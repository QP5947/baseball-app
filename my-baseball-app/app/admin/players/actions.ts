"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 新規・更新
export async function savePlayer(formData: FormData) {
  const supabase = await createClient();

  // ログイン者のチームIDを取得
  const { data: myTeamId, error: rpcError } = await supabase.rpc(
    "get_my_team_id"
  );
  if (rpcError || !myTeamId) {
    console.error("チームIDの取得に失敗しました:", rpcError);
    return;
  }

  // 背番号（文字列）を数値にしたソート用数字を作成
  const sortNo = Number(formData.get("no"));
  const sort = isNaN(sortNo) ? null : Math.ceil(sortNo);

  // 認証用コードの生成
  const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();

  // フォームデータの抽出
  const playerData = {
    team_id: myTeamId,
    id: formData.get("id") || undefined,
    no: formData.get("no"),
    name: formData.get("name"),
    throw_hand: formData.get("throw_hand"),
    batting_hand: formData.get("batting_hand"),
    position: formData.get("position"),
    comment: formData.get("comment"),
    show_flg: formData.get("show_flg") === "on",
    is_player: formData.get("is_player") === "on",
    is_admin: formData.get("is_admin") === "on",
    is_manager: formData.get("is_manager") === "on",
    sort: sort,
  };

  const { error } = await supabase.from("players").upsert(playerData);

  if (error) {
    console.error("Error creating player:", error.message);
    // 実際はここでエラーを呼び出し元に返して表示させるのが理想ですが、
    // まずは最小実装で進めます
    return;
  }

  // 一覧画面のデータを最新の状態に更新（キャッシュクリア）
  revalidatePath("/admin/players");

  // 一覧画面へリダイレクト
  redirect("/admin/players");
}

// 削除
export async function deletePlayer(formData: FormData) {
  // TODO: 試合とかに使われてないかチェック or 削除してみてエラーで判断
  const id = formData.get("id");
  const supabase = await createClient();
  await supabase.from("players").delete().eq("id", id);

  revalidatePath("/admin/players");
}
