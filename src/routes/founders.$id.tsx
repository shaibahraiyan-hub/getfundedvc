import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, MapPin, Globe, Mail, Github, GraduationCap, Newspaper,
  Rocket, Linkedin, CheckCircle2, AlertCircle, Clock, ExternalLink,
  Brain, Pin, Plus, Sparkles, Filter,
} from "lucide-react";
import { getFounder, getFounderMemory, addFounderMemory } from "@/features/founders/data";
import type { Founder, MemoryEntry, MemoryCategory, MemorySource } from "@/features/founders/data";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/founders/$id")({
  loader: ({ params }) => {
    const f = getFounder(params.id);
    if (!f) throw notFound();
    return { founder: f };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.founder.name} · VC Brain` : "Founder · VC Brain" },
      { name: "description", content: loaderData?.founder.bio ?? "Founder workspace" },
    ],
  }),
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">Founder not found.</div>
  ),
  errorComponent: () => (
    <div className="p-8 text-center text-muted-foreground">Failed to load founder.</div>
  ),
  component: FounderWorkspace,
});

const tabs = ["Overview", "Memory", "Research", "Evidence", "Interview", "Investment Memo", "Timeline"] as const;
type Tab = (typeof tabs)[number];

function FounderWorkspace() {
  const { founder } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        to="/founders"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All founders
      </Link>

      <FounderHeader founder={founder} />

      <div className="mt-6 border-b border-border">
        <div className="flex flex-wrap gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative px-3 py-2 text-sm font-medium transition-colors",
                tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {tab === "Overview" && <OverviewTab founder={founder} />}
        {tab === "Memory" && <MemoryTab founder={founder} />}
        {tab === "Research" && <ResearchTab founder={founder} />}
        {tab === "Evidence" && <EvidenceTab founder={founder} />}
        {tab === "Interview" && <InterviewTab founder={founder} />}
        {tab === "Investment Memo" && <MemoTab founder={founder} />}
        {tab === "Timeline" && <TimelineTab founder={founder} />}
      </div>

    </div>
  );
}

function FounderHeader({ founder }: { founder: Founder }) {
  return (
    <div className="mt-3 grid gap-4 rounded-xl border border-border bg-card p-5 lg:grid-cols-[1fr_auto]">
      <div className="flex items-start gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
          {founder.initials}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{founder.name}</h1>
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {founder.stage}
            </span>
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {founder.role} · <span className="text-foreground">{founder.company}</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{founder.bio}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {founder.location}</span>
            <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {founder.website}</span>
            <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {founder.email}</span>
            <span className="inline-flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 lg:min-w-[420px]">
        <ScoreBig label="Founder" value={founder.founderScore} />
        <ScoreBig label="Opportunity" value={founder.opportunityScore} />
        <ScoreBig label="Trust" value={founder.trustScore} />
      </div>
    </div>
  );
}

function ScoreBig({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-border">
        <div
          className="h-1 rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function OverviewTab({ founder }: { founder: Founder }) {
  const data = Object.entries(founder.radar).map(([k, v]) => ({
    dim: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-sm font-semibold tracking-tight">Founder profile radar</div>
        <div className="mt-3 h-[340px]">
          <ResponsiveContainer>
            <RadarChart data={data}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="dim" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-sm font-semibold tracking-tight">Recommendation</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-primary">{founder.recommendation}</span>
            <span className="text-xs text-muted-foreground">{founder.confidence}% confidence</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Every recommendation is backed by evidence collected across {founder.claims.length} verified claims. See the Evidence tab for provenance.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-sm font-semibold tracking-tight">Investment thesis fit</div>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="Industry" v={founder.industry} />
            <Row k="Stage" v={founder.stage} />
            <Row k="Geography" v={founder.country} />
            <Row k="Accelerator" v={founder.research.accelerator ?? "None"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="text-sm">{v}</span>
    </div>
  );
}

function ResearchTab({ founder }: { founder: Founder }) {
  const r = founder.research;
  const sources = [
    { icon: Github, name: "GitHub", summary: r.github.summary, score: r.github.score, extra: `${r.github.stars.toLocaleString()} stars · ${r.github.repos} repos` },
    { icon: GraduationCap, name: "Semantic Scholar", summary: r.scholar.summary, score: r.scholar.score, extra: `${r.scholar.papers} papers · ${r.scholar.citations.toLocaleString()} citations` },
    { icon: Linkedin, name: "LinkedIn", summary: r.linkedin.summary, score: r.linkedin.score, extra: "Employment verified" },
    { icon: Rocket, name: "Product Hunt", summary: r.productHunt.summary, score: r.productHunt.score, extra: "" },
    { icon: Newspaper, name: "News", summary: r.news.summary, score: r.news.score, extra: "" },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {sources.map((s) => (
        <div key={s.name} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-surface">
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-semibold">{s.name}</div>
                {s.extra && <div className="text-[11px] text-muted-foreground">{s.extra}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</div>
              <div className="text-sm font-semibold tabular-nums">{s.score}%</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{s.summary}</p>
        </div>
      ))}
    </div>
  );
}

function EvidenceTab({ founder }: { founder: Founder }) {
  return (
    <div className="space-y-3">
      {founder.claims.map((c) => {
        const Icon = c.verified === "Verified" ? CheckCircle2 : c.verified === "Needs Verification" ? AlertCircle : Clock;
        const color =
          c.verified === "Verified"
            ? "text-[color:var(--success)]"
            : c.verified === "Needs Verification"
              ? "text-[color:var(--warning)]"
              : "text-muted-foreground";
        return (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", color)} />
                  <div className="text-sm font-semibold">{c.claim}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.evidence.map((e) => (
                    <span key={e} className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                      {e}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Source: <span className="text-foreground">{c.source}</span> · Collected {c.date}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</div>
                <div className="text-lg font-semibold tabular-nums">{c.confidence}%</div>
                <div className={cn("mt-1 text-[11px] font-medium", color)}>{c.verified}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InterviewTab({ founder }: { founder: Founder }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-sm font-semibold">Structured interview — draft questions</div>
        <ol className="mt-3 space-y-3 text-sm">
          {[
            "Walk me through the 90 days that led to founding " + founder.company + ".",
            "What's the sharpest customer objection you've heard, and how did you address it?",
            "Where does the wedge break in 18 months if you don't raise?",
            "Which hire is currently blocking your roadmap most?",
            "Tell me about a decision you reversed in the last quarter.",
          ].map((q, i) => (
            <li key={i} className="flex gap-3 rounded-lg border border-border bg-surface p-3">
              <span className="text-xs font-semibold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">Scheduled</div>
          <div className="mt-2 text-sm text-muted-foreground">Thu, Jul 25 · 10:00 · Zoom</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">Prep signals</div>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div>· 4 unresolved claims to probe</div>
            <div>· 2 reference checks pending</div>
            <div>· Deck v3 in data room</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemoTab({ founder }: { founder: Founder }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Investment memo · Draft
      </div>
      <h2 className="mt-1 text-xl font-semibold">{founder.company} — Series Seed</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Prepared for Investment Committee · {new Date().toLocaleDateString()}
      </p>
      <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
        {[
          ["Recommendation", `${founder.recommendation} · ${founder.confidence}% confidence`],
          ["Check size", "$3.0M lead"],
          ["Round", "$6.0M seed at $32M post"],
          ["Ownership target", "9.4%"],
          ["Board", "Observer with pro-rata"],
          ["Key risks", "First-time CEO · Enterprise sales motion unproven"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-border bg-surface p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
            <div className="mt-1">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Thesis.</span> {founder.name} is building the retrieval layer for enterprise AI agents at a moment when every Fortune 500 has an internal agent mandate. The technical wedge is defensible on latency and evaluation.
        </p>
        <p>
          <span className="font-semibold text-foreground">Why now.</span> Vector search primitives have commoditized; the differentiated layer is orchestration, evaluation, and continuous learning — where {founder.company} focuses.
        </p>
        <p>
          <span className="font-semibold text-foreground">Team.</span> {founder.bio}
        </p>
        <p>
          <span className="font-semibold text-foreground">Risk & mitigation.</span> Hyperscaler bundling risk is real; the design-partner motion suggests {founder.company} is winning on developer experience rather than pricing. See Evidence tab for provenance.
        </p>
      </div>
    </div>
  );
}

function TimelineTab({ founder }: { founder: Founder }) {
  return (
    <div className="relative pl-6">
      <div className="absolute inset-y-0 left-2 w-px bg-border" />
      <div className="space-y-4">
        {founder.timeline.map((e) => (
          <div key={e.id} className="relative">
            <div className="absolute -left-[18px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {e.type}
                  </span>
                  <div className="text-sm font-semibold">{e.title}</div>
                </div>
                <div className="text-[11px] text-muted-foreground">{e.date}</div>
              </div>
              {e.description && (
                <p className="mt-1.5 text-sm text-muted-foreground">{e.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
        <ExternalLink className="h-3 w-3" /> All timestamps normalized to founder's local timezone.
      </div>
    </div>
  );
}
