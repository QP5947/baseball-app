import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GoalSettingForm from "./components/GoalSettingForm";
import {
  fetchGoalsDivisions,
  fetchPlayerGoals,
  getAvailableYears,
  fetchPlayerYearlyStats,
} from "./actions";

export default async function PlayerGoalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/player/login");
  }

  const { data: player } = await supabase
    .from("players")
    .select("id, name, no")
    .eq("user_id", user.id)
    .single();

  if (!player) {
    redirect("/player/login");
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

  return (
    <GoalSettingForm
      playerNo={player.no || null}
      playerName={player.name}
      playerId={player.id}
      teamId={myTeamId}
      goalsDivisions={goalsDivisions}
      initialGoals={initialGoals}
      availableYears={availableYears}
      defaultYear={defaultYear}
      playerStats={playerStats}
    />
  );
}
