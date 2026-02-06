import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { fetchUnifiedExercises, bestSetMetric } from "../lib/exerciseUnified";
import ProgressionGraph from '../components/ProgressionGraph'
import { motion } from "framer-motion";

export default function Progress() {
    const [logs, setLogs] = useState([]);
    const [exerciseList, setExerciseList] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [progressionData, setProgressionData] = useState([]);
    const [sessionPoints, setSessionPoints] = useState([]);
    const [prs, setPrs] = useState({ maxWeight: 0, maxVolume: 0});

    // Calculate PRs
    useEffect(() => {
        // Calculate PRs whenever filteredData changes
        if (filteredData.length === 0) {
            setPrs({ maxWeight: 0, maxVolume: 0 });
            return;
        }

        const maxWeight = Math.max(...filteredData.map((d) => d.weight));
        const maxVolume = Math.max(...filteredData.map((d) => d.volume));

        setPrs({ maxWeight, maxVolume });
    }, [filteredData]);

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
                let unique = [...new Set(normalized.map((log) => log.name))];

                // Also include exercises that appear in session-based progression view
                try {
                    const { data: progData, error: progErr } = await supabase
                        .from('exercise_progression')
                        .select('exercise_name, exercise_key')
                        .eq('user_id', user.id);
                    if (!progErr && progData) {
                        progData.forEach(p => {
                            const name = normalizeName(p.exercise_name || p.exercise_key || '');
                            if (name && !unique.includes(name)) unique.push(name);
                        });
                    }
                } catch (e) {
                    console.error('Error fetching progression exercise list:', e);
                }

                setExerciseList(unique);

                // Set default selected exercise
                if (unique.length > 0) setSelectedExercise(unique[0]);
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

    // Fetch progression points from DB view for selected exercise (case-insensitive match)
    useEffect(() => {
        const fetchProgression = async () => {
            if (!selectedExercise) {
                setProgressionData([]);
                return;
            }

            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser();
            if (userError || !user) return;

            // Use ILIKE to match exercise_key case-insensitively
            const { data, error } = await supabase
                .from('exercise_progression')
                .select('*')
                .eq('user_id', user.id)
                .ilike('exercise_name', selectedExercise);

            if (error) {
                console.error('Error fetching progression:', error);
                setProgressionData([]);
                return;
            }

            // Map rows to { date, best_metric }
            const mapped = (data || []).map(d => ({ date: d.date, best_metric: Number(d.best_metric) || 0 }));
            setProgressionData(mapped);

            // Also fetch unified exercise rows (session + single) to get logged weights for session exercises
            try {
                const unified = await fetchUnifiedExercises(user.id, { limit: 2000 });
                const filtered = (unified || []).filter(r => (r.exercise_name || '').toLowerCase() === selectedExercise.toLowerCase());
                const points = filtered.map(r => {
                    const sets = Array.isArray(r.sets) ? r.sets : (typeof r.sets === 'string' ? (() => { try { return JSON.parse(r.sets); } catch(e){ return []; } })() : []);
                    const maxWeight = Number(bestSetMetric(sets, { method: 'maxWeight' })) || 0;
                    const isTrue1RM = Array.isArray(sets) && sets.some(s => Number(s.reps) === 1 && Number(s.weight) === maxWeight);
                    return { date: r.date, weight: maxWeight, actual1RM: isTrue1RM };
                });
                setSessionPoints(points);
            } catch (e) {
                console.error('Error fetching unified exercise rows:', e);
                setSessionPoints([]);
            }
        };

        fetchProgression();
    }, [selectedExercise]);

    // build merged chart data (date-sorted)
    const chartData = (() => {
        const map = {};
        (filteredData || []).forEach(d => {
            const k = new Date(d.date).toISOString();
            // mark single-entry logs with reps===1 as actual 1RMs
            map[k] = { date: k, dateLabel: new Date(d.date).toLocaleDateString(), weight: d.weight, volume: d.volume, actual1RM: Number(d.reps) === 1 };
        });
        (progressionData || []).forEach(p => {
            const k = new Date(p.date).toISOString();
            map[k] = { ...(map[k] || { date: k, dateLabel: new Date(p.date).toLocaleDateString() }), best_metric: p.best_metric };
        });
        // Include session-derived points (from unified view).
        // If a session point is an actual 1RM (`actual1RM`), override the progression estimate on that date.
        (sessionPoints || []).forEach(s => {
            const k = new Date(s.date).toISOString();
            if (!map[k]) map[k] = { date: k, dateLabel: new Date(s.date).toLocaleDateString() };
            map[k].weight = s.weight;
            // propagate actual1RM flag into the merged chart point
            if (s.actual1RM) {
                map[k].actual1RM = true;
                map[k].best_metric = s.weight;
            }
        });
        const arr = Object.values(map).sort((a,b) => new Date(a.date) - new Date(b.date));
        // Mark only the single highest actual 1RM as the PR dot (if any).
        const actualPoints = arr.filter(pt => pt.actual1RM).map(pt => ({
            weight: Number(pt.weight) || 0,
            date: new Date(pt.date).getTime()
        }));
        if (actualPoints.length > 0) {
            // find max weight among actual 1RMs
            const maxWeight = Math.max(...actualPoints.map(p => p.weight));
            // find the most recent point with that max weight
            let latestTime = -Infinity;
            for (const pt of arr) {
                if (pt.actual1RM && Number(pt.weight) === maxWeight) {
                    const t = new Date(pt.date).getTime();
                    if (t >= latestTime) latestTime = t;
                }
            }
            for (const pt of arr) {
                pt.actual1RMPR = false;
                if (pt.actual1RM && Number(pt.weight) === maxWeight && new Date(pt.date).getTime() === latestTime) {
                    pt.actual1RMPR = true;
                }
            }
        } else {
            // ensure flag cleared when no actual1RM points
            for (const pt of arr) pt.actual1RMPR = false;
        }
        return arr;
    })();

    function CustomTooltip({ active, payload, label }) {
        if (!active || !payload || payload.length === 0) return null;
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
        );
    }

    // Custom dot renderer: larger gold dot for actual 1RM points
    function CustomDot(props) {
        const { cx, cy, payload } = props;
        if (cx == null || cy == null) return null;
        // Highlight only when this merged point was marked as a PR actual 1RM
        if (payload && payload.actual1RMPR) {
            return (
                <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
            );
        }
        return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" />;
    }

    return (
        <div className="min-h-screen box-border p-6">
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

        {/* Personal Records */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="max-w-xl mx-auto mb-6 p-5 bg-white rounded-xl shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-blue-600 mb-4 text-center">🏆Personal Records🏆</h3>

            {filteredData.length === 0 ? (
                <p className="text-center text-gray-500">No data for this exercise yet.</p>
            ) : (
                <div className="flex justify-around text center">
                    <div>
                        <p className="text-gray-600">Heaviest Lift</p>
                        <p className="text-2xl font-bold text-blue-500">{prs.maxWeight} kg</p>
                    </div>

                    <div>
                        <p className="text-gray-600">Highest Volume</p>
                        <p className="text-2xl font-bold text-blue-500">{prs.maxVolume} kg</p>
                    </div>
                </div>
            )}
            </div>
        </motion.div>

        {/* Graph */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
        <ProgressionGraph data={chartData} />
        </motion.div>
        </div>
    );
}