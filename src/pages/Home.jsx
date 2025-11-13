import { Link } from "react-router-dom";

export default function Home() {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Hero section */}
        <h1 className="text-2xl font-bold flex justify-center">
          Welcome to Gym Tracker
        </h1>
        <p className="text-gray-600 mb-8 text-center mt-4 text-lg">
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

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white shadow-md p-6 rounded-xl hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2 text-blue-600">Track Workouts</h2>
            <p className="text-gray-600">Log your daily exercises and keep a record of your progress.</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-xl hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2 text-blue-600">View History</h2>
            <p className="text-gray-600">See your past performance and stay consistent with your routines.</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-xl hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2 text-blue-600">Stay Motivated</h2>
            <p className="text-gray-600">Visualize your growth and set new goals to push further.</p>
          </div>
        </div>

      </div>
    );
  }
  