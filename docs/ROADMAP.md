# TradeWitness Project Roadmap

This document outlines the high-level tasks and current progress for the TradeWitness application development.

## 🟢 Completed Tasks

- **Task 1: Initialize Turborepo & Combine Projects**
  - Isolated Landing Page (`pranata-dev`) and Web App (`Bilovodskyi`) into a Turborepo monorepo (`apps/landing`, `apps/app`).
  - Set up shared packages (`packages/api-types`).
  - Handled dependency conflicts (Tailwind v3 vs v4, React 18 vs 19).

- **Task 2: Cloud Infrastructure Migration**
  - Unified database on **Supabase Postgres**.
  - Replaced Neon driver with standard `postgres` driver and Drizzle caching.
  - Implemented **Cloudflare R2** for screenshot storage using lightweight `aws4fetch` (no heavy AWS SDK).
  - Retained **Clerk** for authentication.

---

## 🟡 Upcoming Tasks

### Task 3: AI IDE Integration & Project Onboarding (Homework M2)
- Configure the repository to act as a perfect partner for AI-IDEs (like Cursor, Gemini CLI, Claude Code).
- **Block 1:** Generate and refine a rules file (`GEMINI.md`).
- **Block 2:** Update `README.md` and `.env.example` with clear, reproducible local setup instructions.
- **Block 3:** Generate `FINDINGS.md` by hunting for bugs/tech debt, and fix at least one issue via AI.
- **Nice-To-Have:** Generate Mermaid architecture diagrams and MADR (Architecture Decision Records).

### Task 4: AI Decoupling & BYOAI (Bring Your Own AI)
- Remove hard dependency on paid Anthropic API (`@anthropic-ai/sdk`).
- Redesign the "AI Report" flow: Generate a smart prompt containing the user's trade data (Markdown/JSON) with a "Copy" button, allowing users to paste it into their own ChatGPT/Claude accounts for free analysis.

### Task 5: Integrating the `journedge` Donor Code (Trading Math)
- Migrate professional trading mathematics from the `journedge` repository.
- Implement calculations for: Win Rate, MAE (Maximum Adverse Excursion), MFE (Maximum Favorable Excursion), Expectancy, Profit Factor, and Equity Curve.

### Task 6: Deep Content Rebranding & Landing Setup
- Deep redesign of text content, meta-data, and landing pages (`apps/landing`) to fit the TradeWitness brand (Marketing pages, `About`, `Pricing`).

### Task 7: Desktop Collector (Tauri / Electron App)
- *The Killer Feature.* Create a minimalist desktop application (overlay) that captures screen screenshots.
- Configure `multipart/form-data` uploads to the backend (`/api/trades`), which will utilize the `r2.ts` utility to store the image in Cloudflare R2 and create a new record in Supabase.

### Task 8: Public Profile & Mentor Views
- Implement "Public Portfolio" logic.
- Create routes like `tradewitness.com/u/username` where mentors can view a trader's statistics (read-only) and evaluate their calculated "Discipline Score".

### Task 9: Docker / VPS Deployment & CI/CD
- Write a multi-stage `Dockerfile` for the Turborepo.
- Deploy to the VPS via Docker Compose, configuring a reverse proxy (Nginx/Caddy) for domain routing (e.g., `app.tradewitness.com`).
- (Optional) Set up GitHub Actions for automated deployment on `main` branch pushes.
