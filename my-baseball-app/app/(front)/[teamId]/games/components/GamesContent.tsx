"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Clock, MapPin } from "lucide-react";

interface Game {
  id: string;
  date: number;
  month: number;
  year: number;
  opponent: string;
  result: string;
  score: string;
  location: string;
  leagueName?: string;
  startDatetime?: string;
  status?: number | null;
  gameComment?: string | null;
}

interface GamesContentProps {
  games: Game[];
  displayYear: number;
  displayMonth: number;
  availableYears: number[];
  teamId: string;
  primaryColor: string;
  victoryColor: string;
  loseColor: string;
  drawColor: string;
}

export default function GamesContent({
  games,
  displayYear,
  displayMonth,
  availableYears,
  teamId,
  primaryColor,
  victoryColor,
  loseColor,
  drawColor,
}: GamesContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // スマホ判定
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode("list");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePrevMonth = () => {
    const prevDate = new Date(displayYear, displayMonth - 1, 1);
    const newYear = prevDate.getFullYear();
    const newMonth = prevDate.getMonth();
    router.push(`?year=${newYear}&month=${newMonth}`);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(displayYear, displayMonth + 1, 1);
    const newYear = nextDate.getFullYear();
    const newMonth = nextDate.getMonth();
    router.push(`?year=${newYear}&month=${newMonth}`);
  };

  const handleYearChange = (year: number) => {
    router.push(`?year=${year}&month=${displayMonth}`);
  };

  const getResultStyle = (result: string) => {
    switch (result) {
      case "win":
        return { color: victoryColor, label: "勝利" };
      case "lose":
        return { color: loseColor, label: "敗戦" };
      case "draw":
        return { color: drawColor, label: "引分" };
      default:
        return { color: "#cbd5e1", label: "予定" };
    }
  };

  // カレンダー用計算
  const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

  const themeStyle = {
    "--team-color": primaryColor,
    "--victory-color": victoryColor,
  } as React.CSSProperties;

  return (
    <div style={themeStyle}>
      {/* ビューモード切り替えボタン（MD以上） */}
      <div className="hidden md:flex bg-white p-1 rounded-2xl shadow-inner border border-slate-100 font-black mb-8">
        <button
          onClick={() => setViewMode("list")}
          className={`px-6 py-3 rounded-xl transition-all flex-1 text-center ${
            viewMode === "list"
              ? "bg-(--team-color) text-white shadow-md"
              : "text-slate-400 cursor-pointer"
          }`}
        >
          一覧
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`px-6 py-3 rounded-xl transition-all flex-1 text-center ${
            viewMode === "calendar"
              ? "bg-(--team-color) text-white shadow-md"
              : "text-slate-400 cursor-pointer"
          }`}
        >
          カレンダー
        </button>
      </div>

      {/* 一覧表示 */}
      {viewMode === "list" ? (
        <div className="flex flex-col gap-6 w-full">
          {/* 月移動コントローラー */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePrevMonth}
              className="text-3xl font-black text-slate-300 hover:text-(--team-color) transition-colors p-2 cursor-pointer"
            >
              ←
            </button>
            <div className="text-center">
              <p className="text-2xl font-black tracking-tighter italic">
                {displayYear}.{(displayMonth + 1).toString().padStart(2, "0")}
              </p>
            </div>
            <button
              onClick={handleNextMonth}
              className="text-3xl font-black text-slate-300 hover:text-(--team-color) transition-colors p-2 cursor-pointer"
            >
              →
            </button>
          </div>

          {/* ゲーム一覧 */}
          {games.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg font-semibold">この月の試合はありません</p>
            </div>
          ) : (
            games.map((game) => {
              const res = getResultStyle(game.result);
              return (
                <Link
                  href={`./games/${game.id}?year=${displayYear}&month=${displayMonth}`}
                  key={game.id}
                >
                  <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 group hover:border-(--team-color) transition-all w-full overflow-hidden">
                    {/* 左側：日付と対戦相手情報 */}
                    <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                      <div className="text-center min-w-17.5 md:min-w-22.5 border-r border-slate-100 pr-4 md:pr-6 shrink-0">
                        <p className="font-black text-slate-400 leading-none mb-1">
                          {game.month + 1}月
                        </p>
                        <p className="text-3xl md:text-4xl font-black italic text-slate-900 leading-none">
                          {game.date}
                        </p>
                      </div>

                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <p className="font-black text-slate-400 tracking-widest mb-2 truncate block">
                          {game.leagueName}
                        </p>

                        {/* チーム名 */}
                        <div className="flex items-baseline gap-2 min-w-0 mb-2">
                          <span className="text-slate-400 text-lg md:text-xl font-black italic shrink-0">
                            vs
                          </span>
                          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 truncate leading-tight">
                            {game.opponent}
                          </h3>
                        </div>

                        {/* 開始時間と球場名 */}
                        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                          <div className="flex items-center gap-1 text-slate-500 font-semibold">
                            <Clock size={14} className="shrink-0" />
                            <span>
                              {new Date(
                                game.startDatetime || "",
                              ).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                              ～
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 font-semibold">
                            <MapPin size={14} className="shrink-0" />
                            <span className="truncate">{game.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 右側：得点と結果 */}
                    <div className="flex items-center justify-end gap-3 md:gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50 shrink-0 ml-auto">
                      {game.result !== "next" ? (
                        <div className="flex items-center gap-3 md:gap-4 shrink-0">
                          <p className="text-3xl md:text-5xl font-black italic tracking-tighter text-slate-900 leading-none">
                            {game.score}
                          </p>
                          <div
                            className="text-white text-[10px] md:text-[11px] font-black px-4 py-1.5 md:px-5 md:py-2 rounded-full italic tracking-widest shadow-sm shrink-0 whitespace-nowrap"
                            style={{ backgroundColor: res.color }}
                          >
                            {res.label}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 px-4 py-2 md:px-6 md:py-3 rounded-2xl border border-slate-100 shrink-0">
                          <span className="text-slate-300 font-black italic tracking-[0.2em] whitespace-nowrap">
                            試合前
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      ) : (
        /* --- カレンダー表示 --- */
        <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-xl border border-slate-50">
          {/* 年月移動コントローラー */}
          <div className="flex justify-between items-center mb-10 px-4">
            <button
              onClick={handlePrevMonth}
              className="text-3xl font-black text-slate-300 hover:text-(--team-color) transition-colors p-2"
            >
              ←
            </button>
            <div className="text-center">
              <p className="text-4xl font-black tracking-tighter italic">
                {displayYear}.{(displayMonth + 1).toString().padStart(2, "0")}
              </p>
            </div>
            <button
              onClick={handleNextMonth}
              className="text-3xl font-black text-slate-300 hover:text-(--team-color) transition-colors p-2"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 w-full border-b border-slate-100 mb-4 font-black">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d, i) => (
              <div
                key={d}
                className={`text-center py-4 text-xs tracking-widest ${
                  i === 0
                    ? "text-red-400"
                    : i === 6
                      ? "text-blue-400"
                      : "text-slate-300"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 w-full gap-1 md:gap-3">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-25 sm:min-h-30 md:min-h-35 bg-slate-50/30 rounded-2xl"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const game = games.find(
                (g) =>
                  g.date === day &&
                  g.month === displayMonth &&
                  g.year === displayYear,
              );
              const res = game ? getResultStyle(game.result) : null;

              if (game) {
                return (
                  <Link
                    href={`./games/${game.id}?year=${displayYear}&month=${displayMonth}`}
                    key={day}
                  >
                    <div className="min-h-25 sm:min-h-30 md:min-h-35 border rounded-xl md:rounded-2xl p-1.5 sm:p-2 md:p-3 flex flex-col transition-all border-slate-200 shadow-sm ring-1 ring-slate-100 bg-white hover:shadow-lg">
                      {/* 日付 */}
                      <span className="text-base md:text-lg font-black italic leading-none text-slate-900 mb-1">
                        {day}
                      </span>

                      <div className="flex flex-col gap-0.5 flex-1 min-h-0">
                        {/* リーグ名 */}
                        {game.leagueName && (
                          <p
                            className="text-sm font-bold text-slate-500 leading-tight"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              wordBreak: "break-all",
                            }}
                          >
                            {game.leagueName}
                          </p>
                        )}

                        {/* 対戦相手 */}
                        <p
                          className="font-black leading-tight text-slate-900 mb-0.5"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            wordBreak: "break-word",
                          }}
                        >
                          {game.opponent}
                        </p>

                        {/* 開始時間 */}
                        <div className="flex items-center gap-0.5 text-sm text-slate-500 font-semibold min-w-0">
                          <Clock size={12} className="shrink-0" />
                          <span className="truncate">
                            {new Date(
                              game.startDatetime || "",
                            ).toLocaleTimeString("ja-JP", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        </div>

                        {/* 球場名 */}
                        <div className="flex items-center gap-0.5 text-sm text-slate-500 font-semibold min-w-0">
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate">{game.location}</span>
                        </div>

                        {/* 試合結果 */}
                        <div className="mt-auto pt-0.5">
                          <div
                            className="text-sm text-white px-1 py-0.5 md:py-1 rounded md:rounded-lg font-black text-center truncate whitespace-nowrap"
                            style={{ backgroundColor: res?.color }}
                          >
                            {game.result === "next"
                              ? "予定"
                              : `${res?.label} ${game.score}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }

              return (
                <div
                  key={day}
                  className="min-h-25 sm:min-h-30 md:min-h-35 border rounded-xl md:rounded-2xl p-1.5 sm:p-2 md:p-4 flex flex-col transition-all overflow-hidden border-slate-100"
                >
                  {/* 日付 */}
                  <span className="text-lg font-black italic leading-none text-slate-200">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
