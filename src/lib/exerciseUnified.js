import { supabase } from '../supabase';

/**
 * Fetch unified exercise rows from `exercise_unified_view`.
 * Params: { limit, from, to }
 * Returns rows with shape: { id, user_id, exercise_id, exercise_name, date, sets (jsonb array), source, session_id }
 */
export async function fetchUnifiedExercises(userId, { limit, from, to } = {}) {
  let query = supabase
    .from('exercise_unified_view')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Compute a single numeric metric from an array of sets.
 * - method 'maxWeight' returns max weight across sets.
 * - method 'epley' returns max estimated 1RM using Epley formula: weight * (1 + reps/30)
 */
export function bestSetMetric(sets, { method = 'maxWeight' } = {}) {
  if (!Array.isArray(sets) || sets.length === 0) return null;
  if (method === 'epley') {
    return Math.max(
      ...sets.map(s => {
        const reps = Number(s.reps) || 0;
        const weight = Number(s.weight) || 0;
        return weight * (1 + reps / 30);
      })
    );
  }
  return Math.max(...sets.map(s => Number(s.weight) || 0));
}

/** Fetch per-exercise PRs (from materialized view `exercise_prs`) */
export async function fetchExercisePRs(userId) {
  const { data, error } = await supabase
    .from('exercise_prs')
    .select('*')
    .eq('user_id', userId)
    .order('pr_value', { ascending: false });
  if (error) throw error;
  return data;
}

/** Fetch progression points for a given exercise key (exercise_id or name) */
export async function fetchExerciseProgression(userId, exerciseKey, { limit } = {}) {
  let q = supabase
    .from('exercise_progression')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_key', exerciseKey)
    .order('date', { ascending: true });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

