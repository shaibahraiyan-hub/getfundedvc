import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, FileText, Activity, Shield, GitBranch, Layers, Github, Linkedin, MapPin, Star } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { Pipeline } from "@/components/pipeline";
import { kpis } from "@/features/founders/data";
import { useCurrentUser } from "@/hooks/use-current-user";
import { discoverFoundersOnGitHub } from "@/lib/discover.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · New Founders" },
      { name: "description", content: "Mission control for your investment pipeline." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { firstName } = useCurrentUser();
  const discover = useServerFn(discoverFoundersOnGitHub);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-live-founders"],
    queryFn: () => discover({ data: { minFollowers: 200, limit: 6 } }),
    staleTime: 1000 * 60 * 10,
  });
  const live = data?.founders ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Mission control
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nine memos queued for this week. Two founders moved to Decision overnight.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Founders tracked" value={kpis.foundersTracked} delta="+47 this week" positive icon={Users} />
        <KpiCard label="New this week" value={kpis.newThisWeek} delta="+12% vs last" positive icon={TrendingUp} />
        <KpiCard label="Memos ready" value={kpis.memosReady} delta="Review Thursday" icon={FileText} />
        <KpiCard label="Avg founder score" value={kpis.avgFounderScore} suffix="/100" icon={Activity} />
        <KpiCard label="Avg trust score" value={kpis.avgTrustScore} suffix="/100" icon={Shield} />
        <KpiCard label="Pipeline health" value={kpis.pipelineHealth} suffix="/100" icon={GitBranch} />
        <KpiCard label="Portfolio capacity" value={kpis.portfolioCapacity} suffix="%" delta="3 slots remaining in fund IV" icon={Layers} />
      </div>

      <div className="mt-6">
        <Pipeline />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Live founders on GitHub</h2>
            <p className="text-xs text-muted-foreground">Real profiles fetched live — refresh for a new set.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/10 hover:text-foreground"
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {isLoading && (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Fetching live founders from GitHub…
          </div>
        )}
        {isError && (
          <div className="rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive">
            Couldn't load live founders. GitHub may be rate-limiting — try again in a minute.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((f) => (
            <a
              key={f.id}
              href={f.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="group rounded-lg border border-border bg-card p-4 transition hover:border-accent/60"
            >
              <div className="flex items-start gap-3">
                <img src={f.avatarUrl} alt={f.name} className="h-10 w-10 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold group-hover:text-accent">{f.name}</div>
                    <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">Live</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">@{f.login}</div>
                </div>
              </div>
              {f.bio && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{f.bio}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {f.location && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{f.location}</span>
                )}
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{f.followers}</span>
                {f.topRepo && (
                  <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{f.topRepo.stars} · {f.topRepo.name}</span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-muted-foreground">
                  <Github className="h-3 w-3" />GitHub
                </span>
                <a
                  href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(f.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-muted-foreground hover:text-foreground"
                >
                  <Linkedin className="h-3 w-3" />LinkedIn
                </a>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
