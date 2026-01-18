"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";

type PitchingResultsType =
  Database["public"]["Tables"]["team_profiles"][`Insert`];

// 新規
export async function saveTeamProfile(formData: FormData) {
  const supabase = await createClient();

  // ログイン者のチームIDを取得
  const { data: myTeamId, error: rpcError } = await supabase.rpc(
    "get_my_team_id"
  );
  if (rpcError || !myTeamId) {
    console.error("チームIDの取得に失敗しました:", rpcError);
    return;
  }

  // DELETE
  const { error: deleteError } = await supabase
    .from("team_profiles")
    .delete()
    .eq("team_id", myTeamId);

  if (deleteError) {
    console.error("Error delete team_profiles:", deleteError.message);
    // 実際はここでエラーを呼び出し元に返して表示させるのが理想ですが、
    // まずは最小実装で進めます
    return;
  }

  const questions = formData.getAll("q");
  const answers = formData.getAll("a");
  const qaData: PitchingResultsType[] = questions
    .map((q, idx) => {
      return {
        team_id: myTeamId,
        no: idx,
        q: q as string,
        a: answers[idx] as string,
      };
    })
    .filter((qa, idx) => qa.q !== "" || qa.a !== "");

  // INSERT
  const { error: insertError } = await supabase
    .from("team_profiles")
    .insert(qaData);

  if (insertError) {
    console.error("Error creating team_profiles:", insertError.message);
    // 実際はここでエラーを呼び出し元に返して表示させるのが理想ですが、
    // まずは最小実装で進めます
    return;
  }

  // 一覧画面のデータを最新の状態に更新（キャッシュクリア）
  revalidatePath("/admin/teamProfiles");

  // 一覧画面へリダイレクト
  redirect("/admin/teamProfiles");
}

// 削除
export async function deleteTeamProfile(formData: FormData) {
  // TODO: 試合とかに使われてないかチェック or 削除してみてエラーで判断
  const id = formData.get("id");
  const supabase = await createClient();
  await supabase.from("grounds").delete().eq("id", id);

  revalidatePath("/admin/grounds");
}
