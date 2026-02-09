-- View: exercise_unified_view
-- PURPOSE: Provide a unified, normalized feed of exercise records for PR and progression logic.


CREATE OR REPLACE VIEW public.exercise_unified_view AS
-- Single-entry logs stored in `exercises` (user-entered single exercise logs)
SELECT
  e.id::text AS id,
  e.user_id,
  NULL::text AS exercise_id,
  COALESCE(e.name, '') AS exercise_name,
  e.date AS date,
  COALESCE(e.sets, jsonb_build_array(jsonb_build_object('reps', e.reps, 'weight', e.weight)))::jsonb AS sets,
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
GROUP BY s.id, s.user_id, pe.id, pe.exercise_name, s.performed_at
;
