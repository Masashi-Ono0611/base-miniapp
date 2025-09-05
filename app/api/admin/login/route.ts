import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = "bonsai";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { password?: string } | null;
    const password = (body?.password || "").trim();

    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    // Set httpOnly cookie to allow middleware to validate
    res.cookies.set("admin_pass", ADMIN_PASSWORD, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (e) {
    console.error("POST /api/admin/login error", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
