import { useState } from "react";
import { supabase } from '../supabase';
import { motion } from "framer-motion"
import { Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) { setMessage(error.message); }
        else window.location.hash = "#/"; // Redirect on successful login
    };

    return (
      <div className="min-h-screen box-border flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
    <div className="max-w-md mx-auto mt-16 bg-white shadow p-6 rounded-xl">

      <h2 className="text-2xl font-bold mb-4 text-blue-600 text-shadow-sm">Login</h2>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          data-testid="email-input"
          type="email"
          className="border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          data-testid="password-input"
          type="password"
          className="border p-2 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button data-testid="login-btn" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Login
        </button>
      </form>

      {/*Divider*/}
      <div className="flex items-center my-6">
        <div className="flex-grow border-t border-gray-300" />
        <span className="mx-4 text-sm text-gray-500">OR</span>
        <div className="flex-grow border-t border-gray-300" />
      </div>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link
            to="/register"
            className="block px-2 py-2 rounded font-medium bg-green-100 hover:bg-green-200"
            data-testid="register-link"
        >
            Create an account
        </Link>
      </p>

      {message && <p data-testid="auth-error" className="mt-4 text-red-600">{message}</p>}
      
    </div>
    </motion.div>
    </div>
    );
    }