import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getPenpenAdminCookieOptions,
  hashPenpenPassword,
  isPenpenPasswordHash,
  PENPEN_ADMIN_COOKIE,
  verifyPenpenPassword,
} from "../_shared";

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

  const supabase = createServiceClient();
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
  const isValidPassword = await verifyPenpenPassword(password, savedPassword);

  if (!isValidPassword) {
    return NextResponse.json(
      { message: "パスワードが正しくありません。" },
      { status: 401 },
    );
  }

  if (savedPassword && !isPenpenPasswordHash(savedPassword)) {
    try {
      const hashedPassword = await hashPenpenPassword(password);
      await supabase
        .schema("penpen")
        .from("settings")
        .update({ admin_password_hash: hashedPassword })
        .eq("id", true);
    } catch (upgradeError) {
      console.error(
        "[penpen-admin] failed to upgrade password hash",
        upgradeError,
      );
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    PENPEN_ADMIN_COOKIE,
    "1",
    getPenpenAdminCookieOptions(60 * 60 * 12),
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PENPEN_ADMIN_COOKIE, "", getPenpenAdminCookieOptions(0));
  return response;
}
