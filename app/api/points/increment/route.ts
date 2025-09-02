import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function keyForPoints(fid: string) {
  const env = process.env.NODE_ENV || "dev"; // simple env separation
  return `bonsai:v1:${env}:points:${fid}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!redis) {
      return NextResponse.json(
        { error: "Redis not configured" },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => null) as { fid?: string } | null;
    const fid = body?.fid;
    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    const points = await redis.incr(keyForPoints(fid));
    return NextResponse.json({ points });
  } catch (e) {
    console.error("POST /api/points/increment error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
