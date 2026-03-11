"use client";

import Link from "next/link";
import { Calendar, CircleCheck, MapPin, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPenpenScheduleEntries,
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

export default function PenpenAdminResultsPage() {
  const supabase = createClient();

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("spring");
  const [scheduleEntries, setScheduleEntries] = useState<PenpenScheduleEntry[]>(
    [],
  );
  const [resultMap, setResultMap] = useState<Record<string, GameResult>>({});
  const [entryNoteMap, setEntryNoteMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const entries = await fetchPenpenScheduleEntries(supabase);
        setScheduleEntries(entries);

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
  }, [supabase]);

  const filteredEntries = useMemo(() => {
    return scheduleEntries
      .filter((entry) => getPeriodFromDate(entry.date) === periodFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [scheduleEntries, periodFilter]);

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

  const handleSaveByDate = async (entry: PenpenScheduleEntry) => {
    try {
      const rows = entry.games.map((game) => {
        const current = resultMap[game.id] ?? {
          awayScore: "",
          homeScore: "",
          canceled: false,
          forfeitWinner: null,
        };

        return {
          scheduled_game_id: game.id,
          away_score:
            current.canceled ||
            current.forfeitWinner !== null ||
            current.awayScore === ""
              ? null
              : Number(current.awayScore),
          home_score:
            current.canceled ||
            current.forfeitWinner !== null ||
            current.homeScore === ""
              ? null
              : Number(current.homeScore),
          is_canceled: current.canceled,
          forfeit_winner: current.forfeitWinner,
        };
      });

      if (rows.length > 0) {
        const { error } = await supabase
          .schema("penpen")
          .from("game_results")
          .upsert(rows, { onConflict: "scheduled_game_id" });
        if (error) throw error;
      }

      const { error: dayResultError } = await supabase
        .schema("penpen")
        .from("schedule_day_results")
        .upsert({
          schedule_day_id: entry.id,
          note: entryNoteMap[entry.id] ?? "",
          is_finalized: false,
        });

      if (dayResultError) throw dayResultError;

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

                  {entry.games.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <Wrench size={18} className="text-orange-500" />
                        準備当番: {entry.games[0].awayTeam}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CircleCheck size={18} className="text-orange-500" />
                        片付け当番:{" "}
                        {entry.games[entry.games.length - 1].homeTeam}
                      </span>
                    </div>
                  )}

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
                            <div className="overflow-x-auto">
                              <div className="inline-flex min-w-max items-center gap-4 whitespace-nowrap text-base font-bold text-gray-800">
                                <p>
                                  {game.startTime}〜{game.endTime}
                                </p>
                                <span className="inline-flex items-center gap-1">
                                  {idx === 0 && (
                                    <Wrench
                                      size={16}
                                      className="text-orange-500"
                                    />
                                  )}
                                  {game.awayTeam}
                                </span>
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
                                <span className="inline-flex items-center gap-1">
                                  {idx === entry.games.length - 1 && (
                                    <CircleCheck
                                      size={16}
                                      className="text-orange-500"
                                    />
                                  )}
                                  {game.homeTeam}
                                </span>
                                <div className="inline-flex flex-col items-start gap-2 text-base font-bold text-gray-700">
                                  <div className="inline-flex items-center gap-4">
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
                                    <div className="inline-flex items-center gap-2 pl-1">
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
