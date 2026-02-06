import React, { useState } from 'react'
import { bestSetMetric } from '../lib/exerciseUnified'

export default function SessionExercisesList({ rows = [] }) {
  // group rows by session id (fallback to date+session_name)
  const groups = rows.reduce((acc, r) => {
    const key = r.session_id || r.session_key || `${r.date}-${r.session_name || r.workout_name || 'session'}`;
    if (!acc[key]) acc[key] = { key, rows: [], date: r.date, session_name: r.session_name || r.workout_name || 'Session', program_name: r.program_name };
    acc[key].rows.push(r);
    return acc;
  }, {});

  const list = Object.values(groups).sort((a,b) => new Date(b.date) - new Date(a.date));
  const [openKey, setOpenKey] = useState(null);

  if (!rows || rows.length === 0) return <div className="text-gray-500">No session exercises.</div>

  return (
    <div className="space-y-3">
      {list.map((s) => (
        <div key={s.key} className="bg-white border rounded-lg">
          <div className="p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{s.session_name}</div>
              <div className="text-xs text-gray-500">{s.program_name || ''} • {new Date(s.date).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded"
                onClick={() => setOpenKey(openKey === s.key ? null : s.key)}
              >
                {openKey === s.key ? 'Hide Details' : 'View Details'}
              </button>
            </div>
          </div>

          {openKey === s.key && (
            <div className="p-3 border-t">
              <table className="w-full text-sm text-left bg-white border rounded shadow overflow-hidden">
                <thead>
                  <tr className="bg-blue-100 text-blue-800">
                    <th className="p-2">Exercise</th>
                    <th className="p-2">Sets</th>
                    <th className="p-2">Best</th>
                  </tr>
                </thead>
                <tbody>
                  {s.rows.map((r, i) => {
                    const sets = Array.isArray(r.sets) ? r.sets : (typeof r.sets === 'string' ? (() => { try { return JSON.parse(r.sets); } catch(e){ return []; } })() : []);
                    const best = bestSetMetric(sets, { method: 'maxWeight' }) || 0;
                    return (
                      <tr key={i} className="even:bg-gray-50 hover:bg-gray-100">
                        <td className="p-2 font-semibold">{r.exercise_name || r.name}</td>
                        <td className="p-2 text-xs text-gray-600">{sets && sets.length > 0 ? sets.map((s2, idx) => `${s2.weight || 0}kg x ${s2.reps || 0}${idx < sets.length-1 ? ' · ' : ''}`) : 'No sets recorded'}</td>
                        <td className="p-2"><span className="font-bold">{best} kg</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
