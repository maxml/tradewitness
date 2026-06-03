/**
 * Integration test STUBS for SERVICE 1: feature-flags MCP HTTP wrapper + stdio server.
 *
 * Targets:
 *   mcps/feature-flags/src/http.ts   (REST surface: /health, /tools/*)
 *   mcps/feature-flags/src/index.ts  (stdio MCP tools)
 *
 * Framework: Vitest. Vitest MUST be installed to run:  pnpm add -D vitest
 *
 * WHY THESE ARE STUBS (not fakes):
 *   http.ts and index.ts both call out to the Next.js route GET/PATCH /api/feature-flags,
 *   which is the only code that reads/writes data/feature-flags/features.json. The HTTP
 *   wrapper opens a real `http.createServer(...).listen(PORT)` at import time, and the
 *   stdio server connects a StdioServerTransport at import time. Exercising them honestly
 *   requires (a) a running apps/app on APP_INTERNAL_URL and (b) a writable test copy of
 *   features.json — neither of which a unit run should touch.
 *
 *   Rather than mock the upstream into a fake that would only test the mock, these are
 *   left as `it.todo` placeholders documenting the exact contract each case must assert,
 *   per the spec's decision table and §6 characterization tests. The PURE validation
 *   logic these handlers depend on (DependencyGraph) is fully covered in
 *   feature-flags-core.test.ts.
 *
 * To implement later: start the wrapper against a throwaway app instance (or a stub
 * upstream bound to a free port) using a temp features.json, then drive it with `fetch`.
 */

import { describe, it } from 'vitest';

describe('HTTP wrapper (http.ts) — integration (requires running app + test features.json)', () => {
  // spec §6.12 / decision table row 2
  it.todo('GET /health returns 200 {ok:true} with NO Authorization header');

  // spec §6.11 / decision table row 3
  it.todo('POST /tools/set_feature_state with missing/invalid Bearer -> 401 {error:"unauthorized"}');

  // spec §6.13 / decision table row 4
  it.todo('GET /tools/get_feature_info with a valid Bearer -> 405 {error:"method_not_allowed"}');

  // spec §6.14 / decision table row 5
  it.todo('POST /tools/set_feature_state with body "{" -> 400 {error:"invalid_json"}');
  it.todo('POST /tools/set_feature_state with empty body -> 400 {error:"invalid_body"}');

  // spec §6.15 / decision table edge — arg-name mismatch between surfaces
  it.todo('POST /tools/get_feature_info with {feature_name:"search_v2"} (wrong key) -> 400 {error:"invalid_field"} for feature_id');

  // spec §6.2 — dependency violation maps to 409 on the HTTP surface
  it.todo('POST /tools/set_feature_state {feature_id:"ai_report_followup_v1", state:"Enabled"} while parent Disabled -> 409 {error:"dependency_violation"}');

  // spec §6.10 / decision table row 8
  it.todo('POST /tools/get_feature_info {feature_id:"does_not_exist"} -> 404 {error:"feature_not_found"}');

  // spec §6.16 / decision table row 15
  it.todo('any /tools/* call when APP_INTERNAL_URL points at a closed port -> 502 {error:"upstream_unreachable"}');

  // spec §4 "Unknown tool / route"
  it.todo('POST to an unmapped /tools/wat path with valid Bearer -> 404 {error:"not_found"}');
});

describe('stdio MCP server (index.ts) — integration (requires running app + test features.json)', () => {
  // spec §6.5 — case-sensitive state rejection surfaces as isError text, not a 400
  it.todo('set_feature_state(search_v2, "enabled") -> isError text "state must be one of..."');

  // spec §6.4 — divergence: stdio throws "Flag not found: <dep>" for a missing dependency
  it.todo('set_feature_state on a flag whose depends_on references a missing flag -> isError text "Flag not found: <dep>"');

  // spec §6.6 — runtime guards, not the advertised inputSchema, are the real gate
  it.todo('adjust_traffic_rollout percentage 25.5 -> isError "percentage must be an integer from 0 to 100."');
  it.todo('adjust_traffic_rollout percentage "25" (string) -> isError "percentage must be an integer from 0 to 100."');

  // spec §4 "Unknown tool / route"
  it.todo('calling an unregistered tool name -> McpError MethodNotFound');
});
