import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conceptId, mediaType, prompt } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the concept for context
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

    // Build the image generation prompt
    const mediaPrompts: Record<string, string> = {
      registration_hero: `Professional webinar registration page hero image. Clean, modern design with subtle gradients. Theme: ${profile?.niche || 'business coaching'}. Style: Premium, trustworthy, aspirational. Include abstract elements suggesting growth and transformation. 16:9 aspect ratio. Ultra high quality.`,
      social_ad: `Eye-catching social media ad for a webinar. Bold, attention-grabbing design. Topic: "${concept.big_idea?.slice(0, 50) || 'Business transformation'}". Modern, clean aesthetic with professional feel. Square format 1:1. High contrast, vibrant but professional colors.`,
      email_header: `Professional email header banner for webinar invitation. Clean typography space. Theme: ${profile?.niche || 'coaching'}. Subtle gradient background with abstract geometric elements. 3:1 aspect ratio, horizontal banner format. Minimalist and elegant.`,
      slide_title: `Presentation slide background. Premium, modern design. Dark theme with subtle gradient. Professional business aesthetic. Abstract shapes suggesting innovation. 16:9 aspect ratio. Clean with space for text overlay.`,
      slide_content: `Clean presentation slide background for content. Light theme with subtle professional elements. Minimalist design with soft gradients. Corporate and trustworthy feel. 16:9 aspect ratio. Ample space for text and bullet points.`,
      thumbnail: `Webinar thumbnail image. Professional speaker aesthetic. Clean background with subtle branding elements. Modern, trustworthy, engaging. 16:9 aspect ratio. High quality, YouTube/social media ready.`,
    };

    const imagePrompt = prompt || mediaPrompts[mediaType] || `Professional marketing image for webinar about ${concept.big_idea?.slice(0, 100)}`;

    console.log("Generating image with prompt:", imagePrompt);

    // Generate image using Nano banana model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
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
      const errorText = await response.text();
      console.error("AI gateway error:", errorText);
      throw new Error("Image generation failed");
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));

    const imageData = aiResponse.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      throw new Error("No image generated");
    }

    // Extract base64 data from data URL
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const imageBytes = decode(base64Data);

    // Upload to storage
    const fileName = `${concept.user_id}/${conceptId}/${mediaType}_${Date.now()}.${imageFormat}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, imageBytes, {
        contentType: `image/${imageFormat}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload image");
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Save to generated_media table
    const { data: mediaRecord, error: insertError } = await supabase
      .from("generated_media")
      .insert({
        user_id: concept.user_id,
        concept_id: conceptId,
        media_type: mediaType,
        title: mediaType.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
        image_url: publicUrl,
        prompt: imagePrompt,
        status: "generated",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save media record");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      media: mediaRecord,
      imageUrl: publicUrl 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
