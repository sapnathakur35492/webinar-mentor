import { MainLayout } from "@/components/layout/MainLayout";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  User,
  Mail,
  Phone,
  Globe,
  Building,
  Save
} from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const { profile, updateProfile } = useProfile();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

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

  return (
    <MainLayout>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile Settings */}
        <div className="glass rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary p-2.5">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Profile Information</h2>
              <p className="text-sm text-muted-foreground">Update your basic information</p>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={getValue("full_name")}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  className="bg-secondary border-0 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-secondary border-0 pl-10 opacity-50"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={getValue("phone")}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+47..."
                  className="bg-secondary border-0 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Company</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={getValue("company_name")}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  className="bg-secondary border-0 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={getValue("website_url")}
                  onChange={(e) => handleChange("website_url", e.target.value)}
                  placeholder="https://..."
                  className="bg-secondary border-0 pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving || Object.keys(formData).length === 0}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground glow"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
