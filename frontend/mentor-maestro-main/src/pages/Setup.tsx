import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useProfile } from "@/hooks/useProfile";
import { useDocuments } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  User,
  Building,
  Globe,
  Target,
  Lightbulb,
  MessageSquare,
  Star,
  CheckCircle,
  FileText,
  Upload,
  FolderOpen,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Rocket,
  Video,
  X,
  File as LucideFile
} from "lucide-react";


import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const onboardingFields = [
  { key: "full_name", label: "Full Name", icon: User, type: "input", placeholder: "Your full name", description: "This is how you'll be addressed" },
  { key: "company_name", label: "Company Name", icon: Building, type: "input", placeholder: "Your company or brand", description: "The business entity running the webinar" },
  { key: "website_url", label: "Website", icon: Globe, type: "input", placeholder: "https://...", description: "Your main online presence" },
  { key: "niche", label: "Niche / Industry", icon: Target, type: "input", placeholder: "e.g., Health coaching, Business consulting", description: "The specific market you operate in" },
  { key: "method_description", label: "Your Method / Approach", icon: Lightbulb, type: "textarea", placeholder: "Describe your unique method or approach to helping clients...", description: "What makes your way of doing things special?" },
  { key: "target_audience", label: "Target Audience", icon: Target, type: "textarea", placeholder: "Who is your ideal client? Be specific about demographics, challenges, goals...", description: "Who are we trying to attract?" },
  { key: "audience_pain_points", label: "Audience Pain Points", icon: MessageSquare, type: "textarea", placeholder: "What problems keep your audience up at night?", description: "The deep frustrations they want to solve" },
  { key: "transformation_promise", label: "Transformation Promise", icon: Star, type: "textarea", placeholder: "What transformation do you help clients achieve?", description: "The dream outcome they desire" },
  { key: "unique_mechanism", label: "Unique Mechanism", icon: Lightbulb, type: "textarea", placeholder: "What makes your approach different? Your secret sauce...", description: "The vehicle that gets them to the result" },
  { key: "personal_story", label: "Your Personal Story", icon: User, type: "textarea", placeholder: "Share your journey - how did you discover your method?", description: "Your origin story builds trust" },
  { key: "philosophy", label: "Philosophy & Beliefs", icon: Lightbulb, type: "textarea", placeholder: "What do you believe about your industry that others might disagree with?", description: "Polarizing beliefs attract the right people" },
  { key: "key_objections", label: "Common Objections", icon: MessageSquare, type: "textarea", placeholder: "What objections do prospects typically have? How do you address them?", description: "Reasons they might hesitate to buy" },
  { key: "testimonials", label: "Key Testimonials", icon: Star, type: "textarea", placeholder: "Share your best client success stories and testimonials...", description: "Proof that your method works" },
];

export default function Setup() {
  const { profile, isLoading, updateProfile, updateStage } = useProfile();
  const { documents } = useDocuments();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);


  // Determine initial step based on profile stage
  useEffect(() => {
    if (profile?.current_stage && profile.current_stage !== "onboarding") {
      setStep(2);
    }
  }, [profile?.current_stage]);

  const getValue = (key: string) => {
    if (formData[key] !== undefined) return formData[key];
    if (!profile) return "";
    return (profile as unknown as Record<string, string>)[key] || "";
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const handleSaveStep1 = async () => {
    setIsSaving(true);
    setErrors({});

    // Validate all fields are filled (basic validation for MVP)
    const newErrors: Record<string, string> = {};
    let hasError = false;

    // SCROLL FIX: Don't scroll to top on error, stay where user is to fix it
    onboardingFields.forEach(field => {
      const val = getValue(field.key);
      if (!val || val.trim().length === 0) {
        newErrors[field.key] = "This field is required";
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      // No popup toast - just show "Required" text in red
      setIsSaving(false);

      // FIX: Scroll to first error for better UX
      const firstError = document.querySelector(".required-error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      if (Object.keys(formData).length > 0) {
        await updateProfile.mutateAsync(formData);
        setFormData({});
      }
      setStep(2);
      window.scrollTo(0, 0);
    } finally {
      setIsSaving(false);
    }
  };

  // State to hold the uploaded file object for API submission
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // File type detection helper
  const getFileTypeInfo = (filename: string): { icon: any, color: string, bg: string, label: string } => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/20', label: 'PDF' };
    if (['doc', 'docx', 'txt'].includes(ext)) return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Document' };
    if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) return { icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Video' };
    if (['srt', 'vtt'].includes(ext)) return { icon: LucideFile, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Transcript' };
    return { icon: LucideFile, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'File' };
  };



  // AI Suggestions based on file types
  const getAIInsight = (files: File[]) => {
    if (files.length === 0) return null;

    const hasVideo = files.some(f => ['mp4', 'mov', 'webm', 'avi'].includes(f.name.split('.').pop()?.toLowerCase() || ''));
    const hasPDF = files.some(f => ['pdf'].includes(f.name.split('.').pop()?.toLowerCase() || ''));
    const hasTranscript = files.some(f => ['srt', 'vtt', 'txt'].includes(f.name.split('.').pop()?.toLowerCase() || ''));

    if (hasVideo && hasPDF) return "Combining your visual method with structured data for a hyper-personalized webinar strategy.";
    if (hasVideo) return "AI will analyze your meeting recording to extract high-converting hooks and your unique coaching voice.";
    if (hasPDF) return "We'll deep-scan your frameworks to ensure the webinar structure is technically grounded and authoritative.";
    if (hasTranscript) return "Transcripts will be used to map out specific audience objections and your proven rebuttals.";

    return "Analyzing your provided documents to align the webinar with your established business philosophy.";
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };


  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      // Add to existing files
      setSelectedFiles(prev => [...prev, ...droppedFiles]);
      // Set first file for legacy compatibility
      if (!selectedFile) {
        setSelectedFile(droppedFiles[0]);
      }
      toast.success(`📁 ${droppedFiles.length} file(s) added`, {
        description: droppedFiles.map(f => f.name).join(', '),
        duration: 4000,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);

    // Set first file for legacy compatibility
    if (!selectedFile) {
      setSelectedFile(newFiles[0]);
    }

    toast.success(`📁 ${newFiles.length} file(s) added`, {
      description: newFiles.map(f => f.name).join(', '),
      duration: 4000,
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length === 1) {
      setSelectedFile(null);
    }
  };


  const handleCompleteSetup = async () => {
    setIsSaving(true);
    try {
      // 1. Prepare Data
      const mentorId = profile?.user_id || "test_mentor_id";
      const onboardingContext = JSON.stringify(formData, null, 2);

      // 2. Call Python Backend - Now returns immediately with job_id
      const loadingToastId = toast.info("Uploading context to AI Brain...", {
        duration: Infinity,
      });

      const { api } = await import("@/lib/api");

      const result = await api.uploadContext(
        mentorId,
        onboardingContext,
        "Hook Analysis Pending...",
        selectedFile || undefined,
        (progress) => setUploadProgress(progress)
      );

      // Dismiss the initial loading toast
      toast.dismiss(loadingToastId);

      // NEW: Handle async response with job_id
      if (result.status === "accepted" && result.job_id) {
        // Store job_id for status check
        localStorage.setItem("current_job_id", result.job_id);

        // Show immediately success message
        toast.success("📄 PDF Uploaded! Processing in background...", {
          duration: 5000,
          description: "AI is analyzing your documents. This may take 1-2 minutes."
        });

        // Poll for job status
        let pollCount = 0;
        const maxPolls = 60; // Max 5 minutes (60 * 5 seconds)

        const pollJobStatus = async () => {
          try {
            const jobStatus = await api.getJobStatus(result.job_id);

            // Update progress message
            setUploadProgress(jobStatus.progress);

            if (jobStatus.status === "completed") {
              // Job done! Store asset_id and navigate
              if (jobStatus.asset_id) {
                localStorage.setItem("current_asset_id", jobStatus.asset_id);
              }
              await updateStage.mutateAsync("concept_generation");
              toast.success("✨ AI Concepts Ready! Redirecting...");
              setIsSaving(false);
              navigate("/concepts");
              return;
            }

            if (jobStatus.status === "failed") {
              throw new Error(jobStatus.error || "Processing failed");
            }

            // Still processing - show status update
            if (pollCount % 3 === 0) { // Update toast every 15 seconds
              toast.info(`🔄 ${jobStatus.message}`, {
                duration: 4000,
                id: `poll-${result.job_id}` // Unique ID to update same toast
              });
            }

            // Continue polling
            pollCount++;
            if (pollCount < maxPolls) {
              setTimeout(pollJobStatus, 5000); // Poll every 5 seconds
            } else {
              throw new Error("Processing timeout - please refresh and check Concepts page");
            }

          } catch (pollError: any) {
            console.error("Poll error:", pollError);
            toast.error(`Processing issue: ${pollError.message}`);
            setIsSaving(false);
          }
        };

        // Start polling after 2 seconds
        setTimeout(pollJobStatus, 2000);

      } else if (result.status === "success" && result.asset_id) {
        // Legacy: Handle old synchronous response (backward compatibility)
        localStorage.setItem("current_asset_id", result.asset_id);
        await updateStage.mutateAsync("concept_generation");
        toast.success("AI Context Uploaded! Generating concepts...");
        navigate("/concepts");
      } else {
        throw new Error("Unexpected response from server");
      }

    } catch (error: any) {
      console.error("Upload failed", error);
      toast.error(`Upload failed: ${error.message}`);
      setIsSaving(false);
    }
    // Note: setIsSaving(false) is now handled in poll callback for async flow
  };

  const filledFields = onboardingFields.filter(f => {
    const value = getValue(f.key);
    return value && value.trim().length > 0;
  });
  const step1Progress = Math.round((filledFields.length / onboardingFields.length) * 100);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="flex flex-col items-center gap-4">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            <p className="text-muted-foreground animate-pulse font-medium">Loading profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* MOBILE RESPONSIVE WRAPPER: Added pb-24 for bottom bar clearance */}
      <div className="max-w-5xl mx-auto space-y-8 pb-32">
        {/* Modern Step Indicator - Dark Theme */}
        <div className="relative pt-4 px-4 sm:px-0">
          {/* Background Line */}
          <div className="absolute top-[calc(50%-1px)] left-[120px] right-[120px] h-[2px] bg-white/10" />
          {/* Progress Line */}
          <div
            className="absolute top-[calc(50%-1px)] left-[120px] h-[2px] transition-all duration-500"
            style={{
              width: step === 1 ? 'calc(50% - 120px)' : 'calc(100% - 240px)',
              backgroundColor: '#3bba69'
            }}
          />
          <div className="flex justify-between max-w-2xl mx-auto">
            {/* Profile Step */}
            <div className={cn(
              "flex flex-col items-center gap-2 px-4 py-2 transition-all duration-300",
              step === 1 ? "scale-105" : ""
            )}>
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 border-2",
                step >= 1 ? "bg-[#3bba69] border-[#3bba69] text-white" : "bg-transparent border-white/20 text-white/50"
              )}>
                <User className="h-5 w-5" />
              </div>
              <span className={cn("font-medium text-sm", step >= 1 ? "text-[#3bba69]" : "text-white/50")}>Profile</span>
            </div>

            {/* Documents Step */}
            <div className={cn(
              "flex flex-col items-center gap-2 px-4 py-2 transition-all duration-300",
              step === 2 ? "scale-105" : ""
            )}>
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 border-2",
                step >= 2 ? "bg-[#3bba69] border-[#3bba69] text-white" : "bg-transparent border-white/20 text-white/50"
              )}>
                <FolderOpen className="h-5 w-5" />
              </div>
              <span className={cn("font-medium text-sm", step >= 2 ? "text-[#3bba69]" : "text-white/50")}>Documents</span>
            </div>

            {/* AI Magic Step */}
            <div className="flex flex-col items-center gap-2 px-4 py-2">
              <div className="h-12 w-12 rounded-full bg-transparent border-2 border-white/20 text-white/50 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-medium text-sm text-white/50">AI Magic</span>
            </div>
          </div>
        </div>

        {/* Step 1: Onboarding Profile */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-0">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold text-white tracking-tight">Complete Your Profile</h1>
              <p className="text-white/60 mt-2">
                The more details you share, the better Change 2.0 can understand your unique voice and value.
              </p>
            </div>

            {/* Progress Card - Dark Theme */}
            <div className="rounded-xl p-5 border border-white/10" style={{ backgroundColor: '#142721' }}>


              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">Profile Strength</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    step1Progress < 30 ? "bg-red-500/20 text-red-400" :
                      step1Progress < 70 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-green-500/20 text-green-400"
                  )}>
                    {step1Progress < 30 ? "Needs Work" : step1Progress < 70 ? "Getting There" : "Excellent"}
                  </span>
                </div>
                <span className="text-lg font-bold text-[#3bba69]">{step1Progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${step1Progress}%`, backgroundColor: '#3bba69' }}
                />
              </div>
            </div>

            {/* Form - Dark Theme */}
            <div className="grid grid-cols-1 gap-4">
              {onboardingFields.map((field) => {
                const Icon = field.icon;
                const value = getValue(field.key);
                const isFilled = value && value.trim().length > 0;
                const isError = !!errors[field.key];

                return (
                  <div
                    key={field.key}
                    className={cn(
                      "rounded-xl p-5 border transition-all duration-200",
                      "border-white/10",
                      isFilled && "border-[#3bba69]/30",
                      isError && "required-error"
                    )}
                    style={{ backgroundColor: '#142721' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "rounded-lg p-2 shrink-0 hidden sm:flex",
                        isFilled ? "bg-[#3bba69]/20 text-[#3bba69]" : "bg-white/5 text-white/40"
                      )}>
                        {isFilled ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div>
                          <Label className="text-white font-medium text-sm flex items-center gap-2">
                            <span className="sm:hidden text-[#3bba69]"><Icon className="h-4 w-4" /></span>
                            {field.label}
                            {isError && <span className="text-red-400 text-xs font-normal">* Required</span>}
                          </Label>
                          {field.description && (
                            <p className="text-xs text-white/40 mt-0.5">
                              {field.description}
                            </p>
                          )}
                        </div>

                        {field.type === "input" ? (
                          <Input
                            value={value}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#3bba69] focus:ring-1 focus:ring-[#3bba69] text-sm"
                          />
                        ) : (
                          <Textarea
                            value={value}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#3bba69] focus:ring-1 focus:ring-[#3bba69] resize-none text-sm"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveStep1}
                disabled={isSaving}
                size="lg"
                className="px-8 h-12 text-white font-semibold rounded-full transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #3bba69, #279b65)' }}
              >
                {isSaving ? "Saving..." : "Continue to Documents"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500 px-4 sm:px-0">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Upload Your Materials</h1>
              <p className="text-white/60 mt-2">
                Add documents to help Change 2.0 understand your business better.
              </p>
            </div>

            {/* Upload Zone - Drag and Drop with Visual Feedback */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "rounded-xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer group",
                isDragging
                  ? "border-[#3bba69] bg-[#3bba69]/10 scale-[1.02]"
                  : "border-white/20 hover:border-[#3bba69]/50"
              )}
              style={{ backgroundColor: isDragging ? 'rgba(59, 186, 105, 0.1)' : '#142721' }}
            >
              <label className="block cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300",
                    isDragging ? "bg-[#3bba69]/40 scale-110" : "bg-[#3bba69]/20"
                  )}>
                    <Upload className={cn(
                      "h-8 w-8 transition-all duration-300",
                      isDragging ? "text-white" : "text-[#3bba69]"
                    )} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {isDragging
                        ? "Drop files here!"
                        : isUploading
                          ? "Uploading..."
                          : "Drag & Drop or Click to Upload"}
                    </p>
                    <p className="text-white/50 mt-1 text-sm">
                      PDF, DOCX, TXT, Videos (.mp4, .mov), Transcripts (.srt, .vtt)
                    </p>
                    <div className="flex justify-center gap-4 mt-3">
                      <span className="text-xs text-red-400">📄 PDF</span>
                      <span className="text-xs text-blue-400">📝 Docs</span>
                      <span className="text-xs text-purple-400">🎥 Video</span>
                      <span className="text-xs text-green-400">🎤 Transcript</span>
                    </div>
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.mp4,.mov,.webm,.avi,.srt,.vtt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>


            {/* AI Insight Box - Dynamic Suggestion */}
            {selectedFiles.length > 0 && (
              <div className="rounded-xl p-4 border border-[#3bba69]/30 bg-[#3bba69]/5 animate-in zoom-in-95 duration-500">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#3bba69]/20 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-[#3bba69] animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      AI Professional Insight
                      <span className="text-[10px] bg-[#3bba69]/20 text-[#3bba69] px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                    </h4>
                    <p className="text-sm text-[#3bba69]/80 mt-1 leading-relaxed">
                      {getAIInsight(selectedFiles)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Files Preview (New files to be uploaded) */}

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-white text-sm px-1">Files to Upload ({selectedFiles.length})</h3>
                {selectedFiles.map((file, index) => {
                  const fileInfo = getFileTypeInfo(file.name);
                  const FileIcon = fileInfo.icon;
                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-white/10 animate-in fade-in slide-in-from-top-2 duration-300"
                      style={{ backgroundColor: '#142721' }}
                    >
                      <div className={`h-8 w-8 rounded-lg ${fileInfo.bg} flex items-center justify-center shrink-0`}>
                        <FileIcon className={`h-4 w-4 ${fileInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-white/50">{fileInfo.label} • {(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        title="Remove file"
                      >
                        <X className="h-4 w-4 text-white/50 hover:text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Previously Uploaded Files List - Dark Theme */}
            {documents.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-white text-sm px-1">Previously Uploaded</h3>
                {documents.map((doc) => {
                  const fileInfo = getFileTypeInfo(doc.name);
                  const FileIcon = fileInfo.icon;
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-white/10"
                      style={{ backgroundColor: '#142721' }}
                    >
                      <div className={`h-8 w-8 rounded-lg ${fileInfo.bg} flex items-center justify-center shrink-0`}>
                        <FileIcon className={`h-4 w-4 ${fileInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                        <p className="text-xs text-white/50">{doc.file_size}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-[#3bba69]" />
                    </div>
                  );
                })}
              </div>
            )}


            {/* Pro Tip - Dark Theme */}
            <div className="rounded-lg p-4 border border-[#3bba69]/20" style={{ backgroundColor: 'rgba(59, 186, 105, 0.1)' }}>
              <div className="flex items-start gap-3">
                <div className="bg-[#3bba69]/20 p-2 rounded-lg shrink-0">
                  <Lightbulb className="h-4 w-4 text-[#3bba69]" />
                </div>
                <div>
                  <h4 className="font-medium text-[#3bba69] text-sm">Pro Tip</h4>
                  <p className="text-sm text-white/60 mt-1">
                    You can skip this step if you don't have documents ready. Our AI will generate concepts based purely on your profile answers from Step 1.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-white/60 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Button>

              <Button
                onClick={handleCompleteSetup}
                disabled={isSaving}
                className="h-12 px-8 text-white font-semibold rounded-full transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #3bba69, #279b65)' }}
              >
                {isSaving && (
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                )}
                {isSaving ? (
                  <span className="flex items-center gap-2 relative z-10">
                    {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : "Processing"}
                    <Rocket className="h-5 w-5 animate-bounce" />
                  </span>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">Generate Magic <Sparkles className="h-5 w-5" /></span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

