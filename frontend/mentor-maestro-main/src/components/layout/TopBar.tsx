import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export function TopBar() {
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-white/5 px-4 md:px-6"
      style={{ backgroundColor: '#0d1f1a' }}
    >
      {/* Right Side - User Profile with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all"
          style={{ backgroundColor: showDropdown ? 'rgba(255,255,255,0.05)' : 'transparent' }}
        >
          <div
            className="flex items-center justify-center h-9 w-9 rounded-full text-white font-semibold text-sm border-2 border-[#3bba69]"
            style={{ backgroundColor: 'transparent' }}
          >
            {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="text-sm text-white hidden sm:inline">
            {user?.email || "user@example.com"}
          </span>
          <svg className={`h-4 w-4 text-white/60 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu - Clean simple design matching reference */}
        {showDropdown && (
          <div
            className="absolute right-0 top-full mt-2 min-w-[180px] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ backgroundColor: '#142721' }}
          >
            <button
              onClick={() => {
                signOut();
                setShowDropdown(false);
              }}
              className="w-full flex items-center justify-between px-5 py-4 text-white/90 hover:bg-white/5 transition-all group"
            >
              <span className="text-base font-medium">Logout</span>
              <div
                className="w-10 h-6 rounded-full flex items-center justify-end pr-1 transition-all"
                style={{ backgroundColor: '#3bba69' }}
              >
                <div className="w-4 h-4 rounded-full bg-white"></div>
              </div>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
