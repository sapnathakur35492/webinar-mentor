import { MainLayout } from "@/components/layout/MainLayout";
import { useEmailSequences, ContentStatus, EmailSequence } from "@/hooks/useEmailSequences";
import { useWebinarConcepts } from "@/hooks/useWebinarConcepts";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/components/AdminFeedback";
import {
  Sparkles,
  Mail,
  CheckCircle2,
  Clock,
  RefreshCw,
  Copy,
  Lock,
  ChevronRight,
  ChevronDown,
  Edit3,
  Send,
  X,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";

const statusConfig: Record<ContentStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-500", icon: Clock },
  in_review: { label: "In Review", color: "bg-amber-100 text-amber-600", icon: RefreshCw },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-600", icon: CheckCircle2 },
  rejected: { label: "Needs Work", color: "bg-red-100 text-red-600", icon: RefreshCw },
};

const sequenceTypes = [
  { id: "pre_webinar", label: "Pre-Webinar", description: "Warm-up, reminders, show-up maximization", color: "bg-blue-100 text-blue-600" },
  { id: "post_webinar", label: "Post-Webinar", description: "Attendee vs no-show follow-ups", color: "bg-purple-100 text-purple-600" },
  { id: "sales", label: "Sales Sequence", description: "Open-cart and urgency emails", color: "bg-[#dffec0] text-[#1a3c1a]" },
  { id: "replay", label: "Replay & Repitch", description: "Replay access and final push", color: "bg-emerald-100 text-emerald-600" },
];

interface Email {
  order: number;
  subject: string;
  preview_text: string;
  body: string;
  send_timing: string;
  purpose: string;
}

export default function Emails() {
  const { sequences, isLoading, createSequence } = useEmailSequences();
  const { finalConcept } = useWebinarConcepts();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<number | null>(null);
  const [editingEmail, setEditingEmail] = useState<number | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<Record<number, string>>({});
  const [feedbackErrors, setFeedbackErrors] = useState<Record<number, boolean>>({});
  const [refiningEmail, setRefiningEmail] = useState<number | null>(null);

  const canGenerate = finalConcept !== undefined;

  const handleGenerate = async (sequenceType: string) => {
    const assetId = localStorage.getItem("current_asset_id");

    if (!assetId || !finalConcept?.big_idea) {
      toast.error("Please approve a webinar concept first");
      return;
    }

    setGeneratingType(sequenceType);
    try {
      // Use existing structure or fallback
      const structureText = finalConcept.secret_structure || "Structure not generated yet.";
      const productDetails = `Mechanism: ${finalConcept.mechanism}. Offer: ${finalConcept.offer_transition}`;

      const result = await api.generateEmails(assetId, structureText, productDetails);

      if (result.status === "success" || result.data) {
        queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
        toast.success(`${sequenceTypes.find(t => t.id === sequenceType)?.label} emails generated!`);
      } else {
        throw new Error("Generation failed");
      }
    } catch (error: any) {
      console.error("Email generation error", error);
      toast.error(error.message || "Failed to generate sequence");
    } finally {
      setGeneratingType(null);
    }
  };

  const handleRefineEmail = async (emailIndex: number) => {
    if (!selectedSequence || !emailFeedback[emailIndex]?.trim()) {
      setFeedbackErrors(prev => ({ ...prev, [emailIndex]: true }));
      toast.error("Vennligst skriv inn tilbakemelding");
      return;
    }

    const emails = parseEmails(selectedSequence.emails);
    const currentEmail = emails[emailIndex];

    setRefiningEmail(emailIndex);
    try {
      const { data, error } = await supabase.functions.invoke("refine-email", {
        body: {
          sequenceId: selectedSequence.id,
          emailIndex,
          feedback: emailFeedback[emailIndex],
          currentEmail,
        },
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      setEmailFeedback(prev => ({ ...prev, [emailIndex]: "" }));
      setEditingEmail(null);
      toast.success("Email refined successfully!");
      setSelectedSequence(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to refine email");
    } finally {
      setRefiningEmail(null);
    }
  };

  const handleRegenerate = async (sequenceType: string) => {
    await handleGenerate(sequenceType);
  };

  const getSequencesByType = (type: string) => sequences.filter(s => s.sequence_type === type);

  const parseEmails = (emails: unknown): Email[] => {
    if (!emails) return [];
    if (Array.isArray(emails)) return emails as Email[];
    return [];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Email Sequences</h1>
            <p className="text-muted-foreground mt-1">
              Generate high-converting email campaigns using your webinar structure.
            </p>
          </div>

          <Button variant="outline" onClick={() => navigate("/structure")} className="hidden md:flex gap-2">
            View Structure <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Lock Notice */}
        {!canGenerate && (
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 flex items-center gap-4 shadow-sm">
            <div className="rounded-full bg-amber-100 p-3">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Concept Required</h3>
              <p className="text-amber-700">
                You need an approved webinar concept before generating email sequences
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/concepts")}
              className="ml-auto"
            >
              Go to Concepts
            </Button>
          </div>
        )}

        {/* Sequence Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sequenceTypes.map((type) => {
            const typeSequences = getSequencesByType(type.id);
            const latestSequence = typeSequences[0];
            const status = latestSequence?.status ? statusConfig[latestSequence.status] : null;

            return (
              <div key={type.id} className="rounded-xl border border-white/10 overflow-hidden hover:border-[#3bba69]/30 transition-all" style={{ backgroundColor: '#142721' }}>
                <div className="p-6 border-b border-white/10 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className={cn("rounded-lg p-3", type.color)}>
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{type.label}</h3>
                      <p className="text-sm text-white/60">{type.description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {latestSequence ? (
                    <div className="space-y-4">
                      {/* Admin Feedback Alert */}
                      {latestSequence.admin_notes && latestSequence.status === "rejected" && (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Admin requested changes</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white/70">
                          {latestSequence.email_count || 0} emails generated
                        </span>
                        {status && (
                          <Badge className={cn("border-0 gap-1", status.color)}>
                            <status.icon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/40">
                        Last updated {formatDistanceToNow(new Date(latestSequence.updated_at), { addSuffix: true })}
                      </p>
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1 gap-1.5"
                          onClick={() => {
                            setSelectedSequence(latestSequence);
                            setExpandedEmail(null);
                            setEditingEmail(null);
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                          View & Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/40 hover:text-[#3bba69]"
                          onClick={() => handleRegenerate(type.id)}
                          disabled={generatingType === type.id}
                          title="Regenerate"
                        >
                          {generatingType === type.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <Button
                        onClick={() => handleGenerate(type.id)}
                        disabled={!canGenerate || generatingType === type.id}
                        className="w-full h-12 gap-2 bg-[#1a3c1a] hover:bg-[#1a3c1a]/90 text-white font-bold"
                      >
                        {generatingType === type.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate Sequence
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Email Viewer Dialog */}
      <Dialog open={!!selectedSequence} onOpenChange={() => setSelectedSequence(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-white border-0 shadow-2xl">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-[#1a3c1a]">
              <Mail className="h-6 w-6 text-[#72bf44]" />
              {sequenceTypes.find(t => t.id === selectedSequence?.sequence_type)?.label} Sequence
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-6">
            <div className="space-y-6 pt-2">
              {/* Admin Feedback at top of dialog */}
              {selectedSequence?.admin_notes && (
                <AdminFeedback
                  notes={selectedSequence.admin_notes}
                  status={selectedSequence.status}
                  onRevise={async () => {
                    if (selectedSequence) {
                      await handleRegenerate(selectedSequence.sequence_type);
                      setSelectedSequence(null);
                    }
                  }}
                  isRevising={generatingType === selectedSequence?.sequence_type}
                />
              )}

              {selectedSequence && parseEmails(selectedSequence.emails).map((email, index) => (
                <div
                  key={index}
                  className={cn(
                    "bg-white rounded-xl border transition-all duration-200",
                    expandedEmail === index ? "border-[#1a3c1a] ring-1 ring-[#1a3c1a]/10 shadow-lg" : "border-gray-200 hover:border-[#72bf44]/50"
                  )}
                >
                  <button
                    onClick={() => setExpandedEmail(expandedEmail === index ? null : index)}
                    className="w-full p-5 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                        expandedEmail === index ? "bg-[#1a3c1a] text-white" : "bg-gray-100 text-gray-500"
                      )}>
                        #{email.order}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{email.subject}</p>
                        <p className="text-sm text-gray-500 font-medium">{email.send_timing}</p>
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "h-5 w-5 text-gray-400 transition-transform duration-200",
                      expandedEmail === index && "rotate-180 text-[#1a3c1a]"
                    )} />
                  </button>

                  {expandedEmail === index && (
                    <div className="px-5 pb-6 border-t border-gray-100 pt-6 space-y-5 animate-slide-down">
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-sm text-gray-600 font-medium">
                          <span className="text-gray-400 uppercase text-xs tracking-wider mr-2">Preview Text:</span>
                          {email.preview_text}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingEmail(editingEmail === index ? null : index)}
                            className="gap-1.5 text-gray-600 hover:text-[#1a3c1a]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            {editingEmail === index ? "Cancel" : "Edit"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(email.body)}
                            className="gap-1.5 text-gray-600 hover:text-[#1a3c1a]"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-inner font-serif text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {email.body}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded border border-gray-100 inline-flex">
                        <span className="font-bold text-[#1a3c1a] uppercase text-xs">Goal:</span> {email.purpose}
                      </div>

                      {/* AI Refinement Section */}
                      {editingEmail === index && (
                        <div className="pt-4 border-t border-gray-100 space-y-3">
                          <label className="text-xs text-[#72bf44] font-bold uppercase tracking-wide flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI-Powered Refinement
                          </label>
                          <Textarea
                            placeholder="Tell the AI how to improve this email... e.g., 'Make it more urgent' or 'Add more social proof' or 'Shorten the body'"
                            className={`bg-gray-50 border-gray-200 min-h-[100px] focus:ring-[#72bf44] ${feedbackErrors[index] ? "border-2 border-red-500 focus:ring-red-500" : ""
                              }`}
                            value={emailFeedback[index] || ""}
                            onChange={(e) => {
                              setEmailFeedback(prev => ({ ...prev, [index]: e.target.value }));
                              if (feedbackErrors[index]) {
                                setFeedbackErrors(prev => ({ ...prev, [index]: false }));
                              }
                            }}
                          />
                          {feedbackErrors[index] && (
                            <p className="text-red-500 text-xs mt-1">Tilbakemelding er påkrevd</p>
                          )}
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleRefineEmail(index)}
                              disabled={refiningEmail === index || !emailFeedback[index]?.trim()}
                              className="gap-2 bg-[#1a3c1a] hover:bg-[#1a3c1a]/90 text-white font-bold"
                            >
                              {refiningEmail === index ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  Refining...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4" />
                                  Apply AI Polish
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

