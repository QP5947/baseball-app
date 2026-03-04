"use client";

import Link from "next/link";
import { Calendar, CircleCheck, MapPin, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PeriodFilter = "spring" | "summer" | "autumn";

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
  note: string;
};

const SCHEDULE_STORAGE_KEY = "penpen_league_schedule_entries_v1";
const RESULT_STORAGE_KEY = "penpen_league_result_entries_v1";

const periodLabelMap: Record<PeriodFilter, string> = {
  spring: "3〜5月",
  summer: "6〜8月",
  autumn: "9〜11月",
};

const getPeriodFromDate = (dateString: string): PeriodFilter | null => {
  if (!dateString) {
    return null;
  }

  const month = Number(dateString.split("-")[1]);

  if (month >= 3 && month <= 5) {
    return "spring";
  }
  if (month >= 6 && month <= 8) {
    return "summer";
  }
  if (month >= 9 && month <= 11) {
    return "autumn";
  }

  return null;
};

const gameKey = (entryId: number, gameId: number) => `${entryId}_${gameId}`;

export default function PenpenAdminResultsPage() {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("spring");
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [resultMap, setResultMap] = useState<Record<string, GameResult>>({});
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

    setIsHydrated(true);
  }, []);

  const filteredEntries = useMemo(() => {
    return scheduleEntries
      .filter((entry) => getPeriodFromDate(entry.date) === periodFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [scheduleEntries, periodFilter]);

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
          note: prev[targetKey]?.note ?? "",
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

  const handleSaveByDate = (entry: ScheduleEntry) => {
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
      if (key.startsWith(`${entry.id}_`)) {
        delete nextMap[key];
      }
    });

    entry.games.forEach((game) => {
      const key = gameKey(entry.id, game.id);
      nextMap[key] = resultMap[key] ?? {
        awayScore: "",
        homeScore: "",
        canceled: false,
        note: "",
      };
    });

    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(nextMap));
    window.alert(`${entry.date} の試合結果を保存しました。`);
  };

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-base text-gray-600">データを読み込み中です...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            試合結果入力
          </h1>
          <p className="text-base text-gray-600 mt-2">
            試合日程入力で登録した試合に対して、スコア・中止・備考を入力します。
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
                  className={`px-4 py-2 text-base font-bold ${
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
                      onClick={() => handleSaveByDate(entry)}
                      className="bg-blue-600 text-white font-black px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                        const key = gameKey(entry.id, game.id);
                        const result = resultMap[key] ?? {
                          awayScore: "",
                          homeScore: "",
                          canceled: false,
                          note: "",
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
                            <div className="flex flex-wrap items-center gap-4">
                              <p className="text-base font-bold text-gray-800">
                                {game.startTime}〜{game.endTime}
                              </p>
                              <label className="inline-flex items-center gap-2 text-base font-bold text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={result.canceled}
                                  onChange={(event) =>
                                    updateResult(
                                      entry.id,
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

                            <div className="flex flex-wrap items-center gap-2 text-base font-bold text-gray-800">
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
                                    entry.id,
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
                                    entry.id,
                                    game.id,
                                    "homeScore",
                                    event.target.value,
                                  )
                                }
                                className="w-20 rounded-lg border border-gray-300 px-2 py-1"
                                disabled={result.canceled}
                              />
                              <span className="inline-flex items-center gap-1">
                                {idx === entry.games.length - 1 && (
                                  <CircleCheck size={16} className="text-orange-500" />
                                )}
                                {game.homeTeam}
                              </span>
                            </div>

                            <label className="space-y-2 block">
                              <span className="text-base font-bold text-gray-700">
                                備考
                              </span>
                              <input
                                type="text"
                                value={result.note}
                                onChange={(event) =>
                                  updateResult(
                                    entry.id,
                                    game.id,
                                    "note",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                                placeholder="例: 雨天中止 / 特記事項"
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
