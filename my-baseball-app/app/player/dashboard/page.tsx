import { createClient } from "@/lib/supabase/server";
import PlayerDashboard from "./components/PlayerDashboard";
import { redirect } from "next/navigation";

export default async function PlayerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/player/login");
  }

  const { data: myTeamId, error: rpcError } =
    await supabase.rpc("get_my_team_id");

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!player) {
    redirect("/player/login");
  }

  // 次の試合情報
  // 次の試合
  const { data: nextGame } = await supabase
    .from("games")
    .select("*,leagues (name),grounds(name),vsteams(name)")
    .gt("start_datetime", new Date().toISOString())
    .order("start_datetime", { ascending: true })
    .limit(1)
    .maybeSingle();

  // 次の試合の出欠
  const { data: nextAttendance } = await supabase
    .from("attendance")
    .select("*")
    .eq("game_id", nextGame?.id)
    .eq("player_id", player.id)
    .limit(1)
    .maybeSingle();

  // 日別打撃成績
  const { data: dailyStatsRaw } = await supabase
    .from("mv_player_daily_stats")
    .select("game_date, h")
    .eq("team_id", myTeamId)
    .eq("player_id", player.id)
    .order("game_date", { ascending: false })
    .limit(5);

  // グラフ用にデータを整形（日付を昇順に並び替え）
  const dailyStats = (dailyStatsRaw || []).reverse().map((stat) => ({
    game: new Date(stat.game_date).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    }),
    hits: stat.h || 0,
  }));

  // 目標情報
  const currentYear = new Date().getFullYear();
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("player_id", player.id)
    .eq("team_id", myTeamId)
    .eq("year", currentYear)
    .order("sort", { ascending: true, nullsFirst: false });

  // 目標分類情報
  const { data: goalsDivisions } = await supabase
    .from("golals_division")
    .select("*")
    .order("goal_group_no", { ascending: true })
    .order("no", { ascending: true });

  // 打撃統計を取得
  const { data: battingStats } = await supabase
    .from("mv_player_yearly_stats")
    .select("*")
    .eq("team_id", myTeamId)
    .eq("player_id", player.id)
    .eq("season_year", currentYear)
    .maybeSingle();

  // 投球統計を取得
  const { data: pitchingStats } = await supabase
    .from("mv_player_yearly_pitching_stats")
    .select("*")
    .eq("team_id", myTeamId)
    .eq("player_id", player.id)
    .eq("year", currentYear)
    .maybeSingle();

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

  // 両方のデータをマージ
  const playerStats = {
    ...(battingStats || {}),
    ...prefixedPitchingStats,
  };

  return (
    <PlayerDashboard
      player={player}
      nextGame={nextGame}
      nextAttendance={nextAttendance}
      dailyStats={dailyStats}
      goals={goals || []}
      goalsDivisions={goalsDivisions || []}
      playerStats={playerStats}
    />
  );
}
