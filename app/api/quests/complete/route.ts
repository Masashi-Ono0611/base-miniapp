import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import type { QuestTask } from "../route";

function envName() {
  return process.env.NODE_ENV || "dev";
}
function keyForTasks() {
  return `bonsai:v1:${envName()}:quests:tasks`;
}
function keyForCompleted(fid: string) {
  return `bonsai:v1:${envName()}:quests:done:${fid}`;
}
function keyForPoints(fid: string) {
  return `bonsai:v1:${envName()}:points:${fid}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!redis)
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 });

    const body = (await req.json().catch(() => null)) as
      | { fid?: string; taskId?: string }
      | null;
    const fid = body?.fid;
    const taskId = body?.taskId;
    if (!fid || !taskId)
      return NextResponse.json({ error: "Missing fid or taskId" }, { status: 400 });

    // Load tasks (robust parse)
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
    }
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return NextResponse.json({ error: "Unknown task" }, { status: 400 });

    // Mark completion (idempotent)
    const added = await redis!.sadd(keyForCompleted(fid), taskId);

    let points: number;
    if (added === 1) {
      // first-time completion: award points
      try {
        points = await redis!.incrby(keyForPoints(fid), task.points);
      } catch {
        // Fallback: emulate incrby with get + set
        const current = await redis.get<number>(keyForPoints(fid));
        const prev = typeof current === "number" ? current : Number(current ?? 0) || 0;
        const next = prev + (Number(task.points) || 0);
        await redis.set(keyForPoints(fid), next);
        points = next;
      }
    } else {
      const current = await redis.get<number>(keyForPoints(fid));
      points = typeof current === "number" ? current : Number(current ?? 0) || 0;
    }

    return NextResponse.json({ ok: true, alreadyCompleted: added !== 1, points });
  } catch (e) {
    console.error("POST /api/quests/complete error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
