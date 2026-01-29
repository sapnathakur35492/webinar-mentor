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
    const { profileId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    // Fetch documents
    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", profile.user_id);

    const systemPrompt = `You are an expert webinar strategist specializing in high-converting webinars for coaches, consultants, and course creators. Your job is to generate 2 distinct webinar concept options based on the mentor's profile and materials.

Each concept should include:
1. **Big Idea**: A single compelling statement that encapsulates the webinar's main promise
2. **Hooks**: 3-5 attention-grabbing hooks/headlines for the webinar
3. **Secret Structure**: The 3 belief shifts or secrets you'll reveal (following Perfect Webinar formula)
4. **Mechanism**: The unique mechanism or framework that makes your solution work
5. **Narrative Angle**: The story arc and emotional journey
6. **Offer Transition**: How the content naturally leads to the offer

Generate 2 different concept angles - one more aggressive/bold and one more educational/value-focused.`;

    const userPrompt = `Create 2 webinar concepts for this mentor:

**Profile:**
- Name: ${profile.full_name}
- Company: ${profile.company_name || "Not specified"}
- Niche: ${profile.niche || "Not specified"}
- Method: ${profile.method_description || "Not specified"}
- Target Audience: ${profile.target_audience || "Not specified"}
- Pain Points: ${profile.audience_pain_points || "Not specified"}
- Transformation: ${profile.transformation_promise || "Not specified"}
- Unique Mechanism: ${profile.unique_mechanism || "Not specified"}
- Personal Story: ${profile.personal_story || "Not specified"}
- Philosophy: ${profile.philosophy || "Not specified"}
- Objections: ${profile.key_objections || "Not specified"}
- Testimonials: ${profile.testimonials || "Not specified"}

${documents && documents.length > 0 ? `**Uploaded ${documents.length} supporting documents**` : ""}

Generate 2 complete webinar concepts with all components. Format each concept clearly with headers.`;

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    // Parse the response to extract 2 concepts
    const concepts = parseConceptsFromResponse(content);

    // Save concepts to database
    const savedConcepts = [];
    for (let i = 0; i < concepts.length; i++) {
      const { data: concept, error } = await supabase
        .from("webinar_concepts")
        .insert({
          user_id: profile.user_id,
          version: i + 1,
          status: "draft",
          big_idea: concepts[i].bigIdea,
          hooks: concepts[i].hooks,
          secret_structure: concepts[i].secretStructure,
          mechanism: concepts[i].mechanism,
          narrative_angle: concepts[i].narrativeAngle,
          offer_transition: concepts[i].offerTransition,
          ai_evaluation: concepts[i].evaluation,
        })
        .select()
        .single();

      if (!error && concept) {
        savedConcepts.push(concept);
      }
    }

    return new Response(JSON.stringify({ concepts: savedConcepts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-concepts error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseConceptsFromResponse(content: string): Array<{
  bigIdea: string;
  hooks: string;
  secretStructure: string;
  mechanism: string;
  narrativeAngle: string;
  offerTransition: string;
  evaluation: string;
}> {
  // Split by concept markers
  const conceptSections = content.split(/(?=(?:Concept\s*[12#]|Option\s*[12#]|\*\*Concept\s*[12]|##\s*Concept))/i);
  
  const concepts = conceptSections
    .filter(section => section.trim().length > 100)
    .slice(0, 2)
    .map(section => ({
      bigIdea: extractSection(section, ["Big Idea", "Main Idea", "Core Promise"]),
      hooks: extractSection(section, ["Hooks", "Headlines", "Hook"]),
      secretStructure: extractSection(section, ["Secret Structure", "Secrets", "Belief Shifts", "3 Secrets"]),
      mechanism: extractSection(section, ["Mechanism", "Framework", "Unique Mechanism"]),
      narrativeAngle: extractSection(section, ["Narrative Angle", "Story Arc", "Narrative"]),
      offerTransition: extractSection(section, ["Offer Transition", "Transition", "Call to Action"]),
      evaluation: "AI-generated concept based on your profile. Review and provide feedback to refine.",
    }));

  // If parsing failed, create 2 concepts from the full content
  if (concepts.length === 0) {
    const halfLength = Math.floor(content.length / 2);
    return [
      {
        bigIdea: content.slice(0, halfLength),
        hooks: "",
        secretStructure: "",
        mechanism: "",
        narrativeAngle: "",
        offerTransition: "",
        evaluation: "AI-generated concept. Review and provide feedback.",
      },
      {
        bigIdea: content.slice(halfLength),
        hooks: "",
        secretStructure: "",
        mechanism: "",
        narrativeAngle: "",
        offerTransition: "",
        evaluation: "AI-generated concept. Review and provide feedback.",
      },
    ];
  }

  return concepts;
}

function extractSection(text: string, markers: string[]): string {
  for (const marker of markers) {
    const regex = new RegExp(`(?:${marker}[:\\s]*\\*{0,2}\\s*)([\\s\\S]*?)(?=\\n\\s*(?:\\*{2}|##|\\d\\.|${markers.join("|")})|$)`, "i");
    const match = text.match(regex);
    if (match && match[1]?.trim()) {
      return match[1].trim().slice(0, 2000);
    }
  }
  return "";
}
