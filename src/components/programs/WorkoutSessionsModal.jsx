import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabase";

export default function WorkoutSessionsModal({ open, onClose, workoutId, user, onSessionClick }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 20;

  const fetchSessions = useCallback(async (reset = false) => {
    if (!user || !workoutId) return;

    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }
    // Fetch sessions with pagination
    try {
      const currentOffset = reset ? 0 : offset;
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("workout_id", workoutId)
        .eq("user_id", user.id)
        .order("performed_at", { ascending: false })
        .range(currentOffset, currentOffset + PAGE_SIZE - 1);

      if (error) {
        console.error("Error fetching sessions:", error);
        if (reset) setSessions([]);
      } else {
        if (reset) {
          setSessions(data || []);
        } else {
          setSessions(prev => [...prev, ...(data || [])]);
        }
        setHasMore((data || []).length === PAGE_SIZE);
        setOffset(currentOffset + PAGE_SIZE);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      if (reset) setSessions([]);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [user, workoutId, offset]);

  useEffect(() => {
    if (open && workoutId && user) {
      fetchSessions(true);
    } else if (!open) {
      // Reset state when modal closes
      setSessions([]);
      setOffset(0);
      setHasMore(true);
      setLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workoutId, user]);

  const handleLoadMore = () => {
    fetchSessions(false);
  };

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
            className="card-bg rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-app">All Workout Sessions</h2>
              <button
                onClick={onClose}
                className="text-app opacity-80 hover:opacity-100 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {loading ? (
                <div className="text-center text-app opacity-70">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center text-app opacity-70">No sessions found.</div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="group flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-colors card-bg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-app">
                          {new Date(session.performed_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        {session.notes && (
                          <div className="text-sm text-app opacity-80 mt-1">{session.notes}</div>
                        )}
                        <div className="text-sm text-green-600 font-medium mt-1">✔ Completed</div>
                      </div>
                        <div className="flex items-center gap-2">
                          <button
                          onClick={async () => {
                            if (!user) return;
                            const ok = window.confirm("Delete this session? This cannot be undone.");
                            if (!ok) return;
                            try {
                              const { error } = await supabase
                                .from('workout_sessions')
                                .delete()
                                .eq('id', session.id)
                                .eq('user_id', user.id);
                              if (error) {
                                console.error('Error deleting session:', error);
                                alert('Failed to delete session.');
                                return;
                              }
                              // Remove from UI
                              setSessions((prev) => prev.filter((s) => s.id !== session.id));
                            } catch (err) {
                              console.error('Error deleting session:', err);
                              alert('Failed to delete session.');
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-200 transition-opacity duration-150"
                          aria-label="Delete session"
                          tabIndex={0}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => {
                            onSessionClick(session.id);
                            onClose();
                          }}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}

                  {hasMore && (
                    <div className="text-center pt-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 card-bg text-app text-sm rounded-lg hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loadingMore ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}