import { Outlet, NavLink } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  BarChart3,
  Home,
  ClipboardList,
  Settings,
} from "lucide-react";

import { useAuth } from "@/react-app/context/AuthContext";
import { LogOut } from "lucide-react";

export default function DashboardLayout() {
  const { user, role, signOut } = useAuth(); // Add 'user' here

  const allNavItems = [
    { to: "/", icon: Home, label: "Dashboard", roles: ["admin", "staff", "viewer"] },
    { to: "/daily-stock", icon: ClipboardList, label: "Daily Stock", roles: ["admin", "staff"] },
    { to: "/inventory", icon: Package, label: "Inventory", roles: ["admin", "staff", "viewer"] },
    { to: "/sales", icon: ShoppingCart, label: "Sales", roles: ["admin", "staff"] },
    { to: "/reports", icon: BarChart3, label: "Reports", roles: ["admin"] },
  ];

  // FILTER: Only show items allowed for current role
  const visibleNavItems = allNavItems.filter(item =>
    role && item.roles.includes(role)
  );

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary selection:text-white">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-header shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-heading font-bold tracking-tight text-white">
                Friends <span className="text-primary-foreground/90">Bar</span>
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium ${isActive
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                  title="Admin Settings"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-bold text-xs bg-red-500 px-1.5 py-0.5 rounded text-white">ADMIN</span>
                </NavLink>
              )}

              <button
                onClick={() => signOut()}
                className="p-2 rounded-full text-white/70 hover:text-red-400 hover:bg-white/5 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Outlet />
      </main>
    </div>
  );
}
