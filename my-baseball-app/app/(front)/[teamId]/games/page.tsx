"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import FrontMenu from "../components/FrontMenu";
import Footer from "../components/Footer";

export default function GamesPage() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // 表示中カレンダーの年月管理
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)); // 2026年1月
  const [selectedYear, setSelectedYear] = useState("2026");

  // スマホ判定
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode("list");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const teamSettings = {
    primaryColor: "#3b82f6",
    victoryColor: "#ef4444",
    loseColor: "#64748b",
    drawColor: "#f59e0b",
    teamName: "森野クマサンズ",
  };

  const themeStyle = {
    "--team-color": teamSettings.primaryColor,
    "--victory-color": teamSettings.victoryColor,
  } as React.CSSProperties;

  // 試合データ
  const games = [
    {
      id: 1,
      date: 4,
      month: 0,
      year: 2026,
      opponent: "レッドイーグルス",
      result: "win",
      score: "8 - 2",
      location: "〇〇河川敷",
    },
    {
      id: 2,
      date: 11,
      month: 0,
      year: 2026,
      opponent: "ブルースターズ",
      result: "lose",
      score: "3 - 5",
      location: "横浜スタジアム",
    },
    {
      id: 3,
      date: 18,
      month: 0,
      year: 2026,
      opponent: "グリーンパークス",
      result: "draw",
      score: "4 - 4",
      location: "市民グラウンド",
    },
    {
      id: 4,
      date: 25,
      month: 0,
      year: 2026,
      opponent: "イエローストーンズ",
      result: "next",
      score: "",
      location: "県営A面",
    },
  ];

  // カレンダー計算用
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getResultStyle = (result: string) => {
    switch (result) {
      case "win":
        return { color: teamSettings.victoryColor, label: "勝利" };
      case "lose":
        return { color: teamSettings.loseColor, label: "敗戦" };
      case "draw":
        return { color: teamSettings.drawColor, label: "引分" };
      default:
        return { color: "#cbd5e1", label: "予定" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800" style={themeStyle}>
      <FrontMenu teamName={teamSettings.teamName} />

      <main className="pt-40 md:pt-48 max-w-6xl mx-auto px-6 pb-20">
        <div className="flex flex-row justify-between items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-2xl font-black text-(--team-color) border-none focus:ring-0 p-0 cursor-pointer appearance-none"
              >
                <option value="2026">2026年度</option>
                <option value="2025">2025年度</option>
              </select>
              <span className="text-(--team-color) font-black text-2xl">▼</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-2 h-10 bg-(--team-color) rounded-full"></span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
                試合予定・結果
              </h2>
            </div>
          </div>

          <div className="hidden md:flex bg-white p-1 rounded-2xl shadow-inner border border-slate-100 font-black">
            <button
              onClick={() => setViewMode("list")}
              className={`px-8 py-3 rounded-xl transition-all ${
                viewMode === "list"
                  ? "bg-(--team-color) text-white shadow-md"
                  : "text-slate-400"
              }`}
            >
              一覧
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-8 py-3 rounded-xl transition-all ${
                viewMode === "calendar"
                  ? "bg-(--team-color) text-white shadow-md"
                  : "text-slate-400"
              }`}
            >
              カレンダー
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="flex flex-col gap-6 w-full">
            {games.map((game) => {
              const res = getResultStyle(game.result);
              return (
                <Link href="games/1">
                  <div
                    key={game.id}
                    className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 group hover:border-(--team-color) transition-all w-full overflow-hidden"
                  >
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
                        <p className="font-black text-slate-400 uppercase tracking-widest mb-1 truncate block">
                          {game.location}
                        </p>

                        {/* チーム名 */}
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="text-slate-400 text-lg md:text-xl font-black italic shrink-0">
                            vs
                          </span>
                          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 truncate leading-tight">
                            {game.opponent}
                          </h3>
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
            })}
          </div>
        ) : (
          /* --- カレンダー表示（年月移動・文字サイズUP・省略表示対応） --- */
          <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-xl border border-slate-50">
            {/* 年月移動コントローラー */}
            <div className="flex justify-between items-center mb-10 px-4">
              <button
                onClick={prevMonth}
                className="text-3xl font-black text-slate-300 hover:text-(--team-color) transition-colors p-2"
              >
                ←
              </button>
              <div className="text-center">
                <p className="text-4xl font-black tracking-tighter italic">
                  {year}.{(month + 1).toString().padStart(2, "0")}
                </p>
              </div>
              <button
                onClick={nextMonth}
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
                  className="aspect-square bg-slate-50/30 rounded-2xl"
                />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const game = games.find(
                  (g) => g.date === day && g.month === month && g.year === year,
                );
                const res = game ? getResultStyle(game.result) : null;

                if (game) {
                  return (
                    <Link href="games/1">
                      <div
                        key={day}
                        className="aspect-square border rounded-xl md:rounded-2xl p-1.5 sm:p-2 md:p-4 flex flex-col transition-all overflow-hidden border-slate-200 shadow-sm ring-1 ring-slate-100 bg-white"
                      >
                        {/* 日付 */}
                        <span className="text-lg font-black italic leading-none text-slate-900">
                          {day}
                        </span>

                        <div className="mt-1 flex flex-col gap-0.5 md:gap-1 grow overflow-hidden">
                          <p className="text-[8px] sm:text-[10px] md:text-[13px] font-black leading-tight text-slate-600 truncate">
                            {game.opponent}
                          </p>

                          <p className="hidden lg:block text-[9px] font-bold text-slate-400 truncate">
                            @{game.location}
                          </p>

                          <div className="mt-auto">
                            <div
                              className="text-[7px] sm:text-[9px] md:text-[12px] text-white px-1 py-0.5 md:py-1 rounded md:rounded-lg font-black text-center truncate whitespace-nowrap"
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
                    className="aspect-square border rounded-xl md:rounded-2xl p-1.5 sm:p-2 md:p-4 flex flex-col transition-all overflow-hidden border-slate-100"
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
      </main>
      <Footer />
    </div>
  );
}
