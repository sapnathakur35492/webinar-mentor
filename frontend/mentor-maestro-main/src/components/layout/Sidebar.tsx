import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Lightbulb,
  CheckSquare,
  Mail,
  LogOut,
  ClipboardList,
  Sparkles,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, emoji: "🏠" },
  { name: "Setup", href: "/setup", icon: ClipboardList, description: "Profile & Documents", emoji: "📋" },
  { name: "Webinar Concepts", href: "/concepts", icon: Lightbulb, description: "Ideas & Marketing", emoji: "💡" },
  { name: "Email Sequences", href: "/emails", icon: Mail, description: "Automated Campaigns", emoji: "✉️" },
  { name: "Approvals", href: "/approvals", icon: CheckSquare, description: "Track & Submit", emoji: "✅" },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { profile } = useProfile();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-gradient-to-b from-white via-white to-gray-50/50 border-r border-gray-100 shadow-xl shadow-gray-200/40">
      <div className="flex h-full flex-col">
        {/* Logo - Premium with gradient and glow */}
        <div className="flex h-20 items-center gap-4 px-6 border-b border-gray-100 bg-gradient-to-r from-white to-green-50/30">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl blur-lg opacity-40 animate-pulse" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30">
              <Zap className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Change 2.0
            </h1>
            <p className="text-xs text-gray-500 font-medium">Mentor Portal</p>
          </div>
        </div>

        {/* User Info - Premium card style */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100/50 shadow-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-md opacity-30" />
              <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-500/30">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "M"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {profile?.full_name || "New Mentor"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white shadow-sm">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Navigation - Premium with hover effects */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Main Menu
          </p>
          {navigation.map((item, index) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden",
                  isActive
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                    : "text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-gray-900"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Animated background effect on hover */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}

                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
                  isActive
                    ? "bg-white/20"
                    : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-green-500"
                  )} />
                </div>

                <div className="flex-1 relative z-10">
                  <span className="font-semibold">{item.name}</span>
                  {item.description && (
                    <p className={cn(
                      "text-xs transition-colors duration-300",
                      isActive ? "text-white/80" : "text-gray-400 group-hover:text-gray-500"
                    )}>
                      {item.description}
                    </p>
                  )}
                </div>

                {isActive && (
                  <ArrowRight className="h-4 w-4 text-white/70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button - Clean and simple */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
