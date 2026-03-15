export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  hashPenpenPassword,
  verifyPenpenPassword,
} from "@/api/penpen-admin/_shared";
import { getErrorMessage, requirePenpenAdminSession } from "../_shared";

export async function POST(request: NextRequest) {
  const unauthorized = requirePenpenAdminSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "不正なリクエストです。" },
      { status: 400 },
    );
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword.trim() : "";

  if (!newPassword) {
    return NextResponse.json(
      { message: "新しいパスワードを入力してください。" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .schema("penpen")
      .from("settings")
      .select("admin_password_hash")
      .eq("id", true)
      .single();

    if (error) {
      throw error;
    }

    const savedPassword = data.admin_password_hash ?? "";
    const isValidCurrentPassword = await verifyPenpenPassword(
      currentPassword,
      savedPassword,
    );

    if (!isValidCurrentPassword) {
      return NextResponse.json(
        { message: "現在のパスワードが一致しません。" },
        { status: 401 },
      );
    }

    const hashedPassword = await hashPenpenPassword(newPassword);
    const { error: upsertError } = await supabase
      .schema("penpen")
      .from("settings")
      .upsert(
        {
          id: true,
          admin_password_hash: hashedPassword,
        },
        { onConflict: "id" },
      );

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[penpen admin password]", error);
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
