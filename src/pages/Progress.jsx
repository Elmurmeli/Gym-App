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
import { motion } from "framer-motion";

export default function Progress() {
    const [logs, setLogs] = useState([]);
    const [exerciseList, setExerciseList] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState("");
    const [filteredData, setFilteredData] = useState([]);

    // Normalize exercise name: Capitalize first letter, lowercase the rest
    const normalizeName = (name) => {
        if (!name) return "";
        const clean = name.trim().toLowerCase();
        return clean.charAt(0).toUpperCase() + clean.slice(1);
    }

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
                // Normalize exercise names 
                const normalized = data.map((log) => ({
                    ...log,
                    name: normalizeName(log.name)
                }));

                setLogs(normalized);

                // Build unique exercise list
                const unique = [...new Set(normalized.map((log) => log.name))];
                setExerciseList(unique);

                // Set default selected exercise
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
        <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <select
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none cursor-pointer focus:ring-1 focus:ring-blue-400 transition-all bg-white"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            >
            {exerciseList.map((ex) => (
                <option key={ex} value={ex}>
                {ex}
                </option>
            ))}
            </select>
        
        </motion.div>

        {/* Graph */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
        <div className="bg-white shadow-xl rounded-2xl p-6 mx-auto" style={{ width: "95%", height: 380 }}>
            {filteredData.length === 0 ? (
            <p className="text-center text-gray-500">No data available.</p>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} />
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
        </motion.div>
        </div>
    );
}