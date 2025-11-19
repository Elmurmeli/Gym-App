import { useState } from "react";
import { supabase } from '../supabase';

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage("Registration successful! Check your email for confirmation.");
        }
    };

    return (
    <div className="max-w-md mx-auto mt-16 bg-white shadow p-6 rounded-xl">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Register</h2>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input
          type="email"
          className="border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className="border p-2 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Register
        </button>
      </form>

      {message && <p className="mt-4 text-gray-700">{message}</p>}
    </div>
    );
}