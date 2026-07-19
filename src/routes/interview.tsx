import { createFileRoute } from "@tanstack/react-router";
import { founders } from "@/features/founders/data";
import { Video, Mic, Calendar } from "lucide-react";

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "Interviews · VC Brain" },
      { name: "description", content: "Structured founder interviews with AI-assisted synthesis." },
    ],
  }),
  component: Interview,
});

function Interview() {
  const upcoming = founders.slice(0, 4);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Interview</div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Upcoming interviews</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {upcoming.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {f.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.company}</div>
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface p-2 text-muted-foreground">
                {i % 2 === 0 ? <Video className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Thu, Jul {24 + i} · {10 + i}:00 · 45 min</span>
            </div>
            <button className="mt-4 w-full rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
              Prep briefing
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
