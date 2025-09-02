import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function keyForPoints(fid: string) {
  const env = process.env.NODE_ENV || "dev"; // simple env separation
  return `bonsai:v1:${env}:points:${fid}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");
    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }
    if (!redis) {
      return NextResponse.json(
        { error: "Redis not configured" },
        { status: 500 },
      );
    }

    const val = await redis.get<number>(keyForPoints(fid));
    const points = typeof val === "number" ? val : Number(val ?? 0) || 0;
    return NextResponse.json({ points });
  } catch (e) {
    console.error("GET /api/points error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
