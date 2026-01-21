import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../supabase";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-12 md:px-8 lg:px-24 xl:px-0 flex flex-col justify-between">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-3xl lg:max-w-5xl mx-auto text-center px-4 md:px-12 py-10 md:py-16"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-500 mb-4 drop-shadow-lg">
          Gym Tracker
        </h1>

        <p className="text-gray-600 text-lg md:text-xl mt-4">
          Build programs. Track workouts. See real progress.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4 mt-2 md:mt-3">
          {user ? (
            <>
              <Link
                to="/logs"
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
              >
                📝 Log your exercises
              </Link>

              <Link
                to="/programs"
                className="px-6 py-3 rounded-xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 transition"
              >
                📋 My Programs
              </Link>

              <Link
                to="/progress"
                className="px-6 py-3 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
              >
                📊 See your progress
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/programs"
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
              >
                🌍 Browse Programs
              </Link>

          <Link 
          to="/logs" 
          className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg">
            Log Exercises
          </Link>

              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </motion.div>

      {/* FEATURES */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 mt-16 md:mt-28 max-w-6xl mx-auto px-2 md:px-0"
      >
        {[
          {
            title: "Program Builder",
            text: "Create structured training programs with days, exercises, RPE and notes.",
            emoji: "📝",
          },
          {
            title: "Workout Sessions",
            text: "Log real workouts with weights, reps and multiple sets.",
            emoji: "🏋️",
          },
          {
            title: "Progress Tracking",
            text: "Review your training history and see how you improve over time.",
            emoji: "📈",
          },
        ].map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition transform hover:-translate-y-1 flex flex-col items-center text-center min-h-[220px]"
          >
            <div className="text-3xl md:text-4xl mb-3">{card.emoji}</div>
            <h2 className="text-lg md:text-xl font-semibold text-blue-600 mb-2">
              {card.title}
            </h2>
            <p className="text-gray-600 text-sm md:text-base">{card.text}</p>
          </div>
        ))}
      </motion.div>

      {/* FOOTER NOTE */}
      <div className="text-center text-xs md:text-sm text-gray-400 mt-8 md:mt-12 mb-2">
        Built with React, Tailwind CSS & Supabase • Full-stack personal project
      </div>
    </div>
  );
}