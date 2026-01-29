import { AlertTriangle, MessageSquare, RefreshCw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface AdminFeedbackProps {
  notes: string | null | undefined;
  status?: string | null;
  className?: string;
  onRevise?: (feedback: string) => Promise<void>;
  isRevising?: boolean;
  showReviseOption?: boolean;
}

export function AdminFeedback({ 
  notes, 
  status, 
  className, 
  onRevise, 
  isRevising = false,
  showReviseOption = true 
}: AdminFeedbackProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");

  if (!notes) return null;

  const isRejected = status === "rejected";

  const handleSubmitRevision = async () => {
    if (!onRevise || !revisionNotes.trim()) return;
    await onRevise(revisionNotes);
    setRevisionNotes("");
    setIsEditing(false);
  };

  return (
    <div className={cn(
      "rounded-xl overflow-hidden border-2",
      isRejected 
        ? "bg-destructive/5 border-destructive/40" 
        : "bg-warning/5 border-warning/40",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "px-4 py-3 flex items-center gap-3",
        isRejected ? "bg-destructive/10" : "bg-warning/10"
      )}>
        <div className={cn(
          "rounded-lg p-2 shrink-0",
          isRejected ? "bg-destructive/20" : "bg-warning/20"
        )}>
          {isRejected ? (
            <AlertTriangle className={cn("h-4 w-4", "text-destructive")} />
          ) : (
            <MessageSquare className="h-4 w-4 text-warning" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-semibold",
            isRejected ? "text-destructive" : "text-warning"
          )}>
            {isRejected ? "Changes Requested by Admin" : "Admin Feedback"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRejected 
              ? "Please review the feedback and make revisions" 
              : "Review this feedback for your reference"}
          </p>
        </div>
      </div>

      {/* Feedback Content */}
      <div className="p-4 space-y-4">
        <div className="bg-background rounded-lg p-4 border border-border">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {notes}
          </p>
        </div>

        {/* Revise Section */}
        {showReviseOption && onRevise && isRejected && (
          <>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className={cn(
                  "w-full gap-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50",
                  "text-destructive hover:text-destructive"
                )}
              >
                <RefreshCw className="h-4 w-4" />
                Revise Based on Feedback
              </Button>
            ) : (
              <div className="space-y-3 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3" />
                  Your Revision Instructions
                </label>
                <Textarea
                  placeholder="Describe how you want to address the admin's feedback... The AI will regenerate this content with your instructions."
                  className="min-h-[120px] bg-muted border-0"
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setRevisionNotes("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitRevision}
                    disabled={isRevising || !revisionNotes.trim()}
                    className="flex-1 gap-2"
                  >
                    {isRevising ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Revising...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Apply Revisions & Resubmit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
