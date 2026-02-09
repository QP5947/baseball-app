"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// 打撃成績（日別）を取得
export async function getBattingStats(year: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/player/login");
  }

  const { data: player } = await supabase
    .from("players")
    .select("id, team_id")
    .eq("user_id", user.id)
    .single();

  if (!player) {
    redirect("/player/login");
  }

  // 指定年度の打撃成績を取得
  const { data: battingStats, error } = await supabase
    .from("mv_player_daily_stats")
    .select("*")
    .eq("player_id", player.id)
    .gte("game_date", `${year}-01-01`)
    .lte("game_date", `${year}-12-31`)
    .order("game_date", { ascending: true });

  if (error) {
    console.error("Error fetching batting stats:", error);
    return { stats: [], teamId: player.team_id };
  }

  return { stats: battingStats || [], teamId: player.team_id };
}

// 投手成績（日別）を取得
export async function getPitchingStats(year: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/player/login");
  }

  const { data: player } = await supabase
    .from("players")
    .select("id, team_id")
    .eq("user_id", user.id)
    .single();

  if (!player) {
    redirect("/player/login");
  }

  // 指定年度の投手成績を取得
  const { data: pitchingStats, error } = await supabase
    .from("mv_player_daily_pitching_stats")
    .select("*")
    .eq("player_id", player.id)
    .gte("game_date", `${year}-01-01`)
    .lte("game_date", `${year}-12-31`)
    .order("game_date", { ascending: true });

  if (error) {
    console.error("Error fetching pitching stats:", error);
    return { stats: [], teamId: player.team_id };
  }

  return { stats: pitchingStats || [], teamId: player.team_id };
}

// チーム平均（打撃）を取得
export async function getTeamBattingAverage(teamId: string, year: number) {
  const supabase = await createClient();

  const { data: teamStats, error } = await supabase
    .from("mv_player_daily_stats")
    .select("game_date, avg, h, hr, rbi")
    .eq("team_id", teamId)
    .gte("game_date", `${year}-01-01`)
    .lte("game_date", `${year}-12-31`);

  if (error) {
    console.error("Error fetching team batting average:", error);
    return [];
  }

  // 日付ごとにグループ化して平均を計算
  const groupedByDate: Record<
    string,
    { avg: number; h: number; hr: number; rbi: number; count: number }
  > = {};

  teamStats?.forEach((stat) => {
    const date = stat.game_date;
    if (!groupedByDate[date]) {
      groupedByDate[date] = { avg: 0, h: 0, hr: 0, rbi: 0, count: 0 };
    }
    groupedByDate[date].avg += stat.avg || 0;
    groupedByDate[date].h += stat.h || 0;
    groupedByDate[date].hr += stat.hr || 0;
    groupedByDate[date].rbi += stat.rbi || 0;
    groupedByDate[date].count += 1;
  });

  return Object.entries(groupedByDate).map(([date, values]) => ({
    game_date: date,
    avg: values.avg / values.count,
    h: values.h / values.count,
    hr: values.hr / values.count,
    rbi: values.rbi / values.count,
  }));
}

// チーム平均（投手）を取得
export async function getTeamPitchingAverage(teamId: string, year: number) {
  const supabase = await createClient();

  const { data: teamStats, error } = await supabase
    .from("mv_player_daily_pitching_stats")
    .select("game_date, era, whip, so, ip")
    .eq("team_id", teamId)
    .gte("game_date", `${year}-01-01`)
    .lte("game_date", `${year}-12-31`);

  if (error) {
    console.error("Error fetching team pitching average:", error);
    return [];
  }

  // 日付ごとにグループ化して平均を計算
  const groupedByDate: Record<
    string,
    { era: number; whip: number; so: number; ip: number; count: number }
  > = {};

  teamStats?.forEach((stat) => {
    const date = stat.game_date;
    if (!groupedByDate[date]) {
      groupedByDate[date] = { era: 0, whip: 0, so: 0, ip: 0, count: 0 };
    }
    groupedByDate[date].era += stat.era || 0;
    groupedByDate[date].whip += stat.whip || 0;
    groupedByDate[date].so += stat.so || 0;
    groupedByDate[date].ip += stat.ip || 0;
    groupedByDate[date].count += 1;
  });

  return Object.entries(groupedByDate).map(([date, values]) => ({
    game_date: date,
    era: values.era / values.count,
    whip: values.whip / values.count,
    so: values.so / values.count,
    ip: values.ip / values.count,
  }));
}

// 投手成績が存在するかチェック
export async function hasPitchingStats() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!player) {
    return false;
  }

  const { data, error } = await supabase
    .from("mv_player_daily_pitching_stats")
    .select("player_id")
    .eq("player_id", player.id)
    .limit(1)
    .maybeSingle();

  return !!data;
}

// 試合データがある年度一覧を取得
export async function getAvailableYears() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data: player } = await supabase
    .from("players")
    .select("id, team_id")
    .eq("user_id", user.id)
    .single();

  if (!player) {
    return [];
  }

  // gamesテーブルからチームの試合を取得
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("start_datetime")
    .eq("team_id", player.team_id)
    .order("start_datetime", { ascending: false });

  if (gamesError || !games) {
    return [];
  }

  // ユニークな年度を抽出
  const years = new Set<number>();
  games.forEach((game: any) => {
    const year = new Date(game.start_datetime).getFullYear();
    years.add(year);
  });

  return Array.from(years).sort((a, b) => b - a);
}

// プレイヤー情報を取得
export async function getPlayerInfo() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: player, error } = await supabase
    .from("players")
    .select("no, name")
    .eq("user_id", user.id)
    .single();

  if (error || !player) {
    return null;
  }

  return player;
}
