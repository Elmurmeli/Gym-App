import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabase";

export default function WorkoutSessionModal({
  open,
  onClose,
  workout,
  exercises = [],
  user,
  programId,
}) {
  // State to track workout data
  const [workoutData, setWorkoutData] = useState({});
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  if (!open) return null;

  // Handle input changes
  const handleInputChange = (exerciseId, setIndex, field, value) => {
    setWorkoutData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [setIndex]: {
          ...prev[exerciseId]?.[setIndex],
          [field]: value
        }
      }
    }));
  };

  // Finish workout and save to database
  const handleFinishWorkout = async () => {
    if (!user || !workout) return;

    setLoading(true);
    try {
      // 1. Create workout session
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          program_id: programId,
          workout_id: workout.id,
          performed_at: new Date().toISOString(),
          notes: notes.trim() || null
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 2. Create workout sets for each performed set
      const setsToInsert = [];

      exercises.forEach(exercise => {
        const exerciseData = workoutData[exercise.id] || {};
        
        Object.entries(exerciseData).forEach(([setIndex, setData]) => {
          if (setData.weight && setData.reps) { // Only save sets with data
            setsToInsert.push({
              session_id: sessionData.id,
              program_exercise_id: exercise.id,
              set_index: parseInt(setIndex),
              weight: parseFloat(setData.weight),
              reps: parseInt(setData.reps),
              rpe: setData.rpe ? parseFloat(setData.rpe) : null
            });
          }
        });
      });

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase
          .from('workout_sets')
          .insert(setsToInsert);

        if (setsError) throw setsError;
      }

      // Success - close modal
      onClose();
      alert('Workout completed successfully!');
      
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Error saving workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

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
                          value={workoutData[ex.id]?.[i]?.weight || ''}
                          onChange={(e) => handleInputChange(ex.id, i, 'weight', e.target.value)}
                          className="border rounded p-1 text-center"
                          placeholder="kg"
                        />
                        <input
                          type="number"
                          value={workoutData[ex.id]?.[i]?.reps || ''}
                          onChange={(e) => handleInputChange(ex.id, i, 'reps', e.target.value)}
                          className="border rounded p-1 text-center"
                          placeholder="reps"
                        />
                        <input
                          type="number"
                          step="0.5"
                          value={workoutData[ex.id]?.[i]?.rpe || ''}
                          onChange={(e) => handleInputChange(ex.id, i, 'rpe', e.target.value)}
                          className="border rounded p-1 text-center"
                          placeholder="RPE"
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

          {/* Notes section */}
          <div className="px-6 py-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workout Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm"
              rows={3}
              placeholder="How did the workout feel? Any observations..."
            />
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
              onClick={handleFinishWorkout}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Finish Workout'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}