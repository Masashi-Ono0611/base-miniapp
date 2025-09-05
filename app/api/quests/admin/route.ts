import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
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

function isAuthorized(req: NextRequest): boolean {
  const mode = (process.env.ADMIN_AUTH_MODE || "cookie").toLowerCase();
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    const { valid } = verifyAdminToken(token);
    if (valid) return true;
  }
  // Cookie fallback (web app)
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bonsai";
  const pass = req.cookies.get("admin_pass")?.value;
  if (mode !== "token" && pass === ADMIN_PASSWORD) return true;
  return false;
}

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

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!redis) return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    const body = (await req.json().catch(() => null)) as Partial<AdminQuestTask> | null;
    const title = String(body?.title || "").trim();
    const link = String(body?.link || "").trim();
    const pointsNum = Number(body?.points);

    if (!title || !link || Number.isNaN(pointsNum)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const tasks = await loadTasks();
    // prefer provided id if present, otherwise auto-generate
    function slugify(s: string) {
      return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32);
    }
    function exists(id: string) {
      return tasks.some((t) => t.id === id);
    }
    const base = slugify(title) || "quest";
    let id = String((body?.id || "").toString().trim());
    if (!id) {
      // generate unique id: <slug>-<ts>-<rand>
      const ts = Date.now().toString(36);
      let candidate = `${base}-${ts}-${Math.random().toString(36).slice(2, 6)}`;
      // ensure uniqueness with a few attempts
      let tries = 0;
      while (exists(candidate) && tries < 5) {
        candidate = `${base}-${ts}-${Math.random().toString(36).slice(2, 6)}`;
        tries++;
      }
      // if still colliding, add counter suffix
      let counter = 1;
      while (exists(candidate)) {
        candidate = `${base}-${ts}-${counter++}`;
      }
      id = candidate;
    }

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
    if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
