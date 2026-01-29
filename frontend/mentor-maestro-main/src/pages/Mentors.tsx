import { MainLayout } from "@/components/layout/MainLayout";
import { MentorCard, MentorStage } from "@/components/dashboard/MentorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, Grid, List } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const allMentors: {
  name: string;
  stage: MentorStage;
  progress: number;
  documentsCount: number;
  meetingsCount: number;
  emailsGenerated: number;
}[] = [
  { name: "Maria Eriksen", stage: "concept-dev", progress: 35, documentsCount: 4, meetingsCount: 2, emailsGenerated: 0 },
  { name: "Jonas Berg", stage: "structure-review", progress: 55, documentsCount: 6, meetingsCount: 3, emailsGenerated: 0 },
  { name: "Kristine Olsen", stage: "email-sequence", progress: 70, documentsCount: 8, meetingsCount: 4, emailsGenerated: 12 },
  { name: "Erik Strand", stage: "production", progress: 85, documentsCount: 10, meetingsCount: 5, emailsGenerated: 18 },
  { name: "Anna Hansen", stage: "concept-review", progress: 40, documentsCount: 5, meetingsCount: 2, emailsGenerated: 0 },
  { name: "Lars Nilsen", stage: "onboarding", progress: 15, documentsCount: 2, meetingsCount: 1, emailsGenerated: 0 },
  { name: "Sofie Dahl", stage: "launch", progress: 100, documentsCount: 12, meetingsCount: 6, emailsGenerated: 24 },
  { name: "Magnus Holm", stage: "concept-dev", progress: 28, documentsCount: 3, meetingsCount: 1, emailsGenerated: 0 },
  { name: "Ingrid Lund", stage: "structure-dev", progress: 45, documentsCount: 7, meetingsCount: 3, emailsGenerated: 0 },
  { name: "Henrik Bø", stage: "email-sequence", progress: 65, documentsCount: 9, meetingsCount: 4, emailsGenerated: 8 },
  { name: "Camilla Voss", stage: "production", progress: 90, documentsCount: 11, meetingsCount: 5, emailsGenerated: 20 },
  { name: "Oscar Lie", stage: "launch", progress: 100, documentsCount: 14, meetingsCount: 7, emailsGenerated: 28 },
];

export default function Mentors() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMentors = allMentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Mentors</h1>
            <p className="text-muted-foreground mt-1">Manage all {allMentors.length} mentors in your pipeline</p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground glow">
            <Plus className="h-4 w-4" />
            Add Mentor
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4 glass rounded-xl p-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search mentors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary border-0 pl-10 placeholder:text-muted-foreground"
              />
            </div>
            <Button variant="outline" className="gap-2 border-border">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
          
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                viewMode === "grid" && "bg-background"
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                viewMode === "list" && "bg-background"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mentors Grid */}
        <div className={cn(
          "grid gap-4",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredMentors.map((mentor) => (
            <MentorCard key={mentor.name} {...mentor} />
          ))}
        </div>

        {filteredMentors.length === 0 && (
          <div className="text-center py-12 glass rounded-xl">
            <p className="text-muted-foreground">No mentors found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
