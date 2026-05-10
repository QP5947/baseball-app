export const runtime = "nodejs";

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * サーバーサイドで OAuth URL を生成し、そこへリダイレクトする。
 * PKCE の code_verifier クッキーもレスポンスに含めてセットする。
 *
 * GET /api/auth/oauth-url?provider=google&redirectTo=https://...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") as
    | "google"
    | "facebook"
    | "x"
    | null;
  const redirectTo = searchParams.get("redirectTo");
  const scopes = searchParams.get("scopes") ?? undefined;

  if (!provider || !redirectTo) {
    return NextResponse.json(
      { error: "provider と redirectTo は必須です。" },
      { status: 400 },
    );
  }

  // レスポンスにセットするクッキーを収集する
  const cookiesToSet: { name: string; value: string; options?: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookiesToSet.push(...cookies);
        },
      },
    },
  );

  const options: {
    redirectTo: string;
    skipBrowserRedirect: true;
    scopes?: string;
  } = {
    redirectTo,
    skipBrowserRedirect: true,
  };
  if (scopes) {
    options.scopes = scopes;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options,
  });

  if (error || !data?.url) {
    return NextResponse.json(
      { error: error?.message ?? "OAuth URL の生成に失敗しました。" },
      { status: 500 },
    );
  }

  // PKCE code_verifier などのクッキーをセットしつつ OAuth プロバイダーへリダイレクト
  const response = NextResponse.redirect(data.url);
  for (const { name, value, options: cookieOptions } of cookiesToSet) {
    response.cookies.set(name, value, cookieOptions);
  }
  return response;
}
