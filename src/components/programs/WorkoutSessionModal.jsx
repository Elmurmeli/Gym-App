import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabase";

export default function WorkoutSessionModal({
  open,
  onClose,
  workout,
  exercises = [],
  user,
  programId,
  existingSession,
  onSessionUpdate, // Add callback for when session is created/updated
}) {
  // State to track workout data
  const [workoutData, setWorkoutData] = useState({});
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [isResuming, setIsResuming] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  
  // Track initial state to detect actual changes
  const [initialWorkoutData, setInitialWorkoutData] = useState({});
  const [initialNotes, setInitialNotes] = useState("");
  
  // Track if modal has finished initializing
  const [initialized, setInitialized] = useState(false);
  
  // Ref for auto-save timeout
  const autoSaveTimeoutRef = useRef(null);

  // Reset modal state when it closes
  useEffect(() => {
    if (!open) {
      setWorkoutData({});
      setNotes("");
      setIsResuming(false);
      setAutoSaveStatus('');
      setInitialWorkoutData({});
      setInitialNotes("");
      setInitialized(false);
      // Clear any pending auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
  }, [open]);

  // Auto-save when workoutData or notes change
  useEffect(() => {
    if (!open || loading || !initialized) return;
    
    // Check if workout data has changed
    const workoutDataChanged = JSON.stringify(workoutData) !== JSON.stringify(initialWorkoutData);
    
    // Check if notes have changed
    const notesChanged = notes.trim() !== initialNotes.trim();
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    if (workoutDataChanged || notesChanged) {
      // Set timeout for auto-save (2.5 seconds after last change)
      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave();
      }, 2500);
    } else {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [workoutData, notes, open, isResuming, loading]);

  const performAutoSave = async () => {
    // Clear existing timeout (in case it wasn't cleared by useEffect cleanup)
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    
    if (!user || !workout || loading) {
      return;
    }
    
    setAutoSaveStatus('saving');
    try {
      let sessionId = existingSession?.id;

      // Create session if it doesn't exist
      if (!sessionId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user.id,
            program_id: programId,
            workout_id: workout.id,
            performed_at: new Date().toISOString(),
            notes: notes.trim() || null,
            status: 'in_progress'
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sessionId = sessionData.id;
        // Notify parent component of new session
        onSessionUpdate && onSessionUpdate(workout.id, sessionData);
      } else {
        // Update existing session notes
        await supabase
          .from('workout_sessions')
          .update({ 
            notes: notes.trim() || null,
            last_modified: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      // Delete existing sets and insert current ones
      await supabase
        .from('workout_sets')
        .delete()
        .eq('session_id', sessionId);

      const setsToInsert = [];
      exercises.forEach(exercise => {
        const exerciseData = workoutData[exercise.id] || {};
        
        Object.entries(exerciseData).forEach(([setIndex, setData]) => {
          if (setData && (setData.weight || setData.reps)) {
            setsToInsert.push({
              session_id: sessionId,
              program_exercise_id: exercise.id,
              set_index: parseInt(setIndex),
              weight: setData.weight ? parseFloat(setData.weight) : null,
              reps: setData.reps ? parseInt(setData.reps) : null,
              rpe: setData.rpe ? parseFloat(setData.rpe) : null
            });
          }
        });
      });

      console.log('Inserting sets', setsToInsert.length);
      if (setsToInsert.length > 0) {
        await supabase
          .from('workout_sets')
          .insert(setsToInsert);
      }

      setAutoSaveStatus('saved');
      // Update initial state to reflect the saved data
      setInitialWorkoutData(JSON.parse(JSON.stringify(workoutData)));
      setInitialNotes(notes.trim());
      // Clear "saved" status after 2 seconds
      setTimeout(() => setAutoSaveStatus(''), 2000);
      
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
      // Clear error status after 3 seconds
      setTimeout(() => setAutoSaveStatus(''), 3000);
    }
  };

  // Check for existing session when modal opens
  useEffect(() => {
    if (open && existingSession) {
      setIsResuming(true);
      setNotes(existingSession.notes || "");
      loadExistingSets(existingSession.id);
    } else if (open && !existingSession) {
      setIsResuming(false);
      setWorkoutData({});
      setNotes("");
      // Set initial state for new sessions
      setInitialWorkoutData({});
      setInitialNotes("");
      setInitialized(true);
    }
  }, [open]); // Only depend on open

  const loadExistingSets = async (sessionId) => {
    try {
      const { data: sets, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error loading workout sets:', error);
        return;
      }

      if (sets && sets.length > 0) {
        // Group sets by exercise and set_index
        const loadedData = {};
        sets.forEach(set => {
          if (!loadedData[set.program_exercise_id]) {
            loadedData[set.program_exercise_id] = {};
          }
          loadedData[set.program_exercise_id][set.set_index] = {
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe
          };
        });
        setWorkoutData(loadedData);
        // Set initial state for resumed sessions
        setInitialWorkoutData(loadedData);
        setInitialNotes(existingSession.notes || "");
        setInitialized(true);
      } else {
        // No sets found, keep empty state
        setWorkoutData({});
        // Set initial state for resumed sessions with no sets
        setInitialWorkoutData({});
        setInitialNotes(existingSession.notes || "");
        setInitialized(true);
      }
    } catch (error) {
      console.error('Error in loadExistingSets:', error);
    }
  };

  if (!open) return null;

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    // If auto-save is in progress, consider it unsaved
    if (autoSaveStatus === 'saving') return true;
    
    // If there's a pending auto-save timer, consider it unsaved
    if (autoSaveTimeoutRef.current) return true;
    
    // Check if workout data has changed
    const workoutDataChanged = JSON.stringify(workoutData) !== JSON.stringify(initialWorkoutData);
    
    // Check if notes have changed
    const notesChanged = notes.trim() !== initialNotes.trim();
    
    return workoutDataChanged || notesChanged;
  };

  // Handle modal close with unsaved changes check
  const handleClose = async () => {
    if (hasUnsavedChanges()) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to exit? Your progress may be lost.'
      );
      if (!confirmed) return;
    }
    
    // If auto-save is in progress, wait for it to complete
    if (autoSaveStatus === 'saving') {
      // Wait a bit for the save to complete, then close
      setTimeout(() => {
        onClose();
      }, 1000);
      return;
    }
    
    onClose();
  };

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

  // Save progress manually (immediate save)
  const handleSaveProgress = async () => {
    if (!user || !workout) return;

    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    setLoading(true);
    try {
      let sessionId = existingSession?.id;

      // Create session if it doesn't exist
      if (!sessionId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user.id,
            program_id: programId,
            workout_id: workout.id,
            performed_at: new Date().toISOString(),
            notes: notes.trim() || null,
            status: 'in_progress'
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sessionId = sessionData.id;
        // Notify parent component of new session
        onSessionUpdate && onSessionUpdate(workout.id, sessionData);
      } else {
        // Update existing session notes
        await supabase
          .from('workout_sessions')
          .update({ 
            notes: notes.trim() || null,
            last_modified: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      // Delete existing sets for this session (to avoid duplicates)
      await supabase
        .from('workout_sets')
        .delete()
        .eq('session_id', sessionId);

      // Insert current workout sets
      const setsToInsert = [];
      exercises.forEach(exercise => {
        const exerciseData = workoutData[exercise.id] || {};
        
        Object.entries(exerciseData).forEach(([setIndex, setData]) => {
          if (setData.weight && setData.reps) {
            setsToInsert.push({
              session_id: sessionId,
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

      setAutoSaveStatus('saved');
      // Update initial state to reflect the saved data
      setInitialWorkoutData(JSON.parse(JSON.stringify(workoutData)));
      setInitialNotes(notes.trim());
      setTimeout(() => setAutoSaveStatus(''), 2000);
      
      alert('Progress saved successfully!');
      
    } catch (error) {
      console.error('Error saving progress:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus(''), 3000);
      alert('Error saving progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Finish workout and mark as completed
  const handleFinishWorkout = async () => {
    if (!user || !workout) return;

    setLoading(true);
    try {
      let sessionId = existingSession?.id;

      // Create or update session
      if (!sessionId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user.id,
            program_id: programId,
            workout_id: workout.id,
            performed_at: new Date().toISOString(),
            notes: notes.trim() || null,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sessionId = sessionData.id;
      } else {
        // Update existing session to completed
        await supabase
          .from('workout_sessions')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes: notes.trim() || null
          })
          .eq('id', sessionId);
      }

      // Save final workout sets (same logic as save progress)
      await supabase
        .from('workout_sets')
        .delete()
        .eq('session_id', sessionId);

      const setsToInsert = [];
      // Insert current workout sets
      exercises.forEach(exercise => {
        const exerciseData = workoutData[exercise.id] || {};
        // Insert all sets with weight and reps
        Object.entries(exerciseData).forEach(([setIndex, setData]) => {
          if (setData.weight && setData.reps) {
            setsToInsert.push({
              session_id: sessionId,
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
      
      // Notify parent to remove from in-progress sessions
      onSessionUpdate && onSessionUpdate(workout.id, null);
      
    } catch (error) {
      console.error('Error finishing workout:', error);
      alert('Error finishing workout. Please try again.');
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
        onClick={handleClose}
      >
        {/* Modal container */}
        <motion.div
          className="w-full max-w-4xl max-h-[90vh] modal-bg rounded-2xl shadow-xl overflow-hidden flex flex-col"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {workout?.day_label || "Workout"}
              </h2>
              <p className="text-sm text-gray-500">
                {isResuming ? "Resume your workout" : "Log your sets and reps"}
              </p>
              {isResuming && (
                <p className="text-xs text-blue-600 mt-1">
                  Resuming from {existingSession?.performed_at ? new Date(existingSession.performed_at).toLocaleDateString() : 'previous session'}
                </p>
              )}
              {autoSaveStatus && (
                <p className={`text-xs mt-1 ${
                  autoSaveStatus === 'saving' ? 'text-blue-600' :
                  autoSaveStatus === 'saved' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {autoSaveStatus === 'saving' ? 'Auto-saving...' :
                   autoSaveStatus === 'saved' ? 'Progress saved' :
                   'Save failed'}
                </p>
              )}
            </div>

            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {exercises.length === 0 ? (
              <div className="text-app opacity-70 text-sm">
                No exercises for this workout.
              </div>
            ) : (
              exercises.map((ex) => {
                const exerciseData = workoutData[ex.id] || {};
                const completedSets = Object.values(exerciseData).filter(set => set.weight && set.reps).length;
                const isExerciseComplete = completedSets > 0;

                return (
                  <div
                    key={ex.id}
                    className={`card-bg border rounded-xl p-4 ${isExerciseComplete ? 'border-green-200' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-app">
                        {ex.exercise_name}
                      </h3>
                      {isExerciseComplete && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {completedSets} set{completedSets !== 1 ? 's' : ''} logged
                        </span>
                      )}
                    </div>

                  {/* Sets table */}
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-app opacity-70">Set</div>
                    <div className="text-app opacity-70">Weight</div>
                    <div className="text-app opacity-70">Reps</div>
                    <div className="text-app opacity-70">RPE</div>

                    {Array.from({ length: ex.sets || 0 }).map((_, i) => (
                      <div key={i} className="contents">
                        <div className="font-medium">{i + 1}</div>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="1000"
                          value={workoutData[ex.id]?.[i]?.weight || ''}
                          onChange={(e) => {
                            let v = e.target.value;
                            if (v !== '' && Number(v) > 1000) v = '1000';
                            if (v !== '' && Number(v) < 0) v = '0';
                            handleInputChange(ex.id, i, 'weight', v);
                          }}
                          className="border rounded p-1 text-center bg-transparent text-app"
                          placeholder="kg"
                        />
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={workoutData[ex.id]?.[i]?.reps || ''}
                          onChange={(e) => {
                            let v = e.target.value;
                            if (v !== '' && Number(v) > 1000) v = '1000';
                            handleInputChange(ex.id, i, 'reps', v);
                          }}
                          className="border rounded p-1 text-center bg-transparent text-app"
                          placeholder="reps"
                        />
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="10"
                          value={workoutData[ex.id]?.[i]?.rpe || ''}
                          onChange={(e) => {
                            let v = e.target.value;
                            if (v !== '' && Number(v) > 10) v = '10';
                            handleInputChange(ex.id, i, 'rpe', v);
                          }}
                          className="border rounded p-1 text-center bg-transparent text-app"
                          placeholder="RPE"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Optional hint */}
                  <p className="mt-2 text-xs text-app opacity-70">
                    Planned: {ex.sets} × {ex.reps}
                    {ex.rpe ? ` @ RPE ${ex.rpe}` : ""}
                  </p>
                </div>
              );
            })
            )}
          </div>

          {/* Notes section */}
          <div className="px-6 py-4 border-t">
            <label className="block text-sm font-medium text-app mb-2">
              Workout Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm bg-transparent text-app"
              rows={3}
              placeholder="How did the workout feel? Any observations..."
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t card-bg flex justify-between">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border card-bg text-app hover:bg-gray-50"
            >
              Cancel
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleSaveProgress}
                disabled={loading}
                className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : autoSaveStatus === 'saving' ? 'Auto-saving...' : 'Save Now'}
              </button>

              <button
                onClick={handleFinishWorkout}
                disabled={loading}
                className="px-5 py-2 rounded-lg btn-theme font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Finishing...' : 'Finish Workout'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}