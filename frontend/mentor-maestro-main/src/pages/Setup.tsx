import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useProfile } from "@/hooks/useProfile";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/contexts/AuthContext";
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
  File as LucideFile,
  ImageIcon,
  Camera,
  Languages
} from "lucide-react";


import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  // Step 0: Avatar Image, Step 1: Profile, Step 2: Documents
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [conceptConsiderations, setConceptConsiderations] = useState<string>(
    localStorage.getItem("concept_considerations") || ""
  );

  // Avatar image states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploaded, setAvatarUploaded] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Language selection state
  const [selectedLanguage, setSelectedLanguage] = useState<"Norwegian" | "English">(
    (localStorage.getItem("selected_language") as "Norwegian" | "English") || "Norwegian"
  );

  // Check if avatar was already uploaded in a previous session
  useEffect(() => {
    const savedUrl = localStorage.getItem("avatar_image_url");
    if (savedUrl) {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      setAvatarPreview(`${baseUrl}${savedUrl}`);
      setAvatarUploaded(true);
    }
  }, []);

  // Determine initial step based on profile stage
  useEffect(() => {
    if (profile?.current_stage && profile.current_stage !== "onboarding") {
      setStep(2);
    }
  }, [profile?.current_stage]);

  // Handle assets selected from Sidebar
  useEffect(() => {
    const handleAssetSelect = async (e: any) => {
      const asset = e.detail;
      console.log("[Setup] Sidebar asset selected:", asset);

      if (asset.type === "image") {
        setAvatarPreview(asset.url);
        // We set the path directly to avoid re-uploading since it's already on the server
        localStorage.setItem("avatar_image_path", asset.path || "");
        localStorage.setItem("avatar_image_url", asset.url);
        setAvatarUploaded(true);
        setStep(0); // Jump to Avatar step to show it worked
        toast.success(`Selected ${asset.name} as Avatar`);
      } 
      else if (asset.type === "pdf") {
        try {
          const response = await fetch(asset.url);
          const blob = await response.blob();
          const file = new File([blob], asset.name + ".pdf", { type: "application/pdf" });
          
          setSelectedFiles(prev => [...prev, file]);
          setStep(2); // Jump to Documents step
          toast.success(`Added ${asset.name} to Documents`);
        } catch (err) {
          console.error("Failed to fetch asset PDF:", err);
          toast.error("Failed to load document asset.");
        }
      }
    };

    window.addEventListener('sidebar-asset-selected', handleAssetSelect);
    return () => window.removeEventListener('sidebar-asset-selected', handleAssetSelect);
  }, []);

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

  // ---- Compress/resize avatar image before upload ----
  const compressAvatarImage = (file: File, maxSize = 1024, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        // Resize if larger than maxSize
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
              type: "image/jpeg",
            });
            console.log(`[Avatar] Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`);
            resolve(compressed);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = url;
    });
  };

  const handleUploadAvatar = async (): Promise<boolean> => {
    if (!avatarFile) {
      toast.error("Please select an image first.");
      return false;
    }

    toast.dismiss();
    setIsUploadingAvatar(true);
    try {
      // Compress/resize image before uploading (max 1024px, JPEG 80%)
      const compressedFile = await compressAvatarImage(avatarFile);

      const { api } = await import("@/lib/api");
      const result = await api.uploadAvatarImage(compressedFile);

      if (result.status === "success") {
        // Save the server file path and URL in localStorage for use in Video page
        localStorage.setItem("avatar_image_path", result.file_path);
        localStorage.setItem("avatar_image_url", result.url || result.s3_url || "");
        setAvatarUploaded(true);
        toast.success("Avatar image uploaded successfully!");
        return true;
      } else {
        throw new Error("Upload failed");
      }
    } catch (e: any) {
      console.error("Avatar upload error:", e);
      toast.error(`Upload failed: ${e?.message || "Check your connection"}`);
      return false;
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarUploaded(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a JPG, PNG, or WebP image.");
        return;
      }
      setAvatarFile(file);
      setAvatarUploaded(false);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      toast.error("Please drop an image file (JPG, PNG, or WebP).");
    }
  };

  const handleLanguageSelect = (lang: "Norwegian" | "English") => {
    setSelectedLanguage(lang);
    localStorage.setItem("selected_language", lang);
  };

  const handleAvatarContinue = async () => {
    if (!avatarUploaded && !avatarFile) {
      toast.error("Please upload your avatar image before continuing.");
      return;
    }

    if (avatarFile && !avatarUploaded) {
      const success = await handleUploadAvatar();
      if (!success) return;
    }

    // Save the language preference to localStorage
    localStorage.setItem("selected_language", selectedLanguage);
    setStep(1);
    window.scrollTo(0, 0);
  };

  // ---- Profile Step Handlers ----
  const handleSaveStep1 = async () => {
    setIsSaving(true);
    setErrors({});

    const newErrors: Record<string, string> = {};
    let hasError = false;

    onboardingFields.forEach(field => {
      const val = getValue(field.key);
      if (!val || val.trim().length === 0) {
        newErrors[field.key] = "This field is required";
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      setIsSaving(false);
      const firstError = document.querySelector(".required-error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      // Always include language_tone in the profile update
      const profileData = { ...formData, language_tone: selectedLanguage };
      if (Object.keys(profileData).length > 0) {
        await updateProfile.mutateAsync(profileData);
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
      setSelectedFiles(prev => [...prev, ...droppedFiles]);
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
      const mentorId = profile?.user_id || user?.id || "test_mentor_id";
      const onboardingPayload: Record<string, string> = {};
      onboardingFields.forEach((f) => {
        onboardingPayload[f.key] = getValue(f.key) || "";
      });
      const onboardingContext = JSON.stringify(onboardingPayload, null, 2);

      // Append extra considerations if provided
      const finalContext = conceptConsiderations.trim()
        ? `${onboardingContext}

--- SPECIAL CONSIDERATIONS FOR CONCEPT GENERATION ---
${conceptConsiderations.trim()}
-----------------------------------------------------`
        : onboardingContext;

      // Save considerations to localStorage
      if (conceptConsiderations.trim()) {
        localStorage.setItem("concept_considerations", conceptConsiderations);
      }

      // 2. Call Python Backend - Now returns immediately with job_id
      const loadingToastId = toast.info("Uploading context to AI Brain...", {
        duration: Infinity,
      });

      const { api } = await import("@/lib/api");

      const result = await api.uploadContext(
        mentorId,
        finalContext,
        "Hook Analysis Pending...",
        selectedFiles.length > 0 ? selectedFiles : undefined,
        (progress) => setUploadProgress(progress)
      );

      toast.dismiss(loadingToastId);

      // Handle async response with job_id
      if (result.status === "accepted" && result.job_id) {
        localStorage.setItem("current_job_id", result.job_id);

        toast.success("📄 PDF Uploaded! Processing in background...", {
          duration: 5000,
          description: "AI is analyzing your documents. This may take 1-2 minutes."
        });

        let pollCount = 0;
        const maxPolls = 60;

        const pollJobStatus = async () => {
          try {
            const jobStatus = await api.getJobStatus(result.job_id);
            setUploadProgress(jobStatus.progress);

            if (jobStatus.status === "completed") {
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

            if (pollCount % 3 === 0) {
              toast.info(`🔄 ${jobStatus.message}`, {
                duration: 4000,
                id: `poll-${result.job_id}`
              });
            }

            pollCount++;
            if (pollCount < maxPolls) {
              setTimeout(pollJobStatus, 5000);
            } else {
              throw new Error("Processing timeout - please refresh and check Concepts page");
            }

          } catch (pollError: any) {
            console.error("Poll error:", pollError);
            toast.error(`Processing issue: ${pollError.message}`);
            setIsSaving(false);
          }
        };

        setTimeout(pollJobStatus, 2000);

      } else if (result.status === "success" && result.asset_id) {
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
      {/* MOBILE RESPONSIVE WRAPPER */}
      <div className="max-w-5xl mx-auto space-y-8 pb-32">
        {/* Modern Step Indicator - 3 Steps */}
        <div className="relative pt-4 px-4 sm:px-0">
          {/* Background Line */}
          <div className="absolute top-[calc(50%-1px)] left-[80px] right-[80px] h-[2px] bg-white/10" />
          {/* Progress Line */}
          <div
            className="absolute top-[calc(50%-1px)] left-[80px] h-[2px] transition-all duration-500"
            style={{
              width: step === 0 ? '0%' : step === 1 ? 'calc(33% - 30px)' : 'calc(66% - 60px)',
              backgroundColor: '#3bba69'
            }}
          />
          <div className="flex justify-between max-w-3xl mx-auto">
            {/* Avatar Step */}
            <div className={cn(
              "flex flex-col items-center gap-2 px-3 py-2 transition-all duration-300",
              step === 0 ? "scale-105" : ""
            )}>
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-300 border-2",
                step >= 0 ? "bg-[#3bba69] border-[#3bba69] text-white" : "bg-transparent border-white/20 text-white/50"
              )}>
                <Camera className="h-5 w-5" />
              </div>
              <span className={cn("font-medium text-sm", step >= 0 ? "text-[#3bba69]" : "text-white/50")}>Avatar</span>
            </div>

            {/* Profile Step */}
            <div className={cn(
              "flex flex-col items-center gap-2 px-3 py-2 transition-all duration-300",
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
              "flex flex-col items-center gap-2 px-3 py-2 transition-all duration-300",
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
            <div className="flex flex-col items-center gap-2 px-3 py-2">
              <div className="h-12 w-12 rounded-full bg-transparent border-2 border-white/20 text-white/50 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-medium text-sm text-white/50">AI Magic</span>
            </div>
          </div>
        </div>

        {/* ===== STEP 0: Avatar Image Upload ===== */}
        {step === 0 && (
          <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-0">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">Upload Your Avatar Image</h1>
              <p className="text-white/60 mt-2">
                This image will be used as the first frame of your AI-generated video.
                Upload a clear, well-lit photo for the best results.
              </p>
            </div>

            {/* Avatar Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleAvatarDrop}
              onClick={() => avatarInputRef.current?.click()}
              className={cn(
                "rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer relative overflow-hidden",
                isDragging
                  ? "border-[#3bba69] bg-[#3bba69]/10 scale-[1.02]"
                  : avatarPreview
                    ? "border-[#3bba69]/50 hover:border-[#3bba69]"
                    : "border-white/20 hover:border-[#3bba69]/50"
              )}
              style={{ backgroundColor: isDragging ? 'rgba(59, 186, 105, 0.1)' : '#142721' }}
            >
              {avatarPreview ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-48 h-48 object-cover rounded-2xl border-4 border-[#3bba69]/30 shadow-xl shadow-[#3bba69]/10 transition-all group-hover:border-[#3bba69]/60"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    {avatarUploaded && (
                      <div className="absolute -top-2 -right-2 bg-[#3bba69] rounded-full p-1.5 shadow-lg">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {avatarUploaded ? "Avatar Uploaded ✓" : avatarFile?.name || "Image selected"}
                    </p>
                    <p className="text-white/50 text-sm mt-1">Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5 py-8">
                  <div className={cn(
                    "h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300",
                    isDragging ? "bg-[#3bba69]/40 scale-110" : "bg-[#3bba69]/20"
                  )}>
                    <ImageIcon className={cn(
                      "h-12 w-12 transition-all duration-300",
                      isDragging ? "text-white" : "text-[#3bba69]"
                    )} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {isDragging ? "Drop your image here!" : "Drag & Drop or Click to Upload"}
                    </p>
                    <p className="text-white/50 mt-2 text-sm">
                      Supports JPG, PNG, WebP • Max 10MB
                    </p>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/60 border border-white/10">📸 Photo</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/60 border border-white/10">🎨 Avatar</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/60 border border-white/10">👤 Headshot</span>
                  </div>
                </div>
              )}

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>

            {/* Language Selector */}
            <div className="space-y-3 pt-2">
              <h3 className="text-white font-medium text-sm flex items-center gap-2 px-1">
                <Languages className="h-4 w-4 text-[#3bba69]" />
                Video Language
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => handleLanguageSelect("Norwegian")}
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 transition-all hover:border-[#3bba69]/50 relative overflow-hidden",
                    selectedLanguage === "Norwegian"
                      ? "bg-[#3bba69]/20 border-[#3bba69]"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  {selectedLanguage === "Norwegian" && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-4 w-4 text-[#3bba69]" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇳🇴</span>
                    <div>
                      <p className="font-semibold text-white text-sm">Norwegian</p>
                      <p className="text-xs text-white/50">Norsk (Bokmål)</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleLanguageSelect("English")}
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 transition-all hover:border-[#3bba69]/50 relative overflow-hidden",
                    selectedLanguage === "English"
                      ? "bg-[#3bba69]/20 border-[#3bba69]"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  {selectedLanguage === "English" && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-4 w-4 text-[#3bba69]" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇬🇧</span>
                    <div>
                      <p className="font-semibold text-white text-sm">English</p>
                      <p className="text-xs text-white/50">International</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-lg p-4 border border-[#3bba69]/20" style={{ backgroundColor: 'rgba(59, 186, 105, 0.1)' }}>
              <div className="flex items-start gap-3">
                <div className="bg-[#3bba69]/20 p-2 rounded-lg shrink-0">
                  <Lightbulb className="h-4 w-4 text-[#3bba69]" />
                </div>
                <div>
                  <h4 className="font-medium text-[#3bba69] text-sm">Tips for Best Results</h4>
                  <ul className="text-sm text-white/60 mt-1 space-y-1">
                    <li>• Use a clear, high-resolution photo with good lighting</li>
                    <li>• Face the camera directly for the best video animation</li>
                    <li>• A neutral background works best for professional videos</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end items-center pt-4">
              <Button
                onClick={handleAvatarContinue}
                disabled={isUploadingAvatar || !avatarPreview}
                className={cn(
                  "h-12 px-8 text-white font-semibold rounded-full transition-all",
                  !avatarPreview ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                )}
                style={{ background: !avatarPreview ? '#555' : 'linear-gradient(135deg, #3bba69, #279b65)' }}
              >
                {isUploadingAvatar ? (
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4 animate-bounce" />
                    Uploading...
                  </span>
                ) : !avatarPreview ? (
                  <span className="flex items-center gap-2">📷 Upload Avatar First</span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ===== STEP 1: Onboarding Profile ===== */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-0">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold text-white tracking-tight">Complete Your Profile</h1>
              <p className="text-white/60 mt-2">
                The more details you share, the better Change 2.0 can understand your unique voice and value.
              </p>
            </div>

            {/* Progress Card */}
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

            {/* Form */}
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
            <div className="flex justify-between pt-4">
              <Button
                variant="ghost"
                onClick={() => { setStep(0); window.scrollTo(0, 0); }}
                className="text-white/60 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Avatar
              </Button>
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

        {/* ===== STEP 2: Documents ===== */}
        {step === 2 && (
          <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500 px-4 sm:px-0">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Upload Your Materials</h1>
              <p className="text-white/60 mt-2">
                Add documents to help Change 2.0 understand your business better.
              </p>
            </div>

            {/* ━━━ SPECIAL CONSIDERATIONS FIELD ━━━ */}
            <div
              className="rounded-xl p-5 border border-[#3bba69]/30 space-y-3"
              style={{ backgroundColor: '#142721' }}
            >
              <div className="flex items-start gap-3">
                <div className="bg-[#3bba69]/20 p-2 rounded-lg shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-[#3bba69]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm">
                    Special Instructions for the AI
                  </h3>
                  <p className="text-white/50 text-xs mt-0.5">
                    Anything specific the AI should consider when creating your 3 webinar concepts — e.g. avoid certain topics, focus on a specific audience segment, use a certain tone, include a specific product.
                  </p>
                </div>
              </div>
              <Textarea
                value={conceptConsiderations}
                onChange={(e) => {
                  setConceptConsiderations(e.target.value);
                  localStorage.setItem("concept_considerations", e.target.value);
                }}
                placeholder={`Examples:\n• Focus on entrepreneurs struggling with time management\n• Avoid mentioning competitors by name\n• Tone should be motivational and bold\n• Must include a section about our signature 5-step framework`}
                className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-[#3bba69] focus:ring-1 focus:ring-[#3bba69] resize-none text-sm leading-relaxed"
              />
              {conceptConsiderations.trim() && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-[#3bba69]" />
                  <span className="text-[#3bba69] text-xs">AI will factor this in when generating your 3 concepts</span>
                </div>
              )}
            </div>

            {/* Upload Zone */}
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


            {/* AI Insight Box */}
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

            {/* Selected Files Preview */}
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

            {/* Previously Uploaded Files */}
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


            {/* Pro Tip */}
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
                onClick={() => { setStep(1); window.scrollTo(0, 0); }}
                className="text-white/60 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Button>

              <Button
                onClick={() => {
                  if (selectedFiles.length === 0 && (!documents || documents.length === 0)) {
                    toast.error("Vennligst last opp minst ett dokument (PDF, video, eller transkripsjon) før du fortsetter.");
                    return;
                  }
                  handleCompleteSetup();
                }}
                disabled={isSaving || (selectedFiles.length === 0 && (!documents || documents.length === 0))}
                className={cn(
                  "h-12 px-8 text-white font-semibold rounded-full transition-all",
                  (selectedFiles.length === 0 && (!documents || documents.length === 0))
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105"
                )}
                style={{ background: (selectedFiles.length === 0 && (!documents || documents.length === 0)) ? '#555' : 'linear-gradient(135deg, #3bba69, #279b65)' }}
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
                ) : (selectedFiles.length === 0 && (!documents || documents.length === 0)) ? (
                  <span className="flex items-center gap-2 relative z-10">📄 Upload Documents First</span>
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
