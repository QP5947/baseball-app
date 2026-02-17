import React from "react";
import FrontMenu from "../../components/FrontMenu";
import Footer from "../../components/Footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRate } from "@/utils/rateFormat";
import {
  aggregateBattingRows,
  aggregatePitchingRows,
  buildYearlyTitlesFromDaily,
  groupBattingByYear,
  groupPitchingByYear,
} from "@/utils/statsAggregation";
import ToastRedirect from "@/components/ToastRedirect";

interface Props {
  params: Promise<{
    teamId: string;
    id: string;
  }>;
}

export default async function PlayerDetailPage({ params }: Props) {
  const { teamId, id } = await params;
  const supabase = await createClient();
  const lastYear = new Date().getFullYear() - 1;

  const { data: team } = await supabase
    .from("myteams")
    .select("id, name, team_color, team_logo")
    .eq("id", teamId)
    .single();

  if (!team) {
    return <ToastRedirect message="チームが見つかりません" redirectPath="/" />;
  }

  const { data: player } = await supabase
    .from("players")
    .select("id, no, name, position, comment, list_image, detail_image")
    .eq("team_id", teamId)
    .eq("id", id)
    .eq("show_flg", true)
    .maybeSingle();

  if (!player) {
    return (
      <ToastRedirect
        message="選手が見つかりません"
        redirectPath={`/${teamId}/players`}
      />
    );
  }

  const { data: battingDaily } = await supabase
    .from("mv_player_daily_stats")
    .select("*")
    .eq("team_id", teamId)
    .eq("player_id", player.id)
    .order("game_date", { ascending: false });

  const { data: pitchingDaily } = await supabase
    .from("mv_player_daily_pitching_stats")
    .select("*")
    .eq("team_id", teamId)
    .eq("player_id", player.id)
    .order("game_date", { ascending: false });

  const { data: teamBattingDaily } = await supabase
    .from("mv_player_daily_stats")
    .select("*")
    .eq("team_id", teamId);

  const { data: teamPitchingDaily } = await supabase
    .from("mv_player_daily_pitching_stats")
    .select("*")
    .eq("team_id", teamId);

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

  const teamLogoUrl = getStorageUrl(team.team_logo);
  const playerImageUrl =
    getStorageUrl(player.detail_image, "player_images") ||
    getStorageUrl(player.list_image, "player_images");

  const roles =
    player.position
      ?.split(",")
      .map((value: string) => value.trim())
      .filter(Boolean) || [];

  const formatNumber = (value: number | null | undefined, digits = 0) => {
    if (value === null || value === undefined) return "-";
    return digits > 0 ? value.toFixed(digits) : `${value}`;
  };
  const formatRateOrDash = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return formatRate(value);
  };

  const battingDailyRows = battingDaily || [];
  const battingRows = groupBattingByYear(battingDailyRows);
  const battingTotal = battingDailyRows.length
    ? aggregateBattingRows(battingDailyRows)
    : null;

  const pitchingDailyRows = pitchingDaily || [];
  const pitchingRows = groupPitchingByYear(pitchingDailyRows);
  const pitchingTotal = pitchingDailyRows.length
    ? aggregatePitchingRows(pitchingDailyRows)
    : null;

  const teamTitleRows = buildYearlyTitlesFromDaily(
    teamBattingDaily || [],
    teamPitchingDaily || [],
  );
  const titleBadges = teamTitleRows
    .filter(
      (title) => title.player_id === player.id && title.season_year <= lastYear,
    )
    .sort((a, b) => {
      if (a.season_year !== b.season_year) {
        return b.season_year - a.season_year;
      }
      return a.title_name.localeCompare(b.title_name);
    });

  const hasPitchingStats = pitchingRows.length > 0;
  const hasBattingStats = battingRows.length > 0;

  const themeStyle = {
    "--team-color": team.team_color || "#3b82f6",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800" style={themeStyle}>
      <FrontMenu
        teamName={team.name}
        teamColor={team.team_color || "#3b82f6"}
        teamId={teamId}
        teamLogo={teamLogoUrl}
      />

      <main className="pt-40 md:pt-48 max-w-6xl mx-auto px-4 md:px-6">
        {/* 戻るボタン */}
        <div className="mb-6">
          <Link
            href={`/${teamId}/players`}
            className="inline-flex items-center text-sm font-black text-slate-400 hover:text-(--team-color) transition-colors"
          >
            <span className="mr-2">←</span> 選手一覧
          </Link>
        </div>

        {/* --- 基本プロフィール --- */}
        <section className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-xl border border-slate-100 mb-8 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            <div className="relative w-48 h-48 md:w-96 md:h-96 bg-slate-50 rounded-4xl flex items-center justify-center p-8 shrink-0">
              <span className="absolute top-2 left-4 text-7xl md:text-9xl font-black italic text-slate-200/50">
                {player.no || "-"}
              </span>
              {playerImageUrl ? (
                <img
                  src={playerImageUrl}
                  alt={player.name}
                  className="relative z-10 w-full h-full object-cover object-center rounded-3xl"
                />
              ) : (
                <div className="relative z-10 w-full h-full rounded-3xl bg-linear-to-br from-(--team-color) to-slate-500 flex items-center justify-center">
                  <span className="text-7xl md:text-9xl font-black italic text-white drop-shadow-sm leading-none">
                    {player.name?.trim()?.charAt(0) || "?"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                {roles.length > 0 ? (
                  roles.map((role: string) => (
                    <span
                      key={role}
                      className="bg-blue-50 text-(--team-color) text-[14px] font-black px-4 py-1.5 rounded-full tracking-widest"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="bg-blue-50 text-(--team-color) text-[14px] font-black px-4 py-1.5 rounded-full tracking-widest">
                    -
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
                <span className="text-(--team-color) mr-6 italic">
                  #{player.no || ""}
                </span>
                {player.name}
              </h1>
              <p className="text-slate-500 leading-relaxed font-medium text-sm md:text-base max-w-2xl mb-3">
                {player.comment || ""}
              </p>
              {titleBadges.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                  {titleBadges.map((title, index) => (
                    <span
                      key={`${title.season_year || "year"}-${title.title_name || "title"}-${index}`}
                      className="bg-amber-500 text-white text-[14px] font-medium px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap"
                    >
                      🏆 {title.title_name} ({title.season_year})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {hasBattingStats && (
          <section className="bg-white rounded-4xl p-6 md:p-8 mb-5 shadow-sm border border-slate-100 overflow-hidden">
            <h4 className="flex items-center gap-2 text-xl font-black mb-6 text-blue-600">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              打者成績（年度別）
            </h4>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-center min-w-200">
                <thead className="bg-slate-50 text-slate-400 font-bold tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="p-4 text-left">年度</th>
                    <th className="p-4">打率</th>
                    <th className="p-4">試合</th>
                    <th className="p-4">打数</th>
                    <th className="p-4">安打</th>
                    <th className="p-4">本塁打</th>
                    <th className="p-4">打点</th>
                    <th className="p-4">四死球</th>
                    <th className="p-4">三振</th>
                    <th className="p-4">出塁率</th>
                    <th className="p-4">OPS</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-700 italic">
                  {battingRows.map((h, i) => (
                    <tr
                      key={`${h.season_year || "year"}-${i}`}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 text-left not-italic font-black text-slate-400">
                        {h.season_year || "-"}
                      </td>
                      <td className="p-4 text-blue-600 text-lg">
                        {formatRateOrDash(h.avg)}
                      </td>
                      <td>{formatNumber(h.g_count)}</td>
                      <td>{formatNumber(h.ab)}</td>
                      <td>{formatNumber(h.h)}</td>
                      <td>{formatNumber(h.hr)}</td>
                      <td>{formatNumber(h.rbi)}</td>
                      <td>{formatNumber(h.bb_hbp)}</td>
                      <td>{formatNumber(h.so)}</td>
                      <td>{formatRateOrDash(h.obp)}</td>
                      <td>{formatRateOrDash(h.ops)}</td>
                    </tr>
                  ))}
                </tbody>
                {battingTotal && (
                  <tfoot className="bg-blue-50/50 font-black italic text-slate-900 border-t-2 border-blue-100">
                    <tr>
                      <td className="p-4 text-left not-italic text-blue-600">
                        通算
                      </td>
                      <td className="p-4 text-blue-600 text-xl">
                        {formatRateOrDash(battingTotal.avg)}
                      </td>
                      <td>{formatNumber(battingTotal.g_count)}</td>
                      <td>{formatNumber(battingTotal.ab)}</td>
                      <td>{formatNumber(battingTotal.h)}</td>
                      <td>{formatNumber(battingTotal.hr)}</td>
                      <td>{formatNumber(battingTotal.rbi)}</td>
                      <td>{formatNumber(battingTotal.bb_hbp)}</td>
                      <td>{formatNumber(battingTotal.so)}</td>
                      <td>{formatRateOrDash(battingTotal.obp)}</td>
                      <td>{formatRateOrDash(battingTotal.ops)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        )}

        {hasPitchingStats && (
          <section className="bg-white rounded-4xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8 overflow-hidden">
            <h4 className="flex items-center gap-2 text-xl font-black mb-6 text-red-500">
              <span className="w-1.5 h-6 bg-red-500 rounded-full"></span>
              投手成績（年度別）
            </h4>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-center min-w-200">
                <thead className="bg-slate-50 text-slate-400 font-bold tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="p-4 text-left">年度</th>
                    <th className="p-4">防御率</th>
                    <th className="p-4">登板</th>
                    <th className="p-4">勝利</th>
                    <th className="p-4">敗戦</th>
                    <th className="p-4">セーブ</th>
                    <th className="p-4">投球回</th>
                    <th className="p-4">奪三振</th>
                    <th className="p-4">四球</th>
                    <th className="p-4">被安打</th>
                    <th className="p-4">自責点</th>
                    <th className="p-4">WHIP</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-700 italic">
                  {pitchingRows.map((h, i) => (
                    <tr
                      key={`${h.year || "year"}-${i}`}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 text-left not-italic font-black text-slate-400">
                        {h.year || "-"}
                      </td>
                      <td className="p-4 text-red-600 text-lg">
                        {formatRateOrDash(h.era)}
                      </td>
                      <td>{formatNumber(h.appearances)}</td>
                      <td>{formatNumber(h.wins)}</td>
                      <td>{formatNumber(h.losses)}</td>
                      <td>{formatNumber(h.sv)}</td>
                      <td>{formatNumber(h.ip, 1)}</td>
                      <td>{formatNumber(h.so)}</td>
                      <td>{formatNumber(h.bb)}</td>
                      <td>{formatNumber(h.h)}</td>
                      <td>{formatNumber(h.er)}</td>
                      <td>{formatRateOrDash(h.whip)}</td>
                    </tr>
                  ))}
                </tbody>
                {pitchingTotal && (
                  <tfoot className="bg-red-50/50 font-black italic text-slate-900 border-t-2 border-red-100">
                    <tr>
                      <td className="p-4 text-left not-italic text-red-600">
                        通算
                      </td>
                      <td className="p-4 text-red-600 text-xl">
                        {formatRateOrDash(pitchingTotal.era)}
                      </td>
                      <td>{formatNumber(pitchingTotal.appearances)}</td>
                      <td>{formatNumber(pitchingTotal.wins)}</td>
                      <td>{formatNumber(pitchingTotal.losses)}</td>
                      <td>{formatNumber(pitchingTotal.sv)}</td>
                      <td>{formatNumber(pitchingTotal.ip, 1)}</td>
                      <td>{formatNumber(pitchingTotal.so)}</td>
                      <td>{formatNumber(pitchingTotal.bb)}</td>
                      <td>{formatNumber(pitchingTotal.h)}</td>
                      <td>{formatNumber(pitchingTotal.er)}</td>
                      <td>{formatRateOrDash(pitchingTotal.whip)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
