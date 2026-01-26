import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from "./supabase";

import Home from './pages/Home';
import LogExercise from './pages/LogExercise';
import History from './pages/History';
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProtectedRoutes from './components/ProtectedRoutes';
import NavBar from './components/NavBar';
import Progress from './pages/Progress';
import Programs from './pages/programs/Programs';
import NewProgram from './pages/programs/NewProgram';
import ProgramBuilder from './pages/programs/ProgramBuilder';
import ProgramView from "./pages/programs/ProgramView";


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
    window.location.href = "/Gym-App/"; // Redirect to home on logout
  };

  return (

    <Router>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-800">
        <NavBar />
        <div className="app-content flex-1 overflow-auto p-4 flex flex-col min-h-0">
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
          <Route path="/progress" element={<Progress />} />
          <Route path="/programs" element={<Programs />} />
          <Route
            path="/programs/new"
            element={
              <ProtectedRoutes>
                <NewProgram />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/programs/:id/edit"
            element={
              <ProtectedRoutes>
                <ProgramBuilder />
              </ProtectedRoutes>
            }
          />
          <Route path="/programs/:id" element={<ProgramView />} />
          </Routes>
        </div>
      </div>

    </Router>
    
  );
}