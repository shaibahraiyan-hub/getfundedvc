import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Github } from "lucide-react";
import { discoverFoundersOnGitHub, type DiscoveredFounder } from "@/lib/discover.functions";
import { analyzeFounder } from "@/lib/scoring.functions";

export const Route = createFileRoute("/screening")({
  head: () => ({
    meta: [
      { title: "Screening · New Founders" },
      { name: "description", content: "Three independent panels: Founder, Market, Idea-Market fit." },
    ],
  }),
  component: Screening,
});

type AxisView = {
  score: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  evidence: string[];
};

type PanelSet = { founder: AxisView; market: AxisView; idea: AxisView } | null;

function Screening() {
  const discover = useServerFn(discoverFoundersOnGitHub);
  const analyze = useServerFn(analyzeFounder);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["screening-live-founders"],
    queryFn: () => discover({ data: { minFollowers: 200, limit: 8 } }),
    staleTime: 1000 * 60 * 10,
  });
  const live = data?.founders ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = live.find((f) => f.id === selectedId) ?? live[0] ?? null;
  const [results, setResults] = useState<Record<string, PanelSet>>({});

  const mutation = useMutation({
    mutationFn: async (f: DiscoveredFounder) => {
      const res = await analyze({
        data: {
          founder_key: f.id,
          snapshot: {
            id: f.id,
            name: f.name,
            company: f.company || f.topRepo?.name || "Independent",
            role: "Founder / Builder",
            country: f.location || undefined,
            bio: f.bio || undefined,
            research: {
              github: {
                login: f.login,
                followers: f.followers,
                public_repos: f.publicRepos,
                url: f.htmlUrl,
                top_repo: f.topRepo,
              },
            },
          },
        },
      });
      return { id: f.id, res };
    },
    onSuccess: ({ id, res }) => {
      setResults((prev) => ({
        ...prev,
        [id]: {
          founder: axis(res.founder_axis),
          market: axis(res.market_axis),
          idea: axis(res.idea_axis),
        },
      }));
    },
  });

  const current = selected ? results[selected.id] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Screening
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Independent evaluation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live founders from GitHub. Run AI screening to score three independent panels — never averaged.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent/10 hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {isFetching ? "Refreshing…" : "Refresh founders"}
        </button>
      </div>

      {isLoading && (
        <div className="mt-6 rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Fetching live founders from GitHub…
        </div>
      )}
      {isError && (
        <div className="mt-6 rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive">
          Couldn't load live founders. GitHub may be rate-limiting — try again in a minute.
        </div>
      )}

      {live.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {live.map((x) => {
            const active = (selected?.id ?? live[0].id) === x.id;
            return (
              <button
                key={x.id}
                onClick={() => setSelectedId(x.id)}
                className={
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                  (active
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground")
                }
              >
                <img src={x.avatarUrl} alt="" className="h-4 w-4 rounded-full" />
                {x.name} · @{x.login}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={selected.avatarUrl} alt={selected.name} className="h-10 w-10 rounded-full" />
              <div>
                <div className="text-sm font-semibold">{selected.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selected.bio || `@${selected.login} · ${selected.followers} followers`}
                </div>
              </div>
              <a
                href={selected.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Github className="h-3 w-3" /> Profile
              </a>
            </div>
            <button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(selected)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {mutation.isPending ? "Analyzing…" : current ? "Re-run AI screening" : "Run AI screening"}
            </button>
          </div>
          {mutation.isError && (
            <div className="mt-3 text-xs text-destructive">
              {(mutation.error as Error)?.message ?? "Analysis failed"}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {current ? (
          <>
            <Panel title="Founder" axisView={current.founder} company={selected?.company || selected?.login || ""} />
            <Panel title="Market" axisView={current.market} company={selected?.company || selected?.login || ""} />
            <Panel title="Idea vs Market" axisView={current.idea} company={selected?.company || selected?.login || ""} />
          </>
        ) : (
          <div className="lg:col-span-3 rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            {selected
              ? "Run AI screening to score this founder across three independent panels."
              : "Select a founder above to begin."}
          </div>
        )}
      </div>
    </div>
  );
}

function axis(a: {
  score?: number; confidence?: number; strengths?: string[]; weaknesses?: string[]; evidence?: string[];
} | undefined): AxisView {
  return {
    score: Math.max(0, Math.min(100, Math.round(a?.score ?? 0))),
    confidence: Math.max(0, Math.min(100, Math.round(a?.confidence ?? 0))),
    strengths: a?.strengths ?? [],
    weaknesses: a?.weaknesses ?? [],
    evidence: a?.evidence ?? [],
  };
}

function Panel({ title, axisView: e, company }: { title: string; axisView: AxisView; company: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title} panel
        </div>
        <div className="text-[11px] text-muted-foreground">{company}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">{e.score}</span>
        <span className="text-xs text-muted-foreground">/100 · {e.confidence}% confidence</span>
      </div>
      <div className="mt-3 h-1 rounded-full bg-border">
        <div className="h-1 rounded-full bg-primary" style={{ width: `${e.score}%` }} />
      </div>

      <div className="mt-5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--success)]">
          Strengths
        </div>
        <ul className="mt-1.5 space-y-1.5">
          {e.strengths.length ? e.strengths.map((s) => (
            <li key={s} className="flex gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--success)]" />
              <span className="text-muted-foreground">{s}</span>
            </li>
          )) : <li className="text-xs text-muted-foreground/70">None cited</li>}
        </ul>
      </div>

      <div className="mt-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--warning)]">
          Weaknesses
        </div>
        <ul className="mt-1.5 space-y-1.5">
          {e.weaknesses.length ? e.weaknesses.map((s) => (
            <li key={s} className="flex gap-2 text-sm">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--warning)]" />
              <span className="text-muted-foreground">{s}</span>
            </li>
          )) : <li className="text-xs text-muted-foreground/70">None cited</li>}
        </ul>
      </div>

      {e.evidence.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Evidence
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {e.evidence.map((ev) => (
              <span key={ev} className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                {ev}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
