import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import LogExercise from './pages/LogExercise';
import History from './pages/History';


export default function App() {
  return (

    /* Nav Bar */
    <Router>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <div className="h-screen bg-gray-100 text-gray-800 p-4 w-screen mx-auto" src="...">
        <nav className=" bg-white shadow p-4 rounded flex justify-between items-center mb-6">
          <h1 className="text-blue-500 text-2xl font-bold">Gym Tracker</h1>
          <div className="flex gap-8">
          <Link to="/" className="hover:text-blue-600 font-medium">Home</Link>
          <Link to="/logs" className="hover:text-blue-600 font-medium">Log Exercise</Link>
          <Link to="/history" className="hover:text-blue-600 font-medium">History</Link>
          </div>
        </nav>

        {/* Main Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/logs" element={<LogExercise />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>

    </Router>
    
  );
}