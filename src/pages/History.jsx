import { useEffect, useState } from 'react';
import { motion } from "framer-motion"

export default function History() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const storedLogs = JSON.parse(localStorage.getItem('exerciseLogs') || '[]');
    setLogs(storedLogs);
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
                <td className="p-2">{log.exercise}</td>
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