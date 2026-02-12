
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
  Copy,
  User
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useWebinarConcepts } from "@/hooks/useWebinarConcepts";
import { useEmailSequences } from "@/hooks/useEmailSequences";
import { useGeneratedMedia } from "@/hooks/useGeneratedMedia";
import { useState } from "react";
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
    const toastId = toast.loading(`Generating ${imageTypes.find(t => t.id === imageType)?.label}...`);
    try {
      const assetId = localStorage.getItem("current_asset_id");
      if (!assetId) throw new Error("No asset ID found");

      const conceptText = `${finalConcept.big_idea}. ${finalConcept.hooks?.[0] || ""}`;
      const result = await api.generatePromotionalImage(assetId, imageType, conceptText, true);

      if (result.status === "success" && result.image_url) {
        setGeneratedImages(prev => ({ ...prev, [imageType]: result.image_url }));
        toast.success(`${imageTypes.find(t => t.id === imageType)?.label} generated!`, { id: toastId });
        queryClient.invalidateQueries({ queryKey: ["generated-media"] });
      } else {
        throw new Error("Image generation failed");
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      toast.error(error.message || "Failed to generate image", { id: toastId });
    } finally {
      setGeneratingImage(null);
    }
  };

  const getMediaByType = (type: string) => {
    const persisted = promotionalImages.find((img: any) => img.media_type === type);
    if (persisted) {
      return {
        id: persisted.id || type,
        image_url: persisted.image_url,
        status: persisted.status,
        admin_notes: persisted.admin_notes
      };
    }
    return media.find(m => m.media_type === type);
  };

  // --- Video Generation (HeyGen) ---
  const handleGenerateVideo = async () => {
    if (!finalConcept?.id) {
      toast.error("Please approve a concept first");
      return;
    }

    setIsGeneratingVideo(true);
    setVideoResult(null);
    const toastId = toast.loading("Sending script to HeyGen...");
    try {
      const assetId = localStorage.getItem("current_asset_id");
      if (!assetId) throw new Error("No asset ID found");

      const response = await api.generateVideo(assetId, undefined, undefined);

      if (response.status === "success" && response.talk_id) {
        toast.success("AI Video generation started! This may take 2-4 minutes.", { id: toastId, duration: 4000 });
        setVideoResult({ id: response.talk_id, status: "processing", provider: "heygen" });

        let polls = 0;
        const maxPolls = 60; // 10 minutes

        const pollVideo = async () => {
          try {
            const statusResponse = await api.getVideoStatus(response.talk_id);
            console.log("HeyGen Video status:", statusResponse.status);

            if (statusResponse.status === "done" || statusResponse.status === "completed") {
              setVideoResult(statusResponse);
              toast.success("✨ AI Video is ready!", { duration: 5000 });
              setIsGeneratingVideo(false);
              await refetchConcepts(); // Update persisted URL
            } else if (statusResponse.status === "error" || statusResponse.status === "failed") {
              throw new Error(statusResponse.detail || "Video generation failed");
            } else {
              polls++;
              if (polls < maxPolls) {
                setTimeout(pollVideo, 3000); // Poll every 3s
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

        setTimeout(pollVideo, 3000);
      } else {
        throw new Error("Failed to start video generation");
      }
    } catch (error: any) {
      console.error("Video gen error:", error);
      toast.error(error.message || "Failed to generate video");
      setIsGeneratingVideo(false);
    }
  };

  const handleSubmitAllForApproval = async () => {
    setSubmittingAll(true);
    try {
      if (finalConcept && !finalConcept.submitted_for_approval_at) {
        await submitConceptForApproval.mutateAsync(finalConcept.id);
      }
      for (const seq of sequences) {
        if (!seq.submitted_for_approval_at) {
          // hook takes no args for now
          await (submitEmailForApproval.mutateAsync as any)(seq.id);
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
                        return <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">{finalConcept.secret_structure}</pre>;
                      } catch {
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

        {/* --- SECTION 3: VIDEO GENERATION (HeyGen) --- */}
        {canGenerate && (
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-[#142721] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Rocket className="h-6 w-6 text-[#3bba69]" />
                <div>
                  <h2 className="text-xl font-bold">AI Video Generation (HeyGen)</h2>
                  <p className="text-white/60 text-sm">Create your AI spokesperson video</p>
                </div>
              </div>
              {(videoResult?.status === "completed" || videoResult?.status === "done" || persistedVideoUrl) && (
                <Badge className="bg-[#3bba69] text-white">Ready</Badge>
              )}
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">AI Avatar</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative rounded-xl overflow-hidden border-2 border-[#3bba69] bg-[#3bba69]/5 shadow-md p-1">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                          <img
                            src="http://localhost:8000/static/avatars/DORA-14.jpg"
                            alt="DORA-14"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://files.catbox.moe/68vt9u.jpg";
                            }}
                          />
                        </div>
                        <div className="p-2 text-center">
                          <p className="text-xs font-bold text-gray-900">DORA-14</p>
                          <p className="text-[10px] text-gray-500">Professional Host</p>
                        </div>
                        <div className="absolute top-2 right-2 bg-[#3bba69] text-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      </div>

                      <div className="relative rounded-xl overflow-hidden border-2 border-transparent bg-gray-50 p-1 opacity-50 grayscale cursor-not-allowed">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="p-2 text-center">
                          <p className="text-xs font-bold text-gray-900">Custom Avatar</p>
                          <p className="text-[10px] text-gray-500">Coming Soon</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex gap-3">
                      <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Status</p>
                        <p className="text-xs text-blue-700 mt-1">
                          {isGeneratingVideo
                            ? "HeyGen is processing your video. This may take a few minutes..."
                            : hasStructure
                              ? "Ready to generate! Click the button below to start the HeyGen process."
                              : "Generate structure first to create the video script."}
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

                <div className={cn("flex flex-col items-center justify-center min-h-[300px] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50", (videoResult?.result_url || persistedVideoUrl) ? "p-0" : "p-4")}>
                  {(videoResult?.result_url || videoResult?.items?.[0]?.video_url || persistedVideoUrl) ? (
                    <div className="w-full space-y-4">
                      <div className="aspect-video rounded-lg overflow-hidden shadow-2xl bg-black">
                        <video
                          src={videoResult?.result_url || videoResult?.items?.[0]?.video_url || persistedVideoUrl}
                          controls
                          className="w-full h-full object-contain"
                          poster="http://localhost:8000/static/avatars/DORA-14.jpg"
                        />
                      </div>
                      <div className="flex justify-end p-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={videoResult?.result_url || videoResult?.items?.[0]?.video_url || persistedVideoUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" /> Download Video
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      {isGeneratingVideo ? (
                        <div className="flex flex-col items-center justify-center space-y-8 w-full py-10">
                          <RefreshCw className="h-16 w-16 text-[#3bba69] animate-spin" />
                          <div className="space-y-2">
                            <h3 className="font-bold text-xl text-gray-900">Generating Your AI Video...</h3>
                            <p className="text-sm text-gray-500 animate-pulse">
                              HeyGen is creating your video with Dora. This usually takes 2-4 minutes.
                            </p>
                          </div>
                          <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                            <div className="bg-[#3bba69] h-full rounded-full animate-pulse transition-all duration-1000" style={{ width: "65%" }} />
                          </div>
                        </div>
                      ) : (
                        <>
                          <Rocket className="h-16 w-16 text-gray-200 mx-auto" />
                          <div>
                            <p className="text-lg font-bold text-gray-900">Video Preview</p>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                              Your generated AI video will appear here. Click "Create AI Video" to start.
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
