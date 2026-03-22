import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Trophy,
  MapPin,
  Clock,
  ChevronRight,
  FileText,
  DoorOpen,
  DoorClosedLocked,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  fetchPenpenMasters,
  fetchPenpenScheduleEntries,
  toDisplayDate,
} from "./lib/penpenData";
import { fetchPenpenHeaderImageUrl } from "./lib/penpenStorage";

const DEFAULT_LEAGUE_ID = "1b8cbac7-ab3f-4006-bcad-d4db00e7e65c";

type PenpenGame = {
  awayScore: number | null;
  homeScore: number | null;
  isCanceled: boolean;
  forfeitWinner: "away" | "home" | null;
};

const hasScoredGame = (date: { games: PenpenGame[] }) =>
  date.games.some(
    (game) =>
      game.forfeitWinner !== null ||
      game.isCanceled ||
      (game.awayScore !== null && game.homeScore !== null),
  );

const isPendingGame = (game: PenpenGame) =>
  !game.isCanceled &&
  game.forfeitWinner === null &&
  (game.awayScore === null || game.homeScore === null);

const getPreviousResultTone = (game: PenpenGame) => {
  if (game.isCanceled) {
    return { away: "text-gray-500", home: "text-gray-500" };
  }

  if (game.forfeitWinner === "away") {
    return { away: "text-blue-700", home: "text-slate-400" };
  }

  if (game.forfeitWinner === "home") {
    return { away: "text-slate-400", home: "text-blue-700" };
  }

  if (game.awayScore !== null && game.homeScore !== null) {
    if (game.awayScore > game.homeScore) {
      return { away: "text-blue-700", home: "text-slate-400" };
    }

    if (game.awayScore < game.homeScore) {
      return { away: "text-slate-400", home: "text-blue-700" };
    }

    return { away: "text-gray-500", home: "text-gray-500" };
  }

  return { away: "text-gray-800", home: "text-gray-800" };
};

export const metadata: Metadata = {
  title: { absolute: "ペンペンリーグ" },
};

export default async function HomePage() {
  const supabase = await createClient();
  const [entries, headerImageUrl, masters] = await Promise.all([
    fetchPenpenScheduleEntries(supabase),
    fetchPenpenHeaderImageUrl(supabase),
    fetchPenpenMasters(supabase),
  ]);
  const leagueNameById = new Map(
    masters.leagues.map((league) => [league.id, league.name]),
  );
  const getCompetitionLabels = (game: {
    gameType: string;
    leagueId: string | null;
    tournamentDisplayName: string | null;
  }) => {
    if (!game.leagueId || game.leagueId === DEFAULT_LEAGUE_ID) {
      return null;
    }

    const leagueLabel = leagueNameById.get(game.leagueId) ?? "-";
    const tournamentLabel =
      game.gameType === "トーナメント" ? game.tournamentDisplayName : null;

    return {
      leagueLabel,
      tournamentLabel,
    };
  };

  const today = new Date().toISOString().slice(0, 10);

  const previousEntry = [...entries]
    .filter((entry) => entry.date <= today)
    .reverse()
    .find((entry) => hasScoredGame(entry));

  const nextEntry = entries.find(
    (entry) =>
      entry.date >= today &&
      !hasScoredGame(entry) &&
      entry.games.some(isPendingGame),
  );

  const pendingNextGames = nextEntry
    ? nextEntry.games
        .map((game, originalIndex) => ({ game, originalIndex }))
        .filter(({ game }) => isPendingGame(game))
    : [];

  const previousEntryRestTeams = (previousEntry?.restTeams ?? []).filter(
    (team) => team.trim().length > 0,
  );

  const nextEntryRestTeams = (nextEntry?.restTeams ?? []).filter(
    (team) => team.trim().length > 0,
  );

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
          <h1 className="text-4xl md:text-6xl font-black italic text-white drop-shadow-lg whitespace-nowrap">
            PENPEN LEAGUE
          </h1>
          <p className="text-white font-bold text-lg md:text-xl mt-2">
            ペンペンリーグ 公式サイト
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10">
        <div className="flex flex-wrap justify-center gap-4 py-2 border-y border-gray-200 bg-white shadow-sm -mx-4 px-4 md:mx-0 md:rounded-xl">
          <Link
            href="/penpen_league/rules"
            className="flex items-center gap-2 py-3 px-6 text-orange-700 hover:bg-orange-50 rounded-full transition-colors font-bold text-lg md:text-xl"
          >
            <FileText size={24} />
            <span>大会規定・ルール</span>
          </Link>

          <Link
            href="/penpen_league/stadiums"
            className="flex items-center gap-2 py-3 px-6 text-blue-700 hover:bg-blue-50 rounded-full transition-colors font-bold text-lg md:text-xl"
          >
            <MapPin size={24} />
            <span>球場案内</span>
          </Link>
        </div>

        <nav className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/penpen_league/schedule"
            className="group flex items-center justify-between bg-white border-4 border-blue-600 p-8 rounded-3xl shadow-md hover:bg-blue-600 transition-all"
          >
            <div className="flex items-center space-x-6">
              <Calendar
                size={48}
                className="text-blue-600 group-hover:text-white"
              />
              <span className="text-2xl md:text-3xl font-black text-blue-800 group-hover:text-white">
                日程表
              </span>
            </div>
            <ChevronRight
              size={32}
              className="text-blue-200 group-hover:text-white"
            />
          </Link>
          <Link
            href="/penpen_league/standings"
            className="group flex items-center justify-between bg-white border-4 border-blue-600 p-8 rounded-3xl shadow-md hover:bg-blue-600 transition-all"
          >
            <div className="flex items-center space-x-6">
              <Trophy
                size={48}
                className="text-blue-600 group-hover:text-white"
              />
              <span className="text-2xl md:text-3xl font-black text-blue-800 group-hover:text-white">
                勝敗表
              </span>
            </div>
            <ChevronRight
              size={32}
              className="text-blue-200 group-hover:text-white"
            />
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section className="bg-white rounded-4xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-800 text-white p-6 flex justify-between items-center flex-nowrap">
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 whitespace-nowrap shrink-0">
                <Trophy size={28} /> 前回の結果
              </h2>
              <span className="text-base sm:text-xl font-bold whitespace-nowrap ml-3 shrink-0">
                {previousEntry ? toDisplayDate(previousEntry.date) : "-"}
              </span>
            </div>

            {!previousEntry ? (
              <p className="p-6 text-base text-gray-500">
                結果データはまだありません。
              </p>
            ) : (
              <>
                <div className="divide-y-2 divide-gray-100">
                  {previousEntry.games.map((game, idx) => {
                    const resultTone = getPreviousResultTone(game);

                    return (
                      <div key={game.id} className="p-6 md:p-8">
                        <div className="mb-3 space-y-1">
                          <div className="text-gray-500 font-bold text-lg">
                            第{idx + 1}試合
                          </div>
                          <div className="flex items-center gap-2 text-blue-600 text-base font-bold">
                            <Clock size={18} />
                            {game.startTime}〜{game.endTime}
                          </div>
                          {(() => {
                            const labels = getCompetitionLabels(game);
                            if (!labels) {
                              return null;
                            }

                            return (
                              <span className="inline-flex flex-col items-start gap-1">
                                <span className="rounded-lg bg-blue-50 px-2 py-1 text-sm font-bold text-blue-700">
                                  {labels.leagueLabel}
                                </span>
                                {labels.tournamentLabel ? (
                                  <span className="rounded-lg bg-emerald-50 px-2 py-1 text-sm font-bold text-emerald-700">
                                    {labels.tournamentLabel}
                                  </span>
                                ) : null}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-center pt-1 gap-2 md:gap-3">
                          <div className="flex-1 text-left md:text-right w-full">
                            <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap">
                              {idx === 0 && (
                                <DoorOpen
                                  size={18}
                                  className="inline-block mr-1 text-orange-500 align-[-3px]"
                                />
                              )}
                              {game.awayTeam}
                            </div>
                          </div>
                          <div className="flex items-center justify-center space-x-3 shrink-0 px-2">
                            {game.forfeitWinner !== null ? (
                              <div className="flex flex-col sm:flex-row items-center gap-1">
                                <span
                                  className={`text-sm font-bold px-2 py-0.5 rounded-full ${game.forfeitWinner === "away" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}
                                >
                                  {game.forfeitWinner === "away"
                                    ? "不戦勝"
                                    : "不戦敗"}
                                </span>
                                <span
                                  className={`text-sm font-bold px-2 py-0.5 rounded-full ${game.forfeitWinner === "home" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}
                                >
                                  {game.forfeitWinner === "home"
                                    ? "不戦勝"
                                    : "不戦敗"}
                                </span>
                              </div>
                            ) : game.isCanceled ? (
                              <span className="text-base font-black text-red-600">
                                中止
                              </span>
                            ) : (
                              <>
                                <span
                                  className={`text-2xl sm:text-3xl md:text-4xl font-black ${resultTone.away}`}
                                >
                                  {game.awayScore ?? "-"}
                                </span>
                                <span className="text-lg sm:text-xl text-gray-800">
                                  -
                                </span>
                                <span
                                  className={`text-2xl sm:text-3xl md:text-4xl font-black ${resultTone.home}`}
                                >
                                  {game.homeScore ?? "-"}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex-1 text-right md:text-left w-full">
                            <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap">
                              {game.homeTeam}
                              {idx === previousEntry.games.length - 1 && (
                                <DoorClosedLocked
                                  size={18}
                                  className="inline-block ml-1 text-orange-500 align-[-3px]"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {previousEntryRestTeams.length > 0 && (
                  <div className="p-6 border-t-2 border-gray-100">
                    <div className="text-gray-700">
                      <div>
                        <div className="font-bold text-gray-500 mb-1">
                          休みチーム
                        </div>
                        <p className="text-base whitespace-pre-wrap">
                          {previousEntryRestTeams.join(" / ")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {previousEntry.resultNote && (
                  <div className="p-6 border-t-2 border-gray-100">
                    <div className="text-gray-700">
                      <div>
                        <div className="font-bold text-gray-500 mb-1">
                          結果備考
                        </div>
                        <p className="text-base whitespace-pre-wrap">
                          {previousEntry.resultNote}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="bg-blue-50 rounded-4xl shadow-lg border-2 border-blue-200 overflow-hidden">
            <div className="bg-blue-600 text-white p-6 flex justify-between items-center flex-nowrap">
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 whitespace-nowrap shrink-0">
                <Calendar size={28} /> 次回の試合
              </h2>
              <span className="text-base sm:text-xl font-bold whitespace-nowrap ml-3 shrink-0">
                {nextEntry ? toDisplayDate(nextEntry.date) : "-"}
              </span>
            </div>

            {!nextEntry ? (
              <p className="p-6 text-base text-gray-500">
                次回日程はまだありません。
              </p>
            ) : nextEntry.games.length === 0 ? (
              <>
                <div className="p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-black text-gray-400 mb-2">
                      休み
                    </div>
                  </div>
                </div>
                {nextEntryRestTeams.length > 0 && (
                  <div className="p-6 border-t-2 border-blue-100">
                    <div className="text-blue-700">
                      <div>
                        <div className="font-bold text-sm text-blue-500 mb-1">
                          休みチーム
                        </div>
                        <p className="text-base whitespace-pre-wrap">
                          {nextEntryRestTeams.join(" / ")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {nextEntry.note && (
                  <div className="p-6 border-t-2 border-blue-100">
                    <div className="text-blue-700">
                      <div>
                        <div className="font-bold text-sm text-blue-500 mb-1">
                          備考
                        </div>
                        <p className="text-base whitespace-pre-wrap">
                          {nextEntry.note}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="p-4 bg-white mx-6 mt-6 rounded-xl border border-blue-100 flex items-center justify-center gap-2 text-blue-700 font-black text-xl">
                  <MapPin size={24} /> {nextEntry.stadium || "会場未設定"}
                </div>
                <div className="p-6 space-y-4">
                  {pendingNextGames.map(({ game, originalIndex }) => (
                    <div
                      key={game.id}
                      className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100"
                    >
                      <div className="mb-2 space-y-1 text-blue-600 font-bold text-lg">
                        <div className="flex items-center gap-2">
                          <Clock size={20} /> {game.startTime}〜 (第
                          {originalIndex + 1}試合)
                        </div>
                        {(() => {
                          const labels = getCompetitionLabels(game);
                          if (!labels) {
                            return null;
                          }

                          return (
                            <span className="inline-flex flex-col items-start gap-1">
                              <span className="rounded-lg bg-blue-50 px-2 py-1 text-sm font-bold text-blue-700">
                                {labels.leagueLabel}
                              </span>
                              {labels.tournamentLabel ? (
                                <span className="rounded-lg bg-emerald-50 px-2 py-1 text-sm font-bold text-emerald-700">
                                  {labels.tournamentLabel}
                                </span>
                              ) : null}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex flex-col md:flex-row justify-between items-center pt-1 gap-2 md:gap-4">
                        <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap text-left md:text-left w-full md:w-auto">
                          {originalIndex === 0 && (
                            <DoorOpen
                              size={18}
                              className="inline-block mr-1 text-orange-500 align-[-3px]"
                            />
                          )}
                          {game.awayTeam}
                        </div>
                        <span className="text-base sm:text-lg font-bold text-gray-400 italic">
                          VS
                        </span>
                        <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap text-right md:text-right w-full md:w-auto">
                          {game.homeTeam}
                          {originalIndex === nextEntry.games.length - 1 && (
                            <DoorClosedLocked
                              size={18}
                              className="inline-block ml-1 text-orange-500 align-[-3px]"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {nextEntryRestTeams.length > 0 && (
                  <div className="p-6 border-t-2 border-blue-100">
                    <div className="text-blue-700">
                      <div>
                        <div className="font-bold text-sm text-blue-500 mb-1">
                          休みチーム
                        </div>
                        <p className="text-base whitespace-pre-wrap">
                          {nextEntryRestTeams.join(" / ")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {nextEntry.note && (
                  <div className="p-6 border-t-2 border-blue-100">
                    <div className="text-blue-700">
                      <div>
                        <div className="font-bold text-sm text-blue-500 mb-1">
                          備考
                        </div>
                        <p className="text-base whitespace-pre-wrap">
                          {nextEntry.note}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <div className="text-sm md:text-base text-gray-500 font-bold px-1">
          <span className="inline-flex items-center mr-4">
            <DoorOpen size={18} className="mr-1 text-orange-500" /> 準備当番
          </span>
          <span className="inline-flex items-center">
            <DoorClosedLocked size={18} className="mr-1 text-orange-500" />{" "}
            片付け当番
          </span>
        </div>
      </div>
      <footer className="py-20 border-t border-slate-100 text-center bg-white">
        <div className="opacity-30 font-black tracking-widest hover:underline">
          <a href="/" target="_blank">
            Powered by DashBase
          </a>
        </div>
      </footer>
    </main>
  );
}
