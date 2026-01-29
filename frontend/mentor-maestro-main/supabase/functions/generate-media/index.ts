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
    const { conceptId, mediaType } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the concept
    const { data: concept, error: conceptError } = await supabase
      .from("webinar_concepts")
      .select("*")
      .eq("id", conceptId)
      .single();

    if (conceptError) throw new Error("Failed to fetch concept");

    // Get profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", concept.user_id)
      .single();

    const mediaPrompts: Record<string, string> = {
      registration_page: `Create copy for a webinar registration page including:
- Headline (attention-grabbing, benefit-focused)
- Subheadline (curiosity/intrigue)
- 3-5 bullet points of what they'll learn
- Speaker bio snippet
- Call-to-action button text
- Urgency element`,
      social_ads: `Create 3 social media ad variations including:
- Primary text (hook + benefit)
- Headline
- Description
- Call-to-action
Create for Facebook/Instagram feed format`,
      email_graphics: `Create descriptions for 3 email header graphics:
- Registration confirmation graphic
- Reminder email graphic
- Replay email graphic
Include: suggested imagery, colors, text overlay`,
      slide_thumbnails: `Create descriptions for 5 key slide visuals:
- Title slide
- Problem slide
- Solution reveal slide
- Offer slide
- Bonus stack slide
Include: layout, imagery, key text elements`,
    };

    const systemPrompt = `You are an expert marketing copywriter and creative director specializing in webinar marketing materials.
Create compelling, conversion-focused content that maintains the mentor's voice and resonates with their target audience.

Return a JSON object with this structure:
{
  "title": "Media asset title",
  "items": [
    {
      "name": "Asset name",
      "content": "Full content or description",
      "notes": "Implementation notes"
    }
  ]
}`;

    const userPrompt = `Create ${mediaType.replace(/_/g, " ")} materials for this webinar.

WEBINAR CONCEPT:
- Big Idea: ${concept.big_idea || "Not specified"}
- Hooks: ${concept.hooks || "Not specified"}
- Target Audience: ${profile?.target_audience || "Not specified"}
- Pain Points: ${profile?.audience_pain_points || "Not specified"}
- Transformation: ${profile?.transformation_promise || "Not specified"}
- Mentor: ${profile?.full_name || "Not specified"}

TASK:
${mediaPrompts[mediaType] || "Create relevant marketing materials for this webinar concept."}

Make the content compelling, specific, and action-oriented.`;

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
              name: "create_media_assets",
              description: "Create marketing media assets",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        content: { type: "string" },
                        notes: { type: "string" },
                      },
                      required: ["name", "content"],
                    },
                  },
                },
                required: ["title", "items"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_media_assets" } },
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

    const mediaAssets = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, assets: mediaAssets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating media:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
