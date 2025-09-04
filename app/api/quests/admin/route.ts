import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function envName() {
  return process.env.NODE_ENV || "dev";
}
function keyForTasks() {
  return `bonsai:v1:${envName()}:quests:tasks`;
}

export type AdminQuestTask = {
  id: string;
  title: string;
  link: string;
  points: number;
};

async function loadTasks(): Promise<AdminQuestTask[]> {
  if (!redis) return [];
  const raw = await redis.get(keyForTasks());
  let tasks: AdminQuestTask[] = [];
  if (Array.isArray(raw)) {
    tasks = raw as AdminQuestTask[];
  } else if (typeof raw === "string") {
    try {
      tasks = JSON.parse(raw) as AdminQuestTask[];
    } catch {
      tasks = [];
    }
  }
  return tasks.filter(
    (t) => t && typeof t.id === "string" && typeof t.title === "string" && typeof t.link === "string" && typeof t.points !== "undefined",
  );
}

async function saveTasks(tasks: AdminQuestTask[]) {
  if (!redis) throw new Error("Redis not configured");
  await redis.set(keyForTasks(), JSON.stringify(tasks));
}

export async function GET() {
  try {
    if (!redis) return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    const tasks = await loadTasks();
    return NextResponse.json({ tasks });
  } catch (e) {
    console.error("GET /api/quests/admin error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!redis) return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    const body = (await req.json().catch(() => null)) as Partial<AdminQuestTask> | null;
    const id = String(body?.id || "").trim();
    const title = String(body?.title || "").trim();
    const link = String(body?.link || "").trim();
    const pointsNum = Number(body?.points);

    if (!id || !title || !link || Number.isNaN(pointsNum)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const tasks = await loadTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    const nextTask: AdminQuestTask = { id, title, link, points: pointsNum };

    if (idx >= 0) tasks[idx] = nextTask;
    else tasks.push(nextTask);

    await saveTasks(tasks);
    return NextResponse.json({ ok: true, task: nextTask, tasks });
  } catch (e) {
    console.error("POST /api/quests/admin error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!redis) return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const tasks = await loadTasks();
    const next = tasks.filter((t) => t.id !== id);
    await saveTasks(next);
    return NextResponse.json({ ok: true, tasks: next });
  } catch (e) {
    console.error("DELETE /api/quests/admin error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
