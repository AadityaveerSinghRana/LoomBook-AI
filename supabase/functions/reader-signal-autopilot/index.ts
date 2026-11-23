// Supabase Edge Function: reader-signal-autopilot
// Triggered via pg_net from fn_evaluate_reader_signal() or the 1-minute pg_cron sweep.
// Reads story_bible + neighboring pages, asks Gemini for 3 subtle steering options,
// writes to steer_suggestions (pushed via Supabase Realtime), and auto-applies expired nudges.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (payload.action === "auto_apply_expired") {
      const { data: expired } = await supabase
        .from("steer_suggestions")
        .select("*")
        .eq("status", "pending")
        .lte("auto_apply_at", new Date().toISOString());

      for (const suggestion of expired ?? []) {
        const topOption = (suggestion.options ?? []).sort(
          (a: { confidenceRank: number }, b: { confidenceRank: number }) =>
            a.confidenceRank - b.confidenceRank
        )[0];

        if (!topOption) continue;

        await applySteeringOption(supabase, geminiApiKey, suggestion, topOption, "auto_applied");
      }

      return new Response(
        JSON.stringify({ processed: expired?.length ?? 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: generate_steer
    const { story_id, trouble_page_index, trigger_reason, engagement_score } = payload;

    const { data: story } = await supabase
      .from("stories")
      .select("id, title, genre, story_bible")
      .eq("id", story_id)
      .single();

    const { data: pages } = await supabase
      .from("story_pages")
      .select("*")
      .eq("story_id", story_id)
      .order("page_index", { ascending: true });

    if (!story || !pages || pages.length === 0) {
      return new Response(JSON.stringify({ error: "Story not found" }), { status: 404 });
    }

    const targetPageIndex = Math.min(trouble_page_index + 1, pages.length - 1);
    const neighboringPages = pages.filter(
      (p) => Math.abs(p.page_index - trouble_page_index) <= 1
    );

    const options = await askLlmForSteeringOptions(
      geminiApiKey,
      story,
      neighboringPages,
      trouble_page_index,
      targetPageIndex,
      trigger_reason
    );

    const { data: inserted, error } = await supabase
      .from("steer_suggestions")
      .insert({
        story_id,
        trouble_page_index,
        target_page_index: targetPageIndex,
        trigger_reason,
        engagement_score_at_trigger: engagement_score,
        options,
        status: "pending",
        auto_apply_at: new Date(Date.now() + 45_000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ suggestion: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function askLlmForSteeringOptions(
  apiKey: string | undefined,
  story: Record<string, unknown>,
  neighbors: Array<Record<string, unknown>>,
  troublePageIndex: number,
  targetPageIndex: number,
  triggerReason: string
) {
  const prompt = `You are the Reader-Signal Autopilot for "${story.title}".
Story Bible: ${JSON.stringify(story.story_bible)}
Neighboring Pages: ${JSON.stringify(neighbors)}
Reader trouble occurred on Page ${troublePageIndex + 1} (${triggerReason}).
Propose 3 subtle narrative steering options for Page ${targetPageIndex + 1}:
1. more_tension
2. lighter_tone
3. plot_twist
Return strict JSON array with keys: id, direction, label, title, rationale, previewHook, confidenceRank.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  return JSON.parse(text);
}

async function applySteeringOption(
  supabase: ReturnType<typeof createClient>,
  apiKey: string | undefined,
  suggestion: Record<string, unknown>,
  option: Record<string, unknown>,
  status: "applied" | "auto_applied"
) {
  const { data: story } = await supabase
    .from("stories")
    .select("title, story_bible")
    .eq("id", suggestion.story_id)
    .single();

  const { data: targetPage } = await supabase
    .from("story_pages")
    .select("*")
    .eq("story_id", suggestion.story_id)
    .eq("page_index", suggestion.target_page_index)
    .single();

  if (!story || !targetPage) return;

  const rewritePrompt = `Rewrite Page ${targetPage.page_index + 1} ("${targetPage.chapter_title}") of "${story.title}" subtly applying this steering direction: ${option.title} — ${option.rationale}.
Keep continuity with Story Bible: ${JSON.stringify(story.story_bible)}.
Current page prose: ${targetPage.prose}
Return only the revised prose paragraphs.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: rewritePrompt }] }],
      }),
    }
  );

  const json = await res.json();
  const revisedProse = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!revisedProse) return;

  await supabase
    .from("story_pages")
    .update({
      prose: revisedProse.trim(),
      steered_by: status === "auto_applied" ? "autopilot" : "manual",
      last_steer_note: String(option.title),
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetPage.id);

  await supabase
    .from("steer_suggestions")
    .update({
      status,
      selected_option_id: option.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", suggestion.id);
}
