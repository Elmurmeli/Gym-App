import { useEffect, useState } from 'react';
import { motion } from "framer-motion"
import { supabase } from '../supabase';
import { fetchUnifiedExercises, bestSetMetric } from '../lib/exerciseUnified';
import { PencilSquareIcon, TrashIcon, CheckIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/solid";

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', weight: '', reps: '', sets: '', date: '' });
  const [personalRecords, setPersonalRecords] = useState({});
  const [dbPrs, setDbPrs] = useState([]);

  //Normalize exercise name: Capitalize the first letter, lowercase the rest
  const normalizeExerciseName = (name) => {
    const clean = name.trim().toLowerCase();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      // Get current logged-in user
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      // If no user, redirect to login and show message
      if (userError || !user) {
        alert('You must be logged in to view your workout history.');
        console.error("User not logged in or error:",userError);
        setLogs([]);
        setLoading(false);
        return;
      }

      // Fetch exercise logs for the user
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

        //Calculate personal records for the user
        setPersonalRecords(calculatePrs(data));
      }

      // Fetch unified rows and compute live PRs (max raw weight per exercise)
      try {
        const rows = await fetchUnifiedExercises(user.id, { limit: 2000 });
        const map = {};
        (rows || []).forEach(r => {
          const name = (r.exercise_name || '').trim().toLowerCase();
          const best = bestSetMetric(r.sets, { method: 'maxWeight' }) || 0;
          // prefer higher weight, tie-break by most recent date
          if (!map[name] || best > Number(map[name].pr_value) || (best === Number(map[name].pr_value) && new Date(r.date) > new Date(map[name].pr_date || 0))) {
            map[name] = {
              exercise_key: name,
              exercise_name: r.exercise_name,
              pr_value: best,
              pr_date: r.date
            };
          }
        });
        setDbPrs(Object.values(map));
      } catch (err) {
        console.error('Error fetching unified exercises for PRs:', err);
        setDbPrs([]);
      }

      setLoading(false);
    };

    fetchLogs();
  }, []);

  // Delete function
  const handleDelete = async (id) => {
    // Confirm deletion
    const confirmDelete = window.confirm(" Are you sure you want to delete this exercise?");
    if(!confirmDelete) return;

    const { error } = await supabase.from('exercises').delete().eq('id', id);

    if (error) {
      alert("Failed to delete exercise.");
      console.error(error);
    } else {
    // Remove from local state so UI updates immediately
      const updated = logs.filter(log => log.id !== id)
      setLogs(updated);
    // Recalculate personal records when deleting exercises
      setPersonalRecords(calculatePrs(updated));
    }
  };

  // Edit function
  const handleEdit = (log) => {
    setEditingId(log.id);
    setEditForm({
      name: log.name,
      weight: log.weight|| '',
      reps: log.reps || '',
      sets: log.sets || '',
      date: log.date || ''
    });
  };

  // Save edited log
  const handleUpdate = async (id) => {
    const { error } = await supabase
      .from('exercises')
      .update({
        name: editForm.name,
        weight: editForm.weight,
        reps: editForm.reps,
        sets: editForm.sets,
        date: editForm.date
      })
      .eq('id', id);

    if (error) {
      alert("Failed to update exercise.");
      console.error(error);
    } else {
      // Update local state
      const updated = logs.map(log => log.id === id ? { ...log, ...editForm } : log)
      setLogs(updated);
      // Recalculate personal when edited records
      setPersonalRecords(calculatePrs(updated));
      setEditingId(null);
    }
  }

  // Calculate personal records
  const calculatePrs = (logs) => {
    const prs = {};
    logs.forEach(log => {
      const name = normalizeExerciseName(log.name);
      const weight = Number(log.weight);

      if (!prs[name] || weight > prs[name]) {
        prs[name] = weight;
      }
    });

    return prs;
  };

  const isPR = (log) => {
    const normalized = normalizeExerciseName(log.name);
    return Number(log.weight) === personalRecords[normalized];
  };

  return (
    <div className="min-h-screen box-border justify-center px-4">
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
        {/* PR Summary */}
        {dbPrs && dbPrs.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Personal Records</h3>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {dbPrs.slice(0,6).map((p) => (
                <div key={p.exercise_key} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm font-medium text-gray-700">{p.exercise_name}</div>
                    <div className="text-sm font-bold text-blue-600">{p.pr_value}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{p.pr_date ? new Date(p.pr_date).toLocaleDateString() : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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
              <th className="p-2 w-1 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              
              <tr key={idx} data-testid="log-row" className="even:bg-gray-50 hover:bg-gray-100">
                {/* Editing view */}
                {editingId === log.id ? (
                  <>
                    <td className="p-2">
                      <input
                        type="text"
                        value={editForm.name}
                        data-testid="exercise-input"
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="border p-1 rounded"
                        />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="0.5"
                        value={editForm.weight}
                        data-testid="weight-input"
                        onChange={(e) => {
                          let v = e.target.value;
                          if (v !== '' && Number(v) > 1000) v = '1000';
                          if (v !== '' && Number(v) < 0) v = '0';
                          setEditForm({ ...editForm, weight: v });
                        }}
                        className="border p-1 rounded"
                        /> 
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={editForm.reps}
                        data-testid="reps-input"
                        onChange={(e) => {
                          let v = e.target.value;
                          if (v !== '' && Number(v) > 1000) v = '1000';
                          if (v !== '' && Number(v) < 1) v = '1';
                          setEditForm({ ...editForm, reps: v });
                        }}
                        className="border p-1 rounded"
                        />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={editForm.sets}
                        data-testid="sets-input"
                        onChange={(e) => {
                          let v = e.target.value;
                          if (v !== '' && Number(v) > 100) v = '100';
                          if (v !== '' && Number(v) < 1) v = '1';
                          setEditForm({ ...editForm, sets: v });
                        }}
                        className="border p-1 rounded"
                        />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={editForm.date}
                        data-testid="date-input"
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="border p-1 rounded"
                        />
                    </td>
                    <td className="p-2 flex gap-2">
                      <button
                        className='bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600'
                        data-testid="save-btn"
                        onClick={() => handleUpdate(log.id)}>
                        <CheckIcon className="h-5 w-5"/>
                      </button>
                      <button
                        className='bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500'
                        data-testid="cancel-btn"
                        onClick={() => setEditingId(null)}>
                        <ArrowUturnLeftIcon className="h-5 w-5"/>
                      </button>
                    </td>
                  </>
                ) : (
          
                <>
                {/* Normal view */}
                <td className="p-2">{log.name} {isPR(log) && (
                  <motion.span
                  initial={{ scale: 0.8, opacity:0}}
                  animate={{ scale: 1, opacity: 1}}
                  transition={{ duration:0.3 }}
                  data-testid="pr-badge"
                  className="px-2 py-0.5 bg-yellow-300 text-yellow-900 rounded-full text-xs font-bold shadow"
                  >
                    🏆PR
                  </motion.span>
                )}
                </td>
                <td className="p-2" data-testid="weight-cell">{log.weight || '-'}</td>
                <td className="p-2">{log.reps || '-'}</td>
                <td className="p-2">{log.sets || '-'}</td>
                <td className="p-2">{log.date || '-'}</td>

                <td className="p-2 flex gap-2 2-1 whitespace-nowrap">
                  <button
                  data-testid="edit-btn"
                  className='bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500'
                  onClick={() => handleEdit(log)}>
                    <PencilSquareIcon className="h-5 w-5"/>
                  </button>
                  <button
                  data-testid="delete-btn"
                  className='bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600'
                  onClick={() => handleDelete(log.id)}>
                    <TrashIcon className="h-5 w-5"/>
                  </button>
                </td>
                </>
                )}
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