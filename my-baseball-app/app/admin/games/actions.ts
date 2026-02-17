"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  success: boolean;
  message: string;
  formData?: {
    start_datetime?: string;
    league_id?: string;
    ground_id?: string;
    vsteam_id?: string;
    remarks?: string;
    sum_flg?: boolean;
  };
};

// 新規・更新
export async function saveGame(formData: FormData): Promise<ActionResult> {
  // ログイン者のチームIDを取得
  const supabase = await createClient();
  const { data: myTeamId, error: rpcError } =
    await supabase.rpc("get_my_team_id");
  if (rpcError || !myTeamId) {
    console.error("チームIDの取得に失敗しました:", rpcError);
    return {
      success: false,
      message: "チームIDの取得に失敗しました",
    };
  }

  const leagueId = (formData.get("league_id") as string | null) ?? "";
  const groundId = (formData.get("ground_id") as string | null) ?? "";
  const vsteamId = (formData.get("vsteam_id") as string | null) ?? "";

  const deletedMasters: string[] = [];

  if (leagueId) {
    const leagueResult = await supabase
      .from("leagues")
      .select("id")
      .eq("team_id", myTeamId)
      .eq("id", leagueId)
      .maybeSingle();
    if (leagueResult.error || !leagueResult.data) {
      deletedMasters.push("リーグ");
    }
  }

  if (groundId) {
    const groundResult = await supabase
      .from("grounds")
      .select("id")
      .eq("team_id", myTeamId)
      .eq("id", groundId)
      .maybeSingle();
    if (groundResult.error || !groundResult.data) {
      deletedMasters.push("球場");
    }
  }

  if (vsteamId) {
    const vsteamResult = await supabase
      .from("vsteams")
      .select("id")
      .eq("team_id", myTeamId)
      .eq("id", vsteamId)
      .maybeSingle();
    if (vsteamResult.error || !vsteamResult.data) {
      deletedMasters.push("対戦相手");
    }
  }

  if (deletedMasters.length > 0) {
    return {
      success: false,
      message: `${deletedMasters.join("・")}が削除済みのため保存できません。再選択してください。`,
    };
  }

  // フォームデータの抽出
  const gameData = {
    team_id: myTeamId,
    id: formData.get("id") || undefined,
    start_datetime: `${formData.get("start_datetime")}:00+09:00`,
    league_id: leagueId || null,
    ground_id: groundId || null,
    vsteam_id: vsteamId || null,
    remarks: formData.get("remarks"),
    sum_flg: formData.get("sum_flg") === "on",
  };

  const { error } = await supabase.from("games").upsert(gameData);

  if (error) {
    console.error("Error creating game:", error.message);
    return {
      success: false,
      message: "試合の保存に失敗しました: " + error.message,
    };
  }

  // 一覧画面のデータを最新の状態に更新（キャッシュクリア）
  revalidatePath("/admin/games");

  return {
    success: true,
    message: "試合を保存しました",
  };
}

// 削除
export async function deleteGame(formData: FormData): Promise<ActionResult> {
  const id = formData.get("id");
  const supabase = await createClient();

  const { error } = await supabase.from("games").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: "試合の削除に失敗しました",
    };
  }

  revalidatePath("/admin/games");

  return {
    success: true,
    message: "試合を削除しました",
  };
}
