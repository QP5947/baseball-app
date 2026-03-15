"use client";

import { Calendar, CircleCheck, MapPin, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPenpenScheduleEntries,
  type PenpenScheduleEntry,
} from "../../lib/penpenData";

type GameResult = {
  awayScore: string;
  homeScore: string;
  canceled: boolean;
  forfeitWinner: "away" | "home" | null;
};

export default function OneDayResultForm() {
  const supabase = createClient();

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
          `データの読み込みに失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    };

    void load();
  }, [supabase]);

  const sortedEntries = useMemo(
    () => [...scheduleEntries].sort((a, b) => a.date.localeCompare(b.date)),
    [scheduleEntries],
  );

  const selectedEntry = useMemo(() => {
    for (const entry of sortedEntries) {
      if (entry.games.length === 0) continue;
      for (const game of entry.games) {
        if (
          game.awayScore === null &&
          game.homeScore === null &&
          !game.isCanceled &&
          game.forfeitWinner === null
        ) {
          return entry;
        }
      }
    }
    return null;
  }, [sortedEntries]);

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

  const handleSave = async () => {
    if (!selectedEntry) return;

    try {
      const response = await fetch("/penpen_league/admin/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduleDayId: selectedEntry.id,
          note: entryNoteMap[selectedEntry.id] ?? "",
          games: selectedEntry.games.map((game) => {
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

      applySavedEntry(selectedEntry.id);

      window.alert(`${selectedEntry.date} の試合結果を保存しました。`);
    } catch (error) {
      window.alert(
        `保存に失敗しました: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  };

  if (sortedEntries.length === 0) {
    return (
      <p className="text-base text-gray-500">試合日程データがありません。</p>
    );
  }

  return (
    <div className="space-y-4">
      {selectedEntry && (
        <article
          className={`rounded-xl border p-4 space-y-3 ${
            selectedEntry.games.length === 0
              ? "border-red-200 bg-red-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold text-gray-800">
              <span className="inline-flex items-center gap-1 text-xl font-black text-gray-900">
                <Calendar size={18} className="text-blue-600" />
                {selectedEntry.date}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={18} className="text-blue-600" />
                球場: {selectedEntry.stadium}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleSave()}
              className="bg-blue-600 text-white font-black px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              この日を保存
            </button>
          </div>

          {selectedEntry.games.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold text-gray-700">
              <span className="inline-flex items-center gap-1">
                <Wrench size={18} className="text-orange-500" />
                準備当番: {selectedEntry.games[0].awayTeam}
              </span>
              <span className="inline-flex items-center gap-1">
                <CircleCheck size={18} className="text-orange-500" />
                片付け当番:{" "}
                {selectedEntry.games[selectedEntry.games.length - 1].homeTeam}
              </span>
            </div>
          )}

          {selectedEntry.games.length === 0 ? (
            <p className="text-base font-bold text-gray-700">
              休み（試合なし）
            </p>
          ) : (
            <div className="space-y-3">
              {selectedEntry.games.map((game, idx) => {
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
                            <Wrench size={16} className="text-orange-500" />
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
                          disabled={result.canceled}
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
                          disabled={result.canceled}
                        />
                        <span className="inline-flex items-center gap-1">
                          {idx === selectedEntry.games.length - 1 && (
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
                                    event.target.checked ? "away" : null,
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
                                  checked={result.forfeitWinner === "away"}
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
                                  checked={result.forfeitWinner === "home"}
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
              value={entryNoteMap[selectedEntry.id] ?? ""}
              onChange={(event) =>
                setEntryNoteMap((prev) => ({
                  ...prev,
                  [selectedEntry.id]: event.target.value,
                }))
              }
              aria-label="備考"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              placeholder="備考（例: 雨天中止 / 特記事項）"
            />
          </label>
        </article>
      )}
    </div>
  );
}
