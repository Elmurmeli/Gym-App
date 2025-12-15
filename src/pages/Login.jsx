import { useState } from "react";
import { supabase } from '../supabase';
import { motion } from "framer-motion"

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
        else window.location.href = "/Gym-App/logs"; // Redirect on successful login
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
    <div className="max-w-md mx-auto mt-16 bg-white shadow p-6 rounded-xl">

      <h2 className="text-2xl font-bold mb-4 text-blue-600">Login</h2>

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

      {message && <p className="mt-4 text-red-600">{message}</p>}
      
    </div>
    </motion.div>
    </div>
    );
    }