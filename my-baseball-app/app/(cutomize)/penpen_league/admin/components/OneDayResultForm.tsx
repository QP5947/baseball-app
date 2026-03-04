"use client";

import { Calendar, CircleCheck, MapPin, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type GameInput = {
  id: number;
  startTime: string;
  endTime: string;
  awayTeam: string;
  homeTeam: string;
  gameType: "リーグ戦" | "トーナメント";
};

type ScheduleEntry = {
  id: number;
  date: string;
  stadium: string;
  games: GameInput[];
  restTeams: string[];
  note: string;
};

type GameResult = {
  awayScore: string;
  homeScore: string;
  canceled: boolean;
};

const SCHEDULE_STORAGE_KEY = "penpen_league_schedule_entries_v1";
const RESULT_STORAGE_KEY = "penpen_league_result_entries_v1";
const RESULT_ENTRY_NOTE_STORAGE_KEY = "penpen_league_result_entry_notes_v1";

const gameKey = (entryId: number, gameId: number) => `${entryId}_${gameId}`;

export default function OneDayResultForm() {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [resultMap, setResultMap] = useState<Record<string, GameResult>>({});
  const [entryNoteMap, setEntryNoteMap] = useState<Record<string, string>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const scheduleRaw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (scheduleRaw) {
      try {
        setScheduleEntries(JSON.parse(scheduleRaw) as ScheduleEntry[]);
      } catch {
        setScheduleEntries([]);
      }
    }

    const resultRaw = localStorage.getItem(RESULT_STORAGE_KEY);
    if (resultRaw) {
      try {
        setResultMap(JSON.parse(resultRaw) as Record<string, GameResult>);
      } catch {
        setResultMap({});
      }
    }

    const entryNoteRaw = localStorage.getItem(RESULT_ENTRY_NOTE_STORAGE_KEY);
    if (entryNoteRaw) {
      try {
        setEntryNoteMap(JSON.parse(entryNoteRaw) as Record<string, string>);
      } catch {
        setEntryNoteMap({});
      }
    }

    setIsHydrated(true);
  }, []);

  const sortedEntries = useMemo(
    () => [...scheduleEntries].sort((a, b) => a.date.localeCompare(b.date)),
    [scheduleEntries],
  );

  const selectedEntry = useMemo(
    () => sortedEntries[sortedEntries.length - 1] ?? null,
    [sortedEntries],
  );

  const updateResult = (
    entryId: number,
    gameId: number,
    key: keyof GameResult,
    value: string | boolean,
  ) => {
    const targetKey = gameKey(entryId, gameId);

    setResultMap((prev) => ({
      ...prev,
      [targetKey]: (() => {
        const current = {
          awayScore: prev[targetKey]?.awayScore ?? "",
          homeScore: prev[targetKey]?.homeScore ?? "",
          canceled: prev[targetKey]?.canceled ?? false,
        };

        if (key === "canceled") {
          const nextCanceled = value as boolean;
          if (nextCanceled) {
            return {
              ...current,
              canceled: true,
              awayScore: "",
              homeScore: "",
            };
          }
          return { ...current, canceled: false };
        }

        if (current.canceled && (key === "awayScore" || key === "homeScore")) {
          return current;
        }

        return {
          ...current,
          [key]: value,
        };
      })(),
    }));
  };

  const handleSave = () => {
    if (!selectedEntry) {
      return;
    }

    const raw = localStorage.getItem(RESULT_STORAGE_KEY);
    let storedMap: Record<string, GameResult> = {};

    if (raw) {
      try {
        storedMap = JSON.parse(raw) as Record<string, GameResult>;
      } catch {
        storedMap = {};
      }
    }

    const nextMap = { ...storedMap };

    Object.keys(nextMap).forEach((key) => {
      if (key.startsWith(`${selectedEntry.id}_`)) {
        delete nextMap[key];
      }
    });

    selectedEntry.games.forEach((game) => {
      const key = gameKey(selectedEntry.id, game.id);
      nextMap[key] = resultMap[key] ?? {
        awayScore: "",
        homeScore: "",
        canceled: false,
      };
    });

    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(nextMap));

    const noteRaw = localStorage.getItem(RESULT_ENTRY_NOTE_STORAGE_KEY);
    let storedEntryNotes: Record<string, string> = {};
    if (noteRaw) {
      try {
        storedEntryNotes = JSON.parse(noteRaw) as Record<string, string>;
      } catch {
        storedEntryNotes = {};
      }
    }

    const selectedEntryKey = String(selectedEntry.id);
    storedEntryNotes[selectedEntryKey] = entryNoteMap[selectedEntryKey] ?? "";
    localStorage.setItem(
      RESULT_ENTRY_NOTE_STORAGE_KEY,
      JSON.stringify(storedEntryNotes),
    );

    window.alert(`${selectedEntry.date} の試合結果を保存しました。`);
  };

  if (!isHydrated) {
    return <p className="text-base text-gray-600">データを読み込み中です...</p>;
  }

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
              onClick={handleSave}
              className="bg-blue-600 text-white font-black px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                const key = gameKey(selectedEntry.id, game.id);
                const result = resultMap[key] ?? {
                  awayScore: "",
                  homeScore: "",
                  canceled: false,
                };

                return (
                  <div
                    key={key}
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
                              selectedEntry.id,
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
                              selectedEntry.id,
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
                        <label className="inline-flex items-center gap-2 text-base font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={result.canceled}
                            onChange={(event) =>
                              updateResult(
                                selectedEntry.id,
                                game.id,
                                "canceled",
                                event.target.checked,
                              )
                            }
                            className="h-4 w-4"
                          />
                          中止
                        </label>
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
              value={entryNoteMap[String(selectedEntry.id)] ?? ""}
              onChange={(event) =>
                setEntryNoteMap((prev) => ({
                  ...prev,
                  [String(selectedEntry.id)]: event.target.value,
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
