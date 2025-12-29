import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/react-app/lib/supabase";
import { Shield, Users, Save, X, History, Clock, Monitor, AlertTriangle } from "lucide-react";

interface AppUser {
  id: string;
  email: string;
  created_at: string;
  role: string; // Flattened for easier UI handling
}

interface Role {
  id: number;
  role_name: string;
}

export default function AdminPage() {
  const { role: currentUserRole, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);

  // Editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    // 1. Verify Access
    if (currentUserRole !== "admin") {
      navigate("/");
      return;
    }

    // 2. Fetch Data
    fetchRolesAndUsers();
  }, [currentUserRole, navigate]);

  const fetchRolesAndUsers = async () => {
    setLoading(true);
    try {
      // Fetch available roles
      const { data: rolesData } = await supabase.from("roles").select("*");
      if (rolesData) setRoles(rolesData);

      // Fetch users with their roles
      // Note: This query assumes the relationships are set up correctly in Supabase
      const { data: usersData, error } = await supabase
        .from("app_users")
        .select(`
          id,
          email,
          created_at,
          user_roles (
            roles ( role_name )
          )
        `);

      if (error) throw error;

      // Transform data for table
      const formattedUsers: AppUser[] = (usersData || []).map((u: any) => {
        // Extract role name safely
        const roleName = u.user_roles?.[0]?.roles?.role_name || "none";
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          role: roleName,
        };
      });

      setUsers(formattedUsers);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
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
      // 1. Find the role_id for the selected role_name
      const targetRole = roles.find((r) => r.role_name === selectedRole);
      if (!targetRole) return;

      // 2. Delete existing user_role
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // 3. Insert new user_role
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role_id: targetRole.id,
      });

      if (error) throw error;

      // 4. Refresh UI
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
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold font-heading text-white">Admin Dashboard</h2>
        </div>
        <p className="text-text_secondary">Manage user access and permissions.</p>
      </div>

      {/* User Management Table */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-white">User Roles</h3>
          </div>
          <div className="text-sm text-text_secondary flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span>Create users in Supabase Auth first</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text_secondary">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text_secondary">Current Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text_secondary">Joined</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text_secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{u.email}</td>

                  {/* Role Column */}
                  <td className="px-6 py-4">
                    {editingUserId === u.id ? (
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.role_name}>
                            {r.role_name.toUpperCase()}
                          </option>
                        ))}
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
                        disabled={u.id === currentUser?.id} // Prevent editing own role to avoid lockout
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
