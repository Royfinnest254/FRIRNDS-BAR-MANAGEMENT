import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Trash2, Edit2, Check, X, History, Clock, MapPin, Monitor } from "lucide-react";
import type { UserMetadata, LoginHistory } from "@/shared/types";
import ProjectDownloader from "@/react-app/components/ProjectDownloader";

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserMetadata[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", is_admin: false });

  const isAdmin = (user as any)?.metadata?.is_admin;

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    } else {
      fetchUsers();
      fetchLoginHistory();
    }
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const response = await fetch("/api/admin/login-history");
      if (!response.ok) throw new Error("Failed to fetch login history");
      const data = await response.json();
      setLoginHistory(data);
    } catch (error) {
      console.error("Error fetching login history:", error);
    }
  };

  const handleEdit = (userMetadata: UserMetadata) => {
    setEditingUser(userMetadata.id);
    setEditForm({
      name: userMetadata.name || "",
      is_admin: userMetadata.is_admin,
    });
  };

  const handleSave = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error("Failed to update user");
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update user");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");
      fetchUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return "Unknown";

    // Simple parsing for common browsers
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Chrome";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Edg")) return "Edge";
    if (userAgent.includes("Opera") || userAgent.includes("OPR")) return "Opera";

    return "Other";
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold font-heading text-white">Admin Dashboard</h2>
        </div>
        <p className="text-text_secondary">Manage users and system settings</p>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-white">User Management</h3>
          </div>
          <span className="text-sm text-text_secondary">
            Total Users: {users.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text_secondary">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text_secondary">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text_secondary">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text_secondary">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text_secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((userMetadata) => (
                <tr
                  key={userMetadata.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    {editingUser === userMetadata.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="px-3 py-1 bg-white/5 border border-white/10 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white"
                      />
                    ) : (
                      <span className="text-white font-medium">
                        {userMetadata.name || "N/A"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-text_secondary">
                    {userMetadata.email}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === userMetadata.id ? (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editForm.is_admin}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              is_admin: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-text_secondary">Admin</span>
                      </label>
                    ) : (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${userMetadata.is_admin
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-white/5 text-text_secondary border border-white/10"
                          }`}
                      >
                        {userMetadata.is_admin ? "Admin" : "User"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-text_secondary text-sm">
                    {new Date(userMetadata.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {editingUser === userMetadata.id ? (
                        <>
                          <button
                            onClick={() => handleSave(userMetadata.id)}
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="p-2 text-text_secondary hover:bg-white/5 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(userMetadata)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {userMetadata.user_id !== user?.id && (
                            <button
                              onClick={() => handleDelete(userMetadata.id)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Login Activity</h3>
          </div>
          <span className="text-sm text-text_secondary">
            Recent: {loginHistory.length} logins
          </span>
        </div>

        {loginHistory.length === 0 ? (
          <div className="text-center py-8 text-text_secondary">
            No login activity recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {loginHistory.map((login) => (
              <div
                key={login.id}
                className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                      {login.name?.charAt(0)?.toUpperCase() || login.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {login.name || "Unknown User"}
                      </div>
                      <div className="text-sm text-text_secondary">{login.email}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-text_secondary">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>{formatTimestamp(login.login_timestamp)}</span>
                    </div>

                    {login.ip_address && login.ip_address !== "unknown" && (
                      <div className="flex items-center space-x-2 text-text_secondary">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <span>{login.ip_address}</span>
                      </div>
                    )}

                    {login.user_agent && (
                      <div className="flex items-center space-x-2 text-text_secondary">
                        <Monitor className="w-4 h-4 text-purple-400" />
                        <span>{formatUserAgent(login.user_agent)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectDownloader />

      <div className="bg-blue-500/10 rounded-xl shadow-lg p-6 border border-blue-500/20">
        <h3 className="text-lg font-bold text-blue-400 mb-2">
          Admin Privileges
        </h3>
        <ul className="space-y-2 text-sm text-text_secondary">
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>View all users and their stock entries</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>Monitor login activity and user sessions</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>Edit user information and assign admin roles</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>Remove users from the system</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>Delete any stock entry across all users</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>Download complete project source code</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
