import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AlertTriangle, Terminal, Database } from "lucide-react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import HomePage from "@/react-app/pages/Home";
import InventoryPage from "@/react-app/pages/Inventory";
import SalesPage from "@/react-app/pages/Sales";
import ReportsPage from "@/react-app/pages/Reports";
import DailyStockPage from "@/react-app/pages/DailyStock";
import AdminPage from "@/react-app/pages/Admin";
import AccessGate from "@/react-app/pages/AccessGate";
import Login from "@/react-app/pages/Login";
import { isSupabaseConfigured } from "@/react-app/lib/supabase";
import { AuthProvider, useAuth } from "@/react-app/context/AuthContext";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    // Redirect to Access Gate if not logged in
    return <Navigate to="/access-gate" state={{ from: location }} replace />;
  }

  return children;
}

function ConfigRequired() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-orange-500 p-6 flex justify-center">
          <Database className="w-12 h-12 text-white" />
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Database Configuration Required
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            The application cannot connect to the backend. You need to configure your environment variables.
          </p>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Step 1: Create Environment File
              </h3>
              <p className="text-sm text-gray-600 ml-6">
                Create a new file named <code className="bg-gray-100 px-1 py-0.5 rounded border border-gray-200">.env</code> in the project root directory.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Step 2: Add Credentials
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto ml-6">
                VITE_SUPABASE_URL=your_project_url<br />
                VITE_SUPABASE_ANON_KEY=your_anon_key
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
              <strong>Tip:</strong> You can find these keys in your Supabase Dashboard under <em>Settings &gt; API</em>.
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-500 border-t border-gray-100">
          After adding the file, restart the server with <code className="font-mono">npm run dev</code>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <ConfigRequired />;
  }

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/access-gate" element={<AccessGate />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="daily-stock" element={<DailyStockPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          {/* Catch all redirect to access gate */}
          <Route path="*" element={<Navigate to="/access-gate" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
