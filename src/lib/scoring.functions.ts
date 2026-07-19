import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * AI Scoring Engine — port of rutuvideo.ipynb 3-axis reasoning layer.
 * Founder / Market / Idea-vs-market are scored SEPARATELY and never averaged.
 * Every prediction returns evidence + explanation + confidence.
 */

const FounderSnapshot = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string(),
  role: z.string().optional(),
  industry: z.string().optional(),
  stage: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  research: z.record(z.string(), z.unknown()).optional(),
  radar: z.record(z.string(), z.number()).optional(),
});

const AnalyzeInput = z.object({
  founder_key: z.string().min(1),
  snapshot: FounderSnapshot,
});

const GetInput = z.object({ founder_key: z.string().min(1) });

type AxisResult = {
  axis: "founder" | "market" | "idea";
  score: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  evidence: string[];
  reason: string;
};

type AnalysisResult = {
  founder_axis: AxisResult;
  market_axis: AxisResult;
  idea_axis: AxisResult;
  composite: {
    total: number;
    reason: string;
    components: Record<string, { value: number; reason: string }>;
  };
  trust_notes: string;
  claims: { claim: string; source: string; confidence: number; verified: string }[];
};

const SYSTEM_PROMPT = `You are the reasoning layer of VC Brain. Score three axes SEPARATELY — Founder, Market & traction, Idea-vs-market — NEVER averaged into one number. Every claim you cite carries an evidence_state (verified, self_asserted, contradicted, gap_flagged, unobserved) and a confidence — weight contradicted and low-trust claims accordingly and flag them explicitly. Never invent a fact for a gap; call it "Not disclosed" instead.

Return ONLY valid JSON matching this exact schema:
{
  "founder_axis": { "score": 0-100, "confidence": 0-100, "strengths": ["..."], "weaknesses": ["..."], "evidence": ["source: fact"], "reason": "one paragraph explaining WHY this score" },
  "market_axis": { "score": 0-100, "confidence": 0-100, "strengths": [], "weaknesses": [], "evidence": [], "reason": "" },
  "idea_axis":   { "score": 0-100, "confidence": 0-100, "strengths": [], "weaknesses": [], "evidence": [], "reason": "" },
  "composite": {
    "total": 0-100,
    "reason": "one paragraph explaining the weighted composite score and the primary drivers",
    "components": {
      "technical":    {"value": 0-100, "reason": "..."},
      "execution":    {"value": 0-100, "reason": "..."},
      "research":     {"value": 0-100, "reason": "..."},
      "leadership":   {"value": 0-100, "reason": "..."},
      "communication":{"value": 0-100, "reason": "..."},
      "coachability": {"value": 0-100, "reason": "..."},
      "market_fit":   {"value": 0-100, "reason": "..."}
    }
  },
  "trust_notes": "contradictions or gaps that affect confidence",
  "claims": [ { "claim": "...", "source": "GitHub|Scholar|Website|Interview|News|Memory", "confidence": 0-100, "verified": "Verified|Needs Verification|Unverified" } ]
}`;

async function callGateway(apiKey: string, userPrompt: string): Promise<AnalysisResult> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    body: JSON.stringify({
      model: "openai/gpt-5.4-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (res.status === 429) throw new Error("AI rate limit — please retry in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted — top up in workspace billing.");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  const raw = json.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    throw new Error("AI returned non-JSON output");
  }
}

export const analyzeFounder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => AnalyzeInput.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    // Assemble the founder record — like get_founder_record() in the notebook.
    const [memoryRes, claimsRes] = await Promise.all([
      context.supabase
        .from("founder_memory")
        .select("category, source, content, summary, confidence, created_at")
        .eq("founder_key", data.founder_key)
        .order("created_at", { ascending: false })
        .limit(40),
      context.supabase
        .from("claims")
        .select("claim, source, confidence, verified, source_url")
        .eq("founder_key", data.founder_key)
        .limit(40),
    ]);

    const record = {
      founder: data.snapshot,
      memory: memoryRes.data ?? [],
      existing_claims: claimsRes.data ?? [],
    };

    const userPrompt = `Founder record:\n${JSON.stringify(record, null, 2)}\n\nAnalyze and score the three axes independently. Cite specific evidence for every claim. Flag gaps explicitly.`;
    const result = await callGateway(apiKey, userPrompt);

    // Persist — 3 opportunity_scores rows (one per panel), composite founder_scores, new claims.
    const axes: [string, AxisResult][] = [
      ["founder", result.founder_axis],
      ["market", result.market_axis],
      ["idea", result.idea_axis],
    ];

    const opportunityRows = axes.map(([panel, a]) => ({
      user_id: context.userId,
      founder_key: data.founder_key,
      panel,
      score: clamp(a.score),
      confidence: clamp(a.confidence),
      strengths: a.strengths ?? [],
      weaknesses: a.weaknesses ?? [],
      evidence: a.evidence ?? [],
      reason: a.reason ?? "",
    }));

    await context.supabase.from("opportunity_scores").insert(opportunityRows);

    await context.supabase.from("founder_scores").insert({
      user_id: context.userId,
      founder_key: data.founder_key,
      total: clamp(result.composite.total),
      components: result.composite.components as never,
      reason: result.composite.reason,
    });

    if (result.claims?.length) {
      await context.supabase.from("claims").insert(
        result.claims.slice(0, 20).map((c) => ({
          user_id: context.userId,
          founder_key: data.founder_key,
          claim: c.claim,
          source: c.source,
          confidence: clamp(c.confidence),
          verified: c.verified,
          evidence_urls: [],
        })),
      );
    }

    await context.supabase.from("activities").insert({
      user_id: context.userId,
      founder_key: data.founder_key,
      kind: "ai.analysis",
      meta: {
        total: result.composite.total,
        founder: result.founder_axis.score,
        market: result.market_axis.score,
        idea: result.idea_axis.score,
      },
    });

    return result;
  });

export const getLatestAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GetInput.parse(data))
  .handler(async ({ data, context }) => {
    const [opp, fs] = await Promise.all([
      context.supabase
        .from("opportunity_scores")
        .select("panel, score, confidence, strengths, weaknesses, evidence, reason, created_at")
        .eq("founder_key", data.founder_key)
        .order("created_at", { ascending: false })
        .limit(30),
      context.supabase
        .from("founder_scores")
        .select("total, components, reason, created_at")
        .eq("founder_key", data.founder_key)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Take latest per panel.
    const latestByPanel = new Map<string, NonNullable<typeof opp.data>[number]>();
    for (const row of opp.data ?? []) {
      if (!latestByPanel.has(row.panel)) latestByPanel.set(row.panel, row);
    }

    return {
      composite: fs.data ?? null,
      axes: {
        founder: latestByPanel.get("founder") ?? null,
        market: latestByPanel.get("market") ?? null,
        idea: latestByPanel.get("idea") ?? null,
      },
    };
  });

function clamp(n: number | undefined): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
