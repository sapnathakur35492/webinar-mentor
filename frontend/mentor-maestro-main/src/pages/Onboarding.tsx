import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useProfile } from "@/hooks/useProfile";
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
  Save,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const onboardingFields = [
  { key: "full_name", label: "Full Name", icon: User, type: "input", placeholder: "Your full name" },
  { key: "company_name", label: "Company Name", icon: Building, type: "input", placeholder: "Your company or brand" },
  { key: "website_url", label: "Website", icon: Globe, type: "input", placeholder: "https://..." },
  { key: "niche", label: "Niche / Industry", icon: Target, type: "input", placeholder: "e.g., Health coaching, Business consulting" },
  { key: "method_description", label: "Your Method / Approach", icon: Lightbulb, type: "textarea", placeholder: "Describe your unique method or approach to helping clients..." },
  { key: "target_audience", label: "Target Audience", icon: Target, type: "textarea", placeholder: "Who is your ideal client? Be specific about demographics, challenges, goals..." },
  { key: "audience_pain_points", label: "Audience Pain Points", icon: MessageSquare, type: "textarea", placeholder: "What problems keep your audience up at night?" },
  { key: "transformation_promise", label: "Transformation Promise", icon: Star, type: "textarea", placeholder: "What transformation do you help clients achieve?" },
  { key: "unique_mechanism", label: "Unique Mechanism", icon: Lightbulb, type: "textarea", placeholder: "What makes your approach different? Your secret sauce..." },
  { key: "personal_story", label: "Your Personal Story", icon: User, type: "textarea", placeholder: "Share your journey - how did you discover your method?" },
  { key: "philosophy", label: "Philosophy & Beliefs", icon: Lightbulb, type: "textarea", placeholder: "What do you believe about your industry that others might disagree with?" },
  { key: "key_objections", label: "Common Objections", icon: MessageSquare, type: "textarea", placeholder: "What objections do prospects typically have? How do you address them?" },
  { key: "testimonials", label: "Key Testimonials", icon: Star, type: "textarea", placeholder: "Share your best client success stories and testimonials..." },
];

export default function Onboarding() {
  const { profile, isLoading, updateProfile, updateStage } = useProfile();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data from profile
  const getValue = (key: string) => {
    if (formData[key] !== undefined) return formData[key];
    if (!profile) return "";
    return (profile as unknown as Record<string, string>)[key] || "";
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync(formData);
      setFormData({});
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setIsSaving(true);
    try {
      // Save any pending changes first
      if (Object.keys(formData).length > 0) {
        await updateProfile.mutateAsync(formData);
      }
      // Move to next stage
      await updateStage.mutateAsync("concept_generation");
      toast.success("Onboarding complete! You can now generate your webinar concept.");
    } finally {
      setIsSaving(false);
    }
  };

  const filledFields = onboardingFields.filter(f => {
    const value = getValue(f.key);
    return value && value.trim().length > 0;
  });
  const progress = (filledFields.length / onboardingFields.length) * 100;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-semibold text-foreground">Onboarding Profile</h1>
          <p className="text-muted-foreground mt-1">
            Complete your profile to help AI generate personalized webinar content
          </p>
        </div>

        {/* Progress */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Profile completion</span>
            <span className="text-sm font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div 
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {filledFields.length} of {onboardingFields.length} fields completed
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {onboardingFields.map((field) => {
            const Icon = field.icon;
            const value = getValue(field.key);
            const isFilled = value && value.trim().length > 0;

            return (
              <div key={field.key} className="glass rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "rounded-lg p-2",
                    isFilled ? "bg-success/20" : "bg-secondary"
                  )}>
                    {isFilled ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <Label className="text-foreground font-medium">{field.label}</Label>
                </div>
                
                {field.type === "input" ? (
                  <Input
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-secondary border-0"
                  />
                ) : (
                  <Textarea
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-secondary border-0 min-h-[120px] resize-none"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between glass rounded-xl p-4 sticky bottom-6">
          <p className="text-sm text-muted-foreground">
            {Object.keys(formData).length > 0 ? "You have unsaved changes" : "All changes saved"}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || Object.keys(formData).length === 0}
              className="gap-2 border-border"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button
              onClick={handleCompleteOnboarding}
              disabled={isSaving || progress < 50}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground glow"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Onboarding
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
