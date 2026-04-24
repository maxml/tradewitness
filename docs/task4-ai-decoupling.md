# Technical Plan: Task 4 - AI Decoupling & BYOAI

## Background & Motivation
The original `Bilovodskyi` SaaS codebase heavily relied on the `@anthropic-ai/sdk` to automatically generate trading reports and insights using Claude 3.5 Sonnet. This meant every user interaction with the "AI Report" feature triggered a paid API call on the server backend. For an MVP without a monetization strategy in place, this introduces unacceptable usage costs.

The goal of this task is to pivot to a **BYOAI (Bring Your Own AI)** model. Instead of calling the API automatically, the backend will generate a highly optimized, structured text prompt containing the user's trading data. The user can copy this prompt with a single click and paste it into their personal, free ChatGPT or Claude interface.

## Scope & Impact
- Uninstall the `@anthropic-ai/sdk` package from `apps/app`.
- Remove or refactor the server actions/API routes (`apps/app/src/app/api/claude/route.ts`, etc.) that were performing server-side AI requests.
- Update the UI components (`apps/app/src/components/tradeAI/`) to replace the automatic generation flow with a "Generate Prompt" flow.
- Construct a robust Markdown/JSON serialization utility that takes a user's `trades` from Supabase and formats them clearly for LLM ingestion.
- Implement a "Copy to Clipboard" functionality in the UI.

## Implementation Steps
1. **Uninstall Dependencies:** Run `pnpm --filter @tradewitness/app remove @anthropic-ai/sdk`.
2. **Refactor Prompts Generation:** Create a new utility function `generateAIPrompt(trades: Trade[])` in `apps/app/src/features/ai/`. This function should calculate basic summary stats and format the trade list into a string (e.g., CSV or Markdown table format) appended to a base system prompt.
3. **Update UI Components:** Modify the `AIReportControls` or `ReportPage` to display a large, read-only textarea with the generated prompt, alongside a `<button onClick={() => navigator.clipboard.writeText(prompt)}>` element.
4. **Cleanup Server Routes:** Delete `apps/app/src/app/api/claude/route.ts` and `apps/app/src/app/api/follow-up-claude/route.ts` as they are no longer needed. Remove the `ANTHROPIC_API_KEY` from environment variables.

## Verification
- Clicking "Generate AI Report" in the app does not trigger any network requests to external APIs.
- The UI displays a formatted prompt that correctly includes the user's actual trade data from the Supabase database.
- Clicking "Copy" successfully copies the prompt to the clipboard.