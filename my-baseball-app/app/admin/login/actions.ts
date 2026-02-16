"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(
  _prevState: { error?: string },
  formData: FormData,
) {
  const supabase = await createClient();

  // フォームから入力値を取得
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Supabase Authでログイン
  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // 実際にはエラーメッセージをトースト等で出すのが望ましいです
    console.error("Login error:", error.message);
    return { error: error.message || "ログインに失敗しました" };
  }

  // キャッシュを更新して管理画面などへリダイレクト
  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

export async function signup(
  _prevState: { error?: string },
  formData: FormData,
) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Supabase Authで新規登録
  const { error } = await supabase.auth.signUp(data);

  if (error) {
    console.error("Signup error:", error.message);
    return { error: error.message || "アカウント登録に失敗しました" };
  }

  revalidatePath("/", "layout");
  // 新規登録後は確認メールが飛ぶ設定の場合、案内ページなどへ飛ばすと親切です
  redirect("/login?message=Check email to continue");
}

export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error.message);
  }

  revalidatePath("/", "layout");
  redirect("/admin/login");
}
