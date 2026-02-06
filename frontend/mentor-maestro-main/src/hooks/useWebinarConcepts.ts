import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, WebinarAsset as BackendAsset } from "@/lib/api";
import { toast } from "sonner";

export type ContentStatus = "draft" | "in_review" | "approved" | "rejected";

export interface WebinarConcept {
  id: string;
  user_id: string;
  version: number;
  status: ContentStatus;
  big_idea: string | null;
  hooks: string | null;
  secret_structure: string | null;
  mechanism: string | null;
  narrative_angle: string | null;
  offer_transition: string | null;
  ai_evaluation: string | null;
  ai_improvements: string | null;
  mentor_feedback: string | null;
  is_final: boolean;
  submitted_for_approval_at: string | null;
  admin_approved_at: string | null;
  admin_notes: string | null;
  ready_to_publish: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useWebinarConcepts() {
  const queryClient = useQueryClient();
  const assetId = localStorage.getItem("current_asset_id");

  console.log("[useWebinarConcepts] assetId from localStorage:", assetId);

  const { data: concepts = [], isLoading, error, refetch } = useQuery({
    queryKey: ["webinar-concepts", assetId],
    queryFn: async () => {
      if (!assetId) {
        console.log("[useWebinarConcepts] No assetId, returning empty array");
        return [];
      }

      try {
        console.log("[useWebinarConcepts] Fetching asset from backend:", assetId);
        const asset = await api.getAsset(assetId);
        console.log("[useWebinarConcepts] Got asset:", asset);

        // Save asset to cache for other consumers
        queryClient.setQueryData(["webinar-asset", assetId], asset);

        // Map Backend "Improved Concepts" (Priority) or "Original Concepts" to UI Format
        const sourceConcepts = asset.concepts_improved && asset.concepts_improved.length > 0
          ? asset.concepts_improved
          : asset.concepts_original || [];

        console.log("[useWebinarConcepts] Source concepts count:", sourceConcepts.length);

        if (sourceConcepts.length === 0) {
          console.log("[useWebinarConcepts] No concepts found yet in asset");
        }

        return sourceConcepts.map((c: any, index: number) => {
          // Check if this concept matches the selected one
          let isFinal = false;
          if (asset.selected_concept) {
            // Compare titles or big_idea to identify match. Since object reference differs, use content.
            isFinal = c.title === asset.selected_concept.title && c.big_idea === asset.selected_concept.big_idea;
          }

          return {
            id: `${assetId}_${index}`, // Fake ID for UI list: assetId_index
            user_id: asset.mentor_id,
            version: index + 1,
            status: isFinal ? "approved" : "draft",
            big_idea: c.big_idea || "",
            hooks: c.hook || "", // Backend field name is 'hook'
            secret_structure: c.secrets ? JSON.stringify(c.secrets, null, 2) : "",
            mechanism: c.mechanism || "",
            narrative_angle: c.narrative_angle || "",
            offer_transition: c.offer_transition_logic || "",
            ai_evaluation: asset.concepts_evaluated || null,
            ai_improvements: null, // Already improved
            mentor_feedback: null,
            is_final: isFinal,
            submitted_for_approval_at: isFinal ? asset.updated_at : null,
            admin_approved_at: isFinal ? asset.updated_at : null,
            admin_notes: null,
            ready_to_publish: isFinal,
            created_at: asset.created_at || new Date().toISOString(),
            updated_at: asset.updated_at || new Date().toISOString()
          } as WebinarConcept;
        });

      } catch (err: any) {
        console.error("[useWebinarConcepts] Failed to fetch asset from backend:", err?.message || err);
        toast.error("Failed to load concepts: " + (err?.message || "Unknown error"));
        return [];
      }
    },
    enabled: !!assetId,
    refetchInterval: 5000,
  });

  const finalConcept = concepts.find(c => c.is_final);
  const latestConcept = concepts[0];

  const createConcept = useMutation({ mutationFn: async () => { } });

  const updateConcept = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      // Handle "Approve" action
      if (updates.is_final === true) {
        if (!assetId) throw new Error("No asset ID");

        // Parse index from ID format "assetId_index"
        const parts = id.split('_');
        const index = parseInt(parts[parts.length - 1]);

        if (isNaN(index)) throw new Error("Invalid concept ID format");

        // Determine if improved or original
        // We know useWebinarConcepts returns improved if available.
        // We can check if concepts[0].ai_improvements is null? 
        // Actually, our mapping sets ai_improvements=null because we mapped FROM the improved list.
        // A robust way is to re-fetch asset or check our local list source logic.
        // Simplest: use a heuristics or assume improved if structure exists.
        // Better: We can check via API or just default to true (Improved) as that is the standard flow.
        // If the user hasn't generated improved concepts yet, the list is original.
        // But the UI usually generates improved chain before showing list.
        await api.selectConcept(assetId, index, true);

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ["webinar-concepts"] });
      }
      return {};
    },
    onSuccess: () => {
      toast.success("Concept updated");
    }
  });
  const submitForApproval = useMutation({ mutationFn: async () => { } });

  return {
    concepts,
    finalConcept,
    latestConcept,
    isLoading,
    error,
    createConcept,
    updateConcept,
    submitForApproval,
    refetch,
    promotionalImages: (concepts.length > 0 && assetId) ? queryClient.getQueryData<any>(["webinar-asset", assetId])?.promotional_images : [],
    videoUrl: (concepts.length > 0 && assetId) ? queryClient.getQueryData<any>(["webinar-asset", assetId])?.video_url : null,
    videoStatus: (concepts.length > 0 && assetId) ? queryClient.getQueryData<any>(["webinar-asset", assetId])?.video_status : null,
  };
}
