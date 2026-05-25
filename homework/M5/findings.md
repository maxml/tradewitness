# M5 Plan Findings

This file captured why the original `homework/M5` execution plan would
not work as-is. All 10 blockers have been addressed at the documentation
level (the homework still has to be implemented — but the plan no longer
has dead ends or wrong paths).

The shared structural fix is **Phase 1 (now: "Build the M3 HTTP
wrapper")**. The wrapper is mandatory regardless of WF1's transport
choice, and using it lets us speak the M5 contract (`feature_id`,
`traffic_percentage`) without renaming the existing MCP tools — that
single move resolves blockers 1, 2 and 4 together.

## Blockers (all resolved in docs)

1. **[DONE]** **n8n has no callable MCP HTTP surface.**
   The plan wired n8n to `http://host.docker.internal:<port>/tools/...`,
   `/health`, or `/sse`, but `mcps/feature-flags` only ships
   `StdioServerTransport`.
   **Fix:** Phase 1 is now an explicit "Build the M3 HTTP wrapper" step
   (`docs/01-setup.md` §1.4): `GET /health`, `POST /tools/<name>`, bearer
   auth, port `7733`. Phase 4 verifies the container can reach it.

2. **[DONE]** **WF2 requires HTTP even if WF1 uses SSE.**
   **Fix:** Same Phase 1 wrapper covers both flows. `docs/03-wf2 §C.3`
   now points directly at `http://host.docker.internal:7733/tools/get_feature_info`.

3. **[DONE]** **The planned Next.js path is wrong (`(private)` vs `private`).**
   The actual route lives at `apps/app/src/app/private/admin/features/`.
   **Fix:** corrected in `README.md` (project deviation table) and
   `docs/02-wf1.md` §B.1 / §B.4. All references to `(private)` removed.

4. **[DONE — alternative chosen]** **MCP tool input names do not match the M5 plan.**
   Renaming the live MCP would risk breaking Claude Desktop and any
   other existing consumer.
   **Fix:** the wrapper accepts `feature_id` / `traffic_percentage` and
   maps them to the MCP/internal API names (`name`, no `percentage`
   anywhere — the field is `traffic_percentage` in `features.json`).
   The MCP itself is untouched. Documented in `docs/01-setup.md` §1.4.

5. **[DONE]** **Structured output schema expected `id`, but flags have none.**
   `data/feature-flags/features.json` only has `name`, `status`,
   `traffic_percentage`, `depends_on`, `last_modified`.
   **Fix:** `id` removed from the WF1 output parser schema in
   `docs/02-wf1.md` §C.4. Added `depends_on` and a note that `name` is
   the primary key.

6. **[DONE — already tracked]** **Webhook secrets not fully wired.**
   `N8N_WEBHOOK_API_KEY` in `homework/M5/.env.local` is empty; the
   Next.js app does not yet define `N8N_WEBHOOK_URL` /
   `N8N_WEBHOOK_API_KEY`.
   **Fix:** Phase 0.2 generates the key with `openssl rand -hex 32`.
   Phase 7.1 mirrors it into `apps/app/.env.local`. This was already in
   the plan; flagged here so it doesn't get skipped.

7. **[DONE]** **WF2 starts from the wrong feature state.**
   `search_v2` is currently `Disabled`; WF2's deactivate branch only
   fires when status is not Disabled.
   **Fix:** Phase 10 now has an explicit pre-step: flip `search_v2` to
   `Testing` (via the dashboard or a WF1 `test` call) before starting
   `simulate_wf2.py`. Documented in `README.md` Phase 10.

8. **[DONE]** **Wrong pnpm package selector.**
   `pnpm --filter feature-flags build` matches no package. The real
   name is `@tradewitness/feature-flags-mcp`.
   **Fix:** corrected in `README.md` Phase 1 and `docs/01-setup.md` §1.4.

9. **[DONE]** **Wrong Next.js port.**
   `apps/app` runs `next dev --turbopack -p 3001`, not 3000.
   **Fix:** corrected in `docs/01-setup.md` §1.1 networking table.

10. **[DONE]** **PR checklist omits required files.**
    `docker-compose.yml` (repo root, untracked) and the `.gitignore`
    delta need to land in the PR alongside `homework/M5/*` and
    `apps/app/*`.
    **Fix:** `README.md` Phase 14 now lists these explicitly under
    "Files the PR must include".

## Notes for the implementer

- All code changes (HTTP wrapper, server action, AutoPilotControls,
  simulators, MCP changes if any) are still to be written. This pass
  only fixed the **plan**.
- If you decide later to expose SSE from the wrapper, you can swap the
  three `httpRequestTool` nodes in WF1 §C.3 for a single
  `@n8n/n8n-nodes-langchain.toolMcp` sub-node. WF2's HTTP Request node
  stays either way.
- The wrapper is the single Layer-2 guard (range/enum validation) for
  Defense-in-Depth. Make sure its JSON-schema validation matches what
  the existing MCP enforces, or import the same validators.

## Follow-up Documentation Risks (all resolved in docs)

These are not the original 10 blockers, but they can still make the plan
fail or confuse implementation if left ambiguous.

1. **[DONE]** **WF2 Code node may not be allowed to read files.**
   **Fix:** added `NODE_FUNCTION_ALLOW_BUILTIN: "fs"` to the n8n service
   in `docker-compose.yml`. Documented the dependency in
   `docs/03-wf2 §C.2` so the constraint is visible from the workflow
   spec, not just the compose file.

2. **[DONE]** **The HTTP wrapper's data source is ambiguous.**
   **Fix:** `docs/01-setup.md` §1.4 now picks one path explicitly: the
   wrapper proxies through the existing app API at
   `http://127.0.0.1:3001/api/feature-flags` (same path the existing MCP
   uses), by importing shared `fetchFlags()` / `patchFlag()` helpers
   from a new `mcps/feature-flags/src/feature-flags-client.ts` module.
   Documents the **hard dependency on `apps/app` running** and the
   `FEATURE_FLAGS_API_KEY` ↔ `M3_MCP_API_KEY` mirror.

3. **[DONE]** **"Reuse JSON Schema validation already in MCP" is imprecise.**
   **Fix:** §1.4 now distinguishes:
   - The wrapper owns its **request** schemas (`feature_id`,
     `traffic_percentage`) — different field names than the MCP tools.
   - The wrapper reuses **business-rule helpers** (dependency check via
     `validateStateChange`, "Disabled flag can't have traffic > 0") from
     the same shared module.

4. **[DONE]** **README Phase 4 bearer header depends on host-shell env expansion.**
   **Fix:** Phase 4 verify rewritten to use `sh -c '... $M3_MCP_API_KEY
   ...'` so the variable expands **inside** the container (which got
   the value from compose `--env-file`), not on the host shell. Same
   style as `docs/01-setup.md` §1.7. Added a third bullet to the
   failure-mode list about compose started without `--env-file`.

5. **[DONE]** **One wrapper validation curl hides the HTTP status.**
   **Fix:** all three Phase 1 verify probes (`/health`,
   `get_feature_info`, `adjust_traffic_rollout` invalid) now use `curl -i`
   so the response status is visible in stdout. Comments updated to
   include `HTTP/1.1 200` / `HTTP/1.1 400` explicitly.

6. **[DONE]** **Telegram `chatId` should come from env, not workflow hardcoding.**
   **Fix:** `docs/03-wf2 §C.8` now sets `chatId` to
   `={{ $env.TELEGRAM_CHAT_ID }}`. Compose already exports the value, so
   the exported workflow JSON stays secret-free and portable.

7. **[DONE]** **n8n webhook smoke tests need active-vs-test URL clarity.**
   **Fix:** new "Test URL vs Production URL" subsection at the top of
   `docs/02-wf1 §E` explains the two URL forms (`/webhook-test/...`
   while editing, `/webhook/...` after activation) and which one to use
   when. The smoke-test curl block assumes the activated production URL
   and says so.

## Internal-consistency fixes (post-resolution sweep)

After the wrapper became the new defense-in-depth Layer-2, several files
still referenced the old plan. Cleaned up:

1. **[DONE]** **`docs/05-hallucination-test.md` §B.2 still claimed Layer 2
   was the legacy MCP `inputSchema` on `traffic_percentage`.**
   **Fix:** rewrote §B.2 to point at the wrapper's request schema
   (`mcps/feature-flags/src/http.ts`, `docs/01-setup.md` §1.4). Added a
   sentence clarifying the legacy MCP still has its own validator for
   its own consumers — that's a separate Layer-2 instance, not the one
   M5 relies on.

2. **[DONE]** **`README.md` Phase 1.4 still said "Reuse JSON Schema
   validation already in the MCP".**
   **Fix:** Phase 1.4 now matches `docs/01-setup.md` §1.4: the wrapper
   owns its **own** request schemas (M5 contract), and reuses only the
   **business-rule helpers** (`validateStateChange`, "Disabled flag
   can't have traffic > 0").

3. **[DONE]** **Phase 1 verify never said to start `apps/app` first.**
   The wrapper proxies to `127.0.0.1:3001/api/feature-flags`, so the
   first verify would fail with `fetch failed` / 502 without the app.
   **Fix:** added a "Before verifying" block above the `curl -i` probes:
   start `apps/app` (`pnpm --filter @tradewitness/app dev`) and mirror
   `FEATURE_FLAGS_API_KEY` ↔ `M3_MCP_API_KEY`.

4. **[DONE]** **`logs.json` format was ambiguous ("one per line in the
   JSON array").**
   The Code node does `JSON.parse` on the whole file → format is **one
   valid JSON array**, not JSONL.
   **Fix:** §B of `docs/03-wf2-scheduled-monitor.md` now spells out
   "single valid JSON array (not JSONL / not newline-delimited)" and
   describes the read-push-write append pattern.

5. **[DONE]** **`docs/05-hallucination-test.md` §A used `/webhook/...`
   without the activation note.**
   **Fix:** added a short paragraph above the curl: WF1 must be
   activated for `/webhook/`, otherwise swap to `/webhook-test/` and
   click "Listen for test event"; pointer to `docs/02-wf1` §E for
   the full URL-mode reference.
