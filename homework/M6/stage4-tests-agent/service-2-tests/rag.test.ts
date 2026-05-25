/**
 * Characterization tests for the RAG module (SERVICE 2).
 *
 * Source under test:
 *   - mcps/rag/ingest.ts   (ingest pipeline: chunking, frontmatter, payload shaping, Qdrant upsert)
 *   - mcps/rag/query.ts     (semantic search CLI)
 *   - mcps/rag/package.json (deps: @qdrant/js-client-rest, langchain, gray-matter, uuid)
 * Reference spec: homework/M6/stage3-living-docs/specs/rag-spec.md (Edge Cases drive these tests).
 *
 * RUN REQUIREMENTS:
 *   - Needs Vitest installed (`vitest`), plus the runtime deps `langchain`, `gray-matter`,
 *     `uuid`, and `@qdrant/js-client-rest` resolvable from this workspace.
 *   - These tests do NO network I/O. The Qdrant client is a `vi.fn()` stub; the embedder is
 *     a deterministic fake. We assert CALL SHAPE, not live responses.
 *
 * IMPORT ASSUMPTIONS / TESTABILITY NOTE:
 *   ingest.ts and query.ts execute `main()` at module load and do real I/O, and they export
 *   NOTHING. Their internal helpers are private:
 *     - `extractHeadings(content)`        -> string[]
 *     - `processDocument(filePath, splitter)` -> chunks with .pageContent + .metadata
 *     - `getEmbedding(text)`              -> number[]
 *     - the `VECTOR_SIZE` provider rule, the splitter config (1800/200), the batch loop, etc.
 *   Because none of these are exported, this file reconstructs the EXACT same logic/config from
 *   the source and tests that behavior against the same third-party libs the source uses
 *   (langchain splitter, gray-matter, uuid). Where a unit is reconstructed, it is marked with
 *
 *     // TODO[exportForTestability]: ...
 *
 *   so a maintainer can later `export` the real helper and swap the reconstruction for a direct
 *   import with zero test-logic changes.
 */

import { describe, it, expect, vi } from 'vitest';
import matter from 'gray-matter';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from 'uuid';

// ---------------------------------------------------------------------------
// Reconstructions of the NON-EXPORTED source units (mirrors mcps/rag/ingest.ts).
// Keep these byte-for-byte faithful to the source so the tests pin real behavior.
// ---------------------------------------------------------------------------

// TODO[exportForTestability]: export `VECTOR_SIZE` resolution from ingest.ts.
// Source: const VECTOR_SIZE = EMBEDDING_PROVIDER === 'openai' ? 1536 : 1024;
function resolveVectorSize(provider: string | undefined): number {
  return provider === 'openai' ? 1536 : 1024;
}

// TODO[exportForTestability]: export `extractHeadings` from ingest.ts.
// Source: line.match(/^(#{1,6})\s+(.*)/) -> push match[2].trim()
function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.*)/);
    if (match) {
      headings.push(match[2].trim());
    }
  }
  return headings;
}

// TODO[exportForTestability]: export the splitter factory from ingest.ts.
// Source: new RecursiveCharacterTextSplitter({ chunkSize: 1800, chunkOverlap: 200,
//          separators: ["\n## ", "\n### ", "\n#### ", "\n", " ", ""] })
function makeSplitter(): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize: 1800,
    chunkOverlap: 200,
    separators: ['\n## ', '\n### ', '\n#### ', '\n', ' ', ''],
  });
}

// TODO[exportForTestability]: export `processDocument` from ingest.ts.
// Mirrors the metadata-shaping done in source processDocument().
async function processDocument(
  rawContent: string,
  relativePath: string,
  splitter: RecursiveCharacterTextSplitter,
) {
  const { data, content } = matter(rawContent);
  const headings = extractHeadings(content);
  return splitter.createDocuments(
    [content],
    [
      {
        source_file: relativePath,
        type: data.type || 'document',
        tags: data.tags || [],
        last_modified: data.last_modified || '2026-05-25T00:00:00.000Z',
        parent_headings: headings,
        summary: content.substring(0, 100).replace(/\n/g, ' ') + '...',
        keywords: data.tags || [],
      },
    ],
  );
}

// Mirrors the per-chunk point/record shaping in ingest.ts main().
function buildPoint(chunk: { pageContent: string; metadata: Record<string, unknown> }, vector: number[]) {
  const id = uuidv4();
  return {
    id,
    vector,
    payload: {
      ...chunk.metadata,
      content: chunk.pageContent,
    },
  };
}

// Mirrors the batch-upsert loop in ingest.ts main() (batchSize = 100).
async function upsertInBatches(
  client: { upsert: (collection: string, body: { points: unknown[] }) => Promise<unknown> },
  collection: string,
  points: unknown[],
  batchSize = 100,
) {
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    await client.upsert(collection, { points: batch });
  }
}

// Mirrors ingest.ts main() collection lifecycle + upsert orchestration (the testable
// control flow, with the embedder + client injected so no network is touched).
async function runIngest(opts: {
  client: {
    deleteCollection: (c: string) => Promise<unknown>;
    createCollection: (c: string, cfg: unknown) => Promise<unknown>;
    upsert: (c: string, body: { points: unknown[] }) => Promise<unknown>;
  };
  collection: string;
  vectorSize: number;
  embed: (text: string) => Promise<number[]>;
  chunks: { pageContent: string; metadata: Record<string, unknown> }[];
  batchSize?: number;
}) {
  const { client, collection, vectorSize, embed, chunks, batchSize = 100 } = opts;

  // Source swallows delete errors (collection-might-not-exist).
  try {
    await client.deleteCollection(collection);
  } catch {
    /* source logs "might not exist" and proceeds — intentional in the SUT */
  }

  await client.createCollection(collection, {
    vectors: { size: vectorSize, distance: 'Cosine' },
  });

  const points: unknown[] = [];
  for (const chunk of chunks) {
    const vector = await embed(chunk.pageContent);
    points.push(buildPoint(chunk, vector));
  }

  await upsertInBatches(client, collection, points, batchSize);
  return points;
}

// Deterministic fake embedder — returns a zero vector of the requested dimension.
// (Real source calls bge-m3 / OpenAI; we never want network or model load in tests.)
function fakeEmbedder(dim: number) {
  return vi.fn(async (_text: string) => new Array(dim).fill(0));
}

// ---------------------------------------------------------------------------
// Realistic corpus fixtures (real-looking ADR / incident markdown, not "foo").
// ---------------------------------------------------------------------------

const ADR_DOC = `---
type: adr
tags: [database, postgres, architecture]
last_modified: 2026-04-02T10:15:00.000Z
---
# ADR-014: Adopt PostgreSQL as the primary datastore

## Context
TradeWitness needs durable relational storage for trades, screenshots metadata,
and billing state. We evaluated PostgreSQL, MySQL, and DynamoDB.

## Decision
We will use PostgreSQL 16 with Drizzle ORM. Application-layer authorization is the
only boundary; row-level security is intentionally OFF.

### Consequences
Migrations are generated via drizzle-kit. Operators must run generate after every
schema change.
`;

const INCIDENT_DOC = `---
type: incident
tags: [screenshot-upload, s3, outage]
---
# INC-2026-031: Screenshot upload failures

## Summary
Between 14:02 and 14:48 UTC, screenshot uploads returned HTTP 500 because the S3
presign worker exhausted its connection pool.

## Resolution
We raised the pool size and added a circuit breaker. No data was lost.
`;

const NO_FRONTMATTER_DOC = `# Plain runbook

## Restart procedure
Run the deploy script and watch the health endpoint until it returns 200.
`;

const MALFORMED_FRONTMATTER_DOC = `---
type: incident
tags: [unbalanced, brackets
last_modified: : : not valid yaml
---
# Broken doc
This document has invalid YAML frontmatter and must abort parsing.
`;

// ===========================================================================
// 1. HAPPY PATH — chunk -> expected payload shape
// ===========================================================================
describe('ingest: chunk -> point shaping (happy path)', () => {
  it('shapes a frontmattered ADR into a Qdrant point with full payload and a v4 id', async () => {
    const splitter = makeSplitter();
    const chunks = await processDocument(ADR_DOC, 'docs/m3-corpus/adr-014.md', splitter);

    // Small doc -> single chunk.
    expect(chunks).toHaveLength(1);

    const vector = new Array(1024).fill(0.0);
    const point = buildPoint(chunks[0] as any, vector);

    // id is a real UUID v4 (deterministic *format*, not value).
    expect(uuidValidate(point.id)).toBe(true);
    expect(uuidVersion(point.id)).toBe(4);

    // Vector length matches the bge-m3 dimension.
    expect(point.vector).toHaveLength(1024);

    // Payload is metadata + content, with frontmatter-derived fields.
    expect(point.payload.source_file).toBe('docs/m3-corpus/adr-014.md');
    expect(point.payload.type).toBe('adr');
    expect(point.payload.keywords).toEqual(['database', 'postgres', 'architecture']);
    expect(point.payload.tags).toEqual(['database', 'postgres', 'architecture']);
    expect(point.payload.parent_headings).toEqual([
      'ADR-014: Adopt PostgreSQL as the primary datastore',
      'Context',
      'Decision',
      'Consequences',
    ]);
    // content === the splitter's pageContent (frontmatter stripped).
    expect(point.payload.content).toBe((chunks[0] as any).pageContent);
    expect(point.payload.content).toContain('PostgreSQL 16 with Drizzle ORM');
    expect(point.payload.content).not.toContain('type: adr'); // frontmatter removed
  });

  it('derives summary as first 100 chars + "..." with newlines flattened to spaces', async () => {
    const splitter = makeSplitter();
    const chunks = await processDocument(INCIDENT_DOC, 'docs/m3-corpus/inc-031.md', splitter);
    const summary = (chunks[0] as any).metadata.summary as string;

    // body (frontmatter stripped) first 100 chars + literal "..."
    const { content } = matter(INCIDENT_DOC);
    const expected = content.substring(0, 100).replace(/\n/g, ' ') + '...';
    expect(summary).toBe(expected);
    expect(summary.endsWith('...')).toBe(true);
    expect(summary.slice(0, 100)).not.toContain('\n');
    // 100 source chars + "..." === 103 length when body >= 100 chars.
    expect(summary).toHaveLength(103);
  });
});

// ===========================================================================
// 2. FRONTMATTER / DEFAULTS edge cases (spec Edge Cases: malformed + missing frontmatter)
// ===========================================================================
describe('ingest: frontmatter parsing edge cases', () => {
  it('defaults type to "document" and keywords to [] when frontmatter is absent', async () => {
    const splitter = makeSplitter();
    const chunks = await processDocument(NO_FRONTMATTER_DOC, 'docs/m3-corpus/runbook.md', splitter);
    const meta = (chunks[0] as any).metadata;

    expect(meta.type).toBe('document');
    expect(meta.keywords).toEqual([]);
    expect(meta.tags).toEqual([]);
  });

  it('THROWS on malformed YAML frontmatter (no per-file recovery — aborts the run)', () => {
    // Spec Edge Case: gray-matter throws on invalid YAML, aborting the entire run.
    expect(() => matter(MALFORMED_FRONTMATTER_DOC)).toThrow();
  });
});

// ===========================================================================
// 3. VECTOR DIMENSION rules (spec: provider->size, dimension mismatch 1024 vs 1536)
// ===========================================================================
describe('ingest: vector-size resolution by provider', () => {
  it('resolves 1536 for openai and 1024 for bge-m3 / unset / typo (silent fallthrough)', () => {
    expect(resolveVectorSize('openai')).toBe(1536);
    expect(resolveVectorSize('bge-m3')).toBe(1024);
    expect(resolveVectorSize(undefined)).toBe(1024);
    // Spec Edge Case "Provider typo fallthrough": 'openi' silently selects 1024.
    expect(resolveVectorSize('openi')).toBe(1024);
  });

  it('creates the collection with the provider-matched size and Cosine distance', async () => {
    const client = {
      deleteCollection: vi.fn(async () => ({})),
      createCollection: vi.fn(async () => ({})),
      upsert: vi.fn(async () => ({})),
    };
    const splitter = makeSplitter();
    const chunks = await processDocument(ADR_DOC, 'docs/m3-corpus/adr-014.md', splitter);

    await runIngest({
      client,
      collection: 'tradewitness_m3_docs',
      vectorSize: resolveVectorSize('openai'),
      embed: fakeEmbedder(1536),
      chunks: chunks as any,
    });

    // Lifecycle order: deleteCollection BEFORE createCollection.
    expect(client.deleteCollection).toHaveBeenCalledTimes(1);
    expect(client.createCollection).toHaveBeenCalledWith(
      'tradewitness_m3_docs',
      { vectors: { size: 1536, distance: 'Cosine' } },
    );
    const deleteOrder = client.deleteCollection.mock.invocationCallOrder[0];
    const createOrder = client.createCollection.mock.invocationCallOrder[0];
    expect(deleteOrder).toBeLessThan(createOrder);
  });

  it('rejects a query whose embedding dimension mismatches the collection (1536 vs 1024)', async () => {
    // Spec Edge Case "Embedding dimension mismatch": Qdrant rejects the mismatched vector.
    const search = vi.fn(async (_c: string, body: { vector: number[] }) => {
      if (body.vector.length !== 1024) {
        throw new Error(
          `Wrong input: Vector dimension error: expected dim: 1024, got ${body.vector.length}`,
        );
      }
      return [];
    });
    const client = { search };

    // Collection built for bge-m3 (1024), query embedded with openai (1536) -> mismatch.
    const mismatchedQueryVector = new Array(1536).fill(0);
    await expect(
      client.search('tradewitness_m3_docs', { vector: mismatchedQueryVector, limit: 3, with_payload: true }),
    ).rejects.toThrow(/dimension error: expected dim: 1024, got 1536/);
  });
});

// ===========================================================================
// 4. CHUNKING / heading extraction (spec: oversized chunk, headings false positive)
// ===========================================================================
describe('ingest: chunking + heading extraction', () => {
  it('splits a long heading-free body into multiple overlapping chunks (target 1800)', async () => {
    // 5000 chars of contiguous text, no markdown separators.
    const body = 'TradeWitness reconciles broker statements against on-chain settlement records. '
      .repeat(70); // ~5460 chars
    expect(body.length).toBeGreaterThan(5000);

    const splitter = makeSplitter();
    const docs = await splitter.createDocuments([body]);

    // More than one chunk for a 5000+ char body at chunkSize 1800.
    expect(docs.length).toBeGreaterThan(1);
    // No emitted chunk should wildly exceed the target+overlap budget.
    for (const d of docs) {
      expect(d.pageContent.length).toBeLessThanOrEqual(1800 + 200);
    }
    // Reassembled (de-overlapped) content still covers the original signal.
    expect(docs.map((d) => d.pageContent).join(' ')).toContain('broker statements');
  });

  it('hard-splits an oversized single token block (the final "" separator allows mid-token cuts)', async () => {
    // Spec Edge Case "Oversized single chunk" — REFINED against the real splitter config:
    // because `separators` ends in "", RecursiveCharacterTextSplitter CAN cut inside a long
    // separator-free token, so a 2500-char block becomes >1 chunk, each within the 1800 target
    // (NOT one oversized chunk as the spec draft assumed).
    const giantToken = 'X'.repeat(2500);
    const splitter = makeSplitter();
    const docs = await splitter.createDocuments([giantToken]);

    expect(docs.length).toBeGreaterThan(1);
    for (const d of docs) {
      expect(d.pageContent.length).toBeLessThanOrEqual(1800); // target IS enforced via ""
      expect(/^X+$/.test(d.pageContent)).toBe(true); // content preserved, only X's
    }
  });

  it('extracts every markdown heading, INCLUDING false positives inside code fences', () => {
    // Spec Edge Case "Headings false positives": regex matches "#" lines anywhere.
    const content = [
      '# Deployment Guide',
      'Intro text.',
      '## Steps',
      '```bash',
      '# notaheading inside a fenced code block',
      'kubectl apply -f deploy.yaml',
      '```',
      '### Rollback',
    ].join('\n');

    const headings = extractHeadings(content);
    // The fenced "# notaheading..." is (buggily) captured — this locks current behavior.
    expect(headings).toEqual([
      'Deployment Guide',
      'Steps',
      'notaheading inside a fenced code block',
      'Rollback',
    ]);
  });
});

// ===========================================================================
// 5. EMPTY CORPUS (spec Edge Case: silent no-op index)
// ===========================================================================
describe('ingest: empty corpus', () => {
  it('creates the collection but NEVER upserts when there are zero chunks', async () => {
    const client = {
      deleteCollection: vi.fn(async () => ({})),
      createCollection: vi.fn(async () => ({})),
      upsert: vi.fn(async () => ({})),
    };
    const embed = fakeEmbedder(1024);

    const points = await runIngest({
      client,
      collection: 'tradewitness_m3_docs',
      vectorSize: 1024,
      embed,
      chunks: [], // glob('**/*.md') returned []
    });

    expect(client.createCollection).toHaveBeenCalledTimes(1);
    expect(client.upsert).not.toHaveBeenCalled();
    expect(embed).not.toHaveBeenCalled();
    expect(points).toEqual([]);
  });
});

// ===========================================================================
// 6. BATCHING (spec Suggested Test #9: 250 points -> [100,100,50])
// ===========================================================================
describe('ingest: batch upsert', () => {
  it('upserts in slices of 100, splitting 250 points into batches of [100,100,50]', async () => {
    const upsert = vi.fn(async () => ({}));
    const client = { upsert };
    const points = Array.from({ length: 250 }, (_, i) => ({ id: `pt-${i}`, vector: [0], payload: {} }));

    await upsertInBatches(client, 'tradewitness_m3_docs', points, 100);

    expect(upsert).toHaveBeenCalledTimes(3);
    const batchLengths = upsert.mock.calls.map((c) => (c[1] as { points: unknown[] }).points.length);
    expect(batchLengths).toEqual([100, 100, 50]);
    // First call shapes the body as { points: [...] } against the named collection.
    expect(upsert).toHaveBeenNthCalledWith(
      1,
      'tradewitness_m3_docs',
      expect.objectContaining({ points: expect.any(Array) }),
    );
  });
});

// ===========================================================================
// 7. ERROR PATHS — Qdrant unavailable (mocked rejection), spec Edge Cases
// ===========================================================================
describe('ingest/query: Qdrant unavailable (mocked rejections)', () => {
  it('propagates a rejection if a mid-run batch upsert fails (partial-index hazard)', async () => {
    // Spec Edge Case "Partial batch upsert failure": batch N rejects, leaving 1..N-1 committed.
    const upsert = vi
      .fn()
      .mockResolvedValueOnce({}) // batch 1 commits
      .mockRejectedValueOnce(new Error('ECONNREFUSED: connect 127.0.0.1:6333')); // batch 2 fails
    const client = { upsert };
    const points = Array.from({ length: 150 }, (_, i) => ({ id: `pt-${i}` }));

    await expect(
      upsertInBatches(client, 'tradewitness_m3_docs', points, 100),
    ).rejects.toThrow(/ECONNREFUSED/);

    // The first batch WAS committed before the failure — documents the partial index.
    expect(upsert).toHaveBeenCalledTimes(2);
    expect((upsert.mock.calls[0][1] as { points: unknown[] }).points).toHaveLength(100);
  });

  it('rejects from search() when Qdrant connection is refused (query path)', async () => {
    // Spec error path: query.ts search() awaits client.search which rejects on outage.
    const client = {
      search: vi.fn(async () => {
        throw new Error('Qdrant unreachable: connect ECONNREFUSED http://localhost:6333');
      }),
    };
    const embed = fakeEmbedder(1024);

    async function search(query: string, limit = 3) {
      const vector = await embed(query);
      return client.search('tradewitness_m3_docs', { vector, limit, with_payload: true });
    }

    await expect(
      search('Which TradeWitness features depend on stripe_billing_v1?', 3),
    ).rejects.toThrow(/ECONNREFUSED/);
    expect(client.search).toHaveBeenCalledTimes(1);
    expect(embed).toHaveBeenCalledWith('Which TradeWitness features depend on stripe_billing_v1?');
  });

  it('returns an empty array (no throw) when the collection has no matches', async () => {
    // Spec Edge Case "Empty result set": search returns [] and prints nothing — not an error.
    const client = { search: vi.fn(async () => [] as unknown[]) };
    const embed = fakeEmbedder(1024);

    const results = await (async () => {
      const vector = await embed('an obscure query with no neighbors');
      return client.search('tradewitness_m3_docs', { vector, limit: 3, with_payload: true });
    })();

    expect(results).toEqual([]);
    expect(client.search).toHaveBeenCalledWith(
      'tradewitness_m3_docs',
      expect.objectContaining({ with_payload: true, limit: 3 }),
    );
  });
});
