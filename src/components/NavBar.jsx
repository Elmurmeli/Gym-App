import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

export default function NavBar() {
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);


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

    return (
        <nav className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-40 rounded-xl">
            {/* Left Side - Application Name */}
            <div className= "flex gap-6 items-center">
                <Link to="/" className="text-blue-500 text-2xl font-bold text-shadow-lg">
                    Gym Tracker
                </Link>
            
            {/* Logged-in only navigation links */}
            {user && (
                <>
                    <Link to="/logs" className="hover:text-blue-600 font-medium mx-4 text-shadow-lg">Log Exercise</Link>
                    <Link to="/history" className="hover:text-blue-600 font-medium mx-4 text-shadow-lg">History</Link>
                    <Link to="/progress" className="hover:text-blue-600 font-medium mx-4 text-shadow-lg">Progress</Link>
                </>
                )}
                <Link to="/programs" className="hover:text-blue-600 font-medium mx-4 text-shadow-lg">Programs</Link>
            </div>

            {/* Right Side - Login dropdown menu */}
            <div className="relative">
                <button
                    data-testid="menu-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                    {user ? user.email : 'Login ▾'}
                </button>

            {/* Dropdown Menu */}
                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg animate-fadeIn">
                        {/*Logged out menu*/}
                        {!user && (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-2 hover:bg-gray-100"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-2 hover:bg-gray-100"
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
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
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