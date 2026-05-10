import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { DependencyGraph, FeatureFlag, FeatureFlagStateSchema } from "@tradewitness/feature-flags-core";

export const dynamic = 'force-dynamic';

function getFilePath() {
  const envPath = process.env.FEATURE_FLAGS_FILE || 'data/feature-flags/features.json';
  if (path.isAbsolute(envPath)) return envPath;
  return path.resolve(process.cwd(), '../../', envPath);
}

function checkAuth(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  const validKey = process.env.FEATURE_FLAGS_API_KEY;
  return apiKey && validKey && apiKey === validKey;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const fileContent = await fs.readFile(getFilePath(), "utf-8");
    return NextResponse.json(JSON.parse(fileContent));
  } catch (error) {
    console.error("Error reading feature flags", error);
    return NextResponse.json({ error: "Failed to read flags" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, status, traffic_percentage } = body;

    if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

    const fileContent = await fs.readFile(getFilePath(), "utf-8");
    const flags: FeatureFlag[] = JSON.parse(fileContent);

    const flagIndex = flags.findIndex(f => f.name === name);
    if (flagIndex === -1) return NextResponse.json({ error: "Flag not found" }, { status: 404 });

    const graph = new DependencyGraph(flags);

    if (status !== undefined) {
      const parsedStatus = FeatureFlagStateSchema.safeParse(status);
      if (!parsedStatus.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

      const result = graph.validateStateChange(name, parsedStatus.data);
      if (!result.allowed) return NextResponse.json({ error: result.reason }, { status: 400 });

      flags[flagIndex].status = parsedStatus.data;
    }

    if (traffic_percentage !== undefined) {
      if (typeof traffic_percentage !== 'number' || traffic_percentage < 0 || traffic_percentage > 100) {
        return NextResponse.json({ error: "Invalid traffic_percentage" }, { status: 400 });
      }

      const result = graph.validateTrafficChange(name, traffic_percentage);
      if (!result.allowed) return NextResponse.json({ error: result.reason }, { status: 400 });

      flags[flagIndex].traffic_percentage = traffic_percentage;
    }

    flags[flagIndex].last_modified = new Date().toISOString();

    await fs.writeFile(getFilePath(), JSON.stringify(flags, null, 2), "utf-8");

    return NextResponse.json(flags[flagIndex]);
  } catch (error) {
    console.error("Error updating feature flags", error);
    return NextResponse.json({ error: "Failed to update flags" }, { status: 500 });
  }
}
