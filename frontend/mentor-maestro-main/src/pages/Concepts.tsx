import { MainLayout } from "@/components/layout/MainLayout";
import { useWebinarConcepts } from "@/hooks/useWebinarConcepts";
import { useGeneratedMedia } from "@/hooks/useGeneratedMedia";
import { useProfile } from "@/hooks/useProfile";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/components/AdminFeedback";
import {
  Sparkles,
  Lightbulb,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  Lock,
  Video,
  Mail,
  Star,
  MessageSquare,
  Send,
  Image,
  FileText,
  Megaphone,
  Presentation,
  Copy,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusConfig = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Clock },
  in_review: { label: "In Review", color: "bg-warning/20 text-warning", icon: RefreshCw },
  approved: { label: "Approved", color: "bg-success/20 text-success", icon: CheckCircle },
  rejected: { label: "Needs Work", color: "bg-destructive/20 text-destructive", icon: RefreshCw },
};

const mediaTypes = [
  { id: "registration_page", label: "Registration Page", description: "Landing page copy & elements", icon: FileText, color: "text-blue-500" },
  { id: "social_ads", label: "Social Ads", description: "Facebook & Instagram ad copy", icon: Megaphone, color: "text-purple-500" },
  { id: "email_graphics", label: "Email Graphics", description: "Header image descriptions", icon: Image, color: "text-pink-500" },
  { id: "slide_thumbnails", label: "Slide Visuals", description: "Key slide design concepts", icon: Presentation, color: "text-emerald-500" },
];

const imageTypes = [
  { id: "registration_hero", label: "Registration Hero", description: "Main hero image for landing page" },
  { id: "social_ad", label: "Social Media Ad", description: "Eye-catching ad for Facebook/Instagram" },
  { id: "email_header", label: "Email Header", description: "Banner for email campaigns" },
  { id: "slide_title", label: "Title Slide", description: "Presentation title slide background" },
  { id: "slide_content", label: "Content Slide", description: "Clean content slide background" },
  { id: "thumbnail", label: "Video Thumbnail", description: "Webinar replay thumbnail" },
];

const imageStatusConfig = {
  generated: { label: "Generated", color: "bg-muted text-muted-foreground", icon: Clock },
  pending_approval: { label: "Pending", color: "bg-warning/20 text-warning", icon: Clock },
  approved: { label: "Approved", color: "bg-success/20 text-success", icon: CheckCircle },
  rejected: { label: "Changes Requested", color: "bg-destructive/20 text-destructive", icon: AlertCircle },
};

interface MediaAsset {
  name: string;
  content: string;
  notes?: string;
}

interface MediaResult {
  title: string;
  items: MediaAsset[];
}

export default function Concepts() {
  const { concepts, isLoading, updateConcept } = useWebinarConcepts();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [feedbackErrors, setFeedbackErrors] = useState<Record<string, boolean>>({});
  const [refiningConcept, setRefiningConcept] = useState<string | null>(null);
  const [generatingMedia, setGeneratingMedia] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [mediaResults, setMediaResults] = useState<Record<string, MediaResult>>({});
  const [selectedMedia, setSelectedMedia] = useState<{ type: string; result: MediaResult } | null>(null);

  const approvedConcept = concepts.find(c => c.is_final || c.status === "approved");
  const { media, deleteMedia } = useGeneratedMedia(approvedConcept?.id);

  const canGenerate = profile?.current_stage !== "onboarding";

  // Auto-generate on first visit if no concepts
  useEffect(() => {
    if (canGenerate && concepts.length === 0 && !isLoading && !isGenerating) {
      handleGenerate();
    }
  }, [canGenerate, concepts.length, isLoading]);

  const handleGenerate = async () => {
    const assetId = localStorage.getItem("current_asset_id");
    console.log("[Concepts] handleGenerate called, assetId:", assetId);

    if (!assetId) {
      toast.error("No active session. Please start from Setup.");
      navigate("/setup");
      return;
    }

    setIsGenerating(true);
    try {
      // Dynamic import api
      const { api } = await import("@/lib/api");

      console.log("[Concepts] Calling api.generateConcepts with assetId:", assetId);
      const result = await api.generateConcepts(assetId);
      console.log("[Concepts] API response:", result);

      if (result.status === "success") {
        const isMockFallback = result?.data?.mock_fallback;
        toast.success(
          isMockFallback
            ? "Generated 3 demo concepts (OpenAI quota exhausted - add billing or set MOCK_OPENAI_MODE)"
            : "Generated 3 webinar concept options! Refreshing data..."
        );
        // Invalidate query to refetch data from backend using our new hook
        queryClient.invalidateQueries({ queryKey: ["webinar-concepts"] });

        // Give backend a moment to save, then refetch
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["webinar-concepts"] });
        }, 2000);
      } else {
        console.error("[Concepts] Generation response not successful:", result);
        throw new Error(result.message || "Generation failed");
      }
    } catch (error: any) {
      console.error("[Concepts] Concept generation error:", error);
      toast.error(error.message || error?.response?.data?.detail || "Failed to generate concepts");
    } finally {
      // ALWAYS reset isGenerating, even on error
      console.log("[Concepts] Setting isGenerating to false");
      setIsGenerating(false);
    }
  };

  const handleRefine = async (conceptId: string) => {
    const conceptFeedback = feedback[conceptId];
    if (!conceptFeedback?.trim()) {
      setFeedbackErrors(prev => ({ ...prev, [conceptId]: true }));
      toast.error("Vennligst skriv inn tilbakemelding før du sender");
      return;
    }

    setRefiningConcept(conceptId);
    try {
      const { data, error } = await supabase.functions.invoke("refine-concept", {
        body: { conceptId, feedback: conceptFeedback },
      });

      if (error) throw error;

      setFeedback(prev => ({ ...prev, [conceptId]: "" }));
      toast.success("Concept refined based on your feedback!");
    } catch (error: any) {
      toast.error(error.message || "Failed to refine concept");
    } finally {
      setRefiningConcept(null);
    }
  };

  const handleApprove = async (conceptId: string) => {
    try {
      await updateConcept.mutateAsync({
        id: conceptId,
        updates: { status: "approved", is_final: true },
      });
      toast.success("Concept approved! You can now generate materials.");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleGenerateMedia = async (mediaType: string) => {
    if (!approvedConcept) {
      toast.error("Please approve a concept first");
      return;
    }

    setGeneratingMedia(mediaType);
    try {
      const assetId = localStorage.getItem("current_asset_id");
      if (!assetId) {
        throw new Error("No asset ID found");
      }

      const result = await api.generateMarketingCopy(assetId, mediaType);

      if (result.status === "success" && result.assets) {
        setMediaResults(prev => ({ ...prev, [mediaType]: result.assets }));
        setSelectedMedia({ type: mediaType, result: result.assets });
        toast.success(`${mediaTypes.find(t => t.id === mediaType)?.label} generated!`);
      } else {
        throw new Error("Generation failed");
      }
    } catch (error: any) {
      console.error("Marketing copy generation error:", error);
      toast.error(error.message || "Failed to generate media");
    } finally {
      setGeneratingMedia(null);
    }
  };

  const handleGenerateImage = async (imageType: string) => {
    if (!approvedConcept?.id) {
      toast.error("Please approve a concept first");
      return;
    }

    const assetId = localStorage.getItem("current_asset_id");
    if (!assetId) {
      toast.error("No asset ID found");
      return;
    }

    setGeneratingImage(imageType);
    try {
      // Use backend API instead of Supabase edge function
      const conceptText = `${approvedConcept.big_idea}. ${approvedConcept.hooks || ""}`;
      const result = await api.generatePromotionalImage(assetId, imageType, conceptText);

      if (result.status === "success" && result.image_url) {
        // Store the generated image URL locally
        setGeneratedImages(prev => ({
          ...prev,
          [imageType]: result.image_url
        }));
        toast.success("Image generated successfully!");
      } else {
        throw new Error("Image generation failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate image");
    } finally {
      setGeneratingImage(null);
    }
  };

  const getMediaByType = (type: string) => media.find(m => m.media_type === type);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Webinar Concepts</h1>
            <p className="text-muted-foreground mt-1">
              AI-generated concepts based on your profile — review and refine
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate New Options
              </>
            )}
          </Button>
        </div>

        {/* Lock Notice */}
        {!canGenerate && (
          <div className="bg-card rounded-xl p-4 border border-warning/30 flex items-center gap-4 shadow-sm">
            <div className="rounded-lg bg-warning/10 p-2.5">
              <Lock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="font-medium text-foreground">Complete setup first</p>
              <p className="text-sm text-muted-foreground">
                Complete your profile and documents to generate concepts
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/setup")}
              className="ml-auto"
            >
              Go to Setup
            </Button>
          </div>
        )}

        {/* Approved Concept Actions */}
        {approvedConcept && (
          <div className="bg-success/5 border border-success/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium text-foreground">Concept Approved!</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your webinar concept is ready. Generate the supporting materials:
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate("/video")}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Video className="h-4 w-4" />
                Generate Video Scripts
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate("/emails")}
              >
                <Mail className="h-4 w-4" />
                Generate Email Sequences
              </Button>
            </div>
          </div>
        )}

        {/* Marketing Materials Section with Tabs */}
        {approvedConcept && (
          <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Image className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Marketing Materials</h3>
            </div>
            <Tabs defaultValue="images" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="images" className="gap-2">
                  <Image className="h-4 w-4" />
                  Promotional Images
                </TabsTrigger>
                <TabsTrigger value="copy" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Marketing Copy
                </TabsTrigger>
              </TabsList>
              {/* Promotional Images Tab */}
              <TabsContent value="images">
                <p className="text-sm text-muted-foreground mb-4">
                  AI-generated promotional graphics for your webinar
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imageTypes.map((type) => {
                    const existingMedia = getMediaByType(type.id);
                    const localImage = generatedImages[type.id];
                    const imageUrl = existingMedia?.image_url || localImage;
                    const status = existingMedia?.status ? imageStatusConfig[existingMedia.status as keyof typeof imageStatusConfig] : null;

                    return (
                      <div
                        key={type.id}
                        className="bg-muted/50 rounded-lg overflow-hidden border border-border hover:border-primary/30 transition-all"
                      >
                        {imageUrl ? (
                          <div className="relative aspect-video bg-muted">
                            <img
                              src={imageUrl}
                              alt={type.label}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                              {status && (
                                <Badge className={cn("border-0 text-xs", status.color)}>
                                  <status.icon className="h-3 w-3 mr-1" />
                                  {status.label}
                                </Badge>
                              )}
                              {localImage && !existingMedia && (
                                <Badge className="border-0 text-xs bg-success/20 text-success">
                                  Generated
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-3">
                          <h4 className="font-medium text-sm text-foreground">{type.label}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{type.description}</p>
                          {/* Admin feedback for this specific image */}
                          {existingMedia?.admin_notes && (
                            <div className="mb-3 text-xs bg-destructive/10 text-destructive rounded px-2 py-1.5 flex items-start gap-1.5">
                              <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{existingMedia.admin_notes}</span>
                            </div>
                          )}
                          <div className="flex gap-2">
                            {imageUrl ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-1"
                                  onClick={() => handleGenerateImage(type.id)}
                                  disabled={generatingImage === type.id}
                                >
                                  {generatingImage === type.id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                  Regenerate
                                </Button>
                                {existingMedia && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteMedia.mutate(existingMedia.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <a href={imageUrl} download target="_blank" rel="noopener noreferrer">
                                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                  </a>
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full gap-1.5"
                                onClick={() => handleGenerateImage(type.id)}
                                disabled={generatingImage === type.id}
                              >
                                {generatingImage === type.id ? (
                                  <>
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3.5 w-3.5" />
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
              </TabsContent>

              {/* Marketing Copy Tab */}
              <TabsContent value="copy">
                <p className="text-sm text-muted-foreground mb-4">
                  AI-generated copy and creative briefs for your webinar promotion
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {mediaTypes.map((type) => {
                    const Icon = type.icon;
                    const hasResult = !!mediaResults[type.id];

                    return (
                      <div
                        key={type.id}
                        className="bg-muted/50 rounded-lg p-4 border border-border hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={cn("h-4 w-4", type.color)} />
                          <span className="font-medium text-sm text-foreground">{type.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{type.description}</p>
                        {hasResult ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-1.5"
                            onClick={() => setSelectedMedia({ type: type.id, result: mediaResults[type.id] })}
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-success" />
                            View Content
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full gap-1.5"
                            onClick={() => handleGenerateMedia(type.id)}
                            disabled={generatingMedia === type.id}
                          >
                            {generatingMedia === type.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {generatingMedia === type.id ? "Generating..." : "Generate"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Concepts List */}
        {isLoading || isGenerating ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="text-muted-foreground">
                {isGenerating ? "AI is generating your concepts..." : "Loading..."}
              </span>
            </div>
          </div>
        ) : concepts.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center border border-border shadow-sm">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No concepts yet</h3>
            <p className="text-muted-foreground mt-1">
              {canGenerate
                ? "Click 'Generate New Options' to create webinar concepts"
                : "Complete your setup to unlock concept generation"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {concepts.map((concept, index) => {
              const status = statusConfig[concept.status || "draft"];
              const StatusIcon = status.icon;
              const isExpanded = expandedConcept === concept.id;
              const isRefining = refiningConcept === concept.id;

              return (
                <div
                  key={concept.id}
                  className={cn(
                    "bg-card rounded-xl overflow-hidden border shadow-sm transition-all",
                    concept.is_final ? "border-success/50" : "border-border"
                  )}
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedConcept(isExpanded ? null : concept.id)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "rounded-lg p-2.5",
                        concept.is_final ? "bg-success/10" : "bg-primary/10"
                      )}>
                        <Lightbulb className={cn(
                          "h-5 w-5",
                          concept.is_final ? "text-success" : "text-primary"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            Concept Option {index + 1}
                          </span>
                          {concept.is_final && (
                            <Badge className="bg-success/10 text-success border-0 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {concept.big_idea?.slice(0, 80)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("border-0 gap-1", status.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                      <ChevronDown className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    </div>
                  </button>

                  {/* Content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-border pt-5 space-y-4">
                      {concept.big_idea && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <label className="text-xs text-primary font-semibold uppercase tracking-wide">Big Idea</label>
                          <p className="text-foreground mt-2">{concept.big_idea}</p>
                        </div>
                      )}

                      {concept.hooks && (
                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wide">Hooks</label>
                          <p className="text-foreground mt-1 whitespace-pre-wrap">{concept.hooks}</p>
                        </div>
                      )}

                      {concept.secret_structure && (
                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wide">3 Belief Shifts / Secrets</label>
                          <p className="text-foreground mt-1 whitespace-pre-wrap">{concept.secret_structure}</p>
                        </div>
                      )}

                      {concept.mechanism && (
                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wide">Unique Mechanism</label>
                          <p className="text-foreground mt-1">{concept.mechanism}</p>
                        </div>
                      )}

                      {concept.narrative_angle && (
                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wide">Narrative Angle</label>
                          <p className="text-foreground mt-1">{concept.narrative_angle}</p>
                        </div>
                      )}

                      {concept.offer_transition && (
                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wide">Offer Transition</label>
                          <p className="text-foreground mt-1">{concept.offer_transition}</p>
                        </div>
                      )}

                      {/* Admin Feedback with Revision Option */}
                      {concept.admin_notes && (
                        <AdminFeedback
                          notes={concept.admin_notes}
                          status={concept.status}
                          onRevise={async (revisionFeedback) => {
                            setFeedback(prev => ({ ...prev, [concept.id]: revisionFeedback }));
                            await handleRefine(concept.id);
                          }}
                          isRevising={refiningConcept === concept.id}
                        />
                      )}

                      {/* AI Improvements */}
                      {concept.ai_improvements && (
                        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                          <label className="text-xs text-primary uppercase tracking-wide flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Recent AI Refinement
                          </label>
                          <p className="text-foreground mt-1">{concept.ai_improvements}</p>
                        </div>
                      )}

                      {/* Feedback Section */}
                      {!concept.is_final && (
                        <div className="pt-4 border-t border-border space-y-3">
                          <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Request Changes
                          </label>
                          <Textarea
                            placeholder="Tell the AI what to improve... e.g., 'Make the hooks more provocative' or 'Focus more on the time-saving benefits'"
                            className={`bg-muted border-0 min-h-[100px] focus-visible:ring-2 focus-visible:ring-offset-0 ${feedbackErrors[concept.id] ? "border-2 border-red-500 focus-visible:ring-red-500" : ""
                              }`}
                            value={feedback[concept.id] || ""}
                            onChange={(e) => {
                              setFeedback(prev => ({ ...prev, [concept.id]: e.target.value }));
                              if (feedbackErrors[concept.id]) {
                                setFeedbackErrors(prev => ({ ...prev, [concept.id]: false }));
                              }
                            }}
                          />
                          {feedbackErrors[concept.id] && (
                            <p className="text-red-500 text-xs mt-1">Tilbakemelding er påkrevd</p>
                          )}
                          <div className="flex justify-between">
                            <Button
                              onClick={() => handleRefine(concept.id)}
                              disabled={isRefining || !feedback[concept.id]?.trim()}
                              variant="outline"
                              className="gap-2"
                            >
                              {isRefining ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  Refining...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4" />
                                  Refine with Feedback
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleApprove(concept.id)}
                              className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve This Concept
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Media Viewer Dialog */}
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                {mediaTypes.find(t => t.id === selectedMedia?.type)?.label}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-4">
                {selectedMedia?.result && typeof selectedMedia.result === 'object' && (
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    {Object.entries(selectedMedia.result).map(([key, value]) => {
                      // Skip mock and media_type fields
                      if (key === 'mock' || key === 'media_type') return null;

                      return (
                        <div key={key} className="mb-4 last:mb-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground capitalize">
                              {key.replace(/_/g, ' ')}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(
                                Array.isArray(value) ? value.join('\n') : String(value)
                              )}
                              className="gap-1.5"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </Button>
                          </div>
                          <div className="bg-background rounded-lg p-4 border border-border">
                            {Array.isArray(value) ? (
                              <ul className="list-disc list-inside space-y-1">
                                {value.map((item, idx) => (
                                  <li key={idx} className="text-sm text-foreground">{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-foreground whitespace-pre-wrap">{String(value)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
