import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { FounderCard } from "@/components/founder-card";
import { founders } from "@/features/founders/data";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sourcing")({
  head: () => ({
    meta: [
      { title: "Sourcing · VC Brain" },
      { name: "description", content: "Discover exceptional first-time founders." },
    ],
  }),
  component: Sourcing,
});

const examples = [
  "AI infrastructure founder in Berlin",
  "Healthcare AI with no prior VC funding",
  "Technical founder building enterprise SaaS",
];

const industries = ["AI Infrastructure", "Healthcare AI", "Fintech Infrastructure", "Robotics", "DevTools", "Bio × AI"];
const stages = ["Pre-seed", "Seed", "Series A"];
const countries = ["United States", "Germany", "India", "United Kingdom", "Netherlands"];
const flags = ["Technical", "Accelerator", "Open Source", "Patent", "Research", "Prior Funding"];

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function Sourcing() {
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState<Set<string>>(new Set());
  const [country, setCountry] = useState<Set<string>>(new Set());
  const [flag, setFlag] = useState<Set<string>>(new Set());

  const toggle = (s: Set<string>, setter: (v: Set<string>) => void, v: string) => {
    const n = new Set(s);
    n.has(v) ? n.delete(v) : n.add(v);
    setter(n);
  };

  const results = useMemo(() => {
    return founders.filter((f) => {
      if (q && !`${f.name} ${f.company} ${f.industry} ${f.location} ${f.bio}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (industry.size && !industry.has(f.industry)) return false;
      if (country.size && !country.has(f.country)) return false;
      return true;
    });
  }, [q, industry, country]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sourcing
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Discover founders
        </h1>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="relative">
          <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search founders naturally..."
            className="h-11 border-border bg-surface pl-9 text-sm"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Try:</span>
          {examples.map((e) => (
            <button
              key={e}
              onClick={() => setQ(e)}
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs hover:text-foreground"
            >
              {e}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3 border-t border-border pt-4">
          <FilterRow label="Industry">
            {industries.map((i) => (
              <Chip key={i} label={i} active={industry.has(i)} onClick={() => toggle(industry, setIndustry, i)} />
            ))}
          </FilterRow>
          <FilterRow label="Country">
            {countries.map((c) => (
              <Chip key={c} label={c} active={country.has(c)} onClick={() => toggle(country, setCountry, c)} />
            ))}
          </FilterRow>
          <FilterRow label="Stage">
            {stages.map((s) => (
              <Chip key={s} label={s} active={false} onClick={() => {}} />
            ))}
          </FilterRow>
          <FilterRow label="Signals">
            {flags.map((f) => (
              <Chip key={f} label={f} active={flag.has(f)} onClick={() => toggle(flag, setFlag, f)} />
            ))}
          </FilterRow>
        </div>
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-tight">
          {results.length} {results.length === 1 ? "match" : "matches"}
        </h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5" /> Sorted by founder score
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((f) => (
          <FounderCard key={f.id} founder={f} />
        ))}
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
