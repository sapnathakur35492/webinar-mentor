import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Lightbulb,
  Presentation,
  Video,
  CheckSquare,
  Mail,
  ClipboardList,
  Settings,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Setup", href: "/setup", icon: ClipboardList },
  { name: "Webinar Concepts", href: "/concepts", icon: Lightbulb },
  { name: "Structure", href: "/structure", icon: Presentation },
  { name: "Email Sequences", href: "/emails", icon: Mail },
  { name: "Video", href: "/video", icon: Video },
  { name: "Approvals", href: "/approvals", icon: CheckSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen w-64"
      style={{ backgroundColor: '#142721' }}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-center border-b border-white/5">
          <img
            src="/logo.png"
            alt="Change 2.0"
            className="h-16"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-white" : "text-gray-500"
                )} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
