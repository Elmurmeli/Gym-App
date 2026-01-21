import { useEffect, useState } from "react";
import {motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabase";

export default function WorkoutSessionViewModal({ open, onClose, sessionId }) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionDate, setSessionDate] = useState(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionId || !open) return;

      setLoading(true);
      try {
        // First get the session date
        const { data: sessionData, error: sessionError } = await supabase
          .from("workout_sessions")
          .select("performed_at")
          .eq("id", sessionId)
          .single();

        if (sessionError) {
          console.error("Error fetching session:", sessionError);
        } else {
          setSessionDate(sessionData.performed_at);
        }

        // Then get the sets
        const { data, error } = await supabase
          .from("workout_sets")
          .select(`
            set_index,
            weight,
            reps,
            rpe,
            program_exercises (
              exercise_name
            )
          `)
          .eq("session_id", sessionId)
          .order("set_index");

        if (error) {
          console.error("Error fetching sets:", error);
          setSets([]);
        } else {
          setSets(data || []);
        }
      } catch (error) {
        console.error("Error fetching session details:", error);
        setSets([]);
      }
      setLoading(false);
    };

    fetchSessionDetails();
  }, [sessionId, open]);

  // Group sets by exercise
  const groupedSets = sets.reduce((acc, set) => {
    const exerciseName = set.program_exercises?.exercise_name || "Unknown Exercise";
    if (!acc[exerciseName]) {
      acc[exerciseName] = [];
    }
    acc[exerciseName].push(set);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Workout Session
                {sessionDate && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    - {new Date(sessionDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loading ? (
                <div className="text-center text-gray-500">Loading session details...</div>
              ) : sets.length === 0 ? (
                <div className="text-center text-gray-500">No sets found for this session.</div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedSets).map(([exerciseName, exerciseSets]) => (
                    <div key={exerciseName}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{exerciseName}</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Set</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Weight</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Reps</th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">RPE</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {exerciseSets.map((set) => (
                              <tr key={set.set_index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-900">{set.set_index + 1}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {set.weight ? `${set.weight}kg` : '-'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">{set.reps || '-'}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{set.rpe || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}