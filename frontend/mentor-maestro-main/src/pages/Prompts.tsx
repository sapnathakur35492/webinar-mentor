import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  Plus, 
  Edit, 
  Copy,
  Lightbulb,
  Layout,
  Mail,
  CheckCircle,
  ArrowRight
} from "lucide-react";

type PromptCategory = "concept" | "structure" | "email" | "evaluation";

interface Prompt {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  version: string;
  usageCount: number;
}

const categoryConfig: Record<PromptCategory, { label: string; color: string; icon: typeof Lightbulb }> = {
  concept: { label: "Concept", color: "text-amber-400", icon: Lightbulb },
  structure: { label: "Structure", color: "text-blue-400", icon: Layout },
  email: { label: "Email", color: "text-purple-400", icon: Mail },
  evaluation: { label: "Evaluation", color: "text-emerald-400", icon: CheckCircle },
};

const prompts: Prompt[] = [
  { id: "1", name: "Concept Generator v3", description: "Generates 3 webinar concepts from onboarding docs and hooks", category: "concept", version: "3.2", usageCount: 156 },
  { id: "2", name: "Concept Self-Evaluation", description: "AI evaluates its own concept output for quality", category: "evaluation", version: "2.1", usageCount: 145 },
  { id: "3", name: "Concept Improver", description: "Refines concept based on self-evaluation feedback", category: "concept", version: "2.0", usageCount: 142 },
  { id: "4", name: "Transcript Analyzer", description: "Extracts mentor feedback from meeting transcripts", category: "evaluation", version: "1.5", usageCount: 89 },
  { id: "5", name: "Slide Structure Generator", description: "Creates 80-110 slide structure following Perfect Webinar", category: "structure", version: "4.0", usageCount: 67 },
  { id: "6", name: "Structure Evaluator", description: "Reviews slide structure for psychological flow", category: "evaluation", version: "2.3", usageCount: 62 },
  { id: "7", name: "Pre-Webinar Emails", description: "Generates warm-up and reminder email sequence", category: "email", version: "3.1", usageCount: 78 },
  { id: "8", name: "Post-Webinar Emails", description: "Creates attendee vs no-show email sequences", category: "email", version: "2.8", usageCount: 72 },
  { id: "9", name: "Sales Sequence", description: "Open-cart and urgency-driven sales emails", category: "email", version: "3.5", usageCount: 68 },
  { id: "10", name: "Email Self-Review", description: "Evaluates email clarity, CTA strength, psychology", category: "evaluation", version: "2.0", usageCount: 95 },
];

export default function Prompts() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">AI Prompts</h1>
            <p className="text-muted-foreground mt-1">Manage the prompt library that powers your pipeline</p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground glow">
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </div>

        {/* Workflow Visualization */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Prompt Execution Flow</h3>
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-4">
            {["Onboarding + Hooks", "Concept Gen", "Self-Eval", "Improve", "Transcript", "Final Concept"].map((step, i, arr) => (
              <div key={step} className="flex items-center">
                <div className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground whitespace-nowrap">
                  {step}
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2">
          <Button variant="secondary" className="bg-secondary">All Prompts</Button>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Button key={key} variant="outline" className="gap-2 border-border">
                <Icon className={cn("h-4 w-4", config.color)} />
                {config.label}
              </Button>
            );
          })}
        </div>

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prompts.map((prompt) => {
            const category = categoryConfig[prompt.category];
            const CategoryIcon = category.icon;
            
            return (
              <div
                key={prompt.id}
                className="glass rounded-xl p-5 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn("rounded-lg bg-secondary p-2.5 mt-0.5", category.color)}>
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{prompt.name}</h3>
                        <Badge variant="secondary" className="bg-secondary text-muted-foreground text-xs">
                          v{prompt.version}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{prompt.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Used {prompt.usageCount} times</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
