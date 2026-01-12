import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../../supabase";
import { motion } from "framer-motion";

export default function ProgramBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const programId = useMemo(() => {
    return id;
  }, [id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [program, setProgram] = useState(null);

  // workouts: [{ id, program_id, day_label, notes, order_index, created_at }]
  const [workouts, setWorkouts] = useState([]);

  // exercisesByWorkoutId: { [workoutId]: [{ id, workout_id, exercise_name, sets, reps, rpe, rest_seconds, notes, order_index }] }
  const [exercisesByWorkoutId, setExercisesByWorkoutId] = useState({});

  // -----------------------------------------
  // Fetch helpers
  // -----------------------------------------
  const fetchAll = async () => {
    setLoading(true);
    setErrorMsg("");

    // Ensure user is logged in (ProtectedRoutes should do this, so this is a double-check)
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      setLoading(false);
      setErrorMsg("You must be logged in to edit a program.");
      return;
    }

    // Program
    const { data: programRow, error: programErr } = await supabase
      .from("programs")
      .select("*")
      .eq("id", programId)
      .single();

    if (programErr) {
      setLoading(false);
      setErrorMsg(programErr.message || "Failed to load program.");
      return;
    }
    setProgram(programRow);

    // Workouts
    const { data: workoutRows, error: workoutsErr } = await supabase
      .from("program_workouts")
      .select("*")
      .eq("program_id", programId)
      .order("order_index", { ascending: true });

    if (workoutsErr) {
      setLoading(false);
      setErrorMsg(workoutsErr.message || "Failed to load workouts.");
      return;
    }
    setWorkouts(workoutRows || []);

    // Exercises (fetch all for workouts in one query)
    const workoutIds = (workoutRows || []).map((w) => w.id);
    if (workoutIds.length === 0) {
      setExercisesByWorkoutId({});
      setLoading(false);
      return;
    }

    const { data: exerciseRows, error: exErr } = await supabase
      .from("program_exercises")
      .select("*")
      .in("workout_id", workoutIds)
      .order("order_index", { ascending: true });

    if (exErr) {
      setLoading(false);
      setErrorMsg(exErr.message || "Failed to load exercises.");
      return;
    }

    const grouped = {};
    for (const wid of workoutIds) grouped[wid] = [];
    for (const row of exerciseRows || []) {
      if (!grouped[row.workout_id]) grouped[row.workout_id] = [];
      grouped[row.workout_id].push(row);
    }
    setExercisesByWorkoutId(grouped);

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [programId]);

  // -----------------------------------------
  // Program actions
  // -----------------------------------------
  const updateProgramField = async (patch) => {
    setSaving(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("programs")
      .update(patch)
      .eq("id", programId)
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message || "Failed to update program.");
    } else {
      setProgram(data);
    }
    setSaving(false);
  };

  // -----------------------------------------
  // Workout actions
  // -----------------------------------------
  const addWorkout = async () => {
    setSaving(true);
    setErrorMsg("");

    const nextIndex =
      workouts.length === 0 ? 1 : Math.max(...workouts.map((w) => w.order_index || 1)) + 1;

    const { data, error } = await supabase
      .from("program_workouts")
      .insert([
        {
          program_id: programId,
          day_label: `Day ${nextIndex}`,
          order_index: nextIndex,
          notes: null,
        },
      ])
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message || "Failed to add workout/day.");
      setSaving(false);
      return;
    }

    setWorkouts((prev) => [...prev, data].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
    setExercisesByWorkoutId((prev) => ({ ...prev, [data.id]: [] }));
    setSaving(false);
  };

  const updateWorkout = async (workoutId, patch) => {
    setSaving(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("program_workouts")
      .update(patch)
      .eq("id", workoutId)
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message || "Failed to update workout.");
    } else {
      setWorkouts((prev) => prev.map((w) => (w.id === workoutId ? data : w)));
    }
    setSaving(false);
  };

  const deleteWorkout = async (workoutId) => {
    const ok = window.confirm("Delete this day/workout and all its exercises?");
    if (!ok) return;

    setSaving(true);
    setErrorMsg("");

    const { error } = await supabase.from("program_workouts").delete().eq("id", workoutId);
    if (error) {
      setErrorMsg(error.message || "Failed to delete workout.");
      setSaving(false);
      return;
    }

    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
    setExercisesByWorkoutId((prev) => {
      const copy = { ...prev };
      delete copy[workoutId];
      return copy;
    });

    setSaving(false);
  };

  // -----------------------------------------
  // Exercise actions
  // -----------------------------------------
  const addExercise = async (workoutId) => {
    setSaving(true);
    setErrorMsg("");

    const current = exercisesByWorkoutId[workoutId] || [];
    const nextIndex =
      current.length === 0 ? 1 : Math.max(...current.map((e) => e.order_index || 1)) + 1;

    const { data, error } = await supabase
      .from("program_exercises")
      .insert([
        {
          workout_id: workoutId,
          exercise_name: "Bench Press",
          sets: 3,
          reps: "5",
          rpe: 8.0,
          rest_seconds: 180,
          notes: null,
          order_index: nextIndex,
        },
      ])
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message || "Failed to add exercise.");
      setSaving(false);
      return;
    }

    setExercisesByWorkoutId((prev) => ({
      ...prev,
      [workoutId]: [...(prev[workoutId] || []), data].sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0)
      ),
    }));

    setSaving(false);
  };

  const updateExercise = async (exerciseId, workoutId, patch) => {
    setSaving(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("program_exercises")
      .update(patch)
      .eq("id", exerciseId)
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message || "Failed to update exercise.");
    } else {
      setExercisesByWorkoutId((prev) => ({
        ...prev,
        [workoutId]: (prev[workoutId] || []).map((e) => (e.id === exerciseId ? data : e)),
      }));
    }

    setSaving(false);
  };

  const deleteExercise = async (exerciseId, workoutId) => {
    const ok = window.confirm("Delete this exercise from the day?");
    if (!ok) return;

    setSaving(true);
    setErrorMsg("");

    const { error } = await supabase.from("program_exercises").delete().eq("id", exerciseId);

    if (error) {
      setErrorMsg(error.message || "Failed to delete exercise.");
      setSaving(false);
      return;
    }

    setExercisesByWorkoutId((prev) => ({
      ...prev,
      [workoutId]: (prev[workoutId] || []).filter((e) => e.id !== exerciseId),
    }));

    setSaving(false);
  };

  // -----------------------------------------
  // Render
  // -----------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-5xl mx-auto bg-white shadow rounded-xl p-6">
          <p className="text-gray-600">Loading program builder...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-5xl mx-auto bg-white shadow rounded-xl p-6">
          <p className="text-red-600">{errorMsg || "Program not found."}</p>
          <button
            className="mt-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => navigate("/programs")}
          >
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white shadow rounded-xl p-6"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-blue-600">Program Builder</h2>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    program.visibility === "public"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {program.visibility === "public" ? "🌍 Public" : "🔒 Private"}
                </span>
              </div>
              <p className="text-gray-600 mt-1">Edit days and exercises. Changes save instantly.</p>
            </div>

            <div className="flex gap-2">
              <Link
                to="/programs"
                className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
              >
                ← Programs
              </Link>

              <button
                disabled={saving}
                onClick={() =>
                  updateProgramField({
                    visibility: program.visibility === "public" ? "private" : "public",
                  })
                }
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {program.visibility === "public" ? "Make Private" : "Make Public"}
              </button>
            </div>
          </div>

          {/* Program fields */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                className="mt-1 w-full border rounded p-2"
                value={program.title || ""}
                onChange={(e) => setProgram((p) => ({ ...p, title: e.target.value }))}
                onBlur={(e) => updateProgramField({ title: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Click out of the field to save.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="mt-1 w-full border rounded p-2"
                rows={3}
                value={program.description || ""}
                onChange={(e) => setProgram((p) => ({ ...p, description: e.target.value }))}
                onBlur={(e) => updateProgramField({ description: e.target.value || null })}
              />
            </div>
          </div>

          {errorMsg && <p className="mt-4 text-red-600">{errorMsg}</p>}
        </motion.div>

        {/* Workouts list */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Days / Workouts</h3>
          <button
            disabled={saving}
            onClick={addWorkout}
            className="px-4 py-2 rounded bg-white border hover:bg-gray-50 disabled:opacity-60"
          >
            + Add Day
          </button>
        </div>

        {workouts.length === 0 ? (
          <div className="bg-white shadow rounded-xl p-6">
            <p className="text-gray-600">No days yet. Add your first day to start building.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((w) => (
              <div key={w.id} className="bg-white shadow rounded-xl p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-500">#{w.order_index}</span>
                      <input
                        className="flex-1 border rounded p-2 font-semibold"
                        value={w.day_label}
                        onChange={(e) =>
                          setWorkouts((prev) =>
                            prev.map((x) => (x.id === w.id ? { ...x, day_label: e.target.value } : x))
                          )
                        }
                        onBlur={(e) => updateWorkout(w.id, { day_label: e.target.value })}
                      />
                    </div>

                    <textarea
                      className="mt-3 w-full border rounded p-2"
                      rows={2}
                      placeholder="Optional notes (e.g. focus, warm-up guidance...)"
                      value={w.notes || ""}
                      onChange={(e) =>
                        setWorkouts((prev) =>
                          prev.map((x) => (x.id === w.id ? { ...x, notes: e.target.value } : x))
                        )
                      }
                      onBlur={(e) => updateWorkout(w.id, { notes: e.target.value || null })}
                    />
                  </div>

                  <div className="flex gap-2 md:ml-4">
                    <button
                      disabled={saving}
                      onClick={() => addExercise(w.id)}
                      className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      + Add Exercise
                    </button>
                    <button
                      disabled={saving}
                      onClick={() => deleteWorkout(w.id)}
                      className="px-3 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-60"
                    >
                      Delete Day
                    </button>
                  </div>
                </div>

                {/* Exercises table */}
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <div className="bg-blue-50 text-blue-900 text-sm font-semibold grid grid-cols-12 gap-2 px-3 py-2">
                    <div className="col-span-4">Exercise</div>
                    <div className="col-span-1">Sets</div>
                    <div className="col-span-2">Reps</div>
                    <div className="col-span-1">RPE</div>
                    <div className="col-span-2">Rest (s)</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {(exercisesByWorkoutId[w.id] || []).length === 0 ? (
                    <div className="px-3 py-4 text-gray-600 text-sm bg-white">
                      No exercises yet. Click “Add Exercise”.
                    </div>
                  ) : (
                    <div className="bg-white">
                      {(exercisesByWorkoutId[w.id] || []).map((ex) => (
                        <div
                          key={ex.id}
                          className="grid grid-cols-12 gap-2 px-3 py-2 border-t items-center"
                        >
                          <div className="col-span-4">
                            <input
                              className="w-full border rounded p-2"
                              value={ex.exercise_name || ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setExercisesByWorkoutId((prev) => ({
                                  ...prev,
                                  [w.id]: (prev[w.id] || []).map((row) =>
                                    row.id === ex.id ? { ...row, exercise_name: v } : row
                                  ),
                                }));
                              }}
                              onBlur={(e) =>
                                updateExercise(ex.id, w.id, { exercise_name: e.target.value })
                              }
                            />
                            <input
                              className="w-full border rounded p-2 mt-2 text-sm"
                              placeholder="Notes (optional)"
                              value={ex.notes || ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setExercisesByWorkoutId((prev) => ({
                                  ...prev,
                                  [w.id]: (prev[w.id] || []).map((row) =>
                                    row.id === ex.id ? { ...row, notes: v } : row
                                  ),
                                }));
                              }}
                              onBlur={(e) =>
                                updateExercise(ex.id, w.id, { notes: e.target.value || null })
                              }
                            />
                          </div>

                          <div className="col-span-1">
                            <input
                              type="number"
                              min="1"
                              className="w-full border rounded p-2"
                              value={ex.sets ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setExercisesByWorkoutId((prev) => ({
                                  ...prev,
                                  [w.id]: (prev[w.id] || []).map((row) =>
                                    row.id === ex.id ? { ...row, sets: v } : row
                                  ),
                                }));
                              }}
                              onBlur={(e) =>
                                updateExercise(ex.id, w.id, {
                                  sets: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                            />
                          </div>

                          <div className="col-span-2">
                            <input
                              className="w-full border rounded p-2"
                              value={ex.reps ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setExercisesByWorkoutId((prev) => ({
                                  ...prev,
                                  [w.id]: (prev[w.id] || []).map((row) =>
                                    row.id === ex.id ? { ...row, reps: v } : row
                                  ),
                                }));
                              }}
                              onBlur={(e) =>
                                updateExercise(ex.id, w.id, { reps: e.target.value || null })
                              }
                            />
                          </div>

                          <div className="col-span-1">
                            <input
                              type="number"
                              step="0.5"
                              min="1"
                              max="10"
                              className="w-full border rounded p-2"
                              value={ex.rpe ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setExercisesByWorkoutId((prev) => ({
                                  ...prev,
                                  [w.id]: (prev[w.id] || []).map((row) =>
                                    row.id === ex.id ? { ...row, rpe: v } : row
                                  ),
                                }));
                              }}
                              onBlur={(e) =>
                                updateExercise(ex.id, w.id, {
                                  rpe: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                            />
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number"
                              min="0"
                              className="w-full border rounded p-2"
                              value={ex.rest_seconds ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setExercisesByWorkoutId((prev) => ({
                                  ...prev,
                                  [w.id]: (prev[w.id] || []).map((row) =>
                                    row.id === ex.id ? { ...row, rest_seconds: v } : row
                                  ),
                                }));
                              }}
                              onBlur={(e) =>
                                updateExercise(ex.id, w.id, {
                                  rest_seconds: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                            />
                          </div>

                          <div className="col-span-2 flex justify-end gap-2">
                            <button
                              disabled={saving}
                              onClick={() => deleteExercise(ex.id, w.id)}
                              className="px-3 py-2 rounded border hover:bg-gray-50 disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Tip: click out of a field to save changes.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 py-6">
          {saving ? "Saving..." : "All changes saved via Supabase."}
        </div>
      </div>
    </div>
  );
}