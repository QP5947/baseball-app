"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionResult = {
  success: boolean;
  message: string;
};

// 更新
export async function savePastPlayer(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();

  // ログイン者のチームIDを取得
  const { data: myTeamId, error: rpcError } =
    await supabase.rpc("get_my_team_id");
  if (rpcError || !myTeamId) {
    console.error("チームIDの取得に失敗しました:", rpcError);
    return {
      success: false,
      message: "チームIDの取得に失敗しました",
    };
  }

  // 背番号（文字列）を数値にしたソート用数字を作成
  const sortNo = Number(formData.get("no"));
  const sort = isNaN(sortNo) ? null : Math.ceil(sortNo);

  // フォームデータの抽出
  const pastPlayerData = {
    no: formData.get("no"),
    name: formData.get("name"),
    throw_hand: formData.get("throw_hand"),
    batting_hand: formData.get("batting_hand"),
    show_flg: formData.get("show_flg") === "on",
    sort: sort,
  };

  const { data, error } = await supabase
    .from("past_players")
    .update(pastPlayerData)
    .eq("team_id", myTeamId)
    .eq("player_id", formData.get("player_id"))
    .eq("year", formData.get("year"))
    .select()
    .single();

  if (error) {
    console.error("Error creating player:", error.message);
    return {
      success: false,
      message: "過去選手の保存に失敗しました: " + error.message,
    };
  }

  // 一覧画面のデータを最新の状態に更新（キャッシュクリア）
  revalidatePath("/admin/pastPlayers?year=" + formData.get("year"));

  // 一覧画面へリダイレクト
  redirect("/admin/pastPlayers?year=" + formData.get("year"));
}
