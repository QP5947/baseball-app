import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  FileText,
  MapPin,
  Clock,
  DoorOpen,
  DoorClosedLocked,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  fetchPenpenMasters,
  fetchPenpenScheduleEntries,
  type PenpenScheduleEntry,
  toDisplayDate,
} from "../lib/penpenData";
import { fetchPenpenHeaderImageUrl } from "../lib/penpenStorage";

export const metadata: Metadata = { title: "日程表" };

const DEFAULT_LEAGUE_ID = "1b8cbac7-ab3f-4006-bcad-d4db00e7e65c";
const UNDECIDED_TEAM_NAME = "未定";

type TournamentBindingRow = {
  league_id: string;
  season_year: number;
  third_place_code: string | null;
  bindings: unknown;
};

type GameBinding = {
  gameId: string;
  code: string;
  awaySourceCode: string;
  homeSourceCode: string;
};

const toGameBinding = (value: unknown): GameBinding | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (
    typeof row.gameId !== "string" ||
    typeof row.code !== "string" ||
    typeof row.awaySourceCode !== "string" ||
    typeof row.homeSourceCode !== "string"
  ) {
    return null;
  }

  return {
    gameId: row.gameId,
    code: row.code,
    awaySourceCode: row.awaySourceCode,
    homeSourceCode: row.homeSourceCode,
  };
};

const parseBindings = (raw: unknown): GameBinding[] => {
  let items: unknown[] = [];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        items = parsed;
      }
    } catch {
      items = [];
    }
  }

  return items
    .map(toGameBinding)
    .filter((item): item is GameBinding => item !== null);
};

const getSeasonYearFromDate = (dateText: string) => {
  const date = new Date(`${dateText}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) {
    return new Date().getFullYear();
  }
  return date.getFullYear();
};

const applyTournamentLabels = (
  schedules: PenpenScheduleEntry[],
  bindingRows: TournamentBindingRow[],
) => {
  const bindingMap = new Map<string, TournamentBindingRow>();
  bindingRows.forEach((row) => {
    bindingMap.set(`${row.league_id}:${row.season_year}`, row);
  });

  return schedules.map((day) => {
    const seasonYear = getSeasonYearFromDate(day.date);
    const games = day.games.map((game) => {
      if (game.gameType !== "トーナメント" || !game.leagueId) {
        return game;
      }

      const binding = bindingMap.get(`${game.leagueId}:${seasonYear}`);
      if (!binding) {
        return game;
      }

      const parsedBindings = parseBindings(binding.bindings);
      const gameBinding = parsedBindings.find(
        (item) => item.gameId === game.id,
      );
      if (!gameBinding) {
        return game;
      }

      const isThirdPlace =
        Boolean(binding.third_place_code) &&
        gameBinding.code === binding.third_place_code;
      const outcomeLabel = isThirdPlace ? "敗者" : "勝者";

      const awayTeam =
        game.awayTeam === UNDECIDED_TEAM_NAME && gameBinding.awaySourceCode
          ? `${gameBinding.awaySourceCode}の${outcomeLabel}`
          : game.awayTeam;
      const homeTeam =
        game.homeTeam === UNDECIDED_TEAM_NAME && gameBinding.homeSourceCode
          ? `${gameBinding.homeSourceCode}の${outcomeLabel}`
          : game.homeTeam;

      return {
        ...game,
        awayTeam,
        homeTeam,
      };
    });

    return {
      ...day,
      games,
    };
  });
};

const getScoreTone = (awayScore: number, homeScore: number) => {
  if (awayScore > homeScore) {
    return { away: "text-blue-700", home: "text-slate-400" };
  }

  if (awayScore < homeScore) {
    return { away: "text-slate-400", home: "text-blue-700" };
  }

  return { away: "text-gray-500", home: "text-gray-500" };
};

export default async function SchedulePage() {
  const supabase = await createClient();
  const [schedules, headerImageUrl, masterData, tournamentBindingsRes] =
    await Promise.all([
      fetchPenpenScheduleEntries(supabase),
      fetchPenpenHeaderImageUrl(supabase),
      fetchPenpenMasters(supabase),
      supabase
        .schema("penpen")
        .from("tournament_bindings")
        .select("league_id, season_year, third_place_code, bindings"),
    ]);
  if (tournamentBindingsRes.error) {
    throw tournamentBindingsRes.error;
  }

  const schedulesWithTournamentLabel = applyTournamentLabels(
    schedules,
    (tournamentBindingsRes.data ?? []) as TournamentBindingRow[],
  );
  const leagueNameById = new Map(
    masterData.leagues.map((league) => [league.id, league.name]),
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
          <p className="text-white font-bold text-lg md:text-xl mt-2">日程表</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Link
          href="./"
          className="inline-flex items-center gap-2 mb-8 font-bold text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={20} /> ホームへ戻る
        </Link>

        <div className="space-y-12">
          {schedules.length === 0 ? (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <p className="text-base text-gray-500">
                日程はまだ登録されていません。
              </p>
            </section>
          ) : (
            schedulesWithTournamentLabel.map((day) => (
              <section key={day.id} className="relative">
                <div className="top-4 z-20 mb-4 inline-block bg-zinc-800 text-white px-6 py-2 rounded-full shadow-lg font-black text-xl md:text-2xl">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Calendar size={24} />
                    {toDisplayDate(day.date)}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {day.games.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-black text-gray-400 mb-2">
                          休み
                        </div>
                      </div>
                    </div>
                  ) : (
                    day.games.map((game, index) => (
                      <div
                        key={game.id}
                        className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-black whitespace-nowrap">
                            第{index + 1}試合
                          </div>
                          <div className="flex flex-col items-start gap-1 text-blue-600 font-bold text-xl whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <Clock size={20} />
                              {game.startTime}〜
                            </span>
                            {game.leagueId &&
                            game.leagueId !== DEFAULT_LEAGUE_ID ? (
                              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm whitespace-nowrap">
                                {leagueNameById.get(game.leagueId) ?? "-"}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 w-full md:flex-1">
                          <div className="flex flex-col items-start md:items-end flex-1 min-w-0 w-full">
                            <div className="inline-block">
                              <div className="text-base sm:text-lg md:text-xl font-black text-left md:text-right whitespace-nowrap">
                                {index === 0 && (
                                  <DoorOpen
                                    size={18}
                                    className="inline-block mr-1 text-orange-500 align-[-3px]"
                                  />
                                )}
                                {game.awayTeam}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-center shrink-0 px-2">
                            {game.forfeitWinner !== null ? (
                              <div className="flex flex-col sm:flex-row items-center gap-1 px-1">
                                <span
                                  className={`font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${game.forfeitWinner === "away" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}
                                >
                                  {game.forfeitWinner === "away"
                                    ? "不戦勝"
                                    : "不戦敗"}
                                </span>
                                <span
                                  className={`font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${game.forfeitWinner === "home" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}
                                >
                                  {game.forfeitWinner === "home"
                                    ? "不戦勝"
                                    : "不戦敗"}
                                </span>
                              </div>
                            ) : game.isCanceled ? (
                              <div className="text-sm sm:text-base font-black text-red-600 bg-red-50 px-3 py-1 rounded-xl border border-red-200 whitespace-nowrap">
                                中止
                              </div>
                            ) : game.awayScore !== null &&
                              game.homeScore !== null ? (
                              <div className="text-base sm:text-lg md:text-xl font-black bg-zinc-50 px-3 py-1 rounded-xl border border-zinc-200 whitespace-nowrap">
                                <span
                                  className={
                                    getScoreTone(game.awayScore, game.homeScore)
                                      .away
                                  }
                                >
                                  {game.awayScore}
                                </span>
                                <span className="text-zinc-800"> - </span>
                                <span
                                  className={
                                    getScoreTone(game.awayScore, game.homeScore)
                                      .home
                                  }
                                >
                                  {game.homeScore}
                                </span>
                              </div>
                            ) : (
                              <div className="text-gray-300 font-black italic text-base sm:text-lg px-2 whitespace-nowrap">
                                VS
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end md:items-start flex-1 min-w-0 w-full">
                            <div className="inline-block">
                              <div className="text-base sm:text-lg md:text-xl font-black text-right md:text-left whitespace-nowrap">
                                {game.homeTeam}
                                {index === day.games.length - 1 && (
                                  <DoorClosedLocked
                                    size={18}
                                    className="inline-block ml-1 text-orange-500 align-[-3px]"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {day.restTeams.length > 0 && (
                    <div className="mt-2 bg-red-100 border-2 border-dashed border-red-200 rounded-2xl p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-red-400 text-white font-black px-2 py-1 rounded">
                          休み
                        </span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {day.restTeams.map((team) => (
                            <span
                              key={team}
                              className="text-gray-500 font-bold"
                            >
                              {team}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {(day.note || day.resultNote) && (
                    <div className="mt-2 bg-blue-100 border-2 border-dashed border-blue-200 rounded-2xl p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-blue-400 text-white font-black px-2 py-1 rounded">
                          備考
                        </span>
                        <span className="text-gray-700 font-bold">
                          {day.resultNote || day.note}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="text-sm md:text-base text-gray-500 font-bold px-1 mt-8">
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
