import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../supabase";

export default function Home() {
  const [user, setUser] = useState(null);
  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, []);

  return (
    <div className="flex-1 min-h-0 box-border px-4 py-12 md:px-8 lg:px-24 xl:px-0 flex flex-col justify-between">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-3xl lg:max-w-5xl mx-auto text-center px-4 md:px-12 py-10 md:py-16"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary mb-4 drop-shadow-lg">
          Gym Tracker
        </h1>

        <p className="text-app opacity-80 text-lg md:text-xl mt-4">
          Build programs. Track workouts. See real progress.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4 mt-2 md:mt-3">
          {user ? (
            <>
              <Link
                to="/logs"
                className="px-6 py-3 rounded-xl btn-theme hover:opacity-90 text-white font-semibold shadow transition"
              >
                📝 Log your exercises
              </Link>

              <Link
                to="/programs"
                className="px-6 py-3 rounded-xl card-bg border border-gray-200 text-app font-semibold hover:opacity-80 transition"
              >
                📋 My Programs
              </Link>

              <Link
                to="/progress"
                className="px-6 py-3 rounded-xl btn-theme hover:opacity-90 text-white font-semibold shadow transition"
              >
                📊 See your progress
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/programs"
                className="px-6 py-3 rounded-xl btn-theme hover:opacity-90 text-white font-semibold shadow transition"
              >
                🌍 Browse Programs
              </Link>

              <Link
                to="/register"
                className="px-6 py-3 rounded-xl card-bg border border-blue-600 text-primary font-semibold hover:opacity-95 transition"
              >
                Create Account
              </Link>

              <Link
                to="/login"
                className="px-6 py-3 rounded-xl btn-theme hover:opacity-90 text-white font-semibold shadow transition"
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
            className="card-bg rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition transform hover:-translate-y-1 flex flex-col items-center text-center min-h-[220px]"
          >
            <div className="text-3xl md:text-4xl mb-3">{card.emoji}</div>
            <h2 className="text-lg md:text-xl font-semibold text-primary mb-2">
              {card.title}
            </h2>
            <p className="text-app opacity-80 text-sm md:text-base">{card.text}</p>
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