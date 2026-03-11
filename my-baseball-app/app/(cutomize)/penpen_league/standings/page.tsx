"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  computeStandings,
  fetchPenpenMasters,
  fetchPenpenScheduleEntries,
  type TeamStanding,
} from "../lib/penpenData";
import {
  fetchPenpenHeaderImageUrl,
  PENPEN_DEFAULT_HEADER_IMAGE,
  resolvePenpenImageUrl,
} from "../lib/penpenStorage";

type TournamentImage = {
  id: string;
  leagueName: string;
  imagePath: string;
};

export default function StandingsPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState("standings");
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [tournaments, setTournaments] = useState<TournamentImage[]>([]);
  const [headerImageUrl, setHeaderImageUrl] = useState(
    PENPEN_DEFAULT_HEADER_IMAGE,
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [
          { teams: teamData },
          entries,
          tournamentRes,
          leagueRes,
          nextHeaderImageUrl,
        ] = await Promise.all([
          fetchPenpenMasters(supabase),
          fetchPenpenScheduleEntries(supabase),
          supabase
            .schema("penpen")
            .from("tournaments")
            .select("id, league_id, image_path")
            .order("sort_order", { ascending: true }),
          supabase.schema("penpen").from("leagues").select("id, name"),
          fetchPenpenHeaderImageUrl(supabase),
        ]);

        const enabledTeams = teamData.filter((item) => item.isEnabled);
        setStandings(computeStandings(entries, enabledTeams));

        const leagueNameMap = new Map(
          (leagueRes.data ?? []).map((l) => [l.id, l.name]),
        );
        setTournaments(
          (tournamentRes.data ?? []).map((item) => ({
            id: item.id,
            leagueName: leagueNameMap.get(item.league_id) ?? "トーナメント",
            imagePath: resolvePenpenImageUrl(supabase, item.image_path),
          })),
        );
        setHeaderImageUrl(nextHeaderImageUrl);
      } catch (error) {
        window.alert(
          `勝敗表データの取得に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    };

    void load();
  }, [supabase]);

  const orderedTeams = useMemo(
    () => standings.map((item) => item),
    [standings],
  );

  const getResultSymbol = (res: number | null) => {
    switch (res) {
      case 1:
        return <span className="text-blue-600 font-black text-lg">○</span>;
      case 2:
        return <span className="text-rose-400 font-black text-lg">●</span>;
      case 3:
        return <span className="text-slate-400 font-black text-lg">△</span>;
      default:
        return <span className="text-slate-200">-</span>;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="relative h-48 md:h-64 flex items-center justify-center overflow-hidden">
        <Image
          src={headerImageUrl}
          alt="PENPEN LEAGUE ヘッダー画像"
          fill
          sizes="100vw"
          unoptimized
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-blue-900/60 z-10"></div>
        <div className="relative z-30 text-center">
          <h1 className="text-4xl md:text-6xl font-black italic text-white drop-shadow-lg">
            PENPEN LEAGUE
          </h1>
          <p className="text-white font-bold text-lg md:text-xl mt-2">
            リーグ戦勝敗表
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <Link
          href="./"
          className="inline-flex items-center gap-2 mb-6 font-bold text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={20} /> ホームへ戻る
        </Link>

        <section className="space-y-6 mb-20">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
            リーグ戦
          </h1>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("standings")}
              className={`py-2 px-4 font-bold cursor-pointer ${
                activeTab === "standings"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              順位表
            </button>
            <button
              onClick={() => setActiveTab("crosstable")}
              className={`py-2 px-4 font-bold cursor-pointer ${
                activeTab === "crosstable"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              対戦成績
            </button>
          </div>

          <div className="bg-white rounded-b-lg shadow-xl border border-blue-100 overflow-hidden">
            <div className="p-4 md:p-8">
              {activeTab === "standings" ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white tracking-[0.2em]">
                        <th className="p-3 border border-slate-700 text-center w-12">
                          順位
                        </th>
                        <th className="p-3 border border-slate-700 text-left w-40 whitespace-nowrap">
                          チーム名
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200 whitespace-nowrap">
                          試合
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200">
                          勝
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200">
                          敗
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200">
                          分
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-16 text-blue-200 whitespace-nowrap">
                          勝率
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-amber-600 w-16 whitespace-nowrap">
                          勝ち点
                        </th>
                        <th className="p-3 border border-slate-700 text-center w-16 whitespace-nowrap">
                          得失点
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-bold">
                      {orderedTeams.map((team, idx) => (
                        <tr
                          key={team.teamId}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="p-3 border border-slate-100 text-center italic font-black text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-3 border border-slate-100 text-slate-800">
                            {team.name}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.g}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.w}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.l}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.d}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-500 font-mono">
                            {(team.w + team.l > 0
                              ? team.w / (team.w + team.l)
                              : 0
                            )
                              .toFixed(3)
                              .substring(1)}
                          </td>
                          <td className="p-3 border border-slate-100 text-center bg-amber-50 text-amber-700 text-xl font-black">
                            {team.pts}
                          </td>
                          <td
                            className={`p-3 border border-slate-100 text-center font-black ${
                              team.diff >= 0
                                ? "text-emerald-500"
                                : "text-rose-400"
                            }`}
                          >
                            {team.diff > 0 ? `+${team.diff}` : team.diff}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white tracking-[0.2em]">
                        <th className="p-3 border border-slate-700 text-center w-12">
                          順位
                        </th>
                        <th className="p-3 border border-slate-700 text-left w-40 whitespace-nowrap">
                          チーム名
                        </th>
                        {orderedTeams.map((team) => (
                          <th
                            key={team.teamId}
                            className="p-3 border border-slate-700 text-center w-20 whitespace-nowrap"
                          >
                            {team.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-bold">
                      {orderedTeams.map((team, idx) => (
                        <tr
                          key={team.teamId}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="p-3 border border-slate-100 text-center italic font-black text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-3 border border-slate-100 text-slate-800">
                            {team.name}
                          </td>
                          {orderedTeams.map((opponent) => {
                            const value =
                              team.teamId === opponent.teamId
                                ? null
                                : (team.resultByTeamId[opponent.teamId] ??
                                  null);
                            return (
                              <td
                                key={`${team.teamId}_${opponent.teamId}`}
                                className={`p-3 border border-slate-100 text-center text-xs ${
                                  team.teamId === opponent.teamId
                                    ? "bg-slate-200"
                                    : ""
                                }`}
                              >
                                {getResultSymbol(value)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="bg-slate-50 p-4 text-slate-400 font-bold flex flex-wrap gap-x-6 gap-y-2 justify-center border-t border-slate-100">
              <div className="flex items-center gap-1">
                <span className="text-blue-600 text-lg">○</span> 勝ち
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-lg">△</span> 引き分け
              </div>
              <div className="flex items-center gap-1">
                <span className="text-rose-400 text-lg">●</span> 負け
              </div>
            </div>
          </div>
        </section>

        {tournaments.length > 0 ? (
          <>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-5">
              トーナメント
            </h1>

            <div className="space-y-4">
              {tournaments.map((item) => (
                <section
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6"
                >
                  <h2 className="text-xl font-black text-gray-900 mb-4">
                    {item.leagueName}
                  </h2>
                  <Image
                    src={item.imagePath}
                    alt={item.leagueName}
                    width={1200}
                    height={675}
                    unoptimized
                    className="w-full rounded-xl border border-gray-200 bg-white object-contain"
                  />
                </section>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
