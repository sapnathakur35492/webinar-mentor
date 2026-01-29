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
    const { sequenceId, emailIndex, feedback, currentEmail } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the sequence
    const { data: sequence, error: seqError } = await supabase
      .from("email_sequences")
      .select("*")
      .eq("id", sequenceId)
      .single();

    if (seqError) throw new Error("Failed to fetch sequence");

    const systemPrompt = `You are an expert email copywriter. Your job is to refine and improve an email based on the user's feedback.
Maintain the same general structure but apply the requested changes.
Keep the tone personal, engaging, and conversion-focused.

Return a JSON object with this exact structure:
{
  "subject": "Improved subject line",
  "preview_text": "Updated preview text (40-60 chars)",
  "body": "Improved email body",
  "send_timing": "Same timing",
  "purpose": "Same purpose"
}`;

    const userPrompt = `Please improve this email based on the feedback provided.

CURRENT EMAIL:
Subject: ${currentEmail.subject}
Preview: ${currentEmail.preview_text}
Body: ${currentEmail.body}
Timing: ${currentEmail.send_timing}
Purpose: ${currentEmail.purpose}

USER FEEDBACK:
${feedback}

Apply the feedback while maintaining the email's core purpose and timing. Make it more compelling and effective.`;

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
              name: "update_email",
              description: "Update an email with improvements",
              parameters: {
                type: "object",
                properties: {
                  subject: { type: "string" },
                  preview_text: { type: "string" },
                  body: { type: "string" },
                  send_timing: { type: "string" },
                  purpose: { type: "string" },
                },
                required: ["subject", "preview_text", "body", "send_timing", "purpose"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "update_email" } },
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

    const improvedEmail = JSON.parse(toolCall.function.arguments);
    
    // Update the emails array with the improved email
    const emails = sequence.emails as any[];
    emails[emailIndex] = {
      ...emails[emailIndex],
      ...improvedEmail,
      order: currentEmail.order,
    };

    // Update the sequence
    const { error: updateError } = await supabase
      .from("email_sequences")
      .update({ emails, updated_at: new Date().toISOString() })
      .eq("id", sequenceId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, email: improvedEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error refining email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
