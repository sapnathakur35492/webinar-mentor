
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminFeedback } from "@/components/AdminFeedback";
import {
  Layout,
  Sparkles,
  Lock,
  Image,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  Trash2,
  Download,
  AlertCircle,
  Rocket,
  MessageSquare,
  FileText,
  Copy
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useWebinarConcepts } from "@/hooks/useWebinarConcepts";
import { useEmailSequences } from "@/hooks/useEmailSequences";
import { useGeneratedMedia } from "@/hooks/useGeneratedMedia";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const imageTypes = [
  { id: "registration_hero", label: "Registration Hero", description: "Main hero image for landing page" },
  { id: "social_ad", label: "Social Media Ad", description: "Eye-catching ad for Facebook/Instagram" },
  { id: "email_header", label: "Email Header", description: "Banner for email campaigns" },
  { id: "slide_title", label: "Title Slide", description: "Presentation title slide background" },
  { id: "slide_content", label: "Content Slide", description: "Clean content slide background" },
  { id: "thumbnail", label: "Video Thumbnail", description: "Webinar replay thumbnail" },
];

const approvalStatusConfig = {
  generated: { label: "Generated", color: "bg-muted text-muted-foreground", icon: Clock },
  pending_approval: { label: "Pending Approval", color: "bg-amber-100 text-amber-600", icon: Clock },
  approved: { label: "Admin Approved", color: "bg-emerald-100 text-emerald-600", icon: CheckCircle2 },
  rejected: { label: "Changes Requested", color: "bg-red-100 text-red-600", icon: AlertCircle },
};

export default function Structure() {
  const { profile } = useProfile();
  const { finalConcept, submitForApproval: submitConceptForApproval, refetch: refetchConcepts } = useWebinarConcepts();
  const { sequences, submitForApproval: submitEmailForApproval } = useEmailSequences();
  const { media, submitForApproval: submitMediaForApproval, deleteMedia } = useGeneratedMedia(finalConcept?.id);
  const queryClient = useQueryClient();

  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [submittingAll, setSubmittingAll] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

  const canGenerate = finalConcept !== undefined;
  const hasStructure = !!finalConcept?.secret_structure;

  // --- Structure Generation ---
  const handleGenerateStructure = async () => {
    if (!finalConcept?.id) return;

    setIsGeneratingStructure(true);
    try {
      const assetId = localStorage.getItem("current_asset_id");
      if (!assetId) throw new Error("No asset ID found");

      const conceptText = `Big Idea: ${finalConcept.big_idea}\nHook: ${finalConcept.hooks}\nMechanism: ${finalConcept.mechanism}`;

      await api.generateStructure(assetId, conceptText);

      toast.success("Structure generated successfully!");
      // Refresh to move to "Has Structure" state
      await refetchConcepts();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate structure");
    } finally {
      setIsGeneratingStructure(false);
    }
  };

  // --- Image Generation ---
  const handleGenerateImage = async (imageType: string) => {
    if (!finalConcept?.id) {
      toast.error("Please approve a concept first");
      return;
    }

    setGeneratingImage(imageType);
    try {
      const assetId = localStorage.getItem("current_asset_id");
      if (!assetId) {
        throw new Error("No asset ID found");
      }

      // Get concept text for better image generation
      const conceptText = `${finalConcept.big_idea}. ${finalConcept.hooks?.[0] || ""}`;

      const result = await api.generatePromotionalImage(assetId, imageType, conceptText);

      if (result.status === "success" && result.image_url) {
        // Store the image URL in local state
        setGeneratedImages(prev => ({
          ...prev,
          [imageType]: result.image_url
        }));

        toast.success(`${imageTypes.find(t => t.id === imageType)?.label} generated!`);
        console.log("Generated image URL:", result.image_url);

        // TODO: Save to database via Supabase or backend
        // For now the image will be displayed from the response

        queryClient.invalidateQueries({ queryKey: ["generated-media"] });
      } else {
        throw new Error("Image generation failed");
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      toast.error(error.message || "Failed to generate image");
    } finally {
      setGeneratingImage(null);
    }
  };

  const getMediaByType = (type: string) => media.find(m => m.media_type === type);

  // --- Submissions ---
  const handleSubmitAllForApproval = async () => {
    setSubmittingAll(true);
    try {
      if (finalConcept && !finalConcept.submitted_for_approval_at) {
        await submitConceptForApproval.mutateAsync(finalConcept.id);
      }
      for (const seq of sequences) {
        if (!seq.submitted_for_approval_at) {
          await submitEmailForApproval.mutateAsync(seq.id);
        }
      }
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

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a3c1a]">Structure & Assets</h1>
            <p className="text-muted-foreground mt-1">
              Refine your webinar structure and generate promotional media.
            </p>
          </div>
          {hasContentToSubmit && (
            <Button
              onClick={handleSubmitAllForApproval}
              disabled={submittingAll || !canGenerate}
              className="gap-2 bg-[#1a3c1a] hover:bg-[#1a3c1a]/90 text-white font-bold"
            >
              {submittingAll ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit All
                </>
              )}
            </Button>
          )}
        </div>

        {/* Lock Notice */}
        {!canGenerate && (
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 flex items-center gap-4 shadow-sm">
            <div className="rounded-full bg-amber-100 p-3">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Approve your concept first</h3>
              <p className="text-amber-700">
                You need an approved webinar concept before generating structure and assets.
              </p>
            </div>
          </div>
        )}

        {/* --- SECTION 1: SLIDE STRUCTURE --- */}
        {canGenerate && (
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-[#1a3c1a] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Layout className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Slide Structure</h2>
                  <p className="text-[#dffec0] text-sm">The perfect webinar framework</p>
                </div>
              </div>
              {hasStructure && (
                <Badge className="bg-[#dffec0] text-[#1a3c1a] hover:bg-[#dffec0]">Generated</Badge>
              )}
            </div>

            <div className="p-6">
              {!hasStructure ? (
                <div className="text-center py-10">
                  <FileText className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900">No structure generated yet</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Use our AI to generate a comprehensive slide-by-slide outline based on your concept.
                  </p>
                  <Button
                    onClick={handleGenerateStructure}
                    disabled={isGeneratingStructure}
                    className="bg-[#72bf44] hover:bg-[#61a33a] text-white font-bold h-12 px-8"
                  >
                    {isGeneratingStructure ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                        Generating Structure...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Slide Outline
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 max-h-[500px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                      {/* Display a simplified preview if JSON, or raw text */}
                      {finalConcept.secret_structure}
                    </pre>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(finalConcept.secret_structure || "")}>
                      <Copy className="h-4 w-4 mr-2" /> Copy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGenerateStructure}
                      disabled={isGeneratingStructure}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* --- SECTION 2: PROMOTIONAL IMAGES --- */}
        {canGenerate && (
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex items-center gap-3">
              <Image className="h-6 w-6 text-[#1a3c1a]" />
              <h3 className="text-xl font-bold text-[#1a3c1a]">Promotional Images</h3>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {imageTypes.map((type) => {
                const existingMedia = getMediaByType(type.id);
                const status = existingMedia?.status ? approvalStatusConfig[existingMedia.status as keyof typeof approvalStatusConfig] : null;

                return (
                  <div
                    key={type.id}
                    className="bg-gray-50 rounded-xl overflow-hidden border border-border group hover:shadow-md transition-all"
                  >
                    {/* Check generated images first, then existing media */}
                    {(generatedImages[type.id] || existingMedia?.image_url) ? (
                      <div className="relative aspect-video bg-gray-200">
                        <img
                          src={generatedImages[type.id] || existingMedia.image_url}
                          alt={type.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          {status && (
                            <Badge className={cn("border-0 text-xs shadow-sm", status.color)}>
                              <status.icon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 flex items-center justify-center border-b border-gray-200">
                        <Image className="h-10 w-10 text-gray-300" />
                      </div>
                    )}

                    <div className="p-4">
                      <h4 className="font-bold text-gray-900">{type.label}</h4>
                      <p className="text-xs text-gray-500 mb-4 h-8">{type.description}</p>

                      {existingMedia?.admin_notes && (
                        <div className="mb-3 text-xs bg-red-50 text-red-600 rounded p-2 flex items-start gap-1.5 border border-red-100">
                          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{existingMedia.admin_notes}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {(generatedImages[type.id] || existingMedia) ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={() => handleGenerateImage(type.id)}
                              disabled={generatingImage === type.id}
                            >
                              {generatingImage === type.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                              Retry
                            </Button>
                            {existingMedia && (
                              <Button variant="ghost" size="sm" onClick={() => deleteMedia.mutate(existingMedia.id)}>
                                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                              </Button>
                            )}
                            {(generatedImages[type.id] || existingMedia?.image_url) && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={generatedImages[type.id] || existingMedia.image_url} download target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 text-gray-400" />
                                </a>
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full gap-2 bg-[#1a3c1a] hover:bg-[#1a3c1a]/90 text-white font-medium"
                            onClick={() => handleGenerateImage(type.id)}
                            disabled={generatingImage === type.id}
                          >
                            {generatingImage === type.id ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3" />
                                Generate
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
