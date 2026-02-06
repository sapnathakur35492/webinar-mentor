import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type ContentStatus = "draft" | "in_review" | "approved" | "rejected";

export interface EmailSequence {
  id: string;
  user_id: string;
  sequence_type: string;
  status: ContentStatus | null;
  emails: any[] | null;
  email_count: number | null;
  ai_evaluation: string | null;
  is_final: boolean | null;
  submitted_for_approval_at: string | null;
  admin_approved_at: string | null;
  admin_notes: string | null;
  ready_to_publish: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useEmailSequences() {
  const queryClient = useQueryClient();
  const assetId = localStorage.getItem("current_asset_id");

  const { data: sequences = [], isLoading, error } = useQuery({
    queryKey: ["email-sequences", assetId],
    queryFn: async () => {
      if (!assetId) return [];

      try {
        const asset = await api.getAsset(assetId);

        if (!asset.email_plan || !asset.email_plan.emails) return [];

        // Group Emails by Segment/Type
        const groupedEmails: Record<string, any[]> = {
          pre_webinar: [],
          post_webinar: [],
          sales: [],
          replay: []
        };

        // Simple keyword mapping strategy
        asset.email_plan.emails.forEach((email: any, index: number) => {
          const purpose = (email.purpose || "").toLowerCase();
          const segment = (email.segment || "").toLowerCase();

          if (segment.includes("pre_webinar") || segment.includes("registered") || purpose.includes("reminder")) {
            groupedEmails.pre_webinar.push({ ...email, order: index + 1 });
          } else if (segment.includes("post_webinar") || segment.includes("attended") || purpose.includes("thank")) {
            groupedEmails.post_webinar.push({ ...email, order: index + 1 });
          } else if (segment.includes("replay") || purpose.includes("replay")) {
            groupedEmails.replay.push({ ...email, order: index + 1 });
          } else {
            groupedEmails.sales.push({ ...email, order: index + 1 });
          }
        });

        // Convert groups to Sequence Objects
        const sequenceObjects: EmailSequence[] = Object.keys(groupedEmails).map((type, idx) => ({
          id: `${assetId}_seq_${type}`,
          user_id: asset.mentor_id,
          sequence_type: type,
          status: "draft" as ContentStatus,
          emails: groupedEmails[type],
          email_count: groupedEmails[type].length,
          ai_evaluation: null,
          is_final: false,
          submitted_for_approval_at: null,
          admin_approved_at: null,
          admin_notes: null,
          ready_to_publish: false,
          created_at: asset.created_at,
          updated_at: asset.created_at
        })).filter(s => s.email_count && s.email_count > 0);

        return sequenceObjects;

      } catch (err) {
        console.error("Failed to fetch asset from backend", err);
        return [];
      }
    },
    enabled: !!assetId,
    refetchInterval: 5000,
  });

  // Placeholder mutations
  const createSequence = useMutation({ mutationFn: async () => { } });
  const updateSequence = useMutation({ mutationFn: async () => { } });
  const submitForApproval = useMutation({ mutationFn: async () => { } });

  return {
    sequences,
    isLoading,
    error,
    createSequence,
    updateSequence,
    submitForApproval,
  };
}
