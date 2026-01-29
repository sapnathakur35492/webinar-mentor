import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DocumentType =
  | "onboarding_doc"
  | "hook_analysis"
  | "transcript"
  | "video"
  | "audio"
  | "slide_deck"
  | "other";

export interface Document {
  id: string;
  user_id: string;
  name: string;
  type: DocumentType;
  file_url: string;
  file_size: string | null;
  created_at: string;
  updated_at: string;
}

export function useDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ["documents", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // MOCK: Return empty documents for now as we migrated away from Supabase
      // TODO: Implement fetch from Python backend
      return [] as Document[];

      /* 
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Document[];
      */
    },
    enabled: !!user?.id,
  });

  const addDocument = useMutation({
    mutationFn: async (doc: { name: string; type: DocumentType; file_url: string; file_size?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          ...doc,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", user?.id] });
      toast.success("Document added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", user?.id] });
      toast.success("Document deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    documents,
    isLoading,
    error,
    addDocument,
    deleteDocument,
  };
}
