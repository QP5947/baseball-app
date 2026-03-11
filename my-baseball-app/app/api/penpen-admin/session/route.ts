import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PENPEN_ADMIN_COOKIE = "penpen_admin_session";

const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/penpen_league/admin",
  maxAge,
});

export async function POST(request: NextRequest) {
  let body: { adminId?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "不正なリクエストです。" },
      { status: 400 },
    );
  }

  const adminId = typeof body.adminId === "string" ? body.adminId.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (adminId !== "admin") {
    return NextResponse.json(
      { message: "IDが正しくありません。" },
      { status: 401 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("penpen")
    .from("settings")
    .select("admin_password_hash")
    .eq("id", true)
    .single();

  if (error) {
    return NextResponse.json(
      { message: `ログイン確認に失敗しました: ${error.message}` },
      { status: 500 },
    );
  }

  const savedPassword = data.admin_password_hash ?? "";
  if (savedPassword && password !== savedPassword) {
    return NextResponse.json(
      { message: "パスワードが正しくありません。" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    PENPEN_ADMIN_COOKIE,
    "1",
    getCookieOptions(60 * 60 * 12),
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PENPEN_ADMIN_COOKIE, "", getCookieOptions(0));
  return response;
}
