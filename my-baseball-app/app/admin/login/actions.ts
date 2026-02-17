"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginResult = {
  success: boolean;
  message: string;
};

export async function login(
  _prevState: LoginResult | undefined,
  formData: FormData,
): Promise<LoginResult> {
  const supabase = await createClient();

  // フォームから入力値を取得
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Supabase Authでログイン
  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error("Login error:", error.message);
    return {
      success: false,
      message: error.message || "ログインに失敗しました",
    };
  }

  // キャッシュを更新して管理画面などへリダイレクト
  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

export async function signup(
  _prevState: LoginResult | undefined,
  formData: FormData,
): Promise<LoginResult> {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Supabase Authで新規登録
  const { error } = await supabase.auth.signUp(data);

  if (error) {
    console.error("Signup error:", error.message);
    return {
      success: false,
      message: error.message || "アカウント登録に失敗しました",
    };
  }

  // 登録成功
  return {
    success: true,
    message: "アカウント登録が完了しました。ログインしてください。",
  };
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
