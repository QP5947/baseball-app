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
    .eq("team_id", player.team_id)
    .eq("player_id", player.id)
    .gte("game_date", `${year}-01-01`)
    .lte("game_date", `${year}-12-31`)
    .order("start_datetime", { ascending: true });

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
    .eq("team_id", player.team_id)
    .eq("player_id", player.id)
    .gte("game_date", `${year}-01-01`)
    .lte("game_date", `${year}-12-31`)
    .order("start_datetime", { ascending: true });

  if (error) {
    console.error("Error fetching pitching stats:", error);
    return { stats: [], teamId: player.team_id };
  }

  return { stats: pitchingStats || [], teamId: player.team_id };
}

// チーム平均（打撃）を取得
export async function getTeamBattingAverage(teamId: string, year: number) {
  const supabase = await createClient();

  const { data: teamDailyStats, error } = await supabase
    .from("mv_player_daily_stats")
    .select("game_date, h, rbi, hr, ab") // Select fields for all metrics
    .eq("team_id", teamId)
    .gte("game_date", `${year}-01-01`)
    .lte("game_date", `${year}-12-31`);

  if (error) {
    console.error("Error fetching team batting average:", error);
    return [];
  }
  if (!teamDailyStats) {
    return [];
  }

  // 1. Sum up all stats for the entire team for each day.
  const dailyTeamTotals: {
    [date: string]: { h: number; rbi: number; hr: number; ab: number };
  } = {};
  teamDailyStats.forEach((stat) => {
    const date = stat.game_date;
    if (!dailyTeamTotals[date]) {
      dailyTeamTotals[date] = { h: 0, rbi: 0, hr: 0, ab: 0 };
    }
    dailyTeamTotals[date].h += stat.h || 0;
    dailyTeamTotals[date].rbi += stat.rbi || 0;
    dailyTeamTotals[date].hr += stat.hr || 0;
    dailyTeamTotals[date].ab += stat.ab || 0;
  });

  const sortedDates = Object.keys(dailyTeamTotals).sort();

  let cumulativeH = 0;
  let cumulativeRbi = 0;
  let cumulativeHr = 0;
  let cumulativeTeamAb = 0;
  let cumulativeTeamH = 0;
  let dayCount = 0;
  const result = [];

  for (const date of sortedDates) {
    dayCount++;
    const dailyTotals = dailyTeamTotals[date];
    cumulativeH += dailyTotals.h;
    cumulativeRbi += dailyTotals.rbi;
    cumulativeHr += dailyTotals.hr;
    cumulativeTeamH += dailyTotals.h;
    cumulativeTeamAb += dailyTotals.ab;

    result.push({
      game_date: date,
      h: cumulativeH / dayCount,
      rbi: cumulativeRbi / dayCount,
      hr: cumulativeHr / dayCount,
      avg: cumulativeTeamAb > 0 ? cumulativeTeamH / cumulativeTeamAb : 0,
    });
  }

  return result;
}

// チーム平均（投手）を取得
export async function getTeamPitchingAverage(teamId: string, year: number) {
  const supabase = await createClient();

  const { data: teamDailyPitchingStats, error } = await supabase
    .from("mv_player_daily_pitching_stats")
    .select("game_date, so, ip, er, h, bb") // and other fields for whip
    .eq("team_id", teamId)
    .gte("game_date", `${year}-01-01`)
    .lte("game_date", `${year}-12-31`);

  if (error) {
    console.error("Error fetching team pitching average:", error);
    return [];
  }
  if (!teamDailyPitchingStats) {
    return [];
  }

  const dailyTeamTotals: {
    [date: string]: {
      so: number;
      outs: number;
      er: number;
      h: number;
      bb: number;
    };
  } = {};

  teamDailyPitchingStats.forEach((stat) => {
    const date = stat.game_date;
    if (!dailyTeamTotals[date]) {
      dailyTeamTotals[date] = { so: 0, outs: 0, er: 0, h: 0, bb: 0 };
    }
    const ip_outs =
      Math.floor(stat.ip || 0) * 3 + Math.round(((stat.ip || 0) % 1) * 10);
    dailyTeamTotals[date].so += stat.so || 0;
    dailyTeamTotals[date].outs += ip_outs;
    dailyTeamTotals[date].er += stat.er || 0;
    dailyTeamTotals[date].h += stat.h || 0;
    dailyTeamTotals[date].bb += stat.bb || 0;
  });

  const sortedDates = Object.keys(dailyTeamTotals).sort();

  let cumulativeSo = 0;
  let cumulativeOuts = 0;
  let cumulativeEr = 0;
  let cumulativeH = 0;
  let cumulativeBb = 0;
  let dayCount = 0;
  const result = [];

  for (const date of sortedDates) {
    dayCount++;
    const dailyTotals = dailyTeamTotals[date];
    cumulativeSo += dailyTotals.so;
    cumulativeOuts += dailyTotals.outs;
    cumulativeEr += dailyTotals.er;
    cumulativeH += dailyTotals.h;
    cumulativeBb += dailyTotals.bb;

    const cumulativeInnings = cumulativeOuts / 3;

    const avgOutsPerDay = cumulativeOuts / dayCount;
    const avgIpPerDay =
      Math.floor(avgOutsPerDay / 3) + (Math.round(avgOutsPerDay) % 3) / 10;

    result.push({
      game_date: date,
      so: cumulativeSo / dayCount,
      ip: avgIpPerDay,
      era: cumulativeInnings > 0 ? (cumulativeEr * 9) / cumulativeInnings : 0,
      whip:
        cumulativeInnings > 0
          ? (cumulativeH + cumulativeBb) / cumulativeInnings
          : 0,
    });
  }
  return result;
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
