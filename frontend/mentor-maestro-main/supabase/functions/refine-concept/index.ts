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
    const { conceptId, feedback } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch existing concept
    const { data: concept, error: conceptError } = await supabase
      .from("webinar_concepts")
      .select("*")
      .eq("id", conceptId)
      .single();

    if (conceptError || !concept) {
      throw new Error("Concept not found");
    }

    const systemPrompt = `You are an expert webinar strategist. A mentor has reviewed their webinar concept and provided feedback. Refine the concept based on their input while maintaining the core structure.

Maintain the same format:
1. Big Idea
2. Hooks (3-5)
3. Secret Structure (3 belief shifts)
4. Mechanism
5. Narrative Angle
6. Offer Transition`;

    const userPrompt = `Current concept:
**Big Idea:** ${concept.big_idea || "Not set"}
**Hooks:** ${concept.hooks || "Not set"}
**Secret Structure:** ${concept.secret_structure || "Not set"}
**Mechanism:** ${concept.mechanism || "Not set"}
**Narrative Angle:** ${concept.narrative_angle || "Not set"}
**Offer Transition:** ${concept.offer_transition || "Not set"}

**Mentor Feedback:** ${feedback}

Please refine this concept based on the feedback. Keep what works, improve what's requested.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI refinement failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Update the concept
    const { data: updated, error: updateError } = await supabase
      .from("webinar_concepts")
      .update({
        big_idea: extractSection(content, ["Big Idea"]) || concept.big_idea,
        hooks: extractSection(content, ["Hooks"]) || concept.hooks,
        secret_structure: extractSection(content, ["Secret Structure", "Secrets"]) || concept.secret_structure,
        mechanism: extractSection(content, ["Mechanism"]) || concept.mechanism,
        narrative_angle: extractSection(content, ["Narrative Angle"]) || concept.narrative_angle,
        offer_transition: extractSection(content, ["Offer Transition"]) || concept.offer_transition,
        mentor_feedback: feedback,
        ai_improvements: `Refined based on feedback: "${feedback.slice(0, 100)}..."`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conceptId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ concept: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("refine-concept error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractSection(text: string, markers: string[]): string {
  for (const marker of markers) {
    const regex = new RegExp(`(?:${marker}[:\\s]*\\*{0,2}\\s*)([\\s\\S]*?)(?=\\n\\s*(?:\\*{2}|##|\\d\\.)|\$)`, "i");
    const match = text.match(regex);
    if (match && match[1]?.trim()) {
      return match[1].trim().slice(0, 2000);
    }
  }
  return "";
}
