"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

const TEAM_ABBREVIATIONS = [
  "フレンドリー",
  "ロケッツ",
  "ウインズ",
  "KJフェニックス",
  "ノンベーズ",
  "イエローストーン",
];
const TEAMS_DATA = [
  {
    name: "フレンドリー",
    results: [null, 1, 1, 3, 5, 1], // vsノンベーズを不戦敗に変更
    g: 5,
    w: 3,
    l: 1,
    d: 1,
    pts: 10,
    diff: 12,
  },
  {
    name: "ロケッツ",
    results: [2, null, 1, 2, 1, 3],
    g: 5,
    w: 2,
    l: 2,
    d: 1,
    pts: 7,
    diff: 4,
  },
  {
    name: "ウインズ",
    results: [2, 2, null, 4, 1, 2], // vs KJを不戦勝に変更
    g: 5,
    w: 2,
    l: 3,
    d: 0,
    pts: 6,
    diff: 2,
  },
  {
    name: "KJフェニックス",
    results: [3, 1, 5, null, 2, 2], // vs ウインズを不戦敗に変更
    g: 5,
    w: 1,
    l: 3,
    d: 1,
    pts: 4,
    diff: -3,
  },
  {
    name: "ノンベーズ",
    results: [4, 2, 2, 1, null, 2], // vs フレンドリーを不戦勝に変更
    g: 5,
    w: 2,
    l: 3,
    d: 0,
    pts: 6,
    diff: -6,
  },
  {
    name: "イエローストーン",
    results: [2, 3, 1, 1, 1, null],
    g: 5,
    w: 3,
    l: 1,
    d: 1,
    pts: 10,
    diff: -9,
  },
].sort((a, b) => b.pts - a.pts);

export default function StandingsPage() {
  const [activeTab, setActiveTab] = useState("standings");

  const getResultSymbol = (res: number | null) => {
    switch (res) {
      case 1: // 勝ち
        return <span className="text-blue-600 font-black text-lg">○</span>;
      case 2: // 負け
        return <span className="text-rose-400 font-black text-lg">●</span>;
      case 3: // 引き分け
        return <span className="text-slate-400 font-black text-lg">△</span>;
      case 4: // 不戦勝
        return <span className="text-slate-800 font-black text-lg">□</span>;
      case 5: // 不戦敗
        return <span className="text-slate-800 font-black text-lg">■</span>;
      default: // 未対戦
        return <span className="text-slate-200">-</span>;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="relative h-48 md:h-64 flex items-center justify-center overflow-hidden">
        <img
          src="/league.jpg"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-blue-900/60 z-10"></div>
        <div className="relative z-30 text-center">
          <h1 className="text-4xl md:text-6xl font-black italic text-white drop-shadow-lg">
            PENPEN LEAGUE
          </h1>
          <p className="text-white font-bold text-lg md:text-xl mt-2">
            リーグ戦勝敗表
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <Link
          href="./"
          className="inline-flex items-center gap-2 mb-6 font-bold text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={20} /> ホームへ戻る
        </Link>

        <section className="space-y-6 mb-20">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
            リーグ戦
          </h1>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("standings")}
              className={`py-2 px-4 font-bold ${activeTab === "standings" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
            >
              順位表
            </button>
            <button
              onClick={() => setActiveTab("crosstable")}
              className={`py-2 px-4 font-bold ${activeTab === "crosstable" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
            >
              対戦成績
            </button>
          </div>

          <div className="bg-white rounded-b-lg shadow-xl border border-blue-100 overflow-hidden">
            <div className="p-4 md:p-8">
              {activeTab === "standings" ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white tracking-[0.2em]">
                        <th className="p-3 border border-slate-700 text-center w-12">
                          順位
                        </th>
                        <th className="p-3 border border-slate-700 text-left w-40 whitespace-nowrap">
                          チーム名
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200 whitespace-nowrap">
                          試合
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200">
                          勝
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200">
                          敗
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-12 text-blue-200">
                          分
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-blue-900 w-16 text-blue-200 whitespace-nowrap">
                          勝率
                        </th>
                        <th className="p-3 border border-slate-700 text-center bg-amber-600 w-16 whitespace-nowrap">
                          勝ち点
                        </th>
                        <th className="p-3 border border-slate-700 text-center w-16 whitespace-nowrap">
                          得失点
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-bold">
                      {TEAMS_DATA.map((team, idx) => (
                        <tr
                          key={team.name}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="p-3 border border-slate-100 text-center italic font-black text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-3 border border-slate-100 text-slate-800">
                            {team.name}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.g}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.w}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.l}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-600">
                            {team.d}
                          </td>
                          <td className="p-3 border border-slate-100 text-center text-slate-500 font-mono">
                            {(team.w + team.l > 0
                              ? team.w / (team.w + team.l)
                              : 0
                            )
                              .toFixed(3)
                              .substring(1)}
                          </td>
                          <td className="p-3 border border-slate-100 text-center bg-amber-50 text-amber-700 text-xl font-black">
                            {team.pts}
                          </td>
                          <td
                            className={`p-3 border border-slate-100 text-center font-black ${team.diff >= 0 ? "text-emerald-500" : "text-rose-400"}`}
                          >
                            {team.diff > 0 ? `+${team.diff}` : team.diff}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white tracking-[0.2em]">
                        <th className="p-3 border border-slate-700 text-center w-12">
                          順位
                        </th>
                        <th className="p-3 border border-slate-700 text-left w-40 whitespace-nowrap">
                          チーム名
                        </th>
                        {TEAM_ABBREVIATIONS.map((h) => (
                          <th
                            key={h}
                            className="p-3 border border-slate-700 text-center w-20 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-bold">
                      {TEAMS_DATA.map((team, idx) => (
                        <tr
                          key={team.name}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="p-3 border border-slate-100 text-center italic font-black text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-3 border border-slate-100 text-slate-800">
                            {team.name}
                          </td>
                          {team.results.map((res, i) => (
                            <td
                              key={i}
                              className={`p-3 border border-slate-100 text-center text-xs ${res === null ? "bg-slate-200" : ""}`}
                            >
                              {getResultSymbol(res)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="bg-slate-50 p-4 text-slate-400 font-bold flex flex-wrap gap-x-6 gap-y-2 justify-center border-t border-slate-100">
              <div className="flex items-center gap-1">
                <span className="text-blue-600 text-lg">○</span> 勝ち
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-lg">△</span> 引き分け
              </div>
              <div className="flex items-center gap-1">
                <span className="text-rose-400 text-lg">●</span> 負け
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-800 font-black text-lg">□</span>{" "}
                不戦勝
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-800 font-black text-lg">■</span>{" "}
                不戦敗
              </div>
            </div>
          </div>
        </section>

        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-5">
          春のトーナメント
        </h1>

        <div className="bg-slate-50 flex items-center overflow-x-auto font-sans p-4">
          <div className="flex items-center min-w-max">
            <div className="flex flex-col justify-between h-124 w-52 relative z-10">
              <div className="flex flex-col gap-6">
                <div className="h-24 p-3 border border-slate-300 rounded-md shadow-sm flex items-center bg-blue-50 font-bold text-slate-800">
                  <span>チーム1（シード）</span>
                </div>

                <div className="h-24 bg-white border border-slate-300 rounded-md shadow-sm">
                  <div className="h-1/2 p-3 border-b border-slate-100 flex justify-between items-center font-bold text-slate-800 bg-blue-50 rounded-t-md">
                    <span>チーム2</span>
                    <span className="text-blue-600">2</span>
                  </div>
                  <div className="h-1/2 p-3 flex justify-between items-center text-slate-400">
                    <span>チーム3</span>
                    <span>1</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="h-24 p-3 border border-slate-300 rounded-md shadow-sm flex items-center bg-blue-50 font-bold text-slate-800">
                  <span>チーム4 (シード)</span>
                </div>

                <div className="h-24 bg-white border border-slate-300 rounded-md shadow-sm">
                  <div className="h-1/2 p-3 border-b border-slate-100 flex justify-between items-center text-slate-400 rounded-t-md">
                    <span>チーム5</span>
                    <span>0</span>
                  </div>
                  <div className="h-1/2 p-3 flex justify-between items-center font-bold text-slate-800">
                    <span>チーム6</span>
                    <span className="text-blue-600">3</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-8 relative h-124">
              <div className="absolute top-12 h-30 left-0 w-full border-r-2 border-y-2 border-slate-300 rounded-r-md"></div>
              <div className="absolute top-27 -right-4 w-4 border-b-2 border-slate-300"></div>

              <div className="absolute bottom-12 h-30 left-0 w-full border-r-2 border-y-2 border-slate-300 rounded-r-md"></div>
              <div className="absolute bottom-27 -right-4 w-4 border-b-2 border-slate-300"></div>
            </div>

            <div className="flex flex-col justify-between h-124 w-52 ml-4 relative z-10">
              <div className="mt-15 h-24 bg-white border-2 border-blue-200 rounded-md shadow-md">
                <div className="h-1/2 p-3 border-b border-slate-100 flex justify-between items-center font-bold text-slate-800 bg-blue-50 rounded-t-md">
                  <span>チーム1</span>
                  <span className="text-blue-600">3</span>
                </div>
                <div className="h-1/2 p-3 flex justify-between items-center text-slate-400">
                  <span>チーム2</span>
                  <span>0</span>
                </div>
              </div>

              <div className="mb-15 h-24 bg-white border border-slate-300 rounded-md shadow-sm">
                <div className="h-1/2 p-3 border-b border-slate-100 flex justify-between items-center text-slate-400 rounded-t-md">
                  <span>チーム4</span>
                  <span>1</span>
                </div>
                <div className="h-1/2 p-3 flex justify-between items-center font-bold text-slate-800 bg-blue-50">
                  <span>チーム6</span>
                  <span className="text-blue-600">2</span>
                </div>
              </div>
            </div>

            <div className="w-8 relative h-124">
              <div className="absolute top-27 bottom-27 left-0 w-full border-r-2 border-y-2 border-slate-300 rounded-r-md"></div>
              <div className="absolute top-1/2 -right-6 w-6 border-b-2 border-slate-300"></div>
            </div>

            <div className="flex flex-col justify-center h-124 w-60 ml-6 relative z-10">
              <div className="h-28 bg-yellow-50 border-2 border-yellow-400 rounded-md shadow-lg transform scale-105">
                <div className="h-1/2 p-4 border-b border-yellow-200 flex justify-between items-center font-black text-slate-800 rounded-t-md">
                  <span>チーム1</span>
                  <span className="text-yellow-600 text-lg">2</span>
                </div>
                <div className="h-1/2 p-4 flex justify-between items-center font-bold text-slate-500">
                  <span>チーム6</span>
                  <span>1</span>
                </div>
              </div>
            </div>

            <div className="w-12 relative h-124">
              <div className="absolute top-1/2 left-0 w-full border-b-2 border-yellow-400"></div>
            </div>

            <div className="flex flex-col justify-center h-124 relative z-10">
              <div className="bg-linear-to-br from-yellow-400 to-amber-500 text-white text-center py-5 px-8 rounded-xl shadow-xl transform hover:scale-105 transition-transform cursor-default whitespace-nowrap">
                <div className="font-bold tracking-widest mb-1 opacity-90 text-red-500">
                  優勝
                </div>
                <div className="text-2xl font-black flex items-center gap-2">
                  <span>🏆</span> チーム1
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-16 p-12 text-center bg-gray-100 border-t">
        <p className="text-gray-400 mt-6 text-lg">© 2026 PENPEN LEAGUE</p>
      </footer>
    </main>
  );
}
