import React from "react";
import FrontMenu from "../components/FrontMenu";
import Footer from "../components/Footer";
import { fetchGamesForMonth, fetchAvailableYears } from "./actions";
import { createClient } from "@/lib/supabase/server";
import GamesContent from "./components/GamesContent";
import YearSelector from "./components/YearSelector";

interface GamesPageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function GamesPage({
  params,
  searchParams,
}: GamesPageProps) {
  const { teamId } = await params;
  const searchParamsData = await searchParams;

  const supabase = await createClient();

  // 現在の日付を取得
  const now = new Date();
  const displayYear = parseInt(
    searchParamsData.year || now.getFullYear().toString(),
  );
  const displayMonth = parseInt(
    searchParamsData.month || now.getMonth().toString(),
  );

  // 該当月のゲームデータを取得
  const games = await fetchGamesForMonth(teamId, displayYear, displayMonth);

  // 利用可能な年度リストを取得
  const availableYears = await fetchAvailableYears(teamId);

  // チームの設定情報を取得
  const { data: teamInfo } = await supabase
    .from("myteams")
    .select("name,team_color,team_logo")
    .eq("id", teamId)
    .single();

  const getStorageUrl = (
    path: string | null,
    bucket: string = "team_assets",
  ) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  };

  const teamLogoUrl = getStorageUrl(teamInfo?.team_logo || null);
  const primaryColor = teamInfo?.team_color || "#3b82f6";

  const teamSettings = {
    primaryColor,
    victoryColor: "#ef4444",
    loseColor: "#64748b",
    drawColor: "#f59e0b",
    teamName: teamInfo?.name || "チーム",
  };

  return (
    <div
      className="min-h-screen bg-gray-50 text-slate-800"
      style={
        {
          "--team-color": teamSettings.primaryColor,
          "--victory-color": teamSettings.victoryColor,
        } as React.CSSProperties
      }
    >
      <FrontMenu
        teamName={teamSettings.teamName}
        teamColor={primaryColor}
        teamId={teamId}
        teamLogo={teamLogoUrl}
      />

      <main className="pt-40 md:pt-48 max-w-6xl mx-auto px-6 pb-20">
        <div className="flex flex-row justify-between items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <YearSelector
                displayYear={displayYear}
                displayMonth={displayMonth}
                availableYears={availableYears}
                primaryColor={teamSettings.primaryColor}
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="w-2 h-10 bg-(--team-color) rounded-full"></span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
                試合予定・結果
              </h2>
            </div>
          </div>
        </div>

        <GamesContent
          games={games}
          displayYear={displayYear}
          displayMonth={displayMonth}
          availableYears={availableYears}
          teamId={teamId}
          primaryColor={teamSettings.primaryColor}
          victoryColor={teamSettings.victoryColor}
          loseColor={teamSettings.loseColor}
          drawColor={teamSettings.drawColor}
        />
      </main>
      <Footer />
    </div>
  );
}
