import { Bell, Search, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function TopBar() {
  const navigate = useNavigate();

  const handleNewMentor = () => {
    // Clear any existing session data and redirect to setup
    localStorage.removeItem("current_asset_id");
    toast.success("Starting new mentor setup!");
    navigate("/setup");
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
          <Input
            placeholder="Search mentors, documents..."
            className="w-96 h-12 bg-gray-50 border-0 pl-12 rounded-xl text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-green-500/20 focus-visible:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell with badge */}
        <button className="relative p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white" />
        </button>

        {/* New Mentor Button - Premium */}
        <Button
          onClick={handleNewMentor}
          className="group relative gap-2 h-12 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          <Plus className="h-5 w-5 relative z-10" />
          <span className="relative z-10">New Mentor</span>
          <Sparkles className="h-4 w-4 relative z-10 text-white/70" />
        </Button>
      </div>
    </header>
  );
}
