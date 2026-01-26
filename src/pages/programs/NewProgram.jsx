import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../supabase";

export default function NewProgram() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Handle creating a new program
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("programs")
      .insert([{
        title,
        description: description || null,
        visibility,
        owner_id: user.id,
      }])
      .select()
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      navigate(`/programs/${data.id}/edit`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen box-border p-6">
      <div className="max-w-xl mx-auto bg-white shadow rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-blue-600">Create Program</h2>
          <Link to="/programs" className="text-sm text-blue-600 hover:underline">
            Back
          </Link>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block font-medium">Title</label>
            <input
              className="w-full border rounded p-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-medium">Description</label>
            <textarea
              className="w-full border rounded p-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="block font-medium">Visibility</label>
            <select
              className="w-full border rounded p-2"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Program"}
          </button>
        </form>

        {message && <p className="mt-4 text-red-600">{message}</p>}
      </div>
    </div>
  );
}