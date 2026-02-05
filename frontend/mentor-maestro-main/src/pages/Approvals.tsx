import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminFeedback } from "@/components/AdminFeedback";
import {
  CheckCircle,
  Clock,
  Send,
  RefreshCw,
  AlertCircle,
  Rocket,
  Lightbulb,
  Mail,
  Image,
  FileText,
  ChevronRight
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useWebinarConcepts } from "@/hooks/useWebinarConcepts";
import { useEmailSequences } from "@/hooks/useEmailSequences";
import { useGeneratedMedia } from "@/hooks/useGeneratedMedia";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const approvalStatusConfig = {
  draft: { label: "Not Submitted", color: "bg-muted text-muted-foreground", icon: Clock },
  pending: { label: "Pending Approval", color: "bg-warning/20 text-warning", icon: Clock },
  approved: { label: "Approved", color: "bg-success/20 text-success", icon: CheckCircle },
  rejected: { label: "Changes Requested", color: "bg-destructive/20 text-destructive", icon: AlertCircle },
};

function getItemStatus(item: { submitted_for_approval_at?: string | null; admin_approved_at?: string | null; status?: string | null; ready_to_publish?: boolean | null }) {
  if (item.ready_to_publish || item.status === "approved") return "approved";
  if (item.status === "rejected") return "rejected";
  if (item.submitted_for_approval_at && !item.admin_approved_at) return "pending";
  return "draft";
}

export default function Approvals() {
  const { profile } = useProfile();
  const { finalConcept, submitForApproval: submitConceptForApproval } = useWebinarConcepts();
  const { sequences, submitForApproval: submitEmailForApproval } = useEmailSequences();
  const { media, submitForApproval: submitMediaForApproval } = useGeneratedMedia(finalConcept?.id);

  const [submittingAll, setSubmittingAll] = useState(false);

  const handleSubmitAllForApproval = async () => {
    setSubmittingAll(true);
    try {
      // Submit concept if not already submitted
      if (finalConcept && !finalConcept.submitted_for_approval_at) {
        await submitConceptForApproval.mutateAsync(finalConcept.id);
      }

      // Submit all email sequences
      for (const seq of sequences) {
        if (!seq.submitted_for_approval_at) {
          await submitEmailForApproval.mutateAsync(seq.id);
        }
      }

      // Submit all media
      for (const m of media) {
        if (!m.submitted_for_approval_at) {
          await submitMediaForApproval.mutateAsync(m.id);
        }
      }

      toast.success("All content submitted for admin approval!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit for approval");
    } finally {
      setSubmittingAll(false);
    }
  };

  const allApproved = finalConcept?.ready_to_publish &&
    sequences.every(s => s.ready_to_publish) &&
    media.every(m => m.ready_to_publish);

  const pendingApprovalCount = [
    finalConcept?.submitted_for_approval_at && !finalConcept?.admin_approved_at ? 1 : 0,
    ...sequences.filter(s => s.submitted_for_approval_at && !s.admin_approved_at).map(() => 1),
    ...media.filter(m => m.submitted_for_approval_at && !m.admin_approved_at).map(() => 1),
  ].reduce((a, b) => a + b, 0);

  const hasContentToSubmit = (finalConcept && !finalConcept.submitted_for_approval_at) ||
    sequences.some(s => !s.submitted_for_approval_at) ||
    media.some(m => !m.submitted_for_approval_at);

  const rejectedItems = [
    ...(finalConcept?.status === "rejected" && finalConcept?.admin_notes ? [{ type: "concept", notes: finalConcept.admin_notes, link: "/concepts" }] : []),
    ...sequences.filter(s => s.status === "rejected" && s.admin_notes).map(s => ({ type: "email", notes: `${s.sequence_type}: ${s.admin_notes}`, link: "/emails" })),
    ...media.filter(m => m.status === "rejected" && m.admin_notes).map(m => ({ type: "media", notes: `${m.title}: ${m.admin_notes}`, link: "/concepts" })),
  ];

  const conceptStatus = finalConcept ? getItemStatus(finalConcept) : null;
  const approvedCount = sequences.filter(s => s.ready_to_publish).length + media.filter(m => m.ready_to_publish).length + (finalConcept?.ready_to_publish ? 1 : 0);
  const totalCount = sequences.length + media.length + (finalConcept ? 1 : 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Approvals</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage admin approval for all your content
            </p>
          </div>
          {hasContentToSubmit && (
            <Button
              onClick={handleSubmitAllForApproval}
              disabled={submittingAll}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {submittingAll ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit All for Approval
                </>
              )}
            </Button>
          )}
        </div>

        {/* Ready to Publish Banner */}
        {allApproved && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Rocket className="h-6 w-6 text-success" />
              <div>
                <h3 className="font-semibold text-foreground">Ready to Publish!</h3>
                <p className="text-sm text-muted-foreground">
                  All content has been approved by admin. Your webinar is ready to go live.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approval Status */}
        {pendingApprovalCount > 0 && !allApproved && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-warning" />
              <div>
                <h3 className="font-semibold text-foreground">Pending Admin Review</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingApprovalCount} item{pendingApprovalCount > 1 ? 's' : ''} waiting for admin approval
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rejected Items with Admin Feedback */}
        {rejectedItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Items Requiring Changes ({rejectedItems.length})
            </h3>
            {rejectedItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-1">
                  <AdminFeedback notes={item.notes} status="rejected" />
                </div>
                <Link to={item.link}>
                  <Button variant="outline" size="sm" className="gap-1">
                    Fix <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-foreground">{totalCount}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-success">{approvedCount}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-warning">{pendingApprovalCount}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="text-2xl font-bold text-destructive">{rejectedItems.length}</div>
            <div className="text-sm text-muted-foreground">Needs Changes</div>
          </div>
        </div>

        {/* Detailed Status by Category */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <Accordion type="multiple" defaultValue={["concept", "emails", "media"]} className="w-full">
            {/* Webinar Concept */}
            <AccordionItem value="concept" className="border-b border-border">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-foreground">Webinar Concept</span>
                    <p className="text-xs text-muted-foreground">Your approved webinar idea and strategy</p>
                  </div>
                  {conceptStatus && (
                    <Badge className={cn("border-0 text-xs mr-2", approvalStatusConfig[conceptStatus].color)}>
                      {approvalStatusConfig[conceptStatus].label}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4">
                {finalConcept ? (
                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-foreground font-medium mb-1">Big Idea</p>
                      <p className="text-sm text-muted-foreground">{finalConcept.big_idea}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {finalConcept.submitted_for_approval_at
                          ? `Submitted for approval`
                          : "Not yet submitted"}
                      </span>
                      <Link to="/concepts">
                        <Button variant="outline" size="sm" className="gap-1">
                          View Details <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No approved concept yet</p>
                    <Link to="/concepts">
                      <Button variant="outline" size="sm" className="mt-2">
                        Go to Concepts
                      </Button>
                    </Link>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Email Sequences */}
            <AccordionItem value="emails" className="border-b border-border">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-foreground">Email Sequences</span>
                    <p className="text-xs text-muted-foreground">{sequences.length} sequences</p>
                  </div>
                  <Badge className={cn("border-0 text-xs mr-2",
                    sequences.every(s => s.ready_to_publish)
                      ? "bg-success/20 text-success"
                      : sequences.some(s => s.submitted_for_approval_at)
                        ? "bg-warning/20 text-warning"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {sequences.filter(s => s.ready_to_publish).length}/{sequences.length} Approved
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4">
                {sequences.length > 0 ? (
                  <div className="space-y-2">
                    {sequences.map(seq => {
                      const status = getItemStatus(seq);
                      const StatusIcon = approvalStatusConfig[status].icon;
                      return (
                        <div key={seq.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <StatusIcon className={cn("h-4 w-4",
                              status === "approved" ? "text-success" :
                                status === "pending" ? "text-warning" :
                                  status === "rejected" ? "text-destructive" : "text-muted-foreground"
                            )} />
                            <div>
                              <p className="text-sm font-medium text-foreground capitalize">{seq.sequence_type.replace("_", " ")}</p>
                              <p className="text-xs text-muted-foreground">{seq.email_count || 0} emails</p>
                            </div>
                          </div>
                          <Badge className={cn("border-0 text-xs", approvalStatusConfig[status].color)}>
                            {approvalStatusConfig[status].label}
                          </Badge>
                        </div>
                      );
                    })}
                    <div className="flex justify-end pt-2">
                      <Link to="/emails">
                        <Button variant="outline" size="sm" className="gap-1">
                          View All <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No email sequences yet</p>
                    <Link to="/emails">
                      <Button variant="outline" size="sm" className="mt-2">
                        Go to Emails
                      </Button>
                    </Link>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Generated Media */}
            <AccordionItem value="media">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="rounded-lg bg-purple-500/10 p-2">
                    <Image className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-foreground">Promotional Images</span>
                    <p className="text-xs text-muted-foreground">{media.length} images</p>
                  </div>
                  <Badge className={cn("border-0 text-xs mr-2",
                    media.every(m => m.ready_to_publish)
                      ? "bg-success/20 text-success"
                      : media.some(m => m.submitted_for_approval_at)
                        ? "bg-warning/20 text-warning"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {media.filter(m => m.ready_to_publish).length}/{media.length} Approved
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4">
                {media.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {media.map(m => {
                        const status = getItemStatus(m);
                        return (
                          <div key={m.id} className="relative rounded-lg overflow-hidden border border-border">
                            {m.image_url ? (
                              <img src={m.image_url} alt={m.title} className="aspect-video object-cover w-full" />
                            ) : (
                              <div className="aspect-video bg-muted flex items-center justify-center">
                                <Image className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <Badge className={cn("border-0 text-xs", approvalStatusConfig[status].color)}>
                                {status === "approved" ? "✓" : status === "pending" ? "⏳" : status === "rejected" ? "!" : "○"}
                              </Badge>
                            </div>
                            <div className="p-2 bg-background/80 backdrop-blur-sm">
                              <p className="text-xs font-medium text-foreground truncate">{m.title}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end pt-2">
                      <Link to="/concepts">
                        <Button variant="outline" size="sm" className="gap-1">
                          Manage Images <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No promotional images yet</p>
                    <Link to="/concepts">
                      <Button variant="outline" size="sm" className="mt-2">
                        Go to Concepts
                      </Button>
                    </Link>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* How it works explanation */}
        <div className="bg-muted/50 rounded-xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            How Approval Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 font-semibold text-muted-foreground">1</div>
              <div>
                <p className="font-medium text-foreground">Create Content</p>
                <p className="text-muted-foreground text-xs">Generate concepts, emails, and images</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0 font-semibold text-warning">2</div>
              <div>
                <p className="font-medium text-foreground">Submit for Review</p>
                <p className="text-muted-foreground text-xs">Send to admin when you're happy</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 font-semibold text-primary">3</div>
              <div>
                <p className="font-medium text-foreground">Admin Reviews</p>
                <p className="text-muted-foreground text-xs">Approves or requests changes</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center shrink-0 font-semibold text-success">4</div>
              <div>
                <p className="font-medium text-foreground">Ready to Publish</p>
                <p className="text-muted-foreground text-xs">Launch your webinar!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
