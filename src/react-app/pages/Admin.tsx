import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/react-app/lib/supabase";
import { createClient } from "@supabase/supabase-js"; // For "Ghost Client"
import { Shield, Users, Save, X, UserPlus, AlertTriangle } from "lucide-react";

interface AppUser {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

export default function AdminPage() {
  const { role: currentUserRole, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [createError, setCreateError] = useState<string | null>(null);

  // Editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    if (currentUserRole !== "admin") {
      navigate("/");
      return;
    }
    fetchRolesAndUsers();
  }, [currentUserRole, navigate]);

  const fetchRolesAndUsers = async () => {
    setLoading(true);
    setCreateError(null); // Clear previous errors
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("email");

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error("Error fetching admin data:", err);
      // DISPLAY THE REAL ERROR code and message
      setCreateError(`DB ERROR: ${err.message} (Code: ${err.code || 'N/A'}) - Hint: ${err.hint || 'None'}`);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 👻 GHOST CLIENT CREATION (The "PhD" Solution)
  // Allows Admin to create a user WITHOUT logging themselves out.
  // ------------------------------------------------------------------
  const createNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    // 1. Setup Ghost Client
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      alert("CRITICAL: Missing Environment Variables. Cannot create user.");
      return;
    }

    const tempSupabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      console.log("👻 Starting Ghost Signup...");

      // 2. Sign Up the new user (Ghost Session)
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: newEmail,
        password: newPassword,
      });

      if (authError) {
        // Show EXACT error for debugging
        throw new Error(`AUTH ERROR: ${authError.message} (Code: ${authError.status || 'unknown'})`);
      }
      if (!authData.user) throw new Error("No user returned - email may already exist or confirmation required");

      const newUserId = authData.user.id;
      console.log("✅ User created in Auth:", newUserId);

      // 3. VERIFY USER (Using the new RPC function)
      console.log("🔐 Admin verifying user...");
      const { error: rpcError } = await supabase.rpc('admin_confirm_user', {
        target_user_id: newUserId
      });

      if (rpcError) {
        console.warn("RPC Verify failed (continuing anyway):", rpcError.message);
      } else {
        console.log("✅ User verified.");
      }

      // 4. CREATE PROFILE (Since triggers are removed, we must do this manually)
      console.log("📝 Creating profile with role:", newRole);
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: newUserId,
          email: newEmail,
          role: newRole
        });

      if (insertError) {
        // If insert fails (maybe profile already exists from an old trigger?), try update
        console.warn("Insert failed, trying update...", insertError.message);
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ role: newRole })
          .eq("id", newUserId);

        if (updateError) throw updateError;
      }

      // 5. Success!
      alert(`SUCCESS!\n\n✅ User: ${newEmail}\n✅ Role: ${newRole.toUpperCase()}\n\nThey can login now.`);
      setNewEmail("");
      setNewPassword("");
      setIsCreating(false);
      fetchRolesAndUsers();

    } catch (err: any) {
      console.error("Creation failed:", err);
      setCreateError(err.message);
      alert("FAILED: " + err.message);
    }
  };

  const startEditing = (user: AppUser) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setSelectedRole("");
  };

  const saveRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: selectedRole })
        .eq("id", userId);

      if (error) throw error;
      await fetchRolesAndUsers();
      cancelEditing();
      alert("User role updated successfully!");
    } catch (err: any) {
      console.error("Failed to update role:", err);
      alert("Error updating role: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold font-heading text-white">Admin Dashboard</h2>
          </div>
          <p className="text-text_secondary">Manage user access and permissions.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold transition-all"
        >
          {isCreating ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {isCreating ? "Cancel" : "Add New User"}
        </button>
      </div>

      {/* CREATE USER FORM */}
      {isCreating && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 animate-in slide-in-from-top-4">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-400" />
            Create New User
          </h3>

          <form onSubmit={createNewUser} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-primary outline-none"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="newuser@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-primary outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Initial Role</label>
              <select
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-primary outline-none"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="staff">STAFF</option>
                <option value="admin">ADMIN</option>
                <option value="viewer">VIEWER</option>
              </select>
            </div>

            {createError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                ⚠️ Error: {createError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Create User & Set Role
            </button>
          </form>
        </div>
      )}

      {/* User Management Table */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-white">Existing Users</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text_secondary">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text_secondary">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text_secondary">Joined</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text_secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-black font-medium">{u.email}</td>

                  {/* Role Column */}
                  <td className="px-6 py-4">
                    {editingUserId === u.id ? (
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                      >
                        <option value="admin">ADMIN</option>
                        <option value="staff">STAFF</option>
                        <option value="viewer">VIEWER</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${u.role === "admin"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : u.role === "staff"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                      >
                        {u.role}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-text_secondary text-sm">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-right">
                    {editingUserId === u.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => saveRole(u.id)}
                          className="p-1.5 text-green-400 hover:bg-green-400/10 rounded transition-colors"
                          title="Save Changes"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(u)}
                        disabled={u.id === currentUser?.id}
                        className={`text-sm font-medium hover:underline ${u.id === currentUser?.id ? "text-gray-600 cursor-not-allowed" : "text-primary cursor-pointer"
                          }`}
                      >
                        {u.id === currentUser?.id ? "Me" : "Edit Role"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 rounded-xl shadow-lg p-6 border border-blue-500/20">
        <h3 className="text-lg font-bold text-blue-400 mb-2">
          Role Definitions
        </h3>
        <ul className="space-y-2 text-sm text-text_secondary">
          <li className="flex items-center space-x-2">
            <span className="font-bold text-purple-400">ADMIN:</span>
            <span>Full access to Settings, Reports, Sales, Inventory, and User Management.</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="font-bold text-blue-400">STAFF:</span>
            <span>Can Record Sales and perform Daily Stock checks. Cannot see Reports or Admin.</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="font-bold text-gray-400">VIEWER:</span>
            <span>Read-only access to Inventory and Reports. Cannot edit data.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
