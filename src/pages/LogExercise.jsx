import { useState } from 'react';
import { motion } from "framer-motion"

export default function LogExercise() {
  const [form, setForm] = useState({
    exercise: '',
    weight: '',
    reps: '',
    sets: '',
    date: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  /* Function for submitting the exercise to the form*/
  const handleSubmit = (e) => {
    e.preventDefault();
    const logs = JSON.parse(localStorage.getItem('exerciseLogs') || '[]');
    logs.push(form);
    localStorage.setItem('exerciseLogs', JSON.stringify(logs));
    alert('Exercise logged!');
    setForm({ exercise: '', weight: '', reps: '', sets: '', date: '' });
  };

  return (
    /**/
    <div class="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center px-4">
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
            value={form[field]}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
      ))}
      <button type="submit" className="bg-blue-600 text-white  font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">
        Log Exercise
      </button>
    </form>
    </motion.div>
    </div>
  );
}