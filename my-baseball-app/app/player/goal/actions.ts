"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function fetchGoalsDivisions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("golals_division")
    .select("*")
    .order("goal_group_no", { ascending: true })
    .order("no", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchPlayerGoals(
  playerId: string,
  teamId: string,
  year: number,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("player_id", playerId)
    .eq("team_id", teamId)
    .eq("year", year)
    .order("sort", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function saveGoal(
  playerId: string,
  teamId: string,
  year: number,
  goalNo: number,
  goalValue: string,
  memo: string | null,
  sort: number = 0,
) {
  const supabase = await createClient();

  // upsertを使用（既存レコードがあれば更新、なければ挿入）
  const { error } = await supabase.from("goals").upsert(
    {
      team_id: teamId,
      player_id: playerId,
      year: year,
      goal_no: goalNo,
      goal_value: goalValue,
      memo: memo,
      sort: sort,
    },
    {
      onConflict: "player_id,team_id,year,goal_no",
    },
  );

  if (error) throw new Error(error.message);

  revalidatePath("/player/goal");
}

export async function addGoal(
  playerId: string,
  teamId: string,
  year: number,
  goalNo: number,
  existingGoals: Array<{ goal_no: number; sort: number | null }>,
) {
  const supabase = await createClient();

  // 既存のgoalsのsortを1ずつインクリメントしてアップデート
  const updatePromises = existingGoals.map((goal) => {
    const newSort = (goal.sort || 0) + 1;
    return supabase
      .from("goals")
      .update({ sort: newSort })
      .eq("player_id", playerId)
      .eq("team_id", teamId)
      .eq("year", year)
      .eq("goal_no", goal.goal_no);
  });

  // 既存項目のsortを更新
  const results = await Promise.all(updatePromises);
  for (const result of results) {
    if (result.error) throw new Error(result.error.message);
  }

  // 新しいgoalをsort: 0で挿入
  const { error: insertError } = await supabase.from("goals").insert({
    player_id: playerId,
    team_id: teamId,
    year: year,
    goal_no: goalNo,
    goal_value: "",
    memo: null,
    sort: 0,
  });

  if (insertError) throw new Error(insertError.message);
  revalidatePath("/player/goal");
}

export async function updateGoalSort(
  playerId: string,
  teamId: string,
  year: number,
  goalNo: number,
  sort: number,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("goals")
    .update({ sort })
    .eq("player_id", playerId)
    .eq("team_id", teamId)
    .eq("year", year)
    .eq("goal_no", goalNo);

  if (error) throw new Error(error.message);
  revalidatePath("/player/goal");
}

export async function getAvailableYears(playerId: string, teamId: string) {
  const supabase = await createClient();

  // 試合がある年を取得（start_datetimeから年を抽出）
  const { data: games, error } = await supabase
    .from("games")
    .select("start_datetime")
    .eq("team_id", teamId)
    .not("start_datetime", "is", null)
    .order("start_datetime", { ascending: false });

  if (error) {
    console.error("Error fetching game years:", error);
    // エラーの場合は現在の年度を返す
    return [new Date().getFullYear()];
  }

  if (!games || games.length === 0) {
    // 試合がない場合は現在の年度を返す
    return [new Date().getFullYear()];
  }

  // start_datetimeから年を抽出し、重複を削除してユニークな年のリストを作成
  const uniqueYears = [
    ...new Set(
      games.map((g) => new Date(g.start_datetime).getFullYear()),
    ),
  ].sort((a, b) => b - a);

  return uniqueYears;
}

export async function fetchPlayerYearlyStats(
  playerId: string,
  teamId: string,
  year: number,
) {
  const supabase = await createClient();

  // 打撃統計を取得
  const { data: battingStats, error: battingError } = await supabase
    .from("mv_player_yearly_stats")
    .select("*")
    .eq("player_id", playerId)
    .eq("team_id", teamId)
    .eq("season_year", year)
    .maybeSingle();

  if (battingError) throw new Error(battingError.message);

  // 投球統計を取得
  const { data: pitchingStats, error: pitchingError } = await supabase
    .from("mv_player_yearly_pitching_stats")
    .select("*")
    .eq("player_id", playerId)
    .eq("team_id", teamId)
    .eq("year", year)
    .maybeSingle();

  if (pitchingError) throw new Error(pitchingError.message);

  // 投球統計のプロパティに接頭辞を付けて衝突を避ける
  const prefixedPitchingStats: Record<string, any> = {};
  if (pitchingStats) {
    Object.keys(pitchingStats).forEach((key) => {
      // team_id, player_id, year は共通なので接頭辞不要
      if (key === "team_id" || key === "player_id" || key === "year") {
        return;
      }
      prefixedPitchingStats[`pitch_${key}`] = pitchingStats[key];
    });
  }

  // 両方のデータをマージして返す
  return {
    ...(battingStats || {}),
    ...prefixedPitchingStats,
  };
}

export async function deleteGoal(
  playerId: string,
  teamId: string,
  year: number,
  goalNo: number,
  remainingGoals: Array<{ goal_no: number; sort: number | null }>,
) {
  const supabase = await createClient();

  // 削除対象のゴールを削除
  const { error: deleteError } = await supabase
    .from("goals")
    .delete()
    .eq("player_id", playerId)
    .eq("team_id", teamId)
    .eq("year", year)
    .eq("goal_no", goalNo);

  if (deleteError) throw new Error(deleteError.message);

  // 残りのゴールのsortを0から連番で設定
  const updatePromises = remainingGoals.map((goal, index) => {
    return supabase
      .from("goals")
      .update({ sort: index })
      .eq("player_id", playerId)
      .eq("team_id", teamId)
      .eq("year", year)
      .eq("goal_no", goal.goal_no);
  });

  const results = await Promise.all(updatePromises);
  for (const result of results) {
    if (result.error) throw new Error(result.error.message);
  }

  revalidatePath("/player/goal");
}
