import { MainLayout } from "@/components/layout/MainLayout";
import { useWebinarConcepts } from "@/hooks/useWebinarConcepts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Video, RefreshCw, PlayCircle, FileText, CheckCircle2, Lock, ArrowRight, Headphones, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VideoPage() {
    const { concepts } = useWebinarConcepts();
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(false);
    const [script, setScript] = useState("");
    const [videoResult, setVideoResult] = useState<any>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Get approved concept
    const finalConcept = concepts.find(c => c.is_final) || concepts.find(c => c.status === "approved");
    const assetId = localStorage.getItem("current_asset_id");

    // Load structure as initial script if empty
    useEffect(() => {
        if (finalConcept?.secret_structure && !script) {
            try {
                const structure = JSON.parse(finalConcept.secret_structure);
                if (typeof structure === 'string') {
                    setScript(structure);
                } else if (Array.isArray(structure)) {
                    const scriptText = structure
                        .map((s: any) => `Assumption: ${s.assumption}\nNew Belief: ${s.belief}\nStory: ${s.story}`)
                        .join("\n\n");
                    setScript(scriptText);
                }
            } catch (e) {
                setScript(finalConcept.secret_structure);
            }
        }
    }, [finalConcept, script]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handleGenerateVideo = async () => {
        if (!script.trim()) {
            toast.error("Please enter a script first");
            return;
        }

        setIsGenerating(true);
        setVideoResult(null);

        const toastId = toast.loading("Connecting to HeyGen...");
        try {
            // Call our backend which forwards to HeyGen
            const response = await api.generateVideo(assetId || undefined, script.slice(0, 900));

            if (response.status === "success" && response.talk_id) {
                const videoId = response.talk_id;
                toast.success("Video generation started! This may take 1-3 minutes.", { id: toastId, duration: 3000 });

                // Set initial result to show "processing" state
                setVideoResult({ id: videoId, status: "processing", provider: "heygen" });
                setIsGenerating(false);

                // Start polling for video status
                pollVideoStatus(videoId);
            } else {
                throw new Error(response.detail || "Failed to start video generation");
            }
        } catch (e: any) {
            console.error("[Video] Generation error:", e);
            const msg = e?.response?.data?.detail || e?.message || "Video generation failed";
            toast.error(msg, { id: toastId });
            setIsGenerating(false);
        }
    };

    const handleInstantPreview = async () => {
        if (!script.trim()) {
            toast.error("Please enter a script first");
            return;
        }

        setIsPreviewing(true);
        const toastId = toast.loading("Generating instant preview...");

        try {
            const audioBlob = await api.generateInstantAudio(script.slice(0, 1000));
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsPreviewing(false);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                setIsPreviewing(false);
                toast.error("Failed to play preview audio");
            };

            await audio.play();
            toast.success("Playing preview. No video has been created on HeyGen yet.", { id: toastId, duration: 4000 });
        } catch (e: any) {
            console.error("[Video] Preview error:", e);
            toast.error("Preview failed. Please try again.", { id: toastId });
            setIsPreviewing(false);
        }
    };

    const pollVideoStatus = (videoId: string) => {
        setIsPolling(true);

        pollingRef.current = setInterval(async () => {
            try {
                const statusData = await api.getVideoStatus(videoId);

                if (statusData?.status === "done" && statusData?.result_url) {
                    // Video is ready!
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setIsPolling(false);
                    setVideoResult(statusData);
                    toast.success("Your AI video is ready! 🎉", { duration: 5000 });
                } else if (statusData?.status === "error") {
                    // Generation failed
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setIsPolling(false);
                    setVideoResult(statusData);
                    toast.error("Video generation failed. Please try again.");
                }
                // If still "processing", keep polling
            } catch (e) {
                console.error("[Video] Polling error:", e);
                // Don't stop polling on transient network errors
            }
        }, 3000); // Poll every 3 seconds
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
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={handleInstantPreview}
                                    disabled={isGenerating || isPolling || isPreviewing || !script.trim()}
                                    className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                                >
                                    {isPreviewing ? (
                                        <>
                                            <Volume2 className="h-4 w-4 animate-bounce" />
                                            Playing...
                                        </>
                                    ) : (
                                        <>
                                            <Headphones className="h-4 w-4" />
                                            Instant Preview (No-Dash)
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleGenerateVideo}
                                    disabled={isGenerating || isPolling || isPreviewing || !script.trim()}
                                    className="bg-primary hover:bg-primary/90 text-white gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Sending to HeyGen...
                                        </>
                                    ) : isPolling ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Generating Video...
                                        </>
                                    ) : (
                                        <>
                                            <Video className="h-4 w-4" />
                                            Create Final AI Video
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
                                <div className="text-center space-y-4 w-full">
                                    <div className={cn("bg-background rounded-lg border border-border shadow-sm", videoResult.status === "done" ? "p-1" : "p-6")}>
                                        {/* Processing State */}
                                        {videoResult.status === "processing" && (
                                            <div className="flex flex-col items-center justify-center space-y-8 py-12">
                                                <RefreshCw className="h-20 w-20 text-primary animate-spin" />
                                                <div className="space-y-3">
                                                    <h3 className="font-bold text-2xl">Generating Your AI Video...</h3>
                                                    <p className="text-muted-foreground animate-pulse text-lg">
                                                        HeyGen is creating your video with Dora. This usually takes 1-3 minutes.
                                                    </p>
                                                </div>
                                                <div className="w-full max-w-md bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                                                    <div className="bg-primary h-full rounded-full animate-pulse transition-all duration-1000" style={{ width: "65%" }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Error State */}
                                        {videoResult.status === "error" && (
                                            <div className="space-y-3">
                                                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                                    <span className="text-red-500 text-xl">✕</span>
                                                </div>
                                                <h3 className="font-semibold text-lg">Generation Failed</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Please try again. If the issue persists, check your HeyGen credits.
                                                </p>
                                                <Button onClick={handleGenerateVideo} variant="outline" className="gap-2">
                                                    <RefreshCw className="h-4 w-4" /> Retry
                                                </Button>
                                            </div>
                                        )}


                                        {/* Video Player */}
                                        {(videoResult.result_url || videoResult.items?.[0]?.video_url) && (
                                            <video
                                                src={videoResult.result_url || videoResult.items?.[0]?.video_url}
                                                controls
                                                autoPlay={false}
                                                muted={false}
                                                playsInline
                                                className="rounded-lg w-full shadow-lg border border-border object-contain max-h-[800px] bg-black"
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
