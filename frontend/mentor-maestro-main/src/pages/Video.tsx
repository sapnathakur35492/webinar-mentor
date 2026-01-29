import { MainLayout } from "@/components/layout/MainLayout";
import { useWebinarConcepts } from "@/hooks/useWebinarConcepts";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Video, Sparkles, RefreshCw, PlayCircle, FileText, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VideoPage() {
    const { concepts } = useWebinarConcepts();
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(false);
    const [script, setScript] = useState("");
    const [videoResult, setVideoResult] = useState<any>(null);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);

    // Get approved concept
    const finalConcept = concepts.find(c => c.is_final) || concepts.find(c => c.status === "approved");
    const assetId = localStorage.getItem("current_asset_id");

    // Load structure as initial script if empty
    useEffect(() => {
        if (finalConcept?.secret_structure && !script) {
            try {
                // Try parsing JSON structure first
                const structure = JSON.parse(finalConcept.secret_structure);
                if (typeof structure === 'string') {
                    setScript(structure);
                } else if (Array.isArray(structure)) {
                    // Map backend keys (assumption/belief/story) to script text
                    const scriptText = structure
                        .map((s: any) => `Assumption: ${s.assumption}\nNew Belief: ${s.belief}\nStory: ${s.story}`)
                        .join("\n\n");
                    setScript(scriptText);
                }
            } catch (e) {
                // Fallback: use raw text if not valid JSON
                setScript(finalConcept.secret_structure);
            }
        }
    }, [finalConcept, script]);

    const handleGenerateVideo = async () => {
        if (!script.trim()) {
            toast.error("Please enter a script first");
            return;
        }

        setIsGenerating(true);
        setVideoResult(null);

        try {
            // 1. Generate Video (Trigger D-ID)
            console.log("Generating video for script:", script.substring(0, 50) + "...");
            const response = await api.generateVideo(script); // Calls POST /video/generate

            if (response.status === "success" && response.data) {
                toast.success("Video generation started! This may take a few moments.");
                setVideoResult(response.data);

                // Start polling if we have an ID
                if (response.data.id) {
                    pollVideoStatus(response.data.id);
                }
            } else {
                throw new Error("Failed to start video generation");
            }

        } catch (error: any) {
            console.error("Video generation error:", error);
            toast.error(error.message || "Failed to generate video");
        } finally {
            setIsGenerating(false);
        }
    };

    const pollVideoStatus = async (talkId: string) => {
        setIsLoadingVideo(true);
        const interval = setInterval(async () => {
            try {
                const statusData = await api.getVideoStatus(talkId);
                // Check status in statusData
                if (statusData && (statusData.status === "done" || statusData.status === "error")) {
                    clearInterval(interval);
                    setIsLoadingVideo(false);
                    setVideoResult(statusData);
                    if (statusData.status === "done") toast.success("Video generated successfully!");
                    else toast.error("Video generation failed.");
                }
            } catch (e) {
                console.error("Polling error", e);
                clearInterval(interval);
                setIsLoadingVideo(false);
            }
        }, 5000);
    };

    if (!finalConcept) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <Lock className="h-12 w-12 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Concept Required</h2>
                    <p className="text-muted-foreground">Please approve a concept before generating video.</p>
                    <Button onClick={() => navigate("/concepts")}>Go to Concepts</Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-forest-800 to-forest-600 bg-clip-text text-transparent">
                            Video Studio
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-2xl">
                            Turn your concept into a professional AI avatar video.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Concept Approved
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Script Editor */}
                    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Video Script
                            </CardTitle>
                            <CardDescription>
                                Edit the script below. It's auto-filled from your structure.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                className="min-h-[400px] font-mono text-sm leading-relaxed"
                                placeholder="Enter your video script here..."
                            />
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleGenerateVideo}
                                    disabled={isGenerating || !script.trim()}
                                    className="bg-primary hover:bg-primary/90 text-white gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Video className="h-4 w-4" />
                                            Generate Video
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Preview / Result */}
                    <Card className="border-border/50 shadow-sm bg-muted/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PlayCircle className="h-5 w-5 text-primary" />
                                Video Preview
                            </CardTitle>
                            <CardDescription>
                                Your generated AI video will appear here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center min-h-[400px]">
                            {videoResult ? (
                                <div className="text-center space-y-4">
                                    <div className="bg-background rounded-lg p-6 border border-border shadow-sm">
                                        <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                                        <h3 className="font-semibold text-lg">
                                            {videoResult.status === "done" ? "Video Ready!" : "Generation Started"}
                                        </h3>

                                        {videoResult.status !== "done" && (
                                            <>
                                                <p className="text-sm text-muted-foreground mb-2">ID: {videoResult.id}</p>
                                                <p className="text-sm text-muted-foreground animate-pulse">
                                                    Processing video... ({videoResult.status || "started"})
                                                </p>
                                            </>
                                        )}

                                        {(videoResult.result_url || videoResult.items?.[0]?.video_url) && (
                                            <video
                                                src={videoResult.result_url || videoResult.items?.[0]?.video_url}
                                                controls
                                                className="mt-4 rounded-lg w-full max-w-md shadow-lg"
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <Video className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                    <p>No video generated yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
