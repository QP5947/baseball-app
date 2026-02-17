"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export type ActionResult = {
  success: boolean;
  message: string;
  formData?: {
    no?: string;
    name?: string;
    throw_hand?: string;
    batting_hand?: string;
    position?: string;
    comment?: string;
    show_flg?: boolean;
    is_player?: boolean;
    is_manager?: boolean;
    is_admin?: boolean;
  };
};

// 新規・更新
export async function savePlayer(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  // formData から値を抽出
  const extractedFormData = {
    no: formData.get("no") as string,
    name: formData.get("name") as string,
    throw_hand: formData.get("throw_hand") as string,
    batting_hand: formData.get("batting_hand") as string,
    position: formData.get("position") as string,
    comment: formData.get("comment") as string,
    show_flg: formData.get("show_flg") === "on",
    is_player: formData.get("is_player") === "on",
    is_manager: formData.get("is_manager") === "on",
    is_admin: formData.get("is_admin") === "on",
  };

  // ログイン者のチームIDを取得
  const { data: myTeamId, error: rpcError } =
    await supabase.rpc("get_my_team_id");
  if (rpcError || !myTeamId) {
    return {
      success: false,
      message: "チームIDの取得に失敗しました",
      formData: extractedFormData,
    };
  }

  // 背番号（文字列）を数値にしたソート用数字を作成
  const sortNo = Number(formData.get("no"));
  const sort = isNaN(sortNo) ? null : Math.ceil(sortNo);

  const id = formData.get("id") as string | null;

  let currentPlayer: {
    list_image: string | null;
    detail_image: string | null;
  } | null = null;
  if (id) {
    const { data } = await supabase
      .from("players")
      .select("list_image, detail_image")
      .eq("team_id", myTeamId)
      .eq("id", id)
      .single();
    currentPlayer = data;
  }

  const listImageFile = formData.get("list_image_file") as File | null;
  const detailImageFile = formData.get("detail_image_file") as File | null;

  // ファイルサイズの検証
  if (listImageFile && listImageFile.size > MAX_FILE_SIZE) {
    return {
      success: false,
      message: `一覧用写真が大きすぎます。${MAX_FILE_SIZE / 1024 / 1024}MB以下のファイルをアップロードしてください。`,
      formData: extractedFormData,
    };
  }
  if (detailImageFile && detailImageFile.size > MAX_FILE_SIZE) {
    return {
      success: false,
      message: `詳細用写真が大きすぎます。${MAX_FILE_SIZE / 1024 / 1024}MB以下のファイルをアップロードしてください。`,
      formData: extractedFormData,
    };
  }

  const uploadPlayerImage = async (file: File, suffix: "list" | "detail") => {
    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase()
      : "jpg";
    const fileName = `${myTeamId}/${id || "new"}_${suffix}_${Date.now()}.${extension || "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("player_images")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    return fileName;
  };

  let list_image = currentPlayer?.list_image ?? null;
  if (
    listImageFile &&
    listImageFile.size > 0 &&
    listImageFile.size <= MAX_FILE_SIZE
  ) {
    if (currentPlayer?.list_image) {
      try {
        await supabase.storage
          .from("player_images")
          .remove([currentPlayer.list_image]);
      } catch (err) {
        console.warn("Failed to delete old list image:", err);
      }
    }
    list_image = await uploadPlayerImage(listImageFile, "list");
  }

  let detail_image = currentPlayer?.detail_image ?? null;
  if (
    detailImageFile &&
    detailImageFile.size > 0 &&
    detailImageFile.size <= MAX_FILE_SIZE
  ) {
    if (currentPlayer?.detail_image) {
      try {
        await supabase.storage
          .from("player_images")
          .remove([currentPlayer.detail_image]);
      } catch (err) {
        console.warn("Failed to delete old detail image:", err);
      }
    }
    detail_image = await uploadPlayerImage(detailImageFile, "detail");
  }

  // フォームデータの抽出
  const playerData = {
    team_id: myTeamId,
    id: id || undefined,
    no: formData.get("no"),
    name: formData.get("name"),
    throw_hand: formData.get("throw_hand"),
    batting_hand: formData.get("batting_hand"),
    position: formData.get("position"),
    comment: formData.get("comment"),
    list_image,
    detail_image,
    show_flg: formData.get("show_flg") === "on",
    is_player: formData.get("is_player") === "on",
    is_admin: formData.get("is_admin") === "on",
    is_manager: formData.get("is_manager") === "on",
    sort: sort,
  };

  const { error } = await supabase.from("players").upsert(playerData);

  if (error) {
    console.error("Error creating player:", error.message);
    return {
      success: false,
      message: "選手の保存に失敗しました: " + error.message,
      formData: extractedFormData,
    };
  }

  // 一覧画面のデータを最新の状態に更新（キャッシュクリア）
  revalidatePath("/admin/players");

  // 一覧画面へリダイレクト
  redirect("/admin/players");
}

// 削除
export async function deletePlayer(formData: FormData): Promise<ActionResult> {
  // TODO: 試合とかに使われてないかチェック or 削除してみてエラーで判断
  const id = formData.get("id");
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("list_image, detail_image")
    .eq("id", id)
    .single();

  const filesToDelete = [player?.list_image, player?.detail_image].filter(
    (path): path is string => Boolean(path),
  );

  if (filesToDelete.length > 0) {
    try {
      await supabase.storage.from("player_images").remove(filesToDelete);
    } catch (err) {
      console.warn("Failed to delete player images:", err);
    }
  }

  const { error } = await supabase.from("players").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: "選手の削除に失敗しました",
    };
  }

  revalidatePath("/admin/players");

  return {
    success: true,
    message: "選手を削除しました",
  };
}
