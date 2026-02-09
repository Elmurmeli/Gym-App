-- Migration: create exercise_prs (materialized) and exercise_progression views


BEGIN;

-- Materialized view for per-exercise concrete PR (raw max weight lifted)
DROP MATERIALIZED VIEW IF EXISTS public.exercise_prs;
CREATE MATERIALIZED VIEW public.exercise_prs AS
WITH metrics AS (
  SELECT
    id,
    user_id,
    exercise_id,
    exercise_name,
    date,
    (
      SELECT MAX((COALESCE((s->>'weight'), '0'))::numeric)
      FROM jsonb_array_elements(sets) s
    ) AS best_weight
  FROM public.exercise_unified_view
),
prs AS (
  SELECT
    user_id,
    COALESCE(exercise_id::text, exercise_name) AS exercise_key,
    exercise_id,
    exercise_name,
    MAX(best_weight) AS pr_value
  FROM metrics
  GROUP BY user_id, COALESCE(exercise_id::text, exercise_name), exercise_id, exercise_name
)
SELECT
  p.user_id,
  p.exercise_key,
  p.exercise_id,
  p.exercise_name,
  p.pr_value,
  m.date AS pr_date
FROM prs p
LEFT JOIN LATERAL (
  SELECT date FROM metrics m2
  WHERE m2.user_id = p.user_id
    AND COALESCE(m2.exercise_id::text, m2.exercise_name) = p.exercise_key
    AND m2.best_weight = p.pr_value
  ORDER BY date DESC
  LIMIT 1
) m ON true;

-- View with time-series progression points per exercise (date + best_metric)
CREATE OR REPLACE VIEW public.exercise_progression AS
WITH metrics AS (
  SELECT
    id,
    user_id,
    COALESCE(exercise_id::text, exercise_name) AS exercise_key,
    exercise_id,
    exercise_name,
    date,
    (
      SELECT MAX(((COALESCE((s->>'weight'),'0'))::numeric) * (1 + (COALESCE((s->>'reps'),'0'))::numeric / 30))
      FROM jsonb_array_elements(sets) s
    ) AS best_metric
  FROM public.exercise_unified_view
)
SELECT user_id, exercise_key, exercise_id, exercise_name, date, best_metric
FROM metrics
WHERE best_metric IS NOT NULL
ORDER BY user_id, exercise_key, date;



COMMIT;
