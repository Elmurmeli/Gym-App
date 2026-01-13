import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../supabase";
import { motion } from "framer-motion";

export default function ProgramView() {
  const { id } = useParams();
  const programId = useMemo(() => id, [id]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [program, setProgram] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [exercisesByWorkoutId, setExercisesByWorkoutId] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setErrorMsg("");

      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user ?? null);

      // Program (RLS should allow: public programs for everyone, private only for owner)
      const { data: p, error: pErr } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .single();

      if (pErr) {
        setErrorMsg(pErr.message || "Failed to load program.");
        setLoading(false);
        return;
      }
      setProgram(p);

      // Workouts
      const { data: ws, error: wErr } = await supabase
        .from("program_workouts")
        .select("*")
        .eq("program_id", programId)
        .order("order_index", { ascending: true });

      if (wErr) {
        setErrorMsg(wErr.message || "Failed to load days.");
        setLoading(false);
        return;
      }
      setWorkouts(ws || []);

      const workoutIds = (ws || []).map((w) => w.id);
      if (workoutIds.length === 0) {
        setExercisesByWorkoutId({});
        setLoading(false);
        return;
      }

      const { data: ex, error: exErr } = await supabase
        .from("program_exercises")
        .select("*")
        .in("workout_id", workoutIds)
        .order("order_index", { ascending: true });

      if (exErr) {
        setErrorMsg(exErr.message || "Failed to load exercises.");
        setLoading(false);
        return;
      }

      const grouped = {};
      for (const wid of workoutIds) grouped[wid] = [];
      for (const row of ex || []) {
        if (!grouped[row.workout_id]) grouped[row.workout_id] = [];
        grouped[row.workout_id].push(row);
      }
      setExercisesByWorkoutId(grouped);

      setLoading(false);
    };

    fetchAll();
  }, [programId]);

  const isOwner = user && program && user.id === program.owner_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-5xl mx-auto bg-white shadow rounded-xl p-6 text-gray-600">
          Loading…
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-5xl mx-auto bg-white shadow rounded-xl p-6">
          <p className="text-red-600">{errorMsg || "Program not found."}</p>
          <Link to="/programs" className="inline-block mt-4 text-blue-600 hover:underline">
            ← Back to programs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white shadow rounded-xl p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-blue-600">{program.title}</h2>
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

              {program.description && (
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">{program.description}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <Link to="/programs" className="px-4 py-2 rounded border bg-white hover:bg-gray-50">
                ← Programs
              </Link>

              {isOwner && (
                <Link
                  to={`/programs/${program.id}/edit`}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Edit Program
                </Link>
              )}
            </div>
          </div>

          {!isOwner && program.visibility !== "public" && (
            <p className="mt-3 text-red-600">
              You don’t have access to this private program.
            </p>
          )}
        </motion.div>

        {/* Read-only days */}
        <div className="space-y-4">
          {workouts.length === 0 ? (
            <div className="bg-white shadow rounded-xl p-6 text-gray-600">
              No days added yet.
            </div>
          ) : (
            workouts.map((w) => (
              <div key={w.id} className="bg-white shadow rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">
                    {w.day_label || `Day ${w.order_index || ""}`}
                  </h3>
                  <span className="text-xs text-gray-500">#{w.order_index}</span>
                </div>

                {w.notes && <p className="mt-2 text-sm text-gray-700">{w.notes}</p>}

                <div className="mt-4 border rounded-lg overflow-hidden">
                  <div className="bg-blue-50 text-blue-900 text-sm font-semibold grid grid-cols-12 gap-2 px-3 py-2">
                    <div className="col-span-4">Exercise</div>
                    <div className="col-span-1">Sets</div>
                    <div className="col-span-2">Reps</div>
                    <div className="col-span-1">RPE</div>
                    <div className="col-span-2">Rest (s)</div>
                    <div className="col-span-2">Notes</div>
                  </div>

                  {(exercisesByWorkoutId[w.id] || []).length === 0 ? (
                    <div className="px-3 py-4 text-gray-600 text-sm bg-white">
                      No exercises.
                    </div>
                  ) : (
                    (exercisesByWorkoutId[w.id] || []).map((ex) => (
                      <div
                        key={ex.id}
                        className="grid grid-cols-12 gap-2 px-3 py-2 border-t items-center bg-white"
                      >
                        <div className="col-span-4 font-medium text-gray-900">
                          {ex.exercise_name}
                        </div>
                        <div className="col-span-1">{ex.sets ?? "-"}</div>
                        <div className="col-span-2">{ex.reps ?? "-"}</div>
                        <div className="col-span-1">{ex.rpe ?? "-"}</div>
                        <div className="col-span-2">{ex.rest_seconds ?? "-"}</div>
                        <div className="col-span-2 text-sm text-gray-700">
                          {ex.notes || "-"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}