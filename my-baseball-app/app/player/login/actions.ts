"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data: authData, error } =
    await supabase.auth.signInWithPassword(data);

  if (error || !authData.user) {
    console.error("Login error:", error?.message);
    redirect("/error");
  }

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  revalidatePath("/", "layout");

  if (player) {
    redirect("/player/dashboard");
  }

  redirect("/player/first-login");
}

/**
 * アカウント新規登録
 *
 * @param formData
 */
export async function signup(
  _prevState: { error?: string },
  formData: FormData,
) {
  const supabase = await createClient();

  const origin = (await headers()).get("origin") ?? "";

  const passwordInput = formData.get("password");
  const password =
    typeof passwordInput === "string" && passwordInput.trim()
      ? passwordInput
      : randomBytes(24).toString("base64url");

  const data = {
    email: formData.get("email") as string,
    password,
  };

  const { data: signUpData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: origin
        ? `${origin}/auth/callback?next=/player/first-login`
        : undefined,
    },
  });

  if (signUpData?.user?.identities?.length === 0) {
    return {
      error: "このメールアドレスは登録済みです。ログインしてください。",
    };
  }

  if (error) {
    const message = error.message?.toLowerCase?.() ?? "";
    if (
      message.includes("already registered") ||
      message.includes("registered")
    ) {
      return {
        error: "このメールアドレスは登録済みです。ログインしてください。",
      };
    }
    console.error("Signup error:", error.message);
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/player/login/confirm");
}

/**
 * ログアウト
 */
export async function logout() {
  const supabase = await createClient();

  // Supabaseのセッションを終了
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error.message);
    // エラーでもログイン画面へ飛ばす
  }

  // ログイン画面へリダイレクト
  redirect("/player/login");
}
