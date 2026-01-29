import { FileText, MessageSquare, Sparkles, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityType = "document" | "meeting" | "ai-generation" | "approval";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  mentor: string;
  time: string;
}

const activityConfig: Record<ActivityType, { icon: typeof FileText; color: string }> = {
  document: { icon: FileText, color: "text-blue-400" },
  meeting: { icon: MessageSquare, color: "text-green-400" },
  "ai-generation": { icon: Sparkles, color: "text-primary" },
  approval: { icon: CheckCircle, color: "text-success" },
};

const mockActivities: Activity[] = [
  { id: "1", type: "ai-generation", title: "Webinar concept v2 generated", mentor: "Maria Eriksen", time: "2 min ago" },
  { id: "2", type: "document", title: "Hook analysis uploaded", mentor: "Jonas Berg", time: "15 min ago" },
  { id: "3", type: "approval", title: "Email sequence approved", mentor: "Kristine Olsen", time: "1 hour ago" },
  { id: "4", type: "meeting", title: "Concept review completed", mentor: "Erik Strand", time: "2 hours ago" },
  { id: "5", type: "ai-generation", title: "Slide structure generated", mentor: "Anna Hansen", time: "3 hours ago" },
];

export function RecentActivity() {
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {mockActivities.map((activity) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;
          
          return (
            <div key={activity.id} className="flex items-start gap-3 group cursor-pointer">
              <div className={cn(
                "mt-0.5 rounded-lg bg-secondary p-2 transition-colors group-hover:bg-secondary/80",
                config.color
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.mentor}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
