"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FirstLoginResult = {
  success: boolean;
  message: string;
  error?: string;
  teamId?: string;
  passphrase?: string;
  playerId?: string;
};

export type FirstLoginState =
  | FirstLoginResult
  | {
      error?: string;
      teamId?: string;
      passphrase?: string;
      playerId?: string;
    }
  | undefined;

/**
 * 初回ログイン
 *
 * @param state 前実行結果の状態
 * @param formData フォームデータ
 */
export async function completeFirstLogin(
  state: FirstLoginState,
  formData: FormData,
): Promise<FirstLoginResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/player/login");
  }

  const teamId = String(formData.get("team_id") || "");
  const playerId = String(formData.get("player_id") || "");
  const passphrase = String(formData.get("passphrase") || "");
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("password_confirm") || "");

  if (!teamId || !playerId || !passphrase || !password || !passwordConfirm) {
    return {
      success: false,
      message: "必要項目を入力してください",
    };
  }

  if (password !== passwordConfirm) {
    return {
      success: false,
      message: "パスワードが一致しません",
    };
  }

  const { data: player, error } = await supabase
    .from("players")
    .select("id, user_id")
    .eq("id", playerId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (error || !player || player.user_id) {
    return {
      success: false,
      message: "無効なリクエストです",
    };
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password,
  });

  if (passwordError) {
    console.error("Password update error:", passwordError.message);
    return {
      success: false,
      message: "パスワードの設定に失敗しました",
    };
  }

  const { error: updateError } = await supabase
    .from("players")
    .update({ user_id: user.id })
    .eq("id", playerId)
    .eq("team_id", teamId)
    .is("user_id", null);

  if (updateError) {
    console.error("First login update error:", updateError.message);
    return {
      success: false,
      message: "登録に失敗しました",
    };
  }

  revalidatePath("/", "layout");
  redirect("/player/dashboard");
}
