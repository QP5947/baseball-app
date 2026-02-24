export const runtime = "nodejs";

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Cookieを一時保存する配列
  let cookiesToSet: { name: string; value: string; options?: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(newCookies) {
          cookiesToSet = newCookies;
        },
      },
    },
  );

  const code = request.nextUrl.searchParams.get("code");
  const sessionResult = await supabase.auth.exchangeCodeForSession(code || "");
  console.log("sessionResult", sessionResult);

  // team-register/認証後はregister-entryへ、デフォルトは/player/first-login
  let next = request.nextUrl.searchParams.get("next");
  if (!next) {
    const referer = request.headers.get("referer") || "";
    if (referer.includes("team-register")) {
      next = "/register-entry";
    } else {
      next = "/player/first-login";
    }
  }

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = next;
  redirectUrl.search = "";

  const redirectResponse = NextResponse.redirect(redirectUrl);
  // 必ずここでcookieをセット
  cookiesToSet.forEach(({ name, value, options }) =>
    redirectResponse.cookies.set(name, value, options),
  );
  return redirectResponse;
}
