import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function envName() {
  return process.env.NODE_ENV || "dev";
}
function keyForTasks() {
  return `bonsai:v1:${envName()}:quests:tasks`;
}

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
    }
    if (!redis)
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 });

    const tasks = [
      {
        id: "follow_x",
        title: "Follow X account",
        link: "https://x.com/",
        points: 100,
      },
      {
        id: "follow_telegram",
        title: "Follow Telegram account",
        link: "https://t.me/",
        points: 200,
      },
    ];

    await redis.set(keyForTasks(), JSON.stringify(tasks));
    return NextResponse.json({ ok: true, tasks });
  } catch (e) {
    console.error("POST /api/quests/seed error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
