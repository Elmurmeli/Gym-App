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
  const [savePulse, setSavePulse] = useState(false);

  const [program, setProgram] = useState(null);

  // workouts: [{ id, program_id, day_label, notes, order_index, created_at }]
  const [workouts, setWorkouts] = useState([]);

  // exercisesByWorkoutId: { [workoutId]: [{ id, workout_id, exercise_name, sets, reps, rpe, rest_seconds, notes, order_index }] }
  const [exercisesByWorkoutId, setExercisesByWorkoutId] = useState({});

  // Handles save pulse animation
  const pulseSaved = () => {
  setSavePulse(true);
  setTimeout(() => setSavePulse(false), 900);
  };

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
      pulseSaved();
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
      pulseSaved();
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

  // Update exercise fields
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
      }))
      pulseSaved();
    }

    setSaving(false);
  };

  // Delete exercise
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
     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6">
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white/80 backdrop-blur shadow-sm border border-blue-100 rounded-2xl p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-blue-700">Program Builder</h2>

              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  program.visibility === "public"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-gray-50 text-gray-800 border-gray-200"
                }`}
              >
                {program.visibility === "public" ? "🌍 Public" : "🔒 Private"}
              </span>

              {/* Saving pill */}
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  saving
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : savePulse
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-gray-500 border-gray-200"
                }`}
              >
                {saving ? "Saving..." : savePulse ? "Saved ✓" : "Up to date"}
              </span>
            </div>

            <p className="text-gray-600">
              Build days and exercises. Changes save when you click out of a field.
            </p>

            {errorMsg && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/programs"
              className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 transition"
            >
              ← Programs
            </Link>

            <Link
              to={`/programs/${program.id}`}
              className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 transition"
            >
              Preview
            </Link>

            <button
              disabled={saving}
              onClick={() =>
                updateProgramField({
                  visibility: program.visibility === "public" ? "private" : "public",
                })
              }
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
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
              className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={program.title || ""}
              placeholder="e.g. 4-Day Powerbuilding"
              onChange={(e) => setProgram((p) => ({ ...p, title: e.target.value }))}
              onBlur={(e) => updateProgramField({ title: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Tip: press Tab to save quickly.</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
              rows={3}
              placeholder="What is this program focused on?"
              value={program.description || ""}
              onChange={(e) => setProgram((p) => ({ ...p, description: e.target.value }))}
              onBlur={(e) => updateProgramField({ description: e.target.value || null })}
            />
          </div>
        </div>
      </motion.div>

      {/* Days header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Days</h3>
          <p className="text-sm text-gray-600">Each day contains exercises with sets/reps/RPE/rest.</p>
        </div>

        <button
          disabled={saving}
          onClick={addWorkout}
          className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 transition disabled:opacity-60"
        >
          + Add Day
        </button>
      </div>

      {/* Empty state */}
      {workouts.length === 0 ? (
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
          <p className="text-gray-600">No days yet. Add your first day to start building.</p>
          <button
            disabled={saving}
            onClick={addWorkout}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
          >
            + Add first day
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {workouts.map((w) => (
            <div key={w.id} className="bg-white shadow-sm border border-gray-100 rounded-2xl p-5">
              {/* Day header row */}
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-700">
                      Day #{w.order_index}
                    </span>

                    <input
                      className="flex-1 border border-gray-200 rounded-xl p-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    rows={2}
                    placeholder="Day notes (optional): warm-up, intent, super sets, etc."
                    value={w.notes || ""}
                    onChange={(e) =>
                      setWorkouts((prev) =>
                        prev.map((x) => (x.id === w.id ? { ...x, notes: e.target.value } : x))
                      )
                    }
                    onBlur={(e) => updateWorkout(w.id, { notes: e.target.value || null })}
                  />
                </div>

                <div className="flex flex-wrap gap-2 md:ml-4">
                  <button
                    disabled={saving}
                    onClick={() => addExercise(w.id)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    + Add Exercise
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => deleteWorkout(w.id)}
                    className="px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-white hover:bg-red-50 transition disabled:opacity-60"
                  >
                    Delete Day
                  </button>
                </div>
              </div>

              {/* Exercises section */}
              <div className="mt-5 rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-blue-50 text-blue-900 text-xs font-semibold grid grid-cols-12 gap-2 px-3 py-3">
                  <div className="col-span-4">Exercise</div>
                  <div className="col-span-1">Sets</div>
                  <div className="col-span-2">Reps</div>
                  <div className="col-span-1">RPE</div>
                  <div className="col-span-2">Rest (s)</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {(exercisesByWorkoutId[w.id] || []).length === 0 ? (
                  <div className="px-4 py-6 bg-white">
                    <p className="text-sm text-gray-600">No exercises yet.</p>
                    <button
                      disabled={saving}
                      onClick={() => addExercise(w.id)}
                      className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
                    >
                      + Add first exercise
                    </button>
                  </div>
                ) : (
                  <div className="bg-white">
                    {(exercisesByWorkoutId[w.id] || []).map((ex) => (
                      <div
                        key={ex.id}
                        className="grid grid-cols-12 gap-2 px-3 py-3 border-t items-start"
                      >
                        <div className="col-span-4 space-y-2">
                          <input
                            className="w-full border border-gray-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={ex.exercise_name || ""}
                            placeholder="Exercise name"
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

                          {/* Notes: textarea so long notes show fully */}
                          <textarea
                            className="w-full border border-gray-200 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                            rows={2}
                            placeholder="Notes (optional) — e.g. superset with flyes, pause reps..."
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
                            max="100"
                            className="w-full border border-gray-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={ex.sets ?? ""}
                            onChange={(e) => {
                              let v = e.target.value;
                              if (v !== "" && Number(v) > 100) v = "100";
                              setExercisesByWorkoutId((prev) => ({
                                ...prev,
                                [w.id]: (prev[w.id] || []).map((row) =>
                                  row.id === ex.id ? { ...row, sets: v } : row
                                ),
                              }));
                            }}
                            onBlur={(e) =>
                              updateExercise(ex.id, w.id, {
                                sets: e.target.value === "" ? null : Math.min(Number(e.target.value), 100),
                              })
                            }
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            className="w-full border border-gray-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={ex.reps ?? ""}
                            onChange={(e) => {
                              let v = e.target.value;
                              if (v !== "" && Number(v) > 1000) v = "1000";
                              setExercisesByWorkoutId((prev) => ({
                                ...prev,
                                [w.id]: (prev[w.id] || []).map((row) =>
                                  row.id === ex.id ? { ...row, reps: v } : row
                                ),
                              }));
                            }}
                            onBlur={(e) =>
                              updateExercise(ex.id, w.id, { reps: e.target.value === "" ? null : Math.min(Number(e.target.value), 1000) })
                            }
                          />
                        </div>

                        <div className="col-span-1">
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            max="10"
                            className="w-full border border-gray-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={ex.rpe ?? ""}
                            onChange={(e) => {
                              let v = e.target.value;
                              if (v !== "" && Number(v) > 10) v = "10";
                              setExercisesByWorkoutId((prev) => ({
                                ...prev,
                                [w.id]: (prev[w.id] || []).map((row) =>
                                  row.id === ex.id ? { ...row, rpe: v } : row
                                ),
                              }));
                            }}
                            onBlur={(e) =>
                              updateExercise(ex.id, w.id, {
                                rpe: e.target.value === "" ? null : Math.min(Number(e.target.value), 10),
                              })
                            }
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            max="3600"
                            className="w-full border border-gray-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={ex.rest_seconds ?? ""}
                            onChange={(e) => {
                              let v = e.target.value;
                              if (v !== "" && Number(v) > 3600) v = "3600";
                              setExercisesByWorkoutId((prev) => ({
                                ...prev,
                                [w.id]: (prev[w.id] || []).map((row) =>
                                  row.id === ex.id ? { ...row, rest_seconds: v } : row
                                ),
                              }));
                            }}
                            onBlur={(e) =>
                              updateExercise(ex.id, w.id, {
                                rest_seconds: e.target.value === "" ? null : Math.min(Number(e.target.value), 3600),
                              })
                            }
                          />
                        </div>

                        <div className="col-span-2 flex justify-end">
                          <button
                            disabled={saving}
                            onClick={() => deleteExercise(ex.id, w.id)}
                            className="px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-white hover:bg-red-50 transition disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Tip: click out of a field to save changes.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}