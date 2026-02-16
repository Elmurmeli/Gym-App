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
    const { name, value } = e.target;
    let v = value;
    if (name === 'weight') {
      if (v !== '' && Number(v) > 1000) v = '1000';
      if (v !== '' && Number(v) < 0) v = '0';
    }
    if (name === 'reps') {
      if (v !== '' && Number(v) > 1000) v = '1000';
      if (v !== '' && Number(v) < 1) v = '1';
    }
    if (name === 'sets') {
      if (v !== '' && Number(v) > 100) v = '100';
      if (v !== '' && Number(v) < 1) v = '1';
    }
    setForm({ ...form, [name]: v });
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
    <div className="min-h-screen box-border flex flex-col items-center justify-center px-4">
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl w-full"
    >
      <h2 className="text-2xl text-primary font-semibold mb-4 text-center">Log Your Exercise</h2>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{delay: 0.2, duration: 0.8 }}
      className=" max-w-3xl w-full"
    >
    <form onSubmit={handleSubmit} className="card-bg shadow rounded-lg p-6 space-y-4">
      {['exercise', 'weight', 'reps', 'sets', 'date'].map((field) => {
        let placeholder = '';
        let inputProps = {};
        switch (field) {
          case 'exercise':
            placeholder = 'e.g. Bench Press';
            inputProps.type = 'text';
            break;
          case 'weight':
            placeholder = 'e.g. 100';
            inputProps = { type: 'number', min: 1, max: 1000, step: 0.5 };
            break;
          case 'reps':
            placeholder = 'e.g. 10';
            inputProps = { type: 'number', min: 1, max: 1000 };
            break;
          case 'sets':
            placeholder = 'e.g. 3';
            inputProps = { type: 'number', min: 1, max: 100 };
            break;
          case 'date':
            placeholder = 'Select date';
            inputProps.type = 'date';
            break;
          default:
            placeholder = `${field}...`;
            inputProps.type = 'text';
        }
        return (
          <div key={field}>
            <label className="block capitalize text-app">{field}</label>
            <input
              name={field}
              placeholder={placeholder}
              data-testid={`${field}-input`}
              value={form[field]}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-transparent text-app"
              required
              {...inputProps}
            />
          </div>
        );
      })}
      <button data-testid="submit-btn" type="submit" disabled={submitting} className="btn-theme hover:opacity-90 font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
        {submitting ? 'Logging...' : 'Log Exercise'}
      </button>
    </form>
    </motion.div>
    </div>
  );
}