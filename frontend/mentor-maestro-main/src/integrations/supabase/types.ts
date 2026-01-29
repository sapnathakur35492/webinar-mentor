export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      documents: {
        Row: {
          created_at: string
          file_size: string | null
          file_url: string
          id: string
          name: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: string | null
          file_url: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: string | null
          file_url?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_sequences: {
        Row: {
          admin_approved_at: string | null
          admin_notes: string | null
          ai_evaluation: string | null
          created_at: string
          email_count: number | null
          emails: Json | null
          id: string
          is_final: boolean | null
          ready_to_publish: boolean | null
          sequence_type: string
          status: Database["public"]["Enums"]["content_status"] | null
          submitted_for_approval_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_approved_at?: string | null
          admin_notes?: string | null
          ai_evaluation?: string | null
          created_at?: string
          email_count?: number | null
          emails?: Json | null
          id?: string
          is_final?: boolean | null
          ready_to_publish?: boolean | null
          sequence_type: string
          status?: Database["public"]["Enums"]["content_status"] | null
          submitted_for_approval_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_approved_at?: string | null
          admin_notes?: string | null
          ai_evaluation?: string | null
          created_at?: string
          email_count?: number | null
          emails?: Json | null
          id?: string
          is_final?: boolean | null
          ready_to_publish?: boolean | null
          sequence_type?: string
          status?: Database["public"]["Enums"]["content_status"] | null
          submitted_for_approval_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_media: {
        Row: {
          admin_approved_at: string | null
          admin_notes: string | null
          concept_id: string | null
          created_at: string
          id: string
          image_url: string | null
          media_type: string
          prompt: string | null
          ready_to_publish: boolean | null
          status: string | null
          submitted_for_approval_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_approved_at?: string | null
          admin_notes?: string | null
          concept_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          media_type: string
          prompt?: string | null
          ready_to_publish?: boolean | null
          status?: string | null
          submitted_for_approval_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_approved_at?: string | null
          admin_notes?: string | null
          concept_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          media_type?: string
          prompt?: string | null
          ready_to_publish?: boolean | null
          status?: string | null
          submitted_for_approval_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_media_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "webinar_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          audience_pain_points: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          current_stage: Database["public"]["Enums"]["pipeline_stage"] | null
          email: string | null
          full_name: string
          id: string
          key_objections: string | null
          method_description: string | null
          niche: string | null
          personal_story: string | null
          philosophy: string | null
          phone: string | null
          stage_started_at: string | null
          target_audience: string | null
          testimonials: string | null
          transformation_promise: string | null
          unique_mechanism: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          audience_pain_points?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          current_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          email?: string | null
          full_name: string
          id?: string
          key_objections?: string | null
          method_description?: string | null
          niche?: string | null
          personal_story?: string | null
          philosophy?: string | null
          phone?: string | null
          stage_started_at?: string | null
          target_audience?: string | null
          testimonials?: string | null
          transformation_promise?: string | null
          unique_mechanism?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          audience_pain_points?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          current_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          email?: string | null
          full_name?: string
          id?: string
          key_objections?: string | null
          method_description?: string | null
          niche?: string | null
          personal_story?: string | null
          philosophy?: string | null
          phone?: string | null
          stage_started_at?: string | null
          target_audience?: string | null
          testimonials?: string | null
          transformation_promise?: string | null
          unique_mechanism?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      webinar_concepts: {
        Row: {
          admin_approved_at: string | null
          admin_notes: string | null
          ai_evaluation: string | null
          ai_improvements: string | null
          big_idea: string | null
          created_at: string
          hooks: string | null
          id: string
          is_final: boolean | null
          mechanism: string | null
          mentor_feedback: string | null
          narrative_angle: string | null
          offer_transition: string | null
          ready_to_publish: boolean | null
          secret_structure: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          submitted_for_approval_at: string | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          admin_approved_at?: string | null
          admin_notes?: string | null
          ai_evaluation?: string | null
          ai_improvements?: string | null
          big_idea?: string | null
          created_at?: string
          hooks?: string | null
          id?: string
          is_final?: boolean | null
          mechanism?: string | null
          mentor_feedback?: string | null
          narrative_angle?: string | null
          offer_transition?: string | null
          ready_to_publish?: boolean | null
          secret_structure?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          submitted_for_approval_at?: string | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          admin_approved_at?: string | null
          admin_notes?: string | null
          ai_evaluation?: string | null
          ai_improvements?: string | null
          big_idea?: string | null
          created_at?: string
          hooks?: string | null
          id?: string
          is_final?: boolean | null
          mechanism?: string | null
          mentor_feedback?: string | null
          narrative_angle?: string | null
          offer_transition?: string | null
          ready_to_publish?: boolean | null
          secret_structure?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          submitted_for_approval_at?: string | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      webinar_structures: {
        Row: {
          admin_approved_at: string | null
          admin_notes: string | null
          ai_evaluation: string | null
          concept_id: string | null
          created_at: string
          id: string
          is_final: boolean | null
          mentor_feedback: string | null
          ready_to_publish: boolean | null
          slides: Json | null
          status: Database["public"]["Enums"]["content_status"] | null
          submitted_for_approval_at: string | null
          total_slides: number | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          admin_approved_at?: string | null
          admin_notes?: string | null
          ai_evaluation?: string | null
          concept_id?: string | null
          created_at?: string
          id?: string
          is_final?: boolean | null
          mentor_feedback?: string | null
          ready_to_publish?: boolean | null
          slides?: Json | null
          status?: Database["public"]["Enums"]["content_status"] | null
          submitted_for_approval_at?: string | null
          total_slides?: number | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          admin_approved_at?: string | null
          admin_notes?: string | null
          ai_evaluation?: string | null
          concept_id?: string | null
          created_at?: string
          id?: string
          is_final?: boolean | null
          mentor_feedback?: string | null
          ready_to_publish?: boolean | null
          slides?: Json | null
          status?: Database["public"]["Enums"]["content_status"] | null
          submitted_for_approval_at?: string | null
          total_slides?: number | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "webinar_structures_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "webinar_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_status: "draft" | "in_review" | "approved" | "rejected"
      document_type:
        | "onboarding_doc"
        | "hook_analysis"
        | "transcript"
        | "video"
        | "audio"
        | "slide_deck"
        | "other"
      pipeline_stage:
        | "onboarding"
        | "concept_generation"
        | "concept_review"
        | "structure_development"
        | "structure_review"
        | "email_sequence"
        | "production"
        | "launch_ready"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_status: ["draft", "in_review", "approved", "rejected"],
      document_type: [
        "onboarding_doc",
        "hook_analysis",
        "transcript",
        "video",
        "audio",
        "slide_deck",
        "other",
      ],
      pipeline_stage: [
        "onboarding",
        "concept_generation",
        "concept_review",
        "structure_development",
        "structure_review",
        "email_sequence",
        "production",
        "launch_ready",
      ],
    },
  },
} as const
