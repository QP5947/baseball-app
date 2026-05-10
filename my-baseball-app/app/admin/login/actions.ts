"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginResult = {
  success: boolean;
  message: string;
  errorType?: "auth" | "other";
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
    console.error("Login error:", error.message, "code:", error.code);
    if (
      error.message === "Invalid login credentials" ||
      error.code === "invalid_credentials"
    ) {
      return {
        success: false,
        message: "メールアドレスまたはパスワードが正しくありません。",
        errorType: "auth",
      };
    }
    if (error.message === "Email not confirmed") {
      return {
        success: false,
        message:
          "メールアドレスの確認が完了していません。確認メールのリンクをクリックしてください。",
        errorType: "auth",
      };
    }
    // その他のエラーは実際のメッセージを表示
    return {
      success: false,
      message: error.message || "ログイン時に予期しないエラーが発生しました。",
      errorType: "other",
    };
  }

  // キャッシュを更新して管理画面などへリダイレクト
  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
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
