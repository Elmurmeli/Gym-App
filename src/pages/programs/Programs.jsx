import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase";

export default function Programs() {
  const [tab, setTab] = useState("public"); // public | mine
  const [user, setUser] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Fetch programs based on active tab
  const fetchPrograms = async (activeTab) => {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    setUser(userData?.user ?? null);

    let q = supabase
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });

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
    const ok = window.confirm(
      "Delete this program? This will also delete its workouts/exercises."
    );
    if (!ok) return;

    const { error } = await supabase.from("programs").delete().eq("id", programId);

    if (error) {
      alert(error.message || "Failed to delete program.");
      return;
    }

    // remove from UI immediately
    setPrograms((prev) => prev.filter((p) => p.id !== programId));
  };

  const filteredPrograms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return programs;

    return programs.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [programs, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Programs</h2>
            <p className="text-gray-600 mt-1">
              Browse public programs or manage your own.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Search programs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {user && (
              <Link
                to="/programs/new"
                className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
              >
                + Create
              </Link>
            )}
          </div>
        </div>

        {/* Logged-out CTA */}
        {!user && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-blue-900 font-semibold text-lg">
                  Login to get the full experience 💪
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  Create your own programs, edit workouts, and track progress.
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm mb-6">
          <button
            onClick={() => setTab("public")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === "public"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Public
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === "mine"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            My Programs
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white shadow rounded-2xl p-6 text-gray-600">
            Loading…
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="bg-white shadow rounded-2xl p-6 text-gray-600">
            {tab === "mine" && !user ? "Log in to see your programs." : "No programs found."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPrograms.map((p) => (
              <div
                key={p.id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                        {p.title}
                      </h3>

                      {p.description ? (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {p.description}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 mt-1 italic">
                          No description
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full ${
                        p.visibility === "public"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {p.visibility === "public" ? "🌍 Public" : "🔒 Private"}
                    </span>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Created: {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    <Link
                      to={`/programs/${p.id}`}
                      className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-sm font-medium"
                    >
                      View
                    </Link>

                    {tab === "mine" && (
                      <Link
                        to={`/programs/${p.id}/edit`}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                      >
                        Open Builder
                      </Link>
                    )}
                  </div>

                  {tab === "mine" && (
                    <button
                      onClick={() => handleDeleteProgram(p.id)}
                      className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium"
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
