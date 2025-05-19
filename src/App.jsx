import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import LogExercise from './pages/LogExercise';
import History from './pages/History';


export default function App() {
  return (
    
    <Router>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <div className="h-screen bg-gray-100 text-gray-800 p-4 w-screen mx-auto" src="...">
        <nav className="bg-white shadow p-4 rounded flex justify-center gap-8 mb-6">
          <Link to="/" className="hover:text-blue-600 font-medium">Home</Link>
          <Link to="/log" className="hover:text-blue-600 font-medium">Log Exercise</Link>
          <Link to="/history" className="hover:text-blue-600 font-medium">History</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/log" element={<LogExercise />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>

    </Router>
    
  );
}