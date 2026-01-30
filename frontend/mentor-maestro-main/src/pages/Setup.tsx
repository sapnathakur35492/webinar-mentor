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
  Rocket
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
      toast.error("Please fill in all required fields to proceed");
      setIsSaving(false);

      // FIX: Scroll to first error for better UX
      const firstError = document.querySelector(".border-red-500");
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // For MVP, we just take the first file and store it in state
    // In a full version, we might support multiple files
    const file = files[0];
    setSelectedFile(file);
    toast.success(`File selected: ${file.name}`);
  };

  const handleCompleteSetup = async () => {
    setIsSaving(true);
    try {
      // 1. Prepare Data
      const mentorId = profile?.user_id || "test_mentor_id";
      const onboardingContext = JSON.stringify(formData, null, 2);

      // 2. Call Python Backend - Now returns immediately with job_id
      toast.info("Uploading context to AI Brain...");

      const { api } = await import("@/lib/api");

      const result = await api.uploadContext(
        mentorId,
        onboardingContext,
        "Hook Analysis Pending...",
        selectedFile || undefined,
        (progress) => setUploadProgress(progress)
      );

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
                duration: 3000
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
        {/* Modern Step Indicator */}
        <div className="relative pt-4 px-4 sm:px-0">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 rounded-full" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
            style={{ width: step === 1 ? '33%' : '80%' }}
          />
          <div className="flex justify-between max-w-2xl mx-auto">
            <div className={cn(
              "flex flex-col items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 backdrop-blur-sm",
              step === 1 ? "scale-110" : "opacity-70"
            )}>
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300",
                step >= 1 ? "bg-primary text-white" : "bg-white text-gray-400 border border-gray-200"
              )}>
                <User className="h-5 w-5" />
              </div>
              <span className={cn("font-semibold text-sm hidden sm:block", step >= 1 ? "text-primary" : "text-gray-400")}>Profile</span>
            </div>

            <div className={cn(
              "flex flex-col items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 backdrop-blur-sm",
              step === 2 ? "scale-110" : "opacity-70"
            )}>
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300",
                step >= 2 ? "bg-primary text-white" : "bg-white text-gray-400 border border-gray-200"
              )}>
                <FolderOpen className="h-5 w-5" />
              </div>
              <span className={cn("font-semibold text-sm hidden sm:block", step >= 2 ? "text-primary" : "text-gray-400")}>Documents</span>
            </div>

            <div className="flex flex-col items-center gap-2 px-4 py-2 rounded-xl opacity-60 backdrop-blur-sm">
              <div className="h-10 w-10 rounded-full bg-white text-gray-400 border border-gray-200 flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm hidden sm:block text-gray-400">AI Magic</span>
            </div>
          </div>
        </div>

        {/* Step 1: Onboarding Profile */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-0">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Complete Your Profile</h1>
              <p className="text-gray-500 mt-2 text-lg">
                The more details you share, the better Change 2.0 can understand your unique voice and value.
              </p>
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">Profile Strength</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    step1Progress < 30 ? "bg-red-100 text-red-600" :
                      step1Progress < 70 ? "bg-yellow-100 text-yellow-600" :
                        "bg-green-100 text-green-600"
                  )}>
                    {step1Progress < 30 ? "Needs Work" : step1Progress < 70 ? "Getting There" : "Excellent"}
                  </span>
                </div>
                <span className="text-lg font-bold text-primary">{step1Progress}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden relative z-10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700 ease-out relative"
                  style={{ width: `${step1Progress}%` }}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse-slow" />
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 gap-6">
              {onboardingFields.map((field) => {
                const Icon = field.icon;
                const value = getValue(field.key);
                const isFilled = value && value.trim().length > 0;
                const isError = !!errors[field.key];

                return (
                  <div
                    key={field.key}
                    className={cn(
                      "bg-white rounded-xl p-6 border transition-all duration-200 group hover:shadow-lg",
                      isError ? "border-red-200 shadow-red-50" : "border-gray-100 shadow-sm",
                      isFilled && "border-green-100"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "rounded-xl p-3 shrink-0 transition-colors hidden sm:flex",
                        isFilled ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary/5"
                      )}>
                        {isFilled ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-gray-900 font-semibold text-base flex items-center gap-2">
                            {/* Mobile Icon */}
                            <span className="sm:hidden text-primary"><Icon className="h-4 w-4" /></span>
                            {field.label}
                            {isError && <span className="text-red-500 text-xs font-normal animate-pulse">* Required</span>}
                          </Label>
                          {field.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {field.description}
                            </p>
                          )}
                        </div>

                        {field.type === "input" ? (
                          <Input
                            value={value}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className={cn(
                              "h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all text-base text-gray-900",
                              isError && "border-red-300 focus-visible:ring-red-200 bg-red-50/30"
                            )}
                          />
                        ) : (
                          <Textarea
                            value={value}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className={cn(
                              "min-h-[120px] bg-gray-50 border-gray-200 focus:bg-white transition-all resize-none text-base leading-relaxed text-gray-900",
                              isError && "border-red-300 focus-visible:ring-red-200 bg-red-50/30"
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions: Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] sm:relative sm:border-0 sm:shadow-none sm:bg-transparent sm:bottom-auto sm:p-0">
              <div className="max-w-5xl mx-auto flex justify-end">
                <Button
                  onClick={handleSaveStep1}
                  disabled={isSaving}
                  size="lg"
                  className="w-full sm:w-auto pl-8 pr-6 h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
                >
                  {isSaving ? "Saving..." : "Continue to Documents"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500 px-4 sm:px-0">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Upload Your Materials</h1>
              <p className="text-gray-500 mt-2 text-lg">
                Add documents to help Change 2.0 understand your business better.
              </p>
            </div>

            {/* Upload Zone */}
            <label className="block cursor-pointer group">
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center transition-all duration-300 group-hover:border-primary group-hover:bg-primary/5 group-hover:scale-[1.01] shadow-sm">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    < p className="text-xl font-semibold text-gray-900">
                      {isUploading ? "Uploading..." : "Click to upload files"}
                    </p>
                    <p className="text-gray-500 mt-2">
                      PDFs, DOCX, or key text files
                    </p>
                  </div>
                </div>
              </div>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>

            {/* Uploaded Files List */}
            {documents.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 px-1">Uploaded Files</h3>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.file_size}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Skip Option */}
            <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                <Lightbulb className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Pro Tip</h4>
                <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                  You can skip this step if you don't have documents ready. Our AI will generate concepts based purely on your profile answers from Step 1.
                </p>
              </div>
            </div>

            {/* Actions: Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] sm:relative sm:border-0 sm:shadow-none sm:bg-transparent sm:bottom-auto sm:p-0">
              <div className="max-w-3xl mx-auto flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Profile
                </Button>

                <Button
                  onClick={handleCompleteSetup}
                  disabled={isSaving}
                  className="relative overflow-hidden bg-gradient-to-r from-primary to-[#7aaf3a] hover:from-[#7aaf3a] hover:to-primary text-white shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 h-14 px-8 rounded-full font-bold text-lg hover:scale-105"
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
          </div>
        )}
      </div>
    </MainLayout>
  );
}
