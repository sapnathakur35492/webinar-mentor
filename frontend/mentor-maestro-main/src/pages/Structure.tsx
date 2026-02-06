
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
  const {
    finalConcept,
    submitForApproval: submitConceptForApproval,
    refetch: refetchConcepts,
    promotionalImages = [],
    videoUrl: persistedVideoUrl
  } = useWebinarConcepts();
  const { sequences, submitForApproval: submitEmailForApproval } = useEmailSequences();
  const { media, submitForApproval: submitMediaForApproval, deleteMedia } = useGeneratedMedia(finalConcept?.id);
  const queryClient = useQueryClient();

  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("DORA-14.jpg");
  const [videoResult, setVideoResult] = useState<any>(null);
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

  const getMediaByType = (type: string) => {
    // Check MongoDB persisted images first
    const persisted = promotionalImages.find((img: any) => img.media_type === type);
    if (persisted) {
      return {
        id: persisted.id || type,
        image_url: persisted.image_url,
        status: persisted.status,
        admin_notes: persisted.admin_notes
      };
    }
    // Fallback to Supabase media if still being used
    return media.find(m => m.media_type === type);
  };

  // --- Video Generation ---
  const handleGenerateVideo = async () => {
    if (!finalConcept?.id) {
      toast.error("Please approve a concept first");
      return;
    }

    setIsGeneratingVideo(true);
    setVideoResult(null);
    try {
      const assetId = localStorage.getItem("current_asset_id");
      if (!assetId) throw new Error("No asset ID found");

      // Use the selected avatar (it's just the filename, backend handles the URL)
      // Actually, let's pass the full URL if we want to be explicit, 
      // but did_service.py now has a default pointing to DORA-14.jpg

      const response = await api.generateVideo(assetId, undefined, undefined);

      if (response.status === "success" && response.data?.id) {
        toast.info("Video generation started! This may take 2-4 minutes.");
        setVideoResult(response.data);

        // Polling for video result
        let polls = 0;
        const maxPolls = 30; // 5 minutes

        const pollVideo = async () => {
          try {
            const statusResponse = await api.getVideoStatus(response.data.id);
            console.log("Video status:", statusResponse.status);

            if (statusResponse.status === "completed") {
              setVideoResult(statusResponse);
              toast.success("✨ AI Video is ready!");
              setIsGeneratingVideo(false);
            } else if (statusResponse.status === "error" || statusResponse.status === "failed") {
              throw new Error(statusResponse.error?.message || "D-ID Generation failed");
            } else {
              polls++;
              if (polls < maxPolls) {
                setTimeout(pollVideo, 10000); // Poll every 10s
              } else {
                throw new Error("Video generation timed out. Please refresh later.");
              }
            }
          } catch (e: any) {
            console.error("Video poll error:", e);
            toast.error(e.message || "Failed to get video status");
            setIsGeneratingVideo(false);
          }
        };

        // Start polling after 10 seconds
        setTimeout(pollVideo, 10000);
      } else {
        throw new Error("Failed to start video generation");
      }
    } catch (error: any) {
      console.error("Video gen error:", error);
      toast.error(error.message || "Failed to generate video");
      setIsGeneratingVideo(false);
    }
  };

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
          await submitMediaForApproval.mutateAsync({ mediaId: m.id });
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
                    {/* Parse and display belief shifts in formatted cards */}
                    {(() => {
                      try {
                        const beliefs = typeof finalConcept.secret_structure === 'string'
                          ? JSON.parse(finalConcept.secret_structure)
                          : finalConcept.secret_structure;

                        if (Array.isArray(beliefs)) {
                          return (
                            <div className="space-y-4">
                              {beliefs.map((belief: any, idx: number) => (
                                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="flex items-center justify-center h-7 w-7 rounded-full bg-[#8ABD41]/20 text-[#5a7d2a] text-sm font-bold">
                                      {idx + 1}
                                    </span>
                                    <span className="font-semibold text-gray-800">Belief Shift {idx + 1}</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {belief.assumption && (
                                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                        <span className="text-xs text-red-600 font-bold uppercase tracking-wide">❌ Old Assumption</span>
                                        <p className="text-sm text-gray-800 mt-1 font-medium">"{belief.assumption}"</p>
                                      </div>
                                    )}
                                    {belief.belief && (
                                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                        <span className="text-xs text-green-600 font-bold uppercase tracking-wide">✅ New Belief</span>
                                        <p className="text-sm text-gray-800 mt-1 font-medium">"{belief.belief}"</p>
                                      </div>
                                    )}
                                    {belief.story && (
                                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                        <span className="text-xs text-blue-600 font-bold uppercase tracking-wide">📖 Story</span>
                                        <p className="text-sm text-gray-800 mt-1">{belief.story}</p>
                                      </div>
                                    )}
                                    {belief.transformation && (
                                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                        <span className="text-xs text-amber-600 font-bold uppercase tracking-wide">🔄 Transformation</span>
                                        <p className="text-sm text-gray-800 mt-1">{belief.transformation}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        // Fallback for non-array content
                        return <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">{finalConcept.secret_structure}</pre>;
                      } catch {
                        // Fallback if parsing fails
                        return <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">{finalConcept.secret_structure}</pre>;
                      }
                    })()}
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

        {/* --- SECTION 3: VIDEO GENERATION --- */}
        {canGenerate && (
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-[#142721] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Rocket className="h-6 w-6 text-[#3bba69]" />
                <div>
                  <h2 className="text-xl font-bold">AI Video Generation</h2>
                  <p className="text-white/60 text-sm">Create your AI spokesperson video</p>
                </div>
              </div>
              {videoResult?.status === "completed" && (
                <Badge className="bg-[#3bba69] text-white">Ready</Badge>
              )}
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Avatar Selection & Settings */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Select AI Avatar</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedAvatar("DORA-14.jpg")}
                        className={cn(
                          "relative rounded-xl overflow-hidden border-2 transition-all p-1",
                          selectedAvatar === "DORA-14.jpg" ? "border-[#3bba69] bg-[#3bba69]/5 shadow-md" : "border-transparent bg-gray-50 hover:bg-gray-100"
                        )}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                          <img
                            src="http://localhost:8000/static/avatars/DORA-14.jpg"
                            alt="DORA-14"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if local server not running or image missing
                              (e.target as HTMLImageElement).src = "https://clips-presenters.d-id.com/matt/image.png";
                            }}
                          />
                        </div>
                        <div className="p-2 text-center">
                          <p className="text-xs font-bold text-gray-900">DORA-14</p>
                          <p className="text-[10px] text-gray-500">Professional Host</p>
                        </div>
                        {selectedAvatar === "DORA-14.jpg" && (
                          <div className="absolute top-2 right-2 bg-[#3bba69] text-white rounded-full p-0.5 shadow-sm">
                            <CheckCircle2 className="h-3 w-3" />
                          </div>
                        )}
                      </button>

                      <button
                        disabled
                        className="relative rounded-xl overflow-hidden border-2 border-transparent bg-gray-50 p-1 opacity-50 grayscale cursor-not-allowed"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="p-2 text-center">
                          <p className="text-xs font-bold text-gray-900">Custom Avatar</p>
                          <p className="text-[10px] text-gray-500">Coming Soon</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex gap-3">
                      <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Script Preview</p>
                        <p className="text-xs text-blue-700 mt-1 line-clamp-3 italic">
                          {finalConcept?.secret_structure ? "Your webinar structure points have been converted into an AI spokesperson script..." : "Generate your structure first to see the script preview."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateVideo}
                    disabled={isGeneratingVideo || !hasStructure}
                    className="w-full h-12 bg-[#142721] hover:bg-[#1a3c1a] text-[#3bba69] font-bold text-lg shadow-lg border border-[#3bba69]/20"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                        Generating AI Video...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Create AI Video
                      </>
                    )}
                  </Button>
                </div>

                {/* Right Side: Video Preview */}
                <div className="flex flex-col items-center justify-center min-h-[300px] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4">
                  {(videoResult?.result_url || persistedVideoUrl) ? (
                    <div className="w-full space-y-4">
                      <div className="aspect-video rounded-lg overflow-hidden shadow-2xl bg-black">
                        <video
                          src={videoResult?.result_url || persistedVideoUrl}
                          controls
                          className="w-full h-full object-contain"
                          poster="http://localhost:8000/static/avatars/DORA-14.jpg"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> HD Render Complete
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={videoResult?.result_url || persistedVideoUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" /> Download Video
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      {isGeneratingVideo ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <div className="h-20 w-20 rounded-full border-4 border-[#3bba69]/20 border-t-[#3bba69] animate-spin" />
                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-[#3bba69]" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">Rendering AI Spokesperson...</p>
                            <p className="text-sm text-gray-500">This usually takes 2-4 minutes</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Rocket className="h-16 w-16 text-gray-200 mx-auto" />
                          <div>
                            <p className="text-lg font-bold text-gray-900">Video Preview</p>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                              Your generated AI video will appear here. Choose your avatar and click "Create AI Video" to start.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
