import { useEffect, useState } from 'react';

export default function History() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const storedLogs = JSON.parse(localStorage.getItem('exerciseLogs') || '[]');
    setLogs(storedLogs);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Workout History</h2>
      {logs.length === 0 ? (
        <p>No logs found.</p>
      ) : (
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
  );
}