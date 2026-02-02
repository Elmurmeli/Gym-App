import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

export default function WorkoutHistoryList({ workoutId, user, onSessionClick, onViewAllSessions }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user || !workoutId) return;
      // Fetch recent completed sessions for this workout and user
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("workout_sessions")
          .select("id, performed_at, notes")
          .eq("workout_id", workoutId)
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("performed_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching sessions:", error);
          setSessions([]);
        } else {
          setSessions(data || []);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setSessions([]);
      }
      setLoading(false);
    };

    fetchSessions();
  }, [workoutId, user]);
  // Function to handle deleting a session
  const handleDelete = async (sessionId) => {
    if (!user) return;
    const ok = window.confirm("Delete this session? This cannot be undone.");
    if (!ok) return;

    try {
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting session:', error);
        alert('Failed to delete session.');
        return;
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
      alert('Failed to delete session.');
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading sessions...</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-sm text-gray-500">No recent sessions.</div>;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Sessions</h4>
      <div className="mt-4 mb-4 rounded-xl border border-gray-200 bg-white p-2">
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <div className="group flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 hover:shadow-sm transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 text-2xl">🏋️</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      Session
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(session.performed_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {session.notes && (
                      <div className="text-xs text-gray-600 truncate mt-1">{session.notes}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-sm px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-200 transition-opacity duration-150"
                    aria-label="Delete session"
                    tabIndex={0}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => onSessionClick(session.id)}
                    className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    View
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {sessions.length >= 5 && (
          <div className="mt-2 text-right">
            <button
              onClick={() => onViewAllSessions(workoutId)}
              className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
            >
              View all sessions →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}