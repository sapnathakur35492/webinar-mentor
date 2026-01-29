import { cn } from "@/lib/utils";
import { FileText, Video, Mail, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type MentorStage = 
  | "onboarding"
  | "concept-dev"
  | "concept-review"
  | "structure-dev"
  | "structure-review"
  | "email-sequence"
  | "production"
  | "launch";

const stageConfig: Record<MentorStage, { label: string; color: string }> = {
  "onboarding": { label: "Onboarding", color: "bg-muted text-muted-foreground" },
  "concept-dev": { label: "Concept Dev", color: "bg-primary/20 text-primary" },
  "concept-review": { label: "Concept Review", color: "bg-warning/20 text-warning" },
  "structure-dev": { label: "Structure Dev", color: "bg-primary/20 text-primary" },
  "structure-review": { label: "Structure Review", color: "bg-warning/20 text-warning" },
  "email-sequence": { label: "Emails", color: "bg-primary/20 text-primary" },
  "production": { label: "Production", color: "bg-success/20 text-success" },
  "launch": { label: "Launch Ready", color: "bg-success/20 text-success" },
};

interface MentorCardProps {
  name: string;
  avatar?: string;
  stage: MentorStage;
  progress: number;
  documentsCount: number;
  meetingsCount: number;
  emailsGenerated: number;
}

export function MentorCard({
  name,
  avatar,
  stage,
  progress,
  documentsCount,
  meetingsCount,
  emailsGenerated,
}: MentorCardProps) {
  const config = stageConfig[stage];

  return (
    <div className="glass rounded-xl p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold">
            {avatar ? (
              <img src={avatar} alt={name} className="h-full w-full rounded-full object-cover" />
            ) : (
              name.charAt(0)
            )}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{name}</h3>
            <Badge className={cn("mt-1 border-0 text-xs", config.color)}>
              {config.label}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Pipeline Progress</span>
          <span className="text-foreground font-medium">{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div 
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          <span>{documentsCount} docs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5" />
          <span>{meetingsCount} meetings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          <span>{emailsGenerated} emails</span>
        </div>
      </div>
    </div>
  );
}
