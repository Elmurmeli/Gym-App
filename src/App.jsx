import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from "./supabase";

import Home from './pages/Home';
import LogExercise from './pages/LogExercise';
import History from './pages/History';
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProtectedRoutes from './components/ProtectedRoutes';


export default function App() {
  const[user, setUser] = useState(null);

  // Get active session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // Listen for Login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; // Redirect to home on logout
  };

  return (

    <Router>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <div className="h-screen bg-gray-100 text-gray-800 p-4 w-screen mx-auto" src="...">
        {/* Navigation Bar */}
        <nav className=" bg-white shadow p-4 rounded flex justify-between items-center mb-6">
          <h1 className="text-blue-500 text-2xl font-bold">Gym Tracker</h1>
          <div className="flex gap-8">
          <Link to="/" className="hover:text-blue-600 font-medium">Home</Link>
          <Link to="/logs" className="hover:text-blue-600 font-medium">Log Exercise</Link>
          <Link to="/history" className="hover:text-blue-600 font-medium">History</Link>
          {/* Shows Register and Login links in the navbar if not logged in */}
          {!user && (
            <>
              <Link to="/register" className="hover:text-blue-600">Register</Link>
              <Link to="/login" className="hover:text-blue-600">Login</Link>
            </>
          )}
          {/* Shows Logout button in the navbar if logged in */}
          {user && (
            <button onClick={handleLogout}
            className="bg-red-500 text-white px-2  rounded hover:bg-red-600 transition">
              Logout
            </button>
          )}
          </div>
        </nav>

        {/* Main Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/logs" element={
            <ProtectedRoutes>
              <LogExercise />
            </ProtectedRoutes>
            } />
          <Route path="/history" element={
            <ProtectedRoutes>
              <History />
            </ProtectedRoutes>
            } />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>

    </Router>
    
  );
}