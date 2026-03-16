# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hotelequip Product Optimizer** — an AI-powered WooCommerce product management platform. Key capabilities: product ingestion from PDFs/websites/scrapers, AI-driven enrichment and optimization, and multi-channel publishing.

## Commands

```bash
npm run dev          # Dev server on port 8080
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Run tests once (Vitest)
npm run test:watch   # Tests in watch mode
```

Test files live at `src/**/*.{test,spec}.{ts,tsx}`. Run a single test file: `npx vitest run src/path/to/file.test.ts`.

## Architecture

**Stack:** React 18 + TypeScript + Vite, Supabase (PostgreSQL + Auth), TanStack React Query, React Router v6, shadcn/ui + Tailwind CSS.

**Layer pattern:**
- `src/pages/` — Feature pages (50+), mostly composed from components and hooks
- `src/components/` — UI components; `src/components/ui/` holds shadcn/ui primitives
- `src/hooks/` — All business logic and data fetching (85+ hooks using React Query)
- `src/lib/` — Pure utility functions (scoring, field mappings, scraper analysis)
- `src/integrations/supabase/` — Supabase client + auto-generated DB types (types.ts is large, 528KB)

**State management:** React Query for server state, React Context for auth (`useAuth`) and workspace (`useWorkspaces`). No Redux/Zustand.

**Key subsystems:**
- `src/components/document-intelligence/` — PDF extraction, data preview, column mapping
- `src/components/playbook-engine/` — Automated ingestion workflows and corrections
- `src/components/scraper/` — Website data extraction (visual + manual)
- `src/components/supplier/` — Supplier intelligence
- `src/components/prompt-governance/` — AI prompt management and cost tracking
- `src/config/navigation.ts` — All sidebar navigation (10 menu groups)

**Multi-tenancy:** Workspace-scoped data — always consider active workspace context when querying or mutating data.

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

All client-side env vars use the `VITE_` prefix and are accessed via `import.meta.env`.

## Key Conventions

- `cn()` from `src/lib/utils.ts` is used everywhere for conditional Tailwind class merging
- WooCommerce field mappings live in `src/lib/wooPublishFields.ts`
- SEO scoring logic in `src/lib/seoScore.ts`
- Theme stored in localStorage as `he-theme`, defaults to `"light"`
- PWA app name: "Hotelequip Product Optimizer" (configured in `vite.config.ts`)
