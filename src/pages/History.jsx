import { useEffect, useState } from 'react';
import { motion } from "framer-motion"
import { supabase } from '../supabase';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchLogs = async () => {
      // Get current logged-in user
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert('You must be logged in to view your workout history.');
        console.error("User not logged in or error:",userError);
        setLogs([]);
        setLoading(false);
        return;
      }

      const {data, error} = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching logs:', error);
        setLogs([]);
      } else {
        setLogs(data);
      }

      setLoading(false);
    };

    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100  justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
      <h2 className="text-2xl text-blue-500 font-semibold mb-4">Workout History</h2>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{delay: 0.2, duration: 0.8 }}
      className="w-full"
    >
      <div className="bg-white shadow-md rounded-lg p-4">
      {logs.length === 0 ? (
        <p>No logs found.</p>
      ) : (
        /* Table for displaying the exercises*/ 
        <table className="w-full text-sm text-left bg-white border rounded shadow overflow-hidden">
          <thead>
            <tr className="bg-blue-100 text-blue-800">
              <th className="p-2">Exercise</th>
              <th className="p-2">Weight</th>
              <th className="p-2">Reps</th>
              <th className="p-2">Sets</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={idx} className="even:bg-gray-50 hover:bg-gray-100">
                <td className="p-2">{log.name}</td>
                <td className="p-2">{log.weight}</td>
                <td className="p-2">{log.reps}</td>
                <td className="p-2">{log.sets}</td>
                <td className="p-2">{log.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </motion.div>
    </div>
  );
}