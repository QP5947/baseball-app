"use client";

import Link from "next/link";
import { Calendar, DoorClosedLocked, DoorOpen, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getPeriodFromDate,
  type PenpenScheduleEntry,
} from "../../lib/penpenData";

type PeriodFilter = "spring" | "summer" | "autumn";

type GameResult = {
  awayScore: string;
  homeScore: string;
  canceled: boolean;
  forfeitWinner: "away" | "home" | null;
};

const periodLabelMap: Record<PeriodFilter, string> = {
  spring: "3〜5月",
  summer: "6〜8月",
  autumn: "9〜11月",
};

const DEFAULT_LEAGUE_ID = "1b8cbac7-ab3f-4006-bcad-d4db00e7e65c";

export default function PenpenAdminResultsPage() {
  useEffect(() => {
    document.title = "試合結果入力 | ペンペンリーグ";
  }, []);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("spring");
  const [scheduleEntries, setScheduleEntries] = useState<PenpenScheduleEntry[]>(
    [],
  );
  const [resultMap, setResultMap] = useState<Record<string, GameResult>>({});
  const [entryNoteMap, setEntryNoteMap] = useState<Record<string, string>>({});
  const [leagueNameById, setLeagueNameById] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/penpen_league/admin/api/dashboard", {
          method: "GET",
          credentials: "same-origin",
        });

        const payload = (await response.json().catch(() => null)) as {
          message?: string;
          entries?: PenpenScheduleEntry[];
          masters?: {
            leagues: { id: string; name: string }[];
          };
        } | null;

        if (!response.ok) {
          throw new Error(payload?.message ?? "unknown");
        }

        const entries = payload?.entries ?? [];
        const leagues = payload?.masters?.leagues ?? [];

        setScheduleEntries(entries);
        setLeagueNameById(
          Object.fromEntries(leagues.map((league) => [league.id, league.name])),
        );

        const nextResults: Record<string, GameResult> = {};
        const nextEntryNotes: Record<string, string> = {};

        entries.forEach((entry) => {
          nextEntryNotes[entry.id] = entry.resultNote;
          entry.games.forEach((game) => {
            nextResults[game.id] = {
              awayScore: game.awayScore === null ? "" : String(game.awayScore),
              homeScore: game.homeScore === null ? "" : String(game.homeScore),
              canceled: game.isCanceled,
              forfeitWinner: game.forfeitWinner,
            };
          });
        });

        setResultMap(nextResults);
        setEntryNoteMap(nextEntryNotes);
      } catch (error) {
        window.alert(
          `結果入力データの取得に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    };

    void load();
  }, []);

  const filteredEntries = useMemo(() => {
    return scheduleEntries
      .filter((entry) => getPeriodFromDate(entry.date) === periodFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [scheduleEntries, periodFilter]);

  const getCompetitionLabels = (game: {
    gameType: string;
    leagueId: string | null;
    tournamentDisplayName: string | null;
  }) => {
    if (!game.leagueId || game.leagueId === DEFAULT_LEAGUE_ID) {
      return null;
    }

    const leagueLabel = leagueNameById[game.leagueId] ?? "-";
    const tournamentLabel =
      game.gameType === "トーナメント" ? game.tournamentDisplayName : null;

    return {
      leagueLabel,
      tournamentLabel,
    };
  };

  const updateResult = (
    gameId: string,
    key: keyof GameResult,
    value: string | boolean | "away" | "home" | null,
  ) => {
    setResultMap((prev) => ({
      ...prev,
      [gameId]: (() => {
        const current = {
          awayScore: prev[gameId]?.awayScore ?? "",
          homeScore: prev[gameId]?.homeScore ?? "",
          canceled: prev[gameId]?.canceled ?? false,
          forfeitWinner: prev[gameId]?.forfeitWinner ?? null,
        };

        if (key === "canceled") {
          const nextCanceled = value as boolean;
          if (nextCanceled) {
            return {
              ...current,
              canceled: true,
              awayScore: "",
              homeScore: "",
              forfeitWinner: null,
            };
          }
          return { ...current, canceled: false };
        }

        if (key === "forfeitWinner") {
          const fw = value as "away" | "home" | null;
          return {
            ...current,
            forfeitWinner: fw,
            canceled: false,
            awayScore: "",
            homeScore: "",
          };
        }

        if (
          (current.canceled || current.forfeitWinner !== null) &&
          (key === "awayScore" || key === "homeScore")
        ) {
          return current;
        }

        return {
          ...current,
          [key]: value,
        };
      })(),
    }));
  };

  const applySavedEntry = (entryId: string) => {
    setScheduleEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId) {
          return entry;
        }

        return {
          ...entry,
          resultNote: entryNoteMap[entryId] ?? "",
          games: entry.games.map((game) => {
            const current = resultMap[game.id] ?? {
              awayScore: "",
              homeScore: "",
              canceled: false,
              forfeitWinner: null,
            };

            return {
              ...game,
              awayScore:
                current.canceled ||
                current.forfeitWinner !== null ||
                current.awayScore === ""
                  ? null
                  : Number(current.awayScore),
              homeScore:
                current.canceled ||
                current.forfeitWinner !== null ||
                current.homeScore === ""
                  ? null
                  : Number(current.homeScore),
              isCanceled: current.canceled,
              forfeitWinner: current.forfeitWinner,
            };
          }),
        };
      }),
    );
  };

  const handleSaveByDate = async (entry: PenpenScheduleEntry) => {
    try {
      const response = await fetch("/penpen_league/admin/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduleDayId: entry.id,
          note: entryNoteMap[entry.id] ?? "",
          games: entry.games.map((game) => {
            const current = resultMap[game.id] ?? {
              awayScore: "",
              homeScore: "",
              canceled: false,
              forfeitWinner: null,
            };

            return {
              gameId: game.id,
              awayScore: current.awayScore,
              homeScore: current.homeScore,
              canceled: current.canceled,
              forfeitWinner: current.forfeitWinner,
            };
          }),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? "unknown");
      }

      applySavedEntry(entry.id);

      window.alert(`${entry.date} の試合結果を保存しました。`);
    } catch (error) {
      window.alert(
        `結果保存に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            試合結果入力
          </h1>
          <p className="text-base text-gray-600 mt-2">
            試合日程入力で登録した試合に対して、スコア・中止・不戦・備考を入力します。
          </p>
        </header>

        <div>
          <Link
            href="/penpen_league/admin"
            className="inline-block text-blue-700 font-bold hover:underline"
          >
            ← 管理画面ホームへ戻る
          </Link>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-4">
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
            {(["spring", "summer", "autumn"] as PeriodFilter[]).map(
              (period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setPeriodFilter(period)}
                  className={`px-4 py-2 text-base font-bold cursor-pointer ${
                    periodFilter === period
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {periodLabelMap[period]}
                </button>
              ),
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold text-gray-700">
            <span className="inline-flex items-center gap-1">
              <DoorOpen size={18} className="text-orange-500" />
              準備当番
            </span>
            <span className="inline-flex items-center gap-1">
              <DoorClosedLocked size={18} className="text-orange-500" />
              片付け当番
            </span>
          </div>

          {filteredEntries.length === 0 ? (
            <p className="text-base text-gray-500">
              該当期間の試合日程データがありません。
            </p>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <article
                  key={entry.id}
                  className={`rounded-xl border p-4 space-y-3 ${
                    entry.games.length === 0
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold text-gray-800">
                      <span className="inline-flex items-center gap-1 text-xl md:text-2xl font-black text-gray-900">
                        <Calendar size={18} className="text-blue-600" />
                        {entry.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={18} className="text-blue-600" />
                        球場: {entry.stadium}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSaveByDate(entry)}
                      className="bg-blue-600 text-white font-black px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      この日を保存
                    </button>
                  </div>

                  {entry.games.length === 0 ? (
                    <p className="text-base font-bold text-gray-700">
                      休み（試合なし）
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {entry.games.map((game, idx) => {
                        const result = resultMap[game.id] ?? {
                          awayScore: "",
                          homeScore: "",
                          canceled: false,
                          forfeitWinner: null,
                        };

                        return (
                          <div
                            key={game.id}
                            className={`rounded-lg border p-4 space-y-3 ${
                              result.canceled
                                ? "border-red-200 bg-red-50"
                                : result.forfeitWinner !== null
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="md:overflow-x-auto">
                              <div className="space-y-3 text-base font-bold text-gray-800 md:inline-flex md:min-w-max md:items-center md:gap-4 md:space-y-0 md:whitespace-nowrap">
                                <div className="flex flex-col items-start gap-1">
                                  <p>
                                    {game.startTime}〜{game.endTime}
                                  </p>
                                  {(() => {
                                    const labels = getCompetitionLabels(game);
                                    if (!labels) {
                                      return null;
                                    }

                                    return (
                                      <span className="inline-flex flex-col items-start gap-1">
                                        <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-1 text-sm font-bold text-blue-700">
                                          {labels.leagueLabel}
                                        </span>
                                        {labels.tournamentLabel ? (
                                          <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-1 text-sm font-bold text-emerald-700">
                                            {labels.tournamentLabel}
                                          </span>
                                        ) : null}
                                      </span>
                                    );
                                  })()}
                                </div>
                                <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-4">
                                  <span className="inline-flex items-center gap-1">
                                    {idx === 0 && (
                                      <DoorOpen
                                        size={16}
                                        className="text-orange-500"
                                      />
                                    )}
                                    {game.awayTeam}
                                  </span>
                                  <div className="inline-flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={0}
                                      value={result.awayScore}
                                      onChange={(event) =>
                                        updateResult(
                                          game.id,
                                          "awayScore",
                                          event.target.value,
                                        )
                                      }
                                      className="w-20 rounded-lg border border-gray-300 px-2 py-1"
                                      disabled={
                                        result.canceled ||
                                        result.forfeitWinner !== null
                                      }
                                    />
                                    <span>-</span>
                                    <input
                                      type="number"
                                      min={0}
                                      value={result.homeScore}
                                      onChange={(event) =>
                                        updateResult(
                                          game.id,
                                          "homeScore",
                                          event.target.value,
                                        )
                                      }
                                      className="w-20 rounded-lg border border-gray-300 px-2 py-1"
                                      disabled={
                                        result.canceled ||
                                        result.forfeitWinner !== null
                                      }
                                    />
                                  </div>
                                  <span className="inline-flex items-center gap-1 self-end md:self-auto">
                                    {idx === entry.games.length - 1 && (
                                      <DoorClosedLocked
                                        size={16}
                                        className="text-orange-500"
                                      />
                                    )}
                                    {game.homeTeam}
                                  </span>
                                </div>
                                <div className="flex flex-col items-start gap-2 text-base font-bold text-gray-700">
                                  <div className="flex flex-wrap items-center gap-4">
                                    <label className="inline-flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={result.canceled}
                                        onChange={(event) =>
                                          updateResult(
                                            game.id,
                                            "canceled",
                                            event.target.checked,
                                          )
                                        }
                                        className="h-4 w-4"
                                      />
                                      中止
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={result.forfeitWinner !== null}
                                        onChange={(event) =>
                                          updateResult(
                                            game.id,
                                            "forfeitWinner",
                                            event.target.checked
                                              ? "away"
                                              : null,
                                          )
                                        }
                                        className="h-4 w-4"
                                      />
                                      不戦
                                    </label>
                                  </div>
                                  {result.forfeitWinner !== null && (
                                    <div className="flex flex-col items-start gap-2 pl-1 md:flex-row md:items-center">
                                      <label className="inline-flex items-center gap-1">
                                        <input
                                          type="radio"
                                          name={`forfeit-${game.id}`}
                                          value="away"
                                          checked={
                                            result.forfeitWinner === "away"
                                          }
                                          onChange={() =>
                                            updateResult(
                                              game.id,
                                              "forfeitWinner",
                                              "away",
                                            )
                                          }
                                          className="h-4 w-4"
                                        />
                                        {game.awayTeam} 不戦勝
                                      </label>
                                      <label className="inline-flex items-center gap-1">
                                        <input
                                          type="radio"
                                          name={`forfeit-${game.id}`}
                                          value="home"
                                          checked={
                                            result.forfeitWinner === "home"
                                          }
                                          onChange={() =>
                                            updateResult(
                                              game.id,
                                              "forfeitWinner",
                                              "home",
                                            )
                                          }
                                          className="h-4 w-4"
                                        />
                                        {game.homeTeam} 不戦勝
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <label className="block">
                    <input
                      type="text"
                      value={entryNoteMap[entry.id] ?? ""}
                      onChange={(event) =>
                        setEntryNoteMap((prev) => ({
                          ...prev,
                          [entry.id]: event.target.value,
                        }))
                      }
                      aria-label="備考"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      placeholder="備考（例: 雨天中止 / 特記事項）"
                    />
                  </label>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
