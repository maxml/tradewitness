/**
 * Unit tests for SERVICE 1: feature-flags MCP shared core.
 *
 * Target under test:
 *   packages/feature-flags-core/src/index.ts
 *   -> class DependencyGraph (.getFlag, .validateStateChange, .validateTrafficChange)
 *   -> FeatureFlagStateSchema (zod enum)
 *
 * These are the PURE, I/O-free validation surfaces that both the stdio MCP
 * (mcps/feature-flags/src/index.ts) and the HTTP wrapper (mcps/feature-flags/src/http.ts)
 * funnel through. Testing them gives strong, deterministic assertions with no
 * server, file system, or network involved. The HTTP/stdio glue is covered by a
 * documented integration stub in feature-flags-mcp.integration.test.ts.
 *
 * Framework: Vitest (TypeScript, ESM).
 *   Vitest MUST be installed to run this file:  pnpm add -D vitest
 *   Run with:  pnpm vitest run homework/M6/stage4-tests-agent/service-1-tests
 *
 * IMPORT PATH ASSUMPTION:
 *   The workspace package "@tradewitness/feature-flags-core" exports DependencyGraph
 *   and FeatureFlagStateSchema from its src/index.ts (see package.json "main").
 *   If the workspace alias is not resolvable from this homework folder, change the
 *   import below to the relative path:
 *     '../../../../packages/feature-flags-core/src/index'
 *
 * Edge cases covered (from feature-flags-mcp-spec.md §4 / §6):
 *   - Happy path enable with active parent          (spec §6.1, decision row 9 else-branch)
 *   - Dependency violation, parent Disabled          (spec §4 "Dependency violation", row 9)
 *   - Disable blocked by active child               (spec §4, §6.3, row 11)
 *   - Missing dependency -> "Dependency ... not found" (spec §4 "Missing dependency divergence", row 10)
 *   - Unknown feature                               (spec §6.10, row 8)
 *   - Traffic on Disabled flag blocked / 0 allowed   (spec §6.7, row 14)
 *   - Invalid state casing rejected by schema        (spec §6.5, row 6)
 *   - Dependency-graph cycle silent deadlock         (spec §4 "Dependency-graph cycles")
 */

import { describe, it, expect } from 'vitest';
import {
  DependencyGraph,
  FeatureFlagStateSchema,
  type FeatureFlag,
} from '@tradewitness/feature-flags-core';

/**
 * Builds a realistic TradeWitness flag graph modelled on data/feature-flags/features.json.
 * Callers can override individual flags' status for a given scenario.
 */
function buildFlags(overrides: Partial<Record<string, FeatureFlag['status']>> = {}): FeatureFlag[] {
  const base: FeatureFlag[] = [
    { name: 'auth_clerk_v1', status: 'Enabled', traffic_percentage: 100, depends_on: [], last_modified: '2026-05-10T00:00:00Z' },
    { name: 'supabase_runtime_v1', status: 'Enabled', traffic_percentage: 100, depends_on: [], last_modified: '2026-05-10T00:00:00Z' },
    { name: 'trade_journal_core_v1', status: 'Enabled', traffic_percentage: 100, depends_on: ['auth_clerk_v1', 'supabase_runtime_v1'], last_modified: '2026-05-10T00:00:00Z' },
    { name: 'mentor_public_profile_v1', status: 'Disabled', traffic_percentage: 0, depends_on: ['trade_journal_core_v1'], last_modified: '2026-05-10T00:00:00Z' },
    { name: 'ai_report_prompt_v1', status: 'Disabled', traffic_percentage: 0, depends_on: ['trade_journal_core_v1'], last_modified: '2026-05-10T00:00:00Z' },
    { name: 'ai_report_followup_v1', status: 'Disabled', traffic_percentage: 0, depends_on: ['ai_report_prompt_v1'], last_modified: '2026-05-10T00:00:00Z' },
    { name: 'stripe_billing_v1', status: 'Enabled', traffic_percentage: 100, depends_on: ['trade_journal_core_v1'], last_modified: '2026-05-10T00:00:00Z' },
    { name: 'tokens_purchase_v1', status: 'Testing', traffic_percentage: 25, depends_on: ['stripe_billing_v1'], last_modified: '2026-05-10T00:00:00Z' },
  ];
  return base.map(f => (overrides[f.name] ? { ...f, status: overrides[f.name]! } : f));
}

describe('DependencyGraph.validateStateChange — happy path', () => {
  it('allows enabling mentor_public_profile_v1 when its parent trade_journal_core_v1 is Enabled', () => {
    const graph = new DependencyGraph(buildFlags());
    const result = graph.validateStateChange('mentor_public_profile_v1', 'Enabled');
    expect(result.allowed).toBe(true);
  });
});

describe('DependencyGraph.validateStateChange — dependency edge cases', () => {
  it('blocks enabling ai_report_followup_v1 while parent ai_report_prompt_v1 is Disabled', () => {
    // spec §4 "Dependency violation", decision table row 9
    const graph = new DependencyGraph(buildFlags());
    const result = graph.validateStateChange('ai_report_followup_v1', 'Enabled');
    expect(result.allowed).toBe(false);
    if (result.allowed) throw new Error('expected blocked result');
    expect(result.reason).toBe(
      'Cannot set ai_report_followup_v1 to Enabled because dependency ai_report_prompt_v1 is Disabled.',
    );
  });

  it('allows moving ai_report_followup_v1 to Testing once its parent is promoted to Testing', () => {
    // spec §6.2 — parent in Testing (not Disabled) unblocks the child
    const graph = new DependencyGraph(buildFlags({ ai_report_prompt_v1: 'Testing' }));
    const result = graph.validateStateChange('ai_report_followup_v1', 'Testing');
    expect(result.allowed).toBe(true);
  });

  it('blocks disabling trade_journal_core_v1 while active child mentor_public_profile_v1 still depends on it', () => {
    // spec §4 / §6.3, decision table row 11 — names the FIRST active child
    const graph = new DependencyGraph(buildFlags({ mentor_public_profile_v1: 'Testing' }));
    const result = graph.validateStateChange('trade_journal_core_v1', 'Disabled');
    expect(result.allowed).toBe(false);
    if (result.allowed) throw new Error('expected blocked result');
    expect(result.reason).toBe(
      'Cannot disable trade_journal_core_v1 because child mentor_public_profile_v1 is currently Testing.',
    );
  });

  it('allows disabling stripe_billing_v1 once every dependent child is Disabled', () => {
    // spec §6.3 else-branch — no active children -> allowed
    const graph = new DependencyGraph(buildFlags({ tokens_purchase_v1: 'Disabled' }));
    const result = graph.validateStateChange('stripe_billing_v1', 'Disabled');
    expect(result.allowed).toBe(true);
  });
});

describe('DependencyGraph.validateStateChange — error paths', () => {
  it('rejects a state change for a flag that does not exist', () => {
    // spec §6.10, decision table row 8
    const graph = new DependencyGraph(buildFlags());
    const result = graph.validateStateChange('nonexistent_flag_v9', 'Enabled');
    expect(result.allowed).toBe(false);
    if (result.allowed) throw new Error('expected blocked result');
    expect(result.reason).toBe('Flag nonexistent_flag_v9 not found');
  });

  it('reports "Dependency ... not found" when a depends_on target is missing (core/route divergence vs stdio)', () => {
    // spec §4 "Missing dependency divergence", decision table row 10.
    // The core path returns a structured reason naming the MISSING DEPENDENCY,
    // not the flag itself (the stdio layer instead throws "Flag not found").
    const flags = buildFlags();
    flags.push({
      name: 'mentor_messaging_v1',
      status: 'Disabled',
      traffic_percentage: 0,
      // realtime_chat_v0 is absent and listed FIRST so the missing-dependency
      // branch is reached before any Disabled-parent branch.
      depends_on: ['realtime_chat_v0', 'trade_journal_core_v1'],
      last_modified: '2026-05-10T00:00:00Z',
    });
    const graph = new DependencyGraph(flags);
    const result = graph.validateStateChange('mentor_messaging_v1', 'Enabled');
    expect(result.allowed).toBe(false);
    if (result.allowed) throw new Error('expected blocked result');
    expect(result.reason).toBe('Dependency realtime_chat_v0 not found');
  });
});

describe('DependencyGraph.validateTrafficChange — traffic rules', () => {
  it('blocks setting traffic > 0 on a Disabled flag with a precise reason', () => {
    // spec §6.7, decision table row 14
    const graph = new DependencyGraph(buildFlags());
    const result = graph.validateTrafficChange('ai_report_followup_v1', 50);
    expect(result.allowed).toBe(false);
    if (result.allowed) throw new Error('expected blocked result');
    expect(result.reason).toBe('Cannot set traffic to 50 because ai_report_followup_v1 is Disabled.');
  });

  it('allows setting traffic to 0 on a Disabled flag (no rollout requested)', () => {
    // spec §6.7 — 0% is the only permissible traffic for a Disabled flag
    const graph = new DependencyGraph(buildFlags());
    const result = graph.validateTrafficChange('ai_report_followup_v1', 0);
    expect(result.allowed).toBe(true);
  });

  it('allows a mid-range rollout on an active (Testing) flag', () => {
    const graph = new DependencyGraph(buildFlags());
    const result = graph.validateTrafficChange('tokens_purchase_v1', 75);
    expect(result.allowed).toBe(true);
  });
});

describe('FeatureFlagStateSchema — state enum validation', () => {
  it('accepts the three canonical states and rejects lowercase "enabled" (case-sensitive)', () => {
    // spec §6.5, decision table row 6 — "enabled" !== "Enabled"
    expect(FeatureFlagStateSchema.safeParse('Enabled').success).toBe(true);
    expect(FeatureFlagStateSchema.safeParse('Testing').success).toBe(true);
    expect(FeatureFlagStateSchema.safeParse('Disabled').success).toBe(true);

    const bad = FeatureFlagStateSchema.safeParse('enabled');
    expect(bad.success).toBe(false);
  });
});

describe('DependencyGraph — cycle handling (characterization of silent deadlock)', () => {
  it('treats a depends_on cycle (A->B->A) as un-enableable: each parent looks Disabled', () => {
    // spec §4 "Dependency-graph cycles" — no cycle detection exists; this documents
    // the resulting deadlock rather than asserting a (nonexistent) cycle error.
    const cyclic: FeatureFlag[] = [
      { name: 'sync_engine_v1', status: 'Disabled', traffic_percentage: 0, depends_on: ['sync_worker_v1'], last_modified: '2026-05-10T00:00:00Z' },
      { name: 'sync_worker_v1', status: 'Disabled', traffic_percentage: 0, depends_on: ['sync_engine_v1'], last_modified: '2026-05-10T00:00:00Z' },
    ];
    const graph = new DependencyGraph(cyclic);

    const enableEngine = graph.validateStateChange('sync_engine_v1', 'Enabled');
    expect(enableEngine.allowed).toBe(false);
    if (enableEngine.allowed) throw new Error('expected blocked result');
    expect(enableEngine.reason).toBe(
      'Cannot set sync_engine_v1 to Enabled because dependency sync_worker_v1 is Disabled.',
    );

    const enableWorker = graph.validateStateChange('sync_worker_v1', 'Enabled');
    expect(enableWorker.allowed).toBe(false);
  });
});
