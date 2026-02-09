import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-white p-2 rounded shadow border text-sm">
      <div className="font-medium">{payload[0].payload.dateLabel}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between">
          <div className="text-gray-600">{p.name}{p.payload && p.payload.actual1RMPR ? ' (1RM)' : ''}</div>
          <div className="font-semibold">{p.value !== undefined ? `${Number(p.value).toFixed(1)} kg` : '-'}</div>
        </div>
      ))}
    </div>
  )
}

function CustomDot(props) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null) return null
  if (payload && payload.actual1RMPR) {
    return <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
  }
  return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" />
}

export default function ProgressionGraph({ data = [] }) {
  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 mx-auto" style={{ width: '95%', height: 380 }}>
      {data.length === 0 ? (
        <p className="text-center text-gray-500">No data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateLabel" />
            <YAxis tickFormatter={(v) => `${v} kg`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Line name="Estimated 1RM" type="monotone" dataKey="best_metric" stroke="#10b981" strokeWidth={2} dot={false} connectNulls={false} />
            <Line name="Logged Weight" type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={CustomDot} connectNulls={true} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
