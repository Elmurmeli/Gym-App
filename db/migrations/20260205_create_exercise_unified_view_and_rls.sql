-- Migration: create exercise_unified_view and RLS policies

BEGIN;

-- 1) Create/replace unified view (same view as db/views/exercise_unified_view.sql)
CREATE OR REPLACE VIEW public.exercise_unified_view AS
-- Single-entry logs stored in `exercises` (user-entered single exercise logs)
SELECT
  e.id::text AS id,
  e.user_id,
  NULL::text AS exercise_id,
  COALESCE(e.name, '') AS exercise_name,
  e.date AS date,
  -- Build a jsonb array for single-entry logs (assume `reps` and `weight` represent the logged set)
  jsonb_build_array(jsonb_build_object('reps', e.reps, 'weight', e.weight))::jsonb AS sets,
  'single'::text AS source,
  NULL::uuid AS session_id
FROM public.exercises e

UNION ALL

-- Session-based exercises: aggregate workout sets per session + program exercise
SELECT
  md5(concat(s.id::text, '-', pe.id::text))::text AS id,
  s.user_id,
  pe.id::text AS exercise_id,
  pe.exercise_name AS exercise_name,
  s.performed_at AS date,
  COALESCE(jsonb_agg(jsonb_build_object('set_index', ws.set_index, 'reps', ws.reps, 'weight', ws.weight, 'rpe', ws.rpe) ORDER BY ws.set_index), '[]'::jsonb) AS sets,
  'session'::text AS source,
  s.id::uuid AS session_id
FROM public.workout_sessions s
JOIN public.workout_sets ws ON ws.session_id = s.id
JOIN public.program_exercises pe ON pe.id = ws.program_exercise_id
GROUP BY s.id, s.user_id, pe.id, pe.exercise_name, s.performed_at;

-- 2) Enable Row Level Security and create SELECT policies
-- Protect single-entry `exercises` so users can only SELECT their own rows
ALTER TABLE IF EXISTS public.exercises ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'exercises' AND p.policyname = 'select_exercises_owner'
  ) THEN
    EXECUTE 'CREATE POLICY select_exercises_owner ON public.exercises FOR SELECT USING (user_id = auth.uid())';
  END IF;
END$$;

-- Protect workout_sessions so users only see their own sessions
ALTER TABLE IF EXISTS public.workout_sessions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'workout_sessions' AND p.policyname = 'select_sessions_owner'
  ) THEN
    EXECUTE 'CREATE POLICY select_sessions_owner ON public.workout_sessions FOR SELECT USING (user_id = auth.uid())';
  END IF;
END$$;

-- Protect workout_sets by allowing SELECT only when the parent session belongs to the auth user
ALTER TABLE IF EXISTS public.workout_sets ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'workout_sets' AND p.policyname = 'select_workout_sets_owner'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY select_workout_sets_owner ON public.workout_sets
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.workout_sessions s WHERE s.id = workout_sets.session_id AND s.user_id = auth.uid()
          )
        );
    $pol$;
  END IF;
END$$;

-- program_exercises typically contains exercise templates/names; allow authenticated users to select them
ALTER TABLE IF EXISTS public.program_exercises ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'program_exercises' AND p.policyname = 'select_program_exercises_auth'
  ) THEN
    EXECUTE 'CREATE POLICY select_program_exercises_auth ON public.program_exercises FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
END$$;

-- 3) Grant explicit select on the view to authenticated role (optional)
GRANT SELECT ON public.exercise_unified_view TO authenticated;

COMMIT;

