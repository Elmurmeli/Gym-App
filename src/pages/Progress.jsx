import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";

export default function Progress() {
    const [logs, setLogs] = useState([]);
    const [exerciseList, setExerciseList] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState("");
    const [filteredData, setFilteredData] = useState([]);

    // Fetch logs on load
    useEffect(() => {
        const fetchLogs = async () => {
            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser();
            if (!user) return;

            let { data, error } = await supabase
                .from("exercises")
                .select("*")
                .eq("user_id", user.id)
                .order("date", { ascending: true });

            if (!error && data) {
                setLogs(data);

                // Get list of unique exercises
                const unique = [...new Set(data.map((log) => log.name))];
                setExerciseList(unique);


                if (unique.length > 0) {
                    setSelectedExercise(unique[0]);
                }
            }
        };

        fetchLogs();
    }, []);

    //Filter whenever selected exercise changes
    useEffect(() => {
        if (!selectedExercise) {
            setFilteredData([]);
            return;
        }

        const filtered = logs
            .filter((log) => log.name === selectedExercise)
            .map((log) => ({
                date: log.date,
                weight: Number(log.weight) || 0,
                reps: Number(log.reps) || 0,
                sets: Number(log.sets) || 0,
                volume: (Number(log.weight) || 0) * (Number(log.reps) || 0) * (Number(log.sets) || 0)
            }));

        setFilteredData(filtered);
    }, [selectedExercise, logs]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <h2 className="text-3xl font-semibold text-blue-600 text-center mb-6">
            Exercise Progress
        </h2>

        {/* Exercise Selector */}
        <div className="flex justify-center mb-6">
            <select
            className="border p-2 rounded shadow"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            >
            {exerciseList.map((ex) => (
                <option key={ex} value={ex}>
                {ex}
                </option>
            ))}
            </select>
        </div>

        {/* Graph */}
        <div className="bg-white shadow rounded p-4 mx-auto" style={{ width: "95%", height: 350 }}>
            {filteredData.length === 0 ? (
            <p className="text-center text-gray-500">No data available.</p>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis dataKey="weight" />
                <Tooltip />
                <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                />
                </LineChart>
            </ResponsiveContainer>
            )}
        </div>
        </div>
    );
}