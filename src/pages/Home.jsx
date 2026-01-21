import { Link } from "react-router-dom";
import { motion } from "framer-motion"

export default function Home() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center px-4">
        {/* Hero section */}
        <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl"
      >
        <h1 className="text-5xl font-extrabold text-blue-500 mb-4 drop-shadow-sm">
          Welcome to Gym Tracker
        </h1>
        <p className="text-gray-600 mb-8 mt-4 text-xl">
          Track your workouts, monitor your progress, and stay motivated to reach your fitness goals!
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mb-12">

          <Link 
          to="/logs" 
          className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg">
            Log Exercises
          </Link>

          <Link
          to="/history"
          className="bg-gray-300 text-gray-800 font-semibold px-6 py-3 rounded-lg hover:bg-gray-400 transition shadow-md hover:shadow-lg"
          >View History
          </Link>
        </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-4xl"
        >
        {[
          {
            title: "Track Workouts",
            text: "Log your exercises and monitor progress easily.",
          },
          {
            title: "View History",
            text: "Look back at your achievements and keep improving.",
          },
          {
            title: "Stay Motivated",
            text: "Set goals and watch your progress grow every week.",
          },
        ].map((card, index) => (
          <div
            key={index}
            className="bg-white shadow-md p-6 rounded-2xl hover:shadow-lg transition transform hover:-translate-y-1"
          >
            <h2 className="text-xl font-semibold text-blue-600 mb-2">
              {card.title}
            </h2>
            <p className="text-gray-600">{card.text}</p>
          </div>
        ))}
      </motion.div>
      </div>
    );
  }
  