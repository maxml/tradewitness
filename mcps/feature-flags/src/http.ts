#!/usr/bin/env node
import http from "node:http";
import { DependencyGraph, FeatureFlag, FeatureFlagStateSchema } from "@tradewitness/feature-flags-core";

const PORT = Number(process.env.M3_HTTP_PORT ?? 7733);
const HOST = process.env.M3_HTTP_HOST ?? "0.0.0.0";
const API_URL = process.env.APP_INTERNAL_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3001";
const DEV_API_KEY = "local-m3-change-me";
const BEARER = process.env.M3_MCP_API_KEY ?? DEV_API_KEY;
const APP_API_KEY = process.env.FEATURE_FLAGS_API_KEY ?? DEV_API_KEY;

type Json = Record<string, unknown> | unknown[];

function sendJson(res: http.ServerResponse, status: number, body: Json) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function sendError(res: http.ServerResponse, status: number, code: string, message: string) {
  sendJson(res, status, { error: code, message });
}

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return undefined;
  const raw = Buffer.concat(chunks).toString("utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "invalid_json", "request body is not valid JSON");
  }
}

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

function requireBearer(req: http.IncomingMessage) {
  const header = req.headers["authorization"];
  if (typeof header !== "string" || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "unauthorized", "missing Authorization: Bearer header");
  }
  const token = header.slice("Bearer ".length).trim();
  if (token !== BEARER) {
    throw new HttpError(401, "unauthorized", "invalid bearer token");
  }
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new HttpError(
      502,
      "upstream_unreachable",
      `cannot reach app API at ${API_URL} — is apps/app running on the expected port? (${message})`,
    );
  }
}

async function fetchFlags(): Promise<FeatureFlag[]> {
  const res = await safeFetch(`${API_URL}/api/feature-flags`, {
    headers: { "x-api-key": APP_API_KEY },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new HttpError(502, "upstream_error", `app API returned ${res.status}: ${body}`);
  }
  return (await res.json()) as FeatureFlag[];
}

async function patchFlag(
  name: string,
  update: { status?: FeatureFlag["status"]; traffic_percentage?: number },
): Promise<FeatureFlag> {
  const res = await safeFetch(`${API_URL}/api/feature-flags`, {
    method: "PATCH",
    headers: {
      "x-api-key": APP_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, ...update }),
  });
  const text = await res.text();
  if (!res.ok) {
    // The Next API returns { error: "..." } with a meaningful message; surface it as 400/409.
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed?.error ?? text;
    } catch {
      // keep raw text
    }
    const status = res.status === 404 ? 404 : res.status === 400 ? 400 : 502;
    throw new HttpError(status, "upstream_error", detail);
  }
  return JSON.parse(text) as FeatureFlag;
}

function getString(body: unknown, key: string): string {
  if (!body || typeof body !== "object") {
    throw new HttpError(400, "invalid_body", "request body must be a JSON object");
  }
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, "invalid_field", `field '${key}' must be a non-empty string`);
  }
  return value;
}

function getTrafficPercentage(body: unknown): number {
  if (!body || typeof body !== "object") {
    throw new HttpError(400, "invalid_body", "request body must be a JSON object");
  }
  const value = (body as Record<string, unknown>).traffic_percentage;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) {
    throw new HttpError(400, "invalid_traffic_percentage", "traffic_percentage must be an integer between 0 and 100");
  }
  return value;
}

async function handleGetFeatureInfo(body: unknown): Promise<FeatureFlag> {
  const featureId = getString(body, "feature_id");
  const flags = await fetchFlags();
  const flag = flags.find((f) => f.name === featureId);
  if (!flag) {
    throw new HttpError(404, "feature_not_found", `unknown feature_id: ${featureId}`);
  }
  return flag;
}

async function handleSetFeatureState(body: unknown): Promise<FeatureFlag> {
  const featureId = getString(body, "feature_id");
  const stateRaw = getString(body, "state");
  const parsed = FeatureFlagStateSchema.safeParse(stateRaw);
  if (!parsed.success) {
    throw new HttpError(400, "invalid_state", "state must be one of: Enabled, Disabled, Testing");
  }
  const flags = await fetchFlags();
  const graph = new DependencyGraph(flags);
  if (!graph.getFlag(featureId)) {
    throw new HttpError(404, "feature_not_found", `unknown feature_id: ${featureId}`);
  }
  const validation = graph.validateStateChange(featureId, parsed.data);
  if (!validation.allowed) {
    throw new HttpError(409, "dependency_violation", validation.reason);
  }
  return patchFlag(featureId, { status: parsed.data });
}

async function handleAdjustTrafficRollout(body: unknown): Promise<FeatureFlag> {
  const featureId = getString(body, "feature_id");
  const traffic = getTrafficPercentage(body);
  const flags = await fetchFlags();
  const graph = new DependencyGraph(flags);
  if (!graph.getFlag(featureId)) {
    throw new HttpError(404, "feature_not_found", `unknown feature_id: ${featureId}`);
  }
  const validation = graph.validateTrafficChange(featureId, traffic);
  if (!validation.allowed) {
    throw new HttpError(409, "dependency_violation", validation.reason);
  }
  return patchFlag(featureId, { traffic_percentage: traffic });
}

const server = http.createServer(async (req, res) => {
  try {
    // Health is public so n8n / curl can probe without bearer.
    if (req.method === "GET" && req.url === "/health") {
      return sendJson(res, 200, { ok: true });
    }

    // Everything else needs auth.
    requireBearer(req);

    if (req.method !== "POST") {
      throw new HttpError(405, "method_not_allowed", `${req.method ?? "?"} is not allowed`);
    }

    const body = await readJsonBody(req);

    switch (req.url) {
      case "/tools/get_feature_info":
        return sendJson(res, 200, (await handleGetFeatureInfo(body)) as unknown as Json);
      case "/tools/set_feature_state":
        return sendJson(res, 200, (await handleSetFeatureState(body)) as unknown as Json);
      case "/tools/adjust_traffic_rollout":
        return sendJson(res, 200, (await handleAdjustTrafficRollout(body)) as unknown as Json);
      default:
        throw new HttpError(404, "not_found", `no route for ${req.method} ${req.url}`);
    }
  } catch (err) {
    if (err instanceof HttpError) {
      return sendError(res, err.status, err.code, err.message);
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[m3-http] unexpected error:", err);
    sendError(res, 500, "internal_error", message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`M3 HTTP wrapper listening on http://${HOST}:${PORT} → ${API_URL}/api/feature-flags`);
});
