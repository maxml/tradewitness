# Task 10.1: Feature Flags MCP (Detailed)

## Goal
Implement a persistent feature flag system shared between the Web App and an MCP server, secured by an API key and integrated into the Admin Dashboard.

## Steps

1. **Shared Logic (`packages/feature-flags-core`)**
   - Define Zod schemas for `FeatureFlag` and `FeatureFlagState`.
   - Implement `DependencyGraph` class to handle "must be Testing/Enabled if parent is Enabled" logic.
   - **Dependency Wiring:** Add `"@tradewitness/feature-flags-core": "workspace:*"` to `apps/app/package.json` and the MCP server's `package.json` to prevent build failures.

2. **Persistence Store**
   - Create `data/feature-flags/features.json` in the workspace root.
   - Populate with exactly 25 real flags for TradeWitness, using this initial state table:

     | Feature | Initial status | Initial traffic | Dependencies |
     | --- | --- | --- | --- |
     | `auth_clerk_v1` | Enabled | 100 | none |
     | `supabase_runtime_v1` | Enabled | 100 | none |
     | `trade_journal_core_v1` | Enabled | 100 | `auth_clerk_v1`, `supabase_runtime_v1` |
     | `search_v2` | Disabled | 0 | `trade_journal_core_v1` |
     | `strategies_v1` | Enabled | 100 | `trade_journal_core_v1` |
     | `custom_trade_fields_v1` | Enabled | 100 | `trade_journal_core_v1` |
     | `calendar_analytics_v1` | Testing | 25 | `trade_journal_core_v1` |
     | `history_filters_v1` | Enabled | 100 | `trade_journal_core_v1` |
     | `statistics_summary_v1` | Testing | 25 | `trade_journal_core_v1` |
     | `r2_storage_v1` | Testing | 25 | none |
     | `screenshots_r2_upload_v1` | Testing | 25 | `trade_journal_core_v1`, `r2_storage_v1` |
     | `ai_report_prompt_v1` | Testing | 25 | `trade_journal_core_v1` |
     | `ai_report_followup_v1` | Disabled | 0 | `ai_report_prompt_v1` |
     | `desktop_collector_v1` | Disabled | 0 | `screenshots_r2_upload_v1` |
     | `landing_blog_v1` | Enabled | 100 | none |
     | `landing_i18n_v1` | Enabled | 100 | none |
     | `landing_pricing_v1` | Testing | 25 | none |
     | `stripe_billing_v1` | Disabled | 0 | `auth_clerk_v1` |
     | `tokens_purchase_v1` | Disabled | 0 | `stripe_billing_v1` |
     | `stripe_webhooks_v1` | Disabled | 0 | `stripe_billing_v1` |
     | `mentor_public_profile_v1` | Disabled | 0 | `trade_journal_core_v1` |
     | `discipline_score_v1` | Testing | 25 | `strategies_v1`, `trade_journal_core_v1` |
     | `feature_flags_api_v1` | Testing | 25 | `auth_clerk_v1` |
     | `admin_feature_dashboard_v1` | Disabled | 0 | `feature_flags_api_v1` |
     | `rag_docs_index_v1` | Disabled | 0 | none |

   - The Part 1 MCP prompt depends on `mentor_public_profile_v1` starting as `Disabled` with `traffic_percentage: 0`, so do not change that seed state before recording logs.
   - The dependency graph MUST make the RAG query answerable:
     `tokens_purchase_v1` and `stripe_webhooks_v1` depend on
     `stripe_billing_v1`; `stripe_billing_v1` depends on `auth_clerk_v1`;
     `search_v2`, `mentor_public_profile_v1`, and `discipline_score_v1`
     depend on `trade_journal_core_v1`; `desktop_collector_v1` depends on
     `screenshots_r2_upload_v1`; `screenshots_r2_upload_v1` depends on
     `r2_storage_v1` and `trade_journal_core_v1`.

3. **Backend Integration (`apps/app`)**
   - **Middleware:** Use `createRouteMatcher` to allow `/api/feature-flags` without Clerk block.
   - **API Route:** `src/app/api/feature-flags/route.ts`
     - `GET`: Read JSON file directly, return array.
     - `PATCH`: Update specific flag, validate dependencies, write back to file.
     - **Headers:** Require `x-api-key`.
     - **Caching:** `export const dynamic = 'force-dynamic'`.
   - **Admin Page:** Create `src/app/private/admin/features/page.tsx` to list and view flag statuses. 
     - **Caching:** Add `export const dynamic = 'force-dynamic'` to prevent Next.js build deadlocks during prerendering.
     - **Security:** Inherits Clerk protection from `/private`, but MUST also include an explicit `ADMIN_EMAILS` or role check to prevent regular users from accessing.
     - **Data Fetching:** Must read data securely using a Server Component that makes a server-side `fetch` to `${baseUrl}/api/feature-flags` with the `x-api-key` header, where `baseUrl` is resolved in TypeScript as `process.env.APP_INTERNAL_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3001"`. Use `127.0.0.1` instead of `localhost` to avoid Node.js `ECONNREFUSED` with IPv6. This avoids leaking the key to the browser and fulfills the "reads through API" requirement.

4. **MCP Server (`mcps/feature-flags`)**
   - Build using `@modelcontextprotocol/sdk`.
   - Implement tools: `list_features`, `get_feature_info`, `set_feature_state`, `adjust_traffic_rollout`.
   - **Tool Description Requirements:** Every tool MUST provide a rich description matching the MCP Design Principles. It must explicitly include "when to call", "when NOT to call", expected input/output formats, examples, and imperative "You MUST" rules.
   - Tool descriptions and implementation MUST include these constraints:
     - You MUST reject unknown feature names.
     - You MUST reject invalid states outside `Disabled`, `Testing`, and `Enabled`.
     - You MUST reject traffic values outside `0..100`.
     - You MUST reject `traffic_percentage > 0` when the feature status is `Disabled`.
     - You MUST reject transition to `Enabled` when any dependency is `Disabled`.
     - You MUST update `last_modified` only after a successful mutation.
   - Use `x-api-key` for all API calls.

5. **Verification**
   - `curl -H "x-api-key: ..." http://127.0.0.1:3001/api/feature-flags`

- Verify that updating via MCP updates the file and the Admin UI simultaneously.
