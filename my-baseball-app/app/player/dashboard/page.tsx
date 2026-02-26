"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import PlayerDashboard from "./components/PlayerDashboard";
import {
  aggregateBattingRows,
  aggregatePitchingRows,
  type PitchingAggregate,
} from "@/utils/statsAggregation";

export default function PlayerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardProps, setDashboardProps] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/player/login");
        return;
      }

      const { data: player } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (!player) {
        router.push("/player/login");
        return;
      }

      const { data: myTeamId } = await supabase.rpc("get_my_team_id");

      // 次の試合情報
      const { data: nextGame } = await supabase
        .from("games")
        .select("*,leagues (name),grounds(name),vsteams(name)")
        .eq("team_id", myTeamId)
        .gt("start_datetime", new Date().toISOString())
        .order("start_datetime", { ascending: true })
        .limit(1)
        .maybeSingle();

      // 次の試合の出欠
      const { data: nextAttendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("team_id", myTeamId)
        .eq("game_id", nextGame?.id)
        .eq("player_id", player.id)
        .limit(1)
        .maybeSingle();

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

      // 打撃統計を取得（daily MVをフロント集計）
      const { data: battingDailyStats } = await supabase
        .from("mv_player_daily_stats")
        .select("*")
        .eq("team_id", myTeamId)
        .eq("player_id", player.id)
        .gte("game_date", `${currentYear}-01-01`)
        .lte("game_date", `${currentYear}-12-31`);

      // グラフ用に日ごとの安打数を集計
      const statsByDate: Map<string, number> = new Map();
      if (battingDailyStats) {
        battingDailyStats.forEach((row) => {
          const date = row.game_date;
          statsByDate.set(date, (statsByDate.get(date) || 0) + (row.h || 0));
        });
      }

      const sortedDates = Array.from(statsByDate.keys()).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      );

      const dailyStats = sortedDates.map((date) => ({
        game: new Date(date).toLocaleDateString("ja-JP", {
          month: "numeric",
          day: "numeric",
        }),
        hits: statsByDate.get(date) || 0,
      }));

      // 投球統計を取得（daily MVをフロント集計）
      const { data: pitchingDailyStats } = await supabase
        .from("mv_player_daily_pitching_stats")
        .select("*")
        .eq("team_id", myTeamId)
        .eq("player_id", player.id)
        .gte("game_date", `${currentYear}-01-01`)
        .lte("game_date", `${currentYear}-12-31`);

      const battingStats = aggregateBattingRows(battingDailyStats || []);
      const pitchingStats = aggregatePitchingRows(pitchingDailyStats || []);

      // 投球統計のプロパティに接頭辞を付けて衝突を避ける
      const prefixedPitchingStats: Record<string, any> = {};
      if ((pitchingDailyStats || []).length > 0) {
        Object.keys(pitchingStats).forEach((key) => {
          const typedKey = key as keyof PitchingAggregate;
          // team_id, player_id, year は共通なので接頭辞不要
          if (key === "team_id" || key === "player_id" || key === "year") {
            return;
          }
          prefixedPitchingStats[`pitch_${key}`] = pitchingStats[typedKey];
        });
      }

      // 両方のデータをマージ
      const playerStats = {
        ...(battingStats || {}),
        ...prefixedPitchingStats,
      };

      setDashboardProps({
        player,
        nextGame,
        nextAttendance,
        dailyStats,
        goals: goals || [],
        goalsDivisions: goalsDivisions || [],
        playerStats,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!dashboardProps) {
    return (
      <div className="text-center py-8">データの読み込みに失敗しました</div>
    );
  }

  return <PlayerDashboard {...dashboardProps} />;
}
