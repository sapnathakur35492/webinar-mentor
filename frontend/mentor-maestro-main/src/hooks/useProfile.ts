import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import axios from "axios";

// API Base URL - ensure this matches your backend
const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'https://devwebinar.change20.no/api'}/mentors`;

export type PipelineStage =
  | "onboarding"
  | "concept_generation"
  | "concept_review"
  | "structure_development"
  | "structure_review"
  | "email_sequence"
  | "production"
  | "launch_ready";

export interface Profile {
  id: string; // Mongo ID
  user_id: string;
  email: string;
  full_name: string;
  company_name?: string;
  website_url?: string;
  niche?: string;
  method_description?: string;
  target_audience?: string;
  audience_pain_points?: string;
  transformation_promise?: string;
  unique_mechanism?: string;
  personal_story?: string;
  philosophy?: string;
  key_objections?: string;
  testimonials?: string;
  current_stage: PipelineStage;
  stage_started_at: string;
  created_at?: string;
  updated_at?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const { data } = await axios.get(`${API_BASE}/user/${user.id}`);
        return data as Profile;
      } catch (err: any) {
        if (err.response?.status === 404) {
          return null; // Profile doesn't exist yet
        }
        throw err;
      }
    },
    enabled: !!user?.id,
    retry: 1,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Merge current profile data with updates to ensure all required fields are present if needed,
      // but PATCH endpoint handles partial updates mostly.
      const payload = {
        ...updates,
        email: user.email, // Ensure email is passed
        name: updates.full_name || user.full_name || "New Mentor",
      };

      const { data } = await axios.patch(`${API_BASE}/user/${user.id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      // Don't toast on every auto-save, maybe only on manual save?
      // Leaving silent to keep it "mst" and non-intrusive
    },
    onError: (error: Error) => {
      console.error("Profile update failed", error);
      toast.error("Failed to save changes: " + error.message);
    },
  });

  const updateStage = useMutation({
    mutationFn: async (newStage: PipelineStage) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data } = await axios.patch(`${API_BASE}/user/${user.id}`, {
        current_stage: newStage,
        email: user.email,
        name: profile?.full_name || user.full_name || "Mentor" // Required by schema
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Stage updated safely");
    },
    onError: (error: Error) => {
      toast.error("Failed to update stage: " + error.message);
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updateStage,
  };
}
