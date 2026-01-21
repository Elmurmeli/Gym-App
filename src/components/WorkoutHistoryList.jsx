import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function WorkoutHistoryList({ workoutId, user, onSessionClick }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user || !workoutId) return;

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

  if (loading) {
    return <div className="text-sm text-gray-500">Loading sessions...</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-sm text-gray-500">No recent sessions.</div>;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Sessions</h4>
      <ul className="space-y-1">
        {sessions.map((session) => (
          <li key={session.id}>
            <button
              onClick={() => onSessionClick(session.id)}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left"
            >
              {new Date(session.performed_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })} ✔Completed
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}