"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  success: boolean;
  message: string;
};

// 新規
export async function saveVsTeam(formData: FormData): Promise<ActionResult> {
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
      .from("vsteams")
      .select("sort")
      .eq("team_id", myTeamId)
      .order("sort", { ascending: true })
      .limit(1)
      .single();
    const minSort = maxSortData ? maxSortData.sort - 1 : -1;
    sort = minSort.toString();
  }

  const id = formData.get("id") as string | undefined;

  // 現在のチームデータを取得（旧アイコンファイルパスを確認用）
  let currentVsTeam: any = null;
  if (id) {
    const { data } = await supabase
      .from("vsteams")
      .select("icon")
      .eq("team_id", myTeamId)
      .eq("id", id)
      .single();
    currentVsTeam = data;
  }

  const nameValue = formData.get("name") as string;
  const oneName = formData.get("one_name") as string;
  const iconFile = formData.get("icon") as File | null;
  const deleteIconFlag = formData.get(`delete_icon_${id}`) === "true";

  let icon: string | null = null;

  // アイコンを削除
  if (deleteIconFlag && currentVsTeam?.icon) {
    try {
      await supabase.storage.from("vsteams").remove([currentVsTeam.icon]);
    } catch (err) {
      console.warn("Failed to delete old icon:", err);
    }
    icon = null;
  }

  // アイコンをアップロード
  if (iconFile && iconFile.size > 0) {
    // 削除フラグが立っていない場合のみ旧アイコンを削除
    if (!deleteIconFlag && currentVsTeam?.icon) {
      try {
        await supabase.storage.from("vsteams").remove([currentVsTeam.icon]);
      } catch (err) {
        console.warn("Failed to delete old icon:", err);
      }
    }

    const fileName = `${myTeamId}/${id || "new"}_icon_${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from("vsteams")
      .upload(fileName, iconFile, { upsert: true });

    if (uploadError) throw uploadError;
    icon = fileName;
  } else if (!deleteIconFlag && currentVsTeam?.icon) {
    // ファイルが選択されなかった場合は、既存のアイコンを保持
    icon = currentVsTeam.icon;
  }

  // 登録・更新データ
  const VsTeamData: any = {
    team_id: myTeamId,
    name: nameValue,
    one_name: oneName,
    icon: icon,
    show_flg: formData.get("show_flg") === "on",
    sort: sort,
  };

  // 編集時のみIDを含める（新規作成時はSupabaseが自動生成）
  if (id) {
    VsTeamData.id = id;
  }

  const { error } = await supabase.from("vsteams").upsert(VsTeamData);

  if (error) {
    console.error("Error creating vsteam:", error.message);
    return {
      success: false,
      message: "チームの保存に失敗しました: " + error.message,
    };
  }

  // 一覧画面のデータを最新の状態に更新（キャッシュクリア）
  revalidatePath("/admin/vsteams");

  return {
    success: true,
    message: "対戦相手を保存しました",
  };
}

// 削除
export async function deleteVsTeam(formData: FormData): Promise<ActionResult> {
  // TODO: 試合とかに使われてないかチェック or 削除してみてエラーで判断
  const id = formData.get("id");
  const supabase = await createClient();

  const { error } = await supabase.from("vsteams").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: "対戦相手の削除に失敗しました",
    };
  }

  revalidatePath("/admin/vsteams");

  return {
    success: true,
    message: "対戦相手を削除しました",
  };
}

// ソート順を一括更新する
export async function updateSortOrder(ids: string[]): Promise<ActionResult> {
  const supabase = await createClient();

  // 各IDに対して、現在の配列のインデックスを 'sort' 値として更新
  // Promise.all で並列実行して高速化します
  const updates = ids.map((id, index) =>
    supabase.from("vsteams").update({ sort: index }).eq("id", id),
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

  revalidatePath("/admin/vsteams");

  return {
    success: true,
    message: "並び替えを保存しました",
  };
}
