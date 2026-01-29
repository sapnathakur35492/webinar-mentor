import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sequenceType, conceptId, profileId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user's profile and approved concept
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (profileError) throw new Error("Failed to fetch profile");

    const { data: concept, error: conceptError } = await supabase
      .from("webinar_concepts")
      .select("*")
      .eq("id", conceptId)
      .single();

    if (conceptError) throw new Error("Failed to fetch concept");

    // Build the prompt based on sequence type
    const sequencePrompts: Record<string, string> = {
      pre_webinar: `Generate a pre-webinar email sequence (5 emails) that includes:
- Registration confirmation with excitement building
- Value-add content email (2-3 days before)
- Reminder email (1 day before)
- Day-of reminder (morning)
- 15-minute reminder (urgency)`,
      post_webinar: `Generate a post-webinar email sequence (4 emails) that includes:
- Attendee thank you + replay access
- No-show replay access + FOMO recap
- Key insights recap + testimonials
- Final replay reminder before it expires`,
      sales: `Generate a sales email sequence (6 emails) that includes:
- Cart open announcement with early-bird bonus
- Case study / success story email
- Objection handling email (address top 3 objections)
- Scarcity email (limited spots/bonuses expiring)
- Final 24-hour warning
- Cart close / last chance email`,
      replay: `Generate a replay and repitch sequence (3 emails) that includes:
- Replay available with key timestamps
- Bonus extension announcement
- Final replay access before takedown`,
    };

    const systemPrompt = `You are an expert email copywriter specializing in webinar funnels. 
You write compelling, conversion-focused emails that maintain the mentor's voice and style.
Write emails that are personal, engaging, and drive action.

Output format: Return a JSON object with this structure:
{
  "emails": [
    {
      "order": 1,
      "subject": "Email subject line",
      "preview_text": "Preview text (40-60 chars)",
      "body": "Full email body with HTML formatting allowed",
      "send_timing": "Description of when to send",
      "purpose": "Goal of this email"
    }
  ]
}`;

    const userPrompt = `Create an email sequence for this webinar funnel.

MENTOR CONTEXT:
- Name: ${profile.full_name}
- Company: ${profile.company_name || "Not specified"}
- Niche: ${profile.niche || "Not specified"}
- Target Audience: ${profile.target_audience || "Not specified"}
- Pain Points: ${profile.audience_pain_points || "Not specified"}
- Transformation Promise: ${profile.transformation_promise || "Not specified"}
- Unique Mechanism: ${profile.unique_mechanism || "Not specified"}

WEBINAR CONCEPT:
- Big Idea: ${concept.big_idea || "Not specified"}
- Hooks: ${concept.hooks || "Not specified"}
- Secret Structure: ${concept.secret_structure || "Not specified"}
- Mechanism: ${concept.mechanism || "Not specified"}
- Narrative Angle: ${concept.narrative_angle || "Not specified"}
- Offer Transition: ${concept.offer_transition || "Not specified"}

SEQUENCE TYPE: ${sequenceType}
${sequencePrompts[sequenceType] || "Generate a relevant email sequence."}

Make the emails feel personal and conversational, not corporate. Use the mentor's voice.`;

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_email_sequence",
              description: "Create an email sequence with multiple emails",
              parameters: {
                type: "object",
                properties: {
                  emails: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        order: { type: "number" },
                        subject: { type: "string" },
                        preview_text: { type: "string" },
                        body: { type: "string" },
                        send_timing: { type: "string" },
                        purpose: { type: "string" },
                      },
                      required: ["order", "subject", "preview_text", "body", "send_timing", "purpose"],
                    },
                  },
                },
                required: ["emails"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_email_sequence" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No valid response from AI");
    }

    const emailData = JSON.parse(toolCall.function.arguments);
    const emails = emailData.emails;

    // Insert the email sequence
    const { data: sequence, error: insertError } = await supabase
      .from("email_sequences")
      .insert({
        user_id: profile.user_id,
        sequence_type: sequenceType,
        emails: emails,
        email_count: emails.length,
        status: "draft",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, sequence }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating emails:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
