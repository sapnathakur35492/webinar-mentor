import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GeneratedMedia {
  id: string;
  user_id: string;
  concept_id: string | null;
  media_type: string;
  title: string;
  image_url: string | null;
  prompt: string | null;
  status: string | null;
  submitted_for_approval_at: string | null;
  admin_approved_at: string | null;
  admin_notes: string | null;
  ready_to_publish: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useGeneratedMedia(conceptId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: media = [], isLoading, error } = useQuery({
    queryKey: ["generated-media", user?.id, conceptId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from("generated_media")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (conceptId) {
        query = query.eq("concept_id", conceptId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as GeneratedMedia[];
    },
    enabled: !!user?.id,
  });

  const submitForApproval = useMutation({
    mutationFn: async (mediaId: string) => {
      const { error } = await supabase
        .from("generated_media")
        .update({ 
          submitted_for_approval_at: new Date().toISOString(),
          status: "pending_approval"
        })
        .eq("id", mediaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-media"] });
      toast.success("Submitted for admin approval");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMedia = useMutation({
    mutationFn: async (mediaId: string) => {
      const { error } = await supabase
        .from("generated_media")
        .delete()
        .eq("id", mediaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-media"] });
      toast.success("Image deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    media,
    isLoading,
    error,
    submitForApproval,
    deleteMedia,
  };
}
