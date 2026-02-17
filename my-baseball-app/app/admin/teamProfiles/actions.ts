"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/supabase";

type PitchingResultsType =
  Database["public"]["Tables"]["team_profiles"][`Insert`];

export type ActionResult = {
  success: boolean;
  message: string;
  formData?: {
    profiles: { q: string; a: string }[];
  };
};

// 新規
export async function saveTeamProfile(
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

  // DELETE
  const { error: deleteError } = await supabase
    .from("team_profiles")
    .delete()
    .eq("team_id", myTeamId);

  if (deleteError) {
    console.error("Error delete team_profiles:", deleteError.message);
    return {
      success: false,
      message: "チームプロフィールの保存に失敗しました: " + deleteError.message,
    };
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
    return {
      success: false,
      message: "チームプロフィールの保存に失敗しました: " + insertError.message,
    };
  }

  // 一覧画面のデータを最新の状態に更新（キャッシュクリア）
  revalidatePath("/admin/teamProfiles");

  return {
    success: true,
    message: "チームプロフィールを保存しました",
  };
}
