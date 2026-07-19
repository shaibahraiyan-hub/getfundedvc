# VC Brain — Build Plan

A production-quality, dark-themed VC operating system. Given the scope, I'll ship a strong, fully navigable v1 with polished UI, realistic seed data, and the full information architecture — then layer in backend/AI in follow-up iterations you approve.

## v1 Scope (this build)

**Design system**

- Light theme with exact tokens from your spec (`#0B0F19`, `#121826`, `#1A2234`, `#2A344A`, `#F5F7FA`, `#B8C1D1`, accent `#4F8CFF`, semantic success/warning/danger).
- Inter font, tight professional typography, generous whitespace, rounded cards, minimal motion.
- All colors wired as semantic tokens in `src/styles.css` (oklch) + Tailwind utilities. No hardcoded colors in components.

**App shell**

- Collapsible left sidebar (shadcn sidebar): Dashboard, Sourcing, Founder Workspace, Screening, Diligence, Interview, Investment Committee, Settings + user/profile/logout footer.
- Top bar: search, notifications, avatar, date.
- Fully responsive (desktop / tablet / mobile with off-canvas sidebar).

**Routes (TanStack Router, file-based)**

- `/` Dashboard — KPIs with animated counters, horizontal pipeline (Discovery→Decision), recent founder cards.
- `/sourcing` — natural-language search, filters (industry, stage, country, technical, accelerator, funding, OSS, patent, research), founder result cards.
- `/founders` — list; `/founders/$id` — Founder Workspace with tabs: Overview, Research, Evidence, Interview, Investment Memo, Timeline. Radar chart (recharts), three separate score cards (Founder / Opportunity / Trust).
- `/screening` — three independent panels (Founder, Market, Idea vs Market), each with score/strengths/weaknesses/evidence/confidence. Not averaged.
- `/diligence`, `/interview`, `/committee` — structured shells with realistic content.
- `/settings` — theme, notifications, investment thesis engine (sectors, geo, stage, check size, ownership, risk), default AI model, org, team.

**Data**

- Rich TypeScript seed data (founders, claims, evidence, timeline events, scores) so every screen feels populated and realistic.
- Feature-based folder structure (`src/features/founders`, `src/features/sourcing`, etc.), reusable components, strict TS.

**Libraries**

- Already available: React 19, TS, Tailwind v4, shadcn/ui, lucide, TanStack Router/Query.
- Add: `framer-motion`, `recharts`.

## Deferred to follow-up iterations (ask before building)

These are large, standalone workstreams. I'll ship v1 first, then tackle whichever you prioritize:

1. **Supabase backend** — enable Lovable Cloud, create all tables (Users, Orgs, Founders, Companies, FounderMemory, Scores, Claims, Evidence, Interviews, Transcripts, Memos, Activities, Notifications, Settings), RLS policies, auth (Google + email + magic link), protected routes.
2. **AI features** — natural-language sourcing search, auto-scoring, evidence extraction, interview transcription/analysis, memo generation via Lovable AI Gateway.
3. **External data sources** — GitHub, Semantic Scholar, LinkedIn, Product Hunt, news, accelerators integrations.

## Technical notes

- TanStack Start (not React Router) — routes in `src/routes/` with file-based routing, `__root.tsx` shell already in place.
- Each route defines its own `head()` metadata.
- All data client-side in v1; swappable for Supabase queries in iteration 2 without UI changes (data layer isolated in `src/features/*/data.ts`).
- Sidebar uses shadcn `Sidebar` primitives with `collapsible="icon"` for the mini-collapse behavior you asked for.

## After you approve

I'll build v1 in one pass, then ask which follow-up (backend/auth, AI, integrations) to tackle next.