import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useAnimation } from "framer-motion"
import { supabase } from '../supabase';
import { fetchUnifiedExercises, bestSetMetric } from '../lib/exerciseUnified';
import { PencilSquareIcon, TrashIcon, CheckIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/solid";
import SessionExercisesList from '../components/SessionExercisesList'

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', weight: '', reps: '', sets: '', date: '' });
  const [personalRecords, setPersonalRecords] = useState({});
  const [dbPrs, setDbPrs] = useState([]);
  const [sessionRows, setSessionRows] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'manual' | 'sessions'
  const [selectedSessionKey, setSelectedSessionKey] = useState(null);
  const shouldReduceMotion = useReducedMotion();
  // PR lookup map (exercise_key -> pr_value) used to mark overall PRs
  const prMap = {};
  (dbPrs || []).forEach(p => {
    const key = (p.exercise_key || p.exercise_name || '').toLowerCase().trim();
    prMap[key] = Number(p.pr_value) || 0;
  });

  const isPROverallLog = (log) => {
    const key = (log.name || '').toLowerCase().trim();
    const weight = Number(log.weight) || 0;
    return prMap[key] !== undefined && weight >= prMap[key];
  }

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
        // store session-derived rows for the Sessions tab
        setSessionRows((rows || []).filter(r => r.source === 'session' || r.session_id));
      } catch (err) {
        console.error('Error fetching unified exercises for PRs:', err);
        setDbPrs([]);
        setSessionRows([]);
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

  // PR card subcomponent so each card can control its own animation lifecycle
  // Golden gleam animation for the cards
  function PRCard({ p }) {
    const controls = useAnimation();

    const startSweep = () => {
      if (shouldReduceMotion) return;
      // start the sweep visibly near the left edge so it appears almost instantly,
      // then animate across to the right — leaving the card won't cancel this
      controls.set({ x: '-40%', opacity: 0.95 });
      controls.start({ x: '100%', opacity: 0.95, transition: { duration: 2.2, ease: 'easeInOut' } });
    };

    return (
      <motion.div
        onMouseEnter={startSweep}
        className="relative p-3 rounded-lg bg-gradient-to-br from-yellow-100 via-yellow-300 to-yellow-400 shadow-lg overflow-hidden"
      >
        {!shouldReduceMotion ? (
          <motion.div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              aria-hidden="true"
              animate={controls}
              initial={{ x: '-60%', opacity: 0 }}
              style={{
                position: 'absolute',
                top: '-40%',
                left: '-100%',
                width: '260%',
                height: '200%',
                transform: 'skewX(-20deg)',
                background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,245,130,0.98) 50%, rgba(255,255,255,0) 100%)',
                mixBlendMode: 'screen',
                opacity: 0.95,
                filter: 'blur(2px)'
              }}
            />
          </motion.div>
        ) : (
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div style={{ position: 'absolute', top: '0', left: '5%', right: '5%', bottom: '0', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,245,140,0.6) 50%, rgba(255,255,255,0) 100%)', transform: 'skewX(-18deg)', opacity: 0.7, filter: 'blur(2px)' }} />
          </div>
        )}

        <div className="flex items-baseline justify-between">
          <div className="text-sm font-medium text-yellow-900">{p.exercise_name}</div>
          <div className="text-sm font-bold text-yellow-900">{p.pr_value}</div>
        </div>
        <div className="text-xs text-gray-500 mt-1">{p.pr_date ? new Date(p.pr_date).toLocaleDateString() : ''}</div>
      </motion.div>
    );
  }

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
                /* Use a dedicated PRCard component to handle the animation lifecycle of each card independently */
                <PRCard key={p.exercise_key} p={p} />
              ))}
            </div>
          </div>
        )}

        {/* Tabs: All Activity / Manual Logs / Program Sessions */}
        <div className="mb-4">
          <div className="flex gap-2 justify-center">
            <div className="inline-block w-fit gap-2 mb-4 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-xl ${activeTab==='all'? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>All Activity</button>
              <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-xl ${activeTab==='manual'? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>Manual Logs</button>
              <button onClick={() => setActiveTab('sessions')} className={`px-4 py-2 rounded-xl ${activeTab==='sessions'? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>Program Sessions</button>
            </div>
          </div>


          {activeTab === 'all' && (
            // unified read-only table mixing manual logs and session-derived exercises
            <div className="mb-4">
              {(() => {
                const prMap = {};
                (dbPrs || []).forEach(p => {
                  const key = (p.exercise_key || p.exercise_name || '').toLowerCase();
                  prMap[key] = Number(p.pr_value) || 0;
                });

                const manualEntries = (logs || []).map(l => {
                  const exerciseKey = (l.name || '').toLowerCase().trim();
                  const weight = Number(l.weight) || 0;
                  const isPROverall = prMap[exerciseKey] !== undefined && weight >= Number(prMap[exerciseKey]);
                  return ({
                    key: `m-${l.id}`,
                    exercise: l.name,
                    weight,
                    reps: Number(l.reps) || 0,
                    sets: Number(l.sets) || 0,
                    date: l.date,
                    source: 'Manual',
                    isPR: isPROverall
                  })
                });

                const sessionEntries = (sessionRows || []).map(r => {
                  const sets = Array.isArray(r.sets) ? r.sets : (typeof r.sets === 'string' ? (() => { try { return JSON.parse(r.sets); } catch(e){ return []; } })() : []);
                  const bestSet = (sets && sets.length > 0) ? sets.reduce((a,b)=> (Number(b.weight)||0) > (Number(a.weight)||0) ? b : a, sets[0]) : null;
                  const exerciseKey = (r.exercise_name || r.name || r.workout_name || '').toLowerCase().trim();
                  const bestWeight = Number(bestSet?.weight) || 0;
                  const isPR = prMap[exerciseKey] !== undefined && bestWeight >= Number(prMap[exerciseKey]);
                  return {
                    // prefer row-unique `r.id` first; fall back to `session_id`, then a random short id
                    key: `s-${r.id || r.session_id || Math.random().toString(36).slice(2,9)}`,
                    exercise: r.exercise_name || r.name || r.workout_name || 'Session',
                    weight: bestWeight,
                    reps: Number(bestSet?.reps) || 0,
                    sets: sets.length || 0,
                    date: r.date,
                    // show the program title as the source in All Activity, keep session_name for details
                    source: r.program_title || r.program || r.program_name || 'Program Session',
                    isPR
                  };
                });

                const merged = [...manualEntries, ...sessionEntries].sort((a,b) => new Date(b.date) - new Date(a.date));
                if (merged.length === 0) return <p className="text-center text-gray-500">No activity yet.</p>
                return (
                  <table className="w-full text-sm text-left bg-white border rounded shadow overflow-hidden">
                    <thead>
                      <tr className="bg-blue-100 text-blue-800">
                        <th className="p-2">Exercise</th>
                        <th className="p-2">Weight</th>
                        <th className="p-2">Reps</th>
                        <th className="p-2">Sets</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {merged.map((row) => (
                        <tr key={row.key} className="even:bg-gray-50 hover:bg-gray-100">
                          <td className="p-2">{row.exercise} {row.isPR && (
                            <motion.span
                              data-testid="pr-badge"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              className="px-2 py-0.5 bg-yellow-300 text-yellow-900 rounded-full text-xs font-bold shadow"
                            >
                              🏆PR
                            </motion.span>
                          )}</td>
                          <td className="p-2">{row.weight || '-'}</td>
                          <td className="p-2">{row.reps || '-'}</td>
                          <td className="p-2">{row.sets || '-'}</td>
                          <td className="p-2">{(() => { const d = new Date(row.date); return isNaN(d.getTime()) ? (row.date || '-') : d.toISOString().slice(0,10); })()}</td>
                          <td className="p-2">{row.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              })()}
            </div>
          )}


          {activeTab === 'sessions' && (
            <div className="mb-4">
              <h3 className="text-base font-medium mb-2">Program Sessions</h3>
              <div className="space-y-3">
                {(() => {
                  // Group sessionRows by session key (session_id or fallback)
                  const sessionsMap = {};
                  (sessionRows || []).forEach(r => {
                    const key = r.session_id || `${r.date}-${r.session_name || r.workout_name || 'session'}`;
                    if (!sessionsMap[key]) {
                      sessionsMap[key] = {
                        key,
                        session_id: r.session_id,
                        // program title (from view) and session/workout name
                        program_title: r.program_title || r.program || r.program_name || '-',
                        session_name: r.session_name || r.workout_name || '-',
                        date: r.date,
                        duration: r.duration || r.session_duration || '-',
                      };
                    }
                  });

                  const sessions = Object.values(sessionsMap).sort((a,b) => new Date(b.date) - new Date(a.date));
                  if (sessions.length === 0) return <p className="text-center text-gray-500">No program sessions yet.</p>

                  return (
                    <div className="mt-4 mb-4 rounded-xl border border-gray-200 bg-white p-2">
                      <ul className="space-y-2">
                        {sessions.map(s => (
                          <li key={s.key}>
                            <div className="group flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 hover:shadow-sm transition">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex-shrink-0 text-2xl">🏋️</div>
                                <div className="min-w-0" onClick={() => setSelectedSessionKey(selectedSessionKey === s.key ? null : s.key)}>
                                  <div className="text-sm font-medium text-gray-900 truncate">{s.program_title || s.session_name}</div>
                                  <div className="text-xs text-gray-500">{s.session_name} • {(() => { const d = new Date(s.date); return isNaN(d.getTime()) ? (s.date || '-') : d.toLocaleString(); })()}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedSessionKey(selectedSessionKey === s.key ? null : s.key)}
                                  className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                  {selectedSessionKey === s.key ? 'Hide' : 'View'}
                                </button>
                              </div>
                            </div>

                            {selectedSessionKey === s.key && (
                              <div className="px-3 pb-3 pt-2">
                                <SessionExercisesList rows={sessionRows.filter(r => (r.session_id || `${r.date}-${r.session_name || r.workout_name}`) === s.key)} />
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Session details modal */}
          {selectedSessionKey && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-11/12 md:w-3/4 lg:w-2/3 p-4 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-semibold">Session Details</h4>
                  <button className="text-gray-600" onClick={() => setSelectedSessionKey(null)}>Close</button>
                </div>
                <div className="max-h-96 overflow-auto">
                  <SessionExercisesList rows={sessionRows.filter(r => (r.session_id || `${r.date}-${r.session_name || r.workout_name}`) === selectedSessionKey)} />
                </div>
              </div>
            </div>
          )}

        </div>
        {/* Manual logs table shown when activeTab is manual */}
        {activeTab === 'manual' ? (
          logs.length === 0 ? (
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
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            className='bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500'
                            data-testid="cancel-btn"
                            onClick={() => setEditingId(null)}>
                            <ArrowUturnLeftIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2">{log.name} {isPROverallLog(log) && (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
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
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            data-testid="delete-btn"
                            className='bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600'
                            onClick={() => handleDelete(log.id)}>
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : null}
      </div>
    </motion.div>
    </div>
  );
}