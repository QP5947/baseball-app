"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import GoalSettingForm from "./components/GoalSettingForm";
import {
  fetchGoalsDivisions,
  fetchPlayerGoals,
  getAvailableYears,
  fetchPlayerYearlyStats,
} from "./actions";

export default function PlayerGoalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formProps, setFormProps] = useState<any>(null);

  useEffect(() => {
    loadGoalPageData();
  }, []);

  const loadGoalPageData = async () => {
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
        .select("id, name, no")
        .eq("user_id", user.id)
        .single();

      if (!player) {
        router.push("/player/login");
        return;
      }

      const { data: myTeamId } = await supabase.rpc("get_my_team_id");

      // データ取得
      const [goalsDivisions, availableYears] = await Promise.all([
        fetchGoalsDivisions(),
        getAvailableYears(player.id, myTeamId),
      ]);

      // デフォルトは現在の年度、または利用可能な年度の最新
      const currentYear = new Date().getFullYear();
      const defaultYear = availableYears.includes(currentYear)
        ? currentYear
        : availableYears[0] || currentYear;

      const [initialGoals, playerStats] = await Promise.all([
        fetchPlayerGoals(player.id, myTeamId, defaultYear),
        fetchPlayerYearlyStats(player.id, myTeamId, defaultYear),
      ]);

      setFormProps({
        playerNo: player.no || null,
        playerName: player.name,
        playerId: player.id,
        teamId: myTeamId,
        goalsDivisions,
        initialGoals,
        availableYears,
        defaultYear,
        playerStats,
      });
    } catch (error) {
      console.error("Error loading goal page data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!formProps) {
    return (
      <div className="text-center py-8">データの読み込みに失敗しました</div>
    );
  }

  return <GoalSettingForm {...formProps} />;
}
