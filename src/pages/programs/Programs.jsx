import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase";

export default function Programs() {
  const [tab, setTab] = useState("public"); // public | mine
  const [user, setUser] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

// Fetch programs based on active tab
  const fetchPrograms = async (activeTab) => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    setUser(userData?.user ?? null);

    let q = supabase.from("programs").select("*").order("created_at", { ascending: false });

    if (activeTab === "public") {
      q = q.eq("visibility", "public");
    } else {
      // "mine" tab
      if (!userData?.user) {
        setPrograms([]);
        setLoading(false);
        return;
      }
      q = q.eq("owner_id", userData.user.id);
    }

    const { data, error } = await q;
    setPrograms(error ? [] : data || []);
    setLoading(false);
  };
  
  // Fetch programs when tab changes
  useEffect(() => {
    fetchPrograms(tab);
  }, [tab]);

  // Handle deleting a program
  const handleDeleteProgram = async (programId) => {
  const ok = window.confirm("Delete this program? This will also delete its workouts/exercises.");
  if (!ok) return;

  const { error } = await supabase.from("programs").delete().eq("id", programId);

  if (error) {
    alert(error.message || "Failed to delete program.");
    return;
  }

  // remove from UI immediately
  setPrograms((prev) => prev.filter((p) => p.id !== programId));
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-semibold text-blue-600">Programs</h2>
          {user && (
            <Link
              to="/programs/new"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              + Create Program
            </Link>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("public")}
            className={`px-4 py-2 rounded border ${
              tab === "public" ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50"
            }`}
          >
            Public
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`px-4 py-2 rounded border ${
              tab === "mine" ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50"
            }`}
          >
            My Programs
          </button>
        </div>

        {loading ? (
          <div className="bg-white shadow rounded-xl p-6 text-gray-600">Loading…</div>
        ) : programs.length === 0 ? (
          <div className="bg-white shadow rounded-xl p-6 text-gray-600">
            {tab === "mine" && !user
              ? "Log in to see your programs."
              : "No programs found."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((p) => (
              <div key={p.id} className="bg-white shadow rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                    {p.description && <p className="text-sm text-gray-600 mt-1">{p.description}</p>}
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      p.visibility === "public"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {p.visibility === "public" ? "🌍 Public" : "🔒 Private"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {/* Left: View + Builder */}
                  {/* Always allow viewing */}
                    <div className="flex gap-2">
                      <Link
                        to={`/programs/${p.id}`}
                        className="px-3 py-2 rounded border hover:bg-gray-50"
                      >
                        View
                      </Link>
                      {/* Only show builder link in "mine" tab */}
                      {tab === "mine" && (
                        <Link
                          to={`/programs/${p.id}/edit`}
                          className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Open Builder
                        </Link>
                      )}
                    </div>

                    {/* Right: Delete (only in "mine") */}
                    {tab === "mine" && (
                      <button
                        onClick={() => handleDeleteProgram(p.id)}
                        className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}