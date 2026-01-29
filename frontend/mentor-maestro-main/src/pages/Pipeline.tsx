import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Lightbulb, 
  MessageSquare, 
  Layout, 
  Mail, 
  Video, 
  Rocket,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";

type PipelineColumn = {
  id: string;
  title: string;
  icon: typeof FileText;
  color: string;
  mentors: { id: string; name: string; daysInStage: number; hasBlocker?: boolean }[];
};

const pipelineColumns: PipelineColumn[] = [
  {
    id: "onboarding",
    title: "Onboarding",
    icon: FileText,
    color: "text-blue-400",
    mentors: [
      { id: "1", name: "Lars Nilsen", daysInStage: 2 },
      { id: "2", name: "Hanna Moe", daysInStage: 1 },
    ],
  },
  {
    id: "concept",
    title: "Concept Dev",
    icon: Lightbulb,
    color: "text-amber-400",
    mentors: [
      { id: "3", name: "Maria Eriksen", daysInStage: 4 },
      { id: "4", name: "Magnus Holm", daysInStage: 3 },
      { id: "5", name: "Nina Foss", daysInStage: 5, hasBlocker: true },
    ],
  },
  {
    id: "concept-review",
    title: "Concept Review",
    icon: MessageSquare,
    color: "text-orange-400",
    mentors: [
      { id: "6", name: "Anna Hansen", daysInStage: 2 },
    ],
  },
  {
    id: "structure",
    title: "Structure Dev",
    icon: Layout,
    color: "text-primary",
    mentors: [
      { id: "7", name: "Ingrid Lund", daysInStage: 3 },
      { id: "8", name: "Jonas Berg", daysInStage: 6, hasBlocker: true },
    ],
  },
  {
    id: "emails",
    title: "Email Sequence",
    icon: Mail,
    color: "text-purple-400",
    mentors: [
      { id: "9", name: "Kristine Olsen", daysInStage: 4 },
      { id: "10", name: "Henrik Bø", daysInStage: 2 },
    ],
  },
  {
    id: "production",
    title: "Production",
    icon: Video,
    color: "text-emerald-400",
    mentors: [
      { id: "11", name: "Erik Strand", daysInStage: 7 },
      { id: "12", name: "Camilla Voss", daysInStage: 3 },
    ],
  },
  {
    id: "launch",
    title: "Launch Ready",
    icon: Rocket,
    color: "text-success",
    mentors: [
      { id: "13", name: "Sofie Dahl", daysInStage: 1 },
      { id: "14", name: "Oscar Lie", daysInStage: 2 },
    ],
  },
];

export default function Pipeline() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Pipeline</h1>
            <p className="text-muted-foreground mt-1">Kanban view of all mentor production stages</p>
          </div>
        </div>

        {/* Pipeline Board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {pipelineColumns.map((column) => {
              const Icon = column.icon;
              return (
                <div
                  key={column.id}
                  className="w-72 flex-shrink-0 glass rounded-xl overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", column.color)} />
                      <span className="font-medium text-foreground">{column.title}</span>
                      <Badge variant="secondary" className="ml-1 bg-secondary text-muted-foreground">
                        {column.mentors.length}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Column Content */}
                  <div className="p-3 space-y-3 min-h-[400px]">
                    {column.mentors.map((mentor) => (
                      <div
                        key={mentor.id}
                        className={cn(
                          "bg-card rounded-lg p-3 border border-border hover:border-primary/30 transition-all cursor-pointer group",
                          mentor.hasBlocker && "border-destructive/30"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-medium">
                              {mentor.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{mentor.name}</p>
                              <p className="text-xs text-muted-foreground">{mentor.daysInStage} days in stage</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {mentor.hasBlocker && (
                          <Badge className="mt-2 bg-destructive/20 text-destructive border-0 text-xs">
                            Needs attention
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
