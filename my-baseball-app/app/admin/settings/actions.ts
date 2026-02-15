"use server";

import { createClient } from "@/lib/supabase/server";

export async function fetchTeamSettings() {
  try {
    const supabase = await createClient();

    const { data: myTeamId } = await supabase.rpc("get_my_team_id");

    if (!myTeamId) {
      throw new Error("チーム情報が見つかりません");
    }

    const { data: teamData, error } = await supabase
      .from("myteams")
      .select("*")
      .eq("id", myTeamId)
      .single();

    if (error) throw error;

    // 画像 URL を生成
    const imageUrls: any = {};
    if (teamData?.team_logo) {
      imageUrls.team_logo = supabase.storage
        .from("team_assets")
        .getPublicUrl(teamData.team_logo).data.publicUrl;
    }
    if (teamData?.top_image) {
      imageUrls.top_image = supabase.storage
        .from("team_assets")
        .getPublicUrl(teamData.top_image).data.publicUrl;
    }
    if (teamData?.team_icon) {
      imageUrls.team_icon = supabase.storage
        .from("team_assets")
        .getPublicUrl(teamData.team_icon).data.publicUrl;
    }

    return { success: true, data: teamData, imageUrls };
  } catch (error: any) {
    console.error("Error fetching team settings:", error);
    return {
      success: false,
      error: error?.message || "チーム設定の取得に失敗しました",
    };
  }
}

export async function updateTeamSettings(formData: FormData) {
  try {
    const supabase = await createClient();

    const { data: myTeamId } = await supabase.rpc("get_my_team_id");

    if (!myTeamId) {
      throw new Error("チーム情報が見つかりません");
    }

    // 現在のチームデータを取得（旧画像ファイルパスを確認用）
    const { data: currentTeam } = await supabase
      .from("myteams")
      .select("team_logo,top_image,team_icon")
      .eq("id", myTeamId)
      .single();

    const name = formData.get("name") as string;
    const one_name = formData.get("one_name") as string;
    const passphrase = formData.get("passphrase") as string;
    const team_color = formData.get("team_color") as string;
    const logoFile = formData.get("team_logo") as File | null;
    const topImageFile = formData.get("top_image") as File | null;
    const teamIconFile = formData.get("team_icon") as File | null;

    // 削除フラグを取得
    const deleteTeamLogo = formData.get("delete_team_logo") === "true";
    const deleteTopImage = formData.get("delete_top_image") === "true";
    const deleteTeamIcon = formData.get("delete_team_icon") === "true";

    let team_logo: string | null = null;
    let top_image: string | null = null;
    let team_icon: string | null = null;

    // ロゴを削除
    if (deleteTeamLogo && currentTeam?.team_logo) {
      try {
        await supabase.storage
          .from("team_assets")
          .remove([currentTeam.team_logo]);
      } catch (err) {
        console.warn("Failed to delete old logo:", err);
      }
      team_logo = null;
    }

    // TOP画像を削除
    if (deleteTopImage && currentTeam?.top_image) {
      try {
        await supabase.storage
          .from("team_assets")
          .remove([currentTeam.top_image]);
      } catch (err) {
        console.warn("Failed to delete old top image:", err);
      }
      top_image = null;
    }

    // チームアイコンを削除
    if (deleteTeamIcon && currentTeam?.team_icon) {
      try {
        await supabase.storage
          .from("team_assets")
          .remove([currentTeam.team_icon]);
      } catch (err) {
        console.warn("Failed to delete old team icon:", err);
      }
      team_icon = null;
    }

    // ロゴをアップロード
    if (logoFile && logoFile.size > 0) {
      // 削除フラグが立っていない場合のみ旧ロゴを削除
      if (!deleteTeamLogo && currentTeam?.team_logo) {
        try {
          await supabase.storage
            .from("team_assets")
            .remove([currentTeam.team_logo]);
        } catch (err) {
          console.warn("Failed to delete old logo:", err);
        }
      }

      const fileName = `${myTeamId}/team_logo_${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("team_assets")
        .upload(fileName, logoFile, { upsert: true });

      if (uploadError) throw uploadError;
      team_logo = fileName;
    }

    // TOP画像をアップロード
    if (topImageFile && topImageFile.size > 0) {
      // 削除フラグが立っていない場合のみ旧TOP画像を削除
      if (!deleteTopImage && currentTeam?.top_image) {
        try {
          await supabase.storage
            .from("team_assets")
            .remove([currentTeam.top_image]);
        } catch (err) {
          console.warn("Failed to delete old top image:", err);
        }
      }

      const fileName = `${myTeamId}/top_image_${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("team_assets")
        .upload(fileName, topImageFile, { upsert: true });

      if (uploadError) throw uploadError;
      top_image = fileName;
    }

    // チームアイコンをアップロード
    if (teamIconFile && teamIconFile.size > 0) {
      // 削除フラグが立っていない場合のみ旧チームアイコンを削除
      if (!deleteTeamIcon && currentTeam?.team_icon) {
        try {
          await supabase.storage
            .from("team_assets")
            .remove([currentTeam.team_icon]);
        } catch (err) {
          console.warn("Failed to delete old team icon:", err);
        }
      }

      const fileName = `${myTeamId}/team_icon_${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("team_assets")
        .upload(fileName, teamIconFile, { upsert: true });

      if (uploadError) throw uploadError;
      team_icon = fileName;
    }

    // 更新データ構築
    const updateData: any = {
      name,
      one_name,
      passphrase,
      team_color,
    };

    // ファイルがアップロードされた場合、またはファイルが削除された場合のみ更新
    if (team_logo !== null || deleteTeamLogo) {
      updateData.team_logo = team_logo;
    }
    if (top_image !== null || deleteTopImage) {
      updateData.top_image = top_image;
    }
    if (team_icon !== null || deleteTeamIcon) {
      updateData.team_icon = team_icon;
    }

    // データベースを更新
    const { error: updateError } = await supabase
      .from("myteams")
      .update(updateData)
      .eq("id", myTeamId);

    if (updateError) {
      throw updateError;
    }

    return { success: true, message: "設定を保存しました" };
  } catch (error: any) {
    console.error("Error updating team settings:", error);
    return {
      success: false,
      error: error?.message || "設定の保存に失敗しました",
    };
  }
}
