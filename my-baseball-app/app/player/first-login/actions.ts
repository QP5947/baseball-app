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
): Promise<FirstLoginState> {
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

  const provider = user.app_metadata.provider;

  const returnState = {
    teamId,
    passphrase,
    playerId,
  };

  if (provider === "email") {
    if (!teamId || !playerId || !passphrase || !password || !passwordConfirm) {
      return { ...returnState, error: "missing" };
    }

    if (password !== passwordConfirm) {
      return { ...returnState, error: "password_mismatch" };
    }
  } else {
    if (!teamId || !playerId || !passphrase) {
      return { ...returnState, error: "missing" };
    }
  }

  const { data: player, error } = await supabase
    .from("players")
    .select("id, user_id")
    .eq("id", playerId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (error || !player || player.user_id) {
    return { ...returnState, error: "invalid" };
  }

  if (provider === "email") {
    const { error: passwordError } = await supabase.auth.updateUser({
      password,
    });

    if (passwordError) {
      console.error("Password update error:", passwordError.message);
      return { ...returnState, error: "password" };
    }
  }

  const { error: updateError } = await supabase
    .from("players")
    .update({ user_id: user.id })
    .eq("id", playerId)
    .eq("team_id", teamId)
    .is("user_id", null);

  if (updateError) {
    console.error("First login update error:", updateError.message);
    return { ...returnState, error: "invalid" };
  }

  revalidatePath("/", "layout");
  redirect("/player/dashboard");
}
