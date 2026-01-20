import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../supabase";
import { motion } from "framer-motion";
import WorkoutSessionModal from "../../components/programs/WorkoutSessionModal";

export default function ProgramView() {
  const { id } = useParams();
  const programId = useMemo(() => id, [id]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [program, setProgram] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [exercisesByWorkoutId, setExercisesByWorkoutId] = useState({});
  const [user, setUser] = useState(null);
  const [openWorkoutId, setOpenWorkoutId] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [inProgressSessions, setInProgressSessions] = useState({});

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

      // Automatically open first workout if there exists any
      if ((ws || []).length > 0) setOpenWorkoutId(ws[0].id);

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

    // Check for in-progress workout sessions
    if (user) {
      checkInProgressSessions();
    }
  }, [programId, user?.id]);

  const checkInProgressSessions = async () => {
    if (!user) return;

    try {
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('id, workout_id, performed_at, notes')
        .eq('user_id', user.id)
        .eq('program_id', programId)
        .eq('status', 'in_progress');

      if (!error && sessions) {
        const sessionMap = {};
        sessions.forEach(session => {
          sessionMap[session.workout_id] = session;
        });
        setInProgressSessions(sessionMap);
      }
    } catch (error) {
      console.log('No in-progress sessions found');
    }
  };

  const handleSessionUpdate = (workoutId, sessionData) => {
    setInProgressSessions(prev => {
      if (sessionData === null) {
        // Remove the session
        const newState = { ...prev };
        delete newState[workoutId];
        return newState;
      } else {
        // Add/update the session
        return {
          ...prev,
          [workoutId]: sessionData
        };
      }
    });
  };

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
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white shadow rounded-xl p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-bold text-blue-500">{program.title}</h2>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    program.visibility === "public"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {program.visibility === "public" ? "🌍 Public" : "🔒 Private"}
                </span>

                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                  {workouts.length} day{workouts.length === 1 ? "" : "s"}
                </span>
              </div>

              {program.description ? (
                <div className="mt-3 rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{program.description}</p>
                </div>
              ) : (
                <p className="mt-3 italic text-gray-400">No description.</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <Link to="/programs" className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 font-medium">
                ← Programs
              </Link>

              {isOwner && (
                <Link
                  to={`/programs/${program.id}/edit`}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium"
                >
                  Edit Program
                </Link>
              )}
            </div>
          </div>

          {!isOwner && program.visibility !== "public" && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              You don’t have access to this private program.
            </p>
          )}
        </motion.div>

        {/* Days List */}
          {workouts.length === 0 ? (
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 text-gray-600">
              No days added yet.
            </div>
          ) : (
          <div className="space-y-4">
          {workouts.map((w) => {
            const isOpen = openWorkoutId === w.id;
            const exList = exercisesByWorkoutId[w.id] || [];

            return (
              <div
                key={w.id}
                className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden"
              >
                {/* Accordion header */}
                <button
                  onClick={() => setOpenWorkoutId(isOpen ? null : w.id)}
                  className="w-full text-left p-5 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900">
                        {w.day_label || `Day ${w.order_index || ""}`}
                      </h3>
                      <span className="text-xs text-gray-500">
                        #{w.order_index}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {exList.length} exercise{exList.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {w.notes && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                        {w.notes}
                      </p>
                    )}
                  </div>

                  <span className="text-gray-500 font-bold">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {/* Accordion content */}
                {isOpen && (
                  <div className="px-5 pb-5">
                    {user && (
                      <button 
                        onClick={() => setActiveWorkout(w)} 
                        className={`mt-4 mb-4 px-3 py-2 rounded-xl text-white hover:opacity-90 ${
                          inProgressSessions[w.id] 
                            ? 'bg-orange-600 hover:bg-orange-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {inProgressSessions[w.id] ? 'Resume Workout' : 'Start Workout'}
                      </button>
                    )}

                    {/* Responsive “table” */}
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      {/* header row (hidden on small screens) */}
                      <div className="hidden md:grid bg-blue-50 text-blue-900 text-sm font-semibold grid-cols-12 gap-2 px-3 py-2">
                        <div className="col-span-4">Exercise</div>
                        <div className="col-span-1">Sets</div>
                        <div className="col-span-2">Reps</div>
                        <div className="col-span-1">RPE</div>
                        <div className="col-span-2">Rest (s)</div>
                        <div className="col-span-2">Notes</div>
                      </div>

                      {exList.length === 0 ? (
                        <div className="px-3 py-4 text-gray-600 text-sm bg-white">
                          No exercises.
                        </div>
                      ) : (
                        exList.map((ex) => (
                          <div
                            key={ex.id}
                            className="border-t bg-white"
                          >
                            {/* Desktop row */}
                            <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 items-center">
                              <div className="col-span-4 font-medium text-gray-900">
                                {ex.exercise_name}
                              </div>
                              <div className="col-span-1">{ex.sets ?? "-"}</div>
                              <div className="col-span-2">{ex.reps ?? "-"}</div>
                              <div className="col-span-1">{ex.rpe ?? "-"}</div>
                              <div className="col-span-2">{ex.rest_seconds ?? "-"}</div>
                              <div className="col-span-2 text-sm text-gray-700 whitespace-pre-wrap break-words">
                                {ex.notes || "-"}
                              </div>
                            </div>

                            {/* Mobile card row */}
                            <div className="md:hidden px-3 py-3">
                              <div className="font-semibold text-gray-900">
                                {ex.exercise_name}
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                                <div><span className="text-gray-500">Sets:</span> {ex.sets ?? "-"}</div>
                                <div><span className="text-gray-500">Reps:</span> {ex.reps ?? "-"}</div>
                                <div><span className="text-gray-500">RPE:</span> {ex.rpe ?? "-"}</div>
                                <div><span className="text-gray-500">Rest:</span> {ex.rest_seconds ?? "-"}</div>
                              </div>
                              <div className="mt-2 text-sm text-gray-700">
                                <span className="text-gray-500">Notes:</span>{" "}
                                {ex.notes || "-"}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <WorkoutSessionModal
        open={!!activeWorkout}
        onClose={() => setActiveWorkout(null)}
        workout={activeWorkout}
        exercises={exercisesByWorkoutId[activeWorkout?.id] || []}
        user={user}
        programId={programId}
        existingSession={inProgressSessions[activeWorkout?.id]}
        onSessionUpdate={handleSessionUpdate}
      />
    </div>
  </div>
);}