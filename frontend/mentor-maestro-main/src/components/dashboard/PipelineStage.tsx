import { cn } from "@/lib/utils";
import { Check, Clock, AlertCircle } from "lucide-react";

export type StageStatus = "completed" | "in-progress" | "pending" | "blocked";

interface PipelineStageProps {
  name: string;
  status: StageStatus;
  count: number;
  isLast?: boolean;
}

const statusConfig: Record<StageStatus, { icon: typeof Check; color: string; bg: string }> = {
  completed: { icon: Check, color: "text-success", bg: "bg-success/20" },
  "in-progress": { icon: Clock, color: "text-primary", bg: "bg-primary/20" },
  pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-secondary" },
  blocked: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/20" },
};

export function PipelineStage({ name, status, count, isLast }: PipelineStageProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-all",
          config.bg,
          status === "in-progress" && "animate-pulse-glow"
        )}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs font-medium text-foreground">{name}</p>
          <p className={cn("text-lg font-semibold", config.color)}>{count}</p>
        </div>
      </div>
      {!isLast && (
        <div className="mx-3 h-0.5 w-12 bg-border" />
      )}
    </div>
  );
}
