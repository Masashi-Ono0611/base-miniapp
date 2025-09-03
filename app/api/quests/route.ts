import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// Keys
function envName() {
  return process.env.NODE_ENV || "dev";
}
function keyForTasks() {
  return `bonsai:v1:${envName()}:quests:tasks`;
}
function keyForCompleted(fid: string) {
  return `bonsai:v1:${envName()}:quests:done:${fid}`;
}

export type QuestTask = {
  id: string; // unique id, e.g. "follow_x"
  title: string; // label shown in UI
  link: string; // destination url
  points: number; // points to award on completion
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");
    if (!fid) return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    if (!redis)
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 });

    // Load tasks
    const raw = await redis.get(keyForTasks());
    let tasks: QuestTask[] = [];
    if (Array.isArray(raw)) {
      tasks = raw as QuestTask[];
    } else if (typeof raw === "string") {
      try {
        tasks = JSON.parse(raw) as QuestTask[];
      } catch {
        tasks = [];
      }
    } else if (raw && typeof raw === "object") {
      // Unexpected: try to coerce
      tasks = [];
    }

    // Load completed set for fid
    let completed: string[] = [];
    try {
      // Upstash supports smembers
      const res = await redis!.smembers(keyForCompleted(fid));
      completed = Array.isArray(res) ? (res as string[]) : [];
    } catch {
      completed = [];
    }

    const data = tasks.map((t) => ({ ...t, completed: completed.includes(t.id) }));
    return NextResponse.json({ tasks: data });
  } catch (e) {
    console.error("GET /api/quests error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
