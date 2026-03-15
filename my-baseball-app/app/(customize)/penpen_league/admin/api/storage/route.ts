export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PENPEN_STORAGE_BUCKET } from "../../../lib/penpenStorage";
import { getErrorMessage, requirePenpenAdminSession } from "../_shared";

const DIRECTORY_PATTERN = /^[a-z0-9][a-z0-9/_-]*$/;

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const createStoragePath = (directory: string, fileName: string) => {
  const now = Date.now();
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${directory}/${now}-${random}-${sanitizeFileName(fileName)}`;
};

const isStoragePath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return false;
  }

  return true;
};

export async function POST(request: NextRequest) {
  const unauthorized = requirePenpenAdminSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const rawDirectory = formData.get("directory");
    const directory =
      typeof rawDirectory === "string" ? rawDirectory.trim() : "";

    if (
      !(file instanceof File) ||
      !directory ||
      !DIRECTORY_PATTERN.test(directory)
    ) {
      return NextResponse.json(
        { message: "送信データが不正です。" },
        { status: 400 },
      );
    }

    const path = createStoragePath(directory, file.name || "image");

    const supabase = createServiceClient();
    const { error } = await supabase.storage
      .from(PENPEN_STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || undefined,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from(PENPEN_STORAGE_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      ok: true,
      data: { path, publicUrl: data.publicUrl || "" },
    });
  } catch (error) {
    console.error("[penpen admin storage upload]", error);
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = requirePenpenAdminSession(request);
  if (unauthorized) {
    return unauthorized;
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { message: "不正なリクエストです。" },
      { status: 400 },
    );
  }

  if (!rawBody || typeof rawBody !== "object") {
    return NextResponse.json(
      { message: "送信データが不正です。" },
      { status: 400 },
    );
  }

  const body = rawBody as { path?: unknown };
  const path = typeof body.path === "string" ? body.path.trim() : "";

  if (!isStoragePath(path)) {
    return NextResponse.json({ ok: true });
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.storage
      .from(PENPEN_STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[penpen admin storage delete]", error);
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
