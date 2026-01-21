import { useState } from 'react';
import { motion } from "framer-motion"
import { supabase } from '../supabase';

export default function LogExercise() {
  const [form, setForm] = useState({
    exercise: '',
    weight: '',
    reps: '',
    sets: '',
    date: ''
  });
  const [submitting, setSubmitting] = useState(false);

  //Normalize exercise name: Capitalize the first letter, lowercase the rest
  const normalizeExerciseName = (name) => {
    const clean = name.trim().toLowerCase();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  /* Function for submitting the exercise to the form*/
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    setSubmitting(true); // start loading state

  // Get current logged-in user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    alert('You must be logged in to log an exercise.');
    setSubmitting(false); // stop loading state
    return;
  }

  const normalizedExercise = normalizeExerciseName(form.exercise);

  // Insert exercise into supabase
  const { error } = await supabase
    .from('exercises')
    .insert([
      {
        name: normalizedExercise,
        weight: form.weight || null,
        reps: form.reps || null,
        sets: form.sets || null,
        date: form.date || null,
        user_id: user.id
      }
    ]);

    if (error) {
      alert('Failed to log exercise: ');
    } else {
      alert('Exercise logged successfully!');
      setForm({
        exercise: '',
        weight: '',
        reps: '',
        sets: '',
        date: ''
      });
    }
    setSubmitting(false); // done loading state

  };

  return (
    /**/
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center px-4">
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl w-full"
    >
      <h2 className="text-2xl text-blue-500 font-semibold mb-4 text-center">Log Your Exercise</h2>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{delay: 0.2, duration: 0.8 }}
      className=" max-w-3xl w-full"
    >
    <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
      {['exercise', 'weight', 'reps', 'sets', 'date'].map((field) => (
        <div key={field}>
          <label className="block capitalize">{field}</label>
          <input
            type={field === 'date' ? 'date' : 'text'}
            name={field}
            data-testid={`${field}-input`}
            value={form[field]}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
      ))}
      <button data-testid="submit-btn" type="submit" disabled={submitting} className="bg-blue-600 text-white  font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">
        {submitting ? 'Logging...' : 'Log Exercise'}
      </button>
    </form>
    </motion.div>
    </div>
  );
}