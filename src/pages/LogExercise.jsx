import { useState } from 'react';

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
    <div class="max-w-4xl mx-auto p-6">
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
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Log Exercise
      </button>
    </form>
    </div>
  );
}