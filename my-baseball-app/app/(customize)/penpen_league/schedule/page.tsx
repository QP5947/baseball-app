import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DoorOpen,
  DoorClosedLocked,
  Trophy,
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

type SchedulePeriodKey = "spring" | "summer" | "autumn";

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

const SCHEDULE_PERIODS: Array<{
  key: SchedulePeriodKey;
  label: string;
  months: number[];
}> = [
  { key: "spring", label: "3〜5月", months: [3, 4, 5] },
  { key: "summer", label: "6〜8月", months: [6, 7, 8] },
  { key: "autumn", label: "9〜11月", months: [9, 10, 11] },
];

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

const getMonthFromDate = (dateText: string) => {
  const date = new Date(`${dateText}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) {
    return new Date().getMonth() + 1;
  }
  return date.getMonth() + 1;
};

const getDefaultSchedulePeriod = (): SchedulePeriodKey => {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 8) {
    return "summer";
  }
  if (month >= 9 && month <= 11) {
    return "autumn";
  }
  return "spring";
};

const normalizeSchedulePeriod = (value?: string): SchedulePeriodKey => {
  if (value === "spring" || value === "summer" || value === "autumn") {
    return value;
  }
  return getDefaultSchedulePeriod();
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

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const selectedPeriod = normalizeSchedulePeriod(period);

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
  const activePeriod =
    SCHEDULE_PERIODS.find((item) => item.key === selectedPeriod) ??
    SCHEDULE_PERIODS[0];
  const filteredSchedules = schedulesWithTournamentLabel.filter((day) =>
    activePeriod.months.includes(getMonthFromDate(day.date)),
  );
  const leagueNameById = new Map(
    masterData.leagues.map((league) => [league.id, league.name]),
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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="relative flex h-32 items-center justify-center overflow-hidden md:h-44">
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
          <h1 className="text-3xl font-black italic text-white drop-shadow-lg md:text-4xl">
            PENPEN LEAGUE
          </h1>
          <p className="mt-1 text-base font-bold text-white md:text-lg">
            日程表
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <Link
          href="./"
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 md:text-base"
        >
          <ArrowLeft size={18} /> ホームへ戻る
        </Link>

        {/* 期間選択セクション - 高さを抑えて一覧性を確保 */}
        <section className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2">
            {SCHEDULE_PERIODS.map((item) => {
              const isActive = item.key === activePeriod.key;
              return (
                <Link
                  key={item.key}
                  href={`?period=${item.key}`}
                  className={`whitespace-nowrap rounded-lg border px-4 py-1.5 text-base font-bold transition ${
                    isActive
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>

        <div className="space-y-3">
          {filteredSchedules.map((day) => (
            <section
              key={day.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-col md:flex-row">
                {/* 日付セクション: よりモダンで清潔感のあるデザインへ */}
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-3 py-1.5 md:w-28 md:flex-col md:justify-center md:border-b-0 md:border-r md:py-2">
                  <div className="flex items-baseline gap-1 text-blue-700 md:flex-col md:items-center md:gap-0">
                    <span className="text-sm font-bold md:text-base">
                      {new Date(day.date).getMonth() + 1}月
                    </span>
                    <span className="text-2xl font-black leading-none md:text-3xl">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-1 p-1.5 md:p-2">
                  {day.games.length === 0 ? (
                    <div className="py-3 text-center text-base font-bold text-slate-400">
                      試合予定なし
                    </div>
                  ) : (
                    day.games.map((game, index) => {
                      const labels = getCompetitionLabels(game);

                      return (
                        <article
                          key={game.id}
                          className="rounded-lg border border-slate-100 bg-white p-2 transition-colors hover:bg-slate-50"
                        >
                          <div className="grid gap-1 md:grid-cols-[64px_minmax(0,1fr)] md:items-center md:gap-0">
                            {/* 試合情報 */}
                            <div className="flex min-w-0 items-center gap-1 whitespace-nowrap">
                              <span className="flex items-center gap-1 text-base font-black text-blue-600">
                                <Clock size={16} />
                                {game.startTime}
                              </span>
                              {labels?.tournamentLabel ? (
                                <span className="ml-auto inline-flex max-w-36 items-center gap-1.5 overflow-hidden md:hidden">
                                  <span
                                    title={labels.leagueLabel}
                                    aria-label={labels.leagueLabel}
                                    className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-blue-600"
                                  >
                                    <Trophy size={14} />
                                  </span>
                                  <span className="truncate rounded bg-emerald-50 px-2 py-0.5 text-sm font-bold text-emerald-700">
                                    {labels.tournamentLabel}
                                  </span>
                                </span>
                              ) : null}
                            </div>

                            {/* 対戦カード */}
                            <div className="grid grid-cols-1 items-center gap-1 md:-ml-8 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-1.5">
                              <div className="truncate whitespace-nowrap pl-1 text-left text-base font-black text-slate-800 md:pr-1 md:text-right">
                                {index === 0 && (
                                  <DoorOpen
                                    size={16}
                                    className="mr-1 inline text-orange-400"
                                  />
                                )}
                                {game.awayTeam}
                              </div>

                              <div className="min-w-15 text-center">
                                {game.awayScore !== null &&
                                game.homeScore !== null ? (
                                  <div className="text-base font-black tracking-tight">
                                    <span
                                      className={
                                        getScoreTone(
                                          game.awayScore,
                                          game.homeScore,
                                        ).away
                                      }
                                    >
                                      {game.awayScore}
                                    </span>
                                    <span className="mx-1 text-slate-300">
                                      -
                                    </span>
                                    <span
                                      className={
                                        getScoreTone(
                                          game.awayScore,
                                          game.homeScore,
                                        ).home
                                      }
                                    >
                                      {game.homeScore}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-black italic text-slate-300">
                                    VS
                                  </span>
                                )}
                              </div>

                              <div className="flex min-w-0 items-center justify-end gap-2 whitespace-nowrap pr-1 text-right text-base font-black text-slate-800 md:justify-start md:pl-1 md:pr-0 md:text-left">
                                <span className="block max-w-full truncate text-right md:text-left">
                                  {game.homeTeam}
                                  {index === day.games.length - 1 ? (
                                    <DoorClosedLocked
                                      size={16}
                                      className="ml-1 inline text-orange-400"
                                    />
                                  ) : null}
                                </span>
                                {labels?.tournamentLabel ? (
                                  <span className="ml-auto hidden max-w-36 items-center gap-1.5 overflow-hidden md:inline-flex">
                                    <span
                                      title={labels.leagueLabel}
                                      aria-label={labels.leagueLabel}
                                      className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-blue-600"
                                    >
                                      <Trophy size={14} />
                                    </span>
                                    <span className="truncate rounded bg-emerald-50 px-2 py-0.5 text-sm font-bold text-emerald-700">
                                      {labels.tournamentLabel}
                                    </span>
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}

                  {/* 備考・休みチーム（コンパクト化） */}
                  {(day.restTeams.length > 0 || day.note || day.resultNote) && (
                    <div className="mt-2 space-y-1 pt-2 border-t border-slate-50">
                      {day.restTeams.length > 0 && (
                        <div className="text-sm font-bold text-slate-500">
                          <span className="mr-1 text-red-400">●</span>休み：
                          {day.restTeams.join("、")}
                        </div>
                      )}
                      {(day.resultNote || day.note) && (
                        <div className="text-sm font-bold text-slate-500">
                          <span className="mr-1 text-blue-400">●</span>
                          備考：{day.resultNote || day.note}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
