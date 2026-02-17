"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  success: boolean;
  message: string;
};

// 新規
export async function saveGround(formData: FormData): Promise<ActionResult> {
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

  // 新規登録時は、ソート順を最小にする
  let sort = formData.get("sort");
  if (!sort || sort === "") {
    const { data: maxSortData } = await supabase
      .from("grounds")
      .select("sort")
      .eq("team_id", myTeamId)
      .order("sort", { ascending: true })
      .limit(1)
      .single();
    const minSort = maxSortData ? maxSortData.sort - 1 : -1;
    sort = minSort.toString();
  }

  // 登録・更新データ
  const GroundData = {
    team_id: myTeamId,
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    show_flg: formData.get("show_flg") === "on",
    sort: sort,
  };
  const { error } = await supabase.from("grounds").upsert(GroundData);

  if (error) {
    console.error("Error creating ground:", error.message);
    return {
      success: false,
      message: "球場の保存に失敗しました: " + error.message,
    };
  }

  // 一覧画面のデータを最新の状態に更新（キャッシュクリア）
  revalidatePath("/admin/grounds");

  return {
    success: true,
    message: "球場を保存しました",
  };
}

// 削除
export async function deleteGround(formData: FormData): Promise<ActionResult> {
  // TODO: 試合とかに使われてないかチェック or 削除してみてエラーで判断
  const id = formData.get("id");
  const supabase = await createClient();

  const { error } = await supabase.from("grounds").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: "球場の削除に失敗しました",
    };
  }

  revalidatePath("/admin/grounds");

  return {
    success: true,
    message: "球場を削除しました",
  };
}

// ソート順を一括更新する
export async function updateSortOrder(ids: string[]): Promise<ActionResult> {
  const supabase = await createClient();

  // 各IDに対して、現在の配列のインデックスを 'sort' 値として更新
  // Promise.all で並列実行して高速化します
  const updates = ids.map((id, index) =>
    supabase.from("grounds").update({ sort: index }).eq("id", id),
  );

  const results = await Promise.all(updates);

  // エラーチェック
  const firstError = results.find((r) => r.error);
  if (firstError) {
    console.error("並び替えの保存に失敗しました:", firstError.error);
    return {
      success: false,
      message: "並び替えの保存に失敗しました",
    };
  }

  revalidatePath("/admin/grounds");

  return {
    success: true,
    message: "並び替えを保存しました",
  };
}
