import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';

export default function NavBar() {
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);


    // Get active session
    useEffect(() => {
        supabase.auth.getUser().then(({ data: {user} }) => {
        setUser(user);
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
        setMenuOpen(false);
        window.location.hash = "#/"; // Redirect to home on logout
    };

    useEffect(() => {
        try {
            const el = document.documentElement;
            const stored = localStorage.getItem('theme');
            const dark = stored ? stored === 'dark' : el.classList.contains('dark');
            if (dark) el.classList.add('dark'); else el.classList.remove('dark');
            setIsDark(dark);
        } catch (e) {
            // ignore
        }
    }, []);

    const toggleTheme = () => {
        try {
            const el = document.documentElement;
            const next = !isDark;
            if (next) el.classList.add('dark'); else el.classList.remove('dark');
            localStorage.setItem('theme', next ? 'dark' : 'light');
            setIsDark(next);
        } catch (e) {
            // ignore
        }
    };

    return (
        <nav className="nav-bg shadow-md p-4 flex justify-between items-center sticky top-0 z-40 rounded-xl">
            {/* Left Side - Application Name */}
            <div className= "flex gap-6 items-center">
                <Link to="/" className="text-primary text-2xl font-bold text-shadow-lg">
                    Gym Tracker
                </Link>
            
            {/* Logged-in only navigation links */}
            {user && (
                <>
                    <Link to="/logs" className="text-app hover:text-blue-600 font-medium mx-4 text-shadow-lg">Log Exercise</Link>
                    <Link to="/history" className="text-app hover:text-blue-600 font-medium mx-4 text-shadow-lg">History</Link>
                    <Link to="/progress" className="text-app hover:text-blue-600 font-medium mx-4 text-shadow-lg">Progress</Link>
                </>
                )}
                <Link to="/programs" className="text-app hover:text-primary/90 font-medium mx-4 text-shadow-lg">Programs</Link>
            </div>

            {/* Right Side - Login dropdown menu */}
            <div className="relative flex items-center gap-3">
                {/* Theme toggle button */}
                <button
                    aria-label="Toggle theme"
                    title="Toggle light / dark"
                    onClick={toggleTheme}
                    className="px-2 py-1 rounded-lg hover:opacity-90 transition"
                >
                    <div className="relative w-14 h-8 p-1 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                        <motion.span
                            className="absolute left-2 top-1 text-sm pointer-events-none text-gray-700 dark:text-gray-200"
                            animate={{ opacity: isDark ? 1 : 0 }}
                            transition={{ duration: 0.12 }}
                        >
                            🌙
                        </motion.span>
                        <motion.span
                            className="absolute right-2 top-1 text-sm pointer-events-none text-gray-700 dark:text-gray-200"
                            animate={{ opacity: isDark ? 0 : 1 }}
                            transition={{ duration: 0.12 }}
                        >
                            ☀️
                        </motion.span>

                        <motion.div
                            className="w-6 h-6 rounded-full shadow-lg border border-gray-300 dark:border-white"
                            style={{ backgroundColor: '#ffffff' }}
                            initial={false}
                            animate={{ x: isDark ? 24 : 0 }}
                            transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                        />
                    </div>
                </button>

                <button
                    data-testid="menu-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="px-3 py-2 btn-theme text-white rounded-lg hover:opacity-90 transition"
                >
                    {user ? user.email : 'Login ▾'}
                </button>

            {/* Dropdown Menu */}
                {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-40 dropdown-bg border rounded shadow-lg animate-fadeIn">
                        {/*Logged out menu*/}
                        {!user && (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-2 dropdown-item"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-2 dropdown-item"
                                >
                                    Register
                                </Link>
                            </>
                        )}

                        {/* Logged-in menu */}
                        {user && (
                            <button
                                data-testid="logout-btn"
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 dropdown-bg"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}