import { Link } from "react-router-dom";

export default function Home() {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Hero section */}
        <h1 className="text-2xl font-bold flex justify-center">
          Welcome to Gym Tracker
        </h1>
        <p className="mt-2 flex justify-center">
          Track your workouts, monitor your progress, and stay motivated to reach your fitness goals!
        </p>
        <div className="flex justify-center gap-4 mb-12">

          <Link 
          to="/logs" 
          className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg">
            Log Exercise
          </Link>

          <Link
          to="/history"
          className="bg-gray-300 text-gray-800 font-semibold px-6 py-3 rounded-lg hover:bg-gray-400 transition"
          >View History
          </Link>

          
        </div>

      </div>
    );
  }
  