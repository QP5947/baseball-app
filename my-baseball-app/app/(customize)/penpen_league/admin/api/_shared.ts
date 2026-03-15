import { NextRequest, NextResponse } from "next/server";

export const PENPEN_ADMIN_COOKIE = "penpen_admin_session";

type ErrorLike = {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
};

export const requirePenpenAdminSession = (request: NextRequest) => {
  const hasPenpenAdminSession =
    request.cookies.get(PENPEN_ADMIN_COOKIE)?.value === "1";

  if (hasPenpenAdminSession) {
    return null;
  }

  return NextResponse.json(
    { message: "管理画面の認証が切れています。再ログインしてください。" },
    { status: 401 },
  );
};

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const { message, details, hint, code } = error as ErrorLike;
    const parts = [message, details, hint, code]
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      )
      .map((value) => value.trim());

    if (parts.length > 0) {
      return parts.join(" / ");
    }
  }

  return "unknown";
};
