import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabase";

export default function WorkoutSessionModal({
  open,
  onClose,
  workout,
  exercises = [],
}) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Modal container */}
        <motion.div
          className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {workout?.day_label || "Workout"}
              </h2>
              <p className="text-sm text-gray-500">
                Log your sets and reps
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {exercises.length === 0 ? (
              <div className="text-gray-500 text-sm">
                No exercises for this workout.
              </div>
            ) : (
              exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="border rounded-xl p-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {ex.exercise_name}
                  </h3>

                  {/* Sets table */}
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-gray-500">Set</div>
                    <div className="text-gray-500">Weight</div>
                    <div className="text-gray-500">Reps</div>
                    <div className="text-gray-500">RPE</div>

                    {Array.from({ length: ex.sets || 0 }).map((_, i) => (
                      <div key={i} className="contents">
                        <div className="font-medium">{i + 1}</div>
                        <input
                          type="number"
                          step="0.5"
                          className="border rounded p-1 text-center"
                        />
                        <input
                          type="number"
                          className="border rounded p-1 text-center"
                        />
                        <input
                          type="number"
                          step="0.5"
                          className="border rounded p-1 text-center"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Optional hint */}
                  <p className="mt-2 text-xs text-gray-500">
                    Planned: {ex.sets} × {ex.reps}
                    {ex.rpe ? ` @ RPE ${ex.rpe}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              Finish Workout
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}