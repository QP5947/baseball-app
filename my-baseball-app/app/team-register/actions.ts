"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type RegisterTeamResult = {
  success: boolean;
  message: string;
  formData?: {
    team_id?: string;
    team_name?: string;
    one_name?: string;
    team_color?: string;
    representative_name?: string;
    representative_email?: string;
    representative_password?: string;
  };
};

export async function registerTeam(
  prevState: RegisterTeamResult | undefined,
  formData: FormData,
): Promise<RegisterTeamResult | undefined> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/register-entry");
  }

  const team_id = formData.get("team_id") as string;
  const team_name = formData.get("team_name") as string;
  const one_name = formData.get("one_name") as string;
  const team_color = formData.get("team_color") as string;

  if (!team_id || !team_name || !one_name || !team_color) {
    return {
      success: false,
      message: "すべての項目を入力してください。",
      formData: {
        team_id,
        team_name,
        one_name,
        team_color,
      },
    };
  }

  // チーム登録
  const { data: teamArr, error: teamError } = await supabase
    .from("myteams")
    .insert({
      id: team_id,
      name: team_name,
      one_name: one_name,
      team_color: team_color,
      status: true,
    })
    .select()
    .single();
  const team = Array.isArray(teamArr) ? teamArr[0] : teamArr;

  if (teamError || !team) {
    return {
      success: false,
      message: teamError?.message || "チームの登録に失敗しました。",
      formData: {
        team_id,
        team_name,
        one_name,
        team_color,
      },
    };
  }

  const { error: playerError } = await supabase.from("players").insert({
    name: "管理者",
    user_id: user.id,
    team_id: team.id,
    is_player: false,
    is_manager: true,
    is_admin: true,
    show_flg: false,
  });

  if (playerError) {
    await supabase.from("myteams").delete().eq("id", team.id);
    return {
      success: false,
      message: playerError.message || "代表者の登録に失敗しました。",
      formData: {
        team_id,
        team_name,
        one_name,
        team_color,
      },
    };
  }

  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}
