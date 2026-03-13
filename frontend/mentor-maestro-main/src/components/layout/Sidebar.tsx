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

const meetingAssets = [
  { 
    id: "marit_photo", 
    name: "Marit Bjørgen Photo", 
    type: "image", 
    url: "/static/avatars/marit_bjorgen.png",
    path: "static/avatars/marit_bjorgen.png",
    icon: Video,
    description: "Professional Headshot" 
  },
  { 
    id: "marit_book", 
    name: "Marits Metode (Book)", 
    type: "pdf", 
    url: "/static/MaritsMetode_Summary.pdf",
    icon: Lightbulb,
    description: "Reference Document" 
  },
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

        {/* Meeting Assets Library */}
        <div className="mt-auto px-3 py-6 border-t border-white/5">
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Meeting Documents
          </h3>
          <div className="space-y-2">
            {meetingAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('sidebar-asset-selected', { detail: asset }));
                }}
                className="w-full flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all group"
              >
                <asset.icon className="h-4 w-4 text-gray-500 group-hover:text-[#3bba69]" />
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="truncate w-full">{asset.name}</span>
                  <span className="text-[10px] text-gray-600 truncate w-full">{asset.description}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 px-4 py-3 rounded-lg bg-[#3bba69]/5 border border-[#3bba69]/10">
            <p className="text-[10px] text-[#3bba69] leading-tight">
              Tip: Click assets to instantly add them to your current setup step.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
