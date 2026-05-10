export const runtime = "nodejs";

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function resolveCanonicalBase(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  const fallback = request.nextUrl.origin;
  return fallback.replace(/\/$/, "");
}

export async function GET(request: NextRequest) {
  let cookiesToSet: { name: string; value: string; options?: any }[] = [];
  const canonicalBase = resolveCanonicalBase(request);

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

  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const flow = searchParams.get("flow"); // 'signup' or 'login'
  const origin = searchParams.get("origin"); // 認証を開始した元のページ

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.search = "";

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      redirectUrl.pathname = origin ?? "/"; // エラー時は元のページに戻す
      redirectUrl.searchParams.set("error", "auth_error");
      redirectUrl.searchParams.set("error_description", "認証に失敗しました。");
      const redirectResponse = NextResponse.redirect(redirectUrl);
      cookiesToSet.forEach(({ name, value, options }) =>
        redirectResponse.cookies.set(name, value, options),
      );
      return redirectResponse;
    }

    const user = data.user;
    if (!user) {
      redirectUrl.pathname = origin ?? "/"; // エラー時は元のページに戻す
      redirectUrl.searchParams.set("error", "user_not_found");
      redirectUrl.searchParams.set(
        "error_description",
        "ユーザーが見つかりませんでした。",
      );
      const redirectResponse = NextResponse.redirect(redirectUrl);
      cookiesToSet.forEach(({ name, value, options }) =>
        redirectResponse.cookies.set(name, value, options),
      );
      return redirectResponse;
    }

    // playersテーブルにユーザーが存在するか確認
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (playerError) {
      // エラーはログに出力しておく
      console.error("Player check error:", playerError);
    }

    const userExistsInPlayers = player !== null;

    if (flow === "signup") {
      if (userExistsInPlayers) {
        // 登録しようとしたが、既に存在していた
        await supabase.auth.signOut();
        redirectUrl.pathname = origin ?? "/register-entry"; // エラー時はoriginに戻す
        redirectUrl.searchParams.set("error", "already_registered");
        redirectUrl.searchParams.set(
          "error_description",
          "このアカウントは既に登録されています。ログインしてください。",
        );
      } else {
        // 新規登録成功
        redirectUrl.pathname = next;
      }
    } else if (flow === "login") {
      if (!userExistsInPlayers) {
        // ログインしようとしたが、存在しなかった
        await supabase.auth.signOut();
        redirectUrl.pathname = origin ?? "/"; // エラー時はoriginに戻す
        redirectUrl.searchParams.set("error", "not_registered");
        redirectUrl.searchParams.set(
          "error_description",
          "このアカウントは登録されていません。新規登録をしてください。",
        );
      } else {
        // ログイン成功
        redirectUrl.pathname = next;
      }
    } else {
      // flowが指定されていない場合 (旧管理者ログインなど)
      redirectUrl.pathname = next;
    }
  } else {
    // codeがない場合
    const originPath = searchParams.get("origin") ?? "/";
    redirectUrl.pathname = originPath; // codeがないエラーも元のページに戻す
    redirectUrl.searchParams.set("error", "no_code");
    redirectUrl.searchParams.set(
      "error_description",
      "認証を完了できませんでした。もう一度お試しください。",
    );
  }

  const finalUrl = new URL(
    `${redirectUrl.pathname}${redirectUrl.search}`,
    canonicalBase,
  );
  const redirectResponse = NextResponse.redirect(finalUrl);
  // 必ずここでcookieをセット
  cookiesToSet.forEach(({ name, value, options }) =>
    redirectResponse.cookies.set(name, value, options),
  );
  return redirectResponse;
}
