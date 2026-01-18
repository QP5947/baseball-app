"use client";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import Footer from "../../components/Footer";
import FrontMenu from "../../components/FrontMenu";

export default function GameDetailPage() {
  const teamSettings = {
    primaryColor: "#3b82f6",
    victoryColor: "#ef4444",
    teamName: "森野クマサンズ",
  };

  const themeStyle = {
    "--team-color": teamSettings.primaryColor,
    "--victory-color": teamSettings.victoryColor,
  } as React.CSSProperties;

  // 打者データ（1番〜9番）
  const batters = [
    {
      num: 1,
      pos: "右",
      name: "市橋",
      res: ["中安", "", "投ゴ", "", "三失", "捕飛", ""],
      ab: 5,
      h: 2,
      rbi: 0,
      sb: 3,
      bb: 0,
      k: 0,
      r: 2,
    },
    {
      num: 2,
      pos: "中",
      name: "三浦",
      res: ["一ゴ", "", "四球", "", "三振", "", "死球"],
      ab: 3,
      h: 0,
      rbi: 0,
      sb: 1,
      bb: 2,
      k: 1,
      r: 2,
    },
    {
      num: 3,
      pos: "捕",
      name: "山下",
      res: ["左犠①", "", "投飛", "", "遊安①", "", "中飛"],
      ab: 4,
      h: 2,
      rbi: 2,
      sb: 0,
      bb: 0,
      k: 0,
      r: 0,
    },
    {
      num: 4,
      pos: "遊",
      name: "櫛田",
      res: ["左飛", "", "左本②", "", "三振", "", "死球"],
      ab: 4,
      h: 1,
      rbi: 2,
      sb: 0,
      bb: 1,
      k: 1,
      r: 2,
    },
    {
      num: 5,
      pos: "一",
      name: "田中",
      res: ["", "三振", "中安", "", "", "遊ゴ", "投飛"],
      ab: 4,
      h: 1,
      rbi: 1,
      sb: 0,
      bb: 1,
      k: 1,
      r: 1,
    },
    {
      num: 6,
      pos: "左",
      name: "佐藤",
      res: ["", "投飛", "", "三振", "", "中飛", "左安"],
      ab: 5,
      h: 1,
      rbi: 1,
      sb: 1,
      bb: 0,
      k: 1,
      r: 0,
    },
    {
      num: 7,
      pos: "二",
      name: "渡辺",
      res: ["", "中飛", "", "三振", "", "投飛", "死球"],
      ab: 3,
      h: 0,
      rbi: 1,
      sb: 0,
      bb: 1,
      k: 1,
      r: 0,
    },
    {
      num: 8,
      pos: "三",
      name: "伊藤",
      res: ["", "三振", "", "四球", "", "三飛", "三振"],
      ab: 3,
      h: 0,
      rbi: 0,
      sb: 0,
      bb: 1,
      k: 2,
      r: 0,
    },
    {
      num: 9,
      pos: "投",
      name: "近藤",
      res: ["", "三振", "", "", "投ゴ", "中飛", ""],
      ab: 4,
      h: 0,
      rbi: 0,
      sb: 0,
      bb: 0,
      k: 1,
      r: 0,
    },
  ];

  return (
    <div
      className="min-h-screen bg-gray-50 text-slate-800 pb-20"
      style={themeStyle}
    >
      <FrontMenu teamName={teamSettings.teamName} />
      <main className="pt-32 md:pt-40 max-w-6xl mx-auto px-4 md:px-6">
        {/* 戻るボタン */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/games"
            className="text-gray-500 hover:text-gray-700 flex"
          >
            <ChevronLeft size={24} className="mr-3" /> 試合一覧
          </Link>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <span className="w-2 h-10 bg-(--team-color) rounded-full"></span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
            試合予定・結果
          </h2>
        </div>
        {/* スコアボード */}
        <section className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-100 mb-8 overflow-hidden">
          <div className="flex justify-between items-center mb-10 px-4">
            <div className="w-1/3 flex flex-col items-center text-center">
              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                Visitor
              </p>
              <div className="w-12 h-12 md:w-20 md:h-20 bg-blue-50 text-slate-300 flex items-center justify-center rounded-3xl font-black">
                相手
              </div>
            </div>
            <div className="px-6 text-center shrink-0">
              <div className="mt-4">
                <span className="text-[10px] md:text-xs font-black bg-red-500 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full italic shadow-sm">
                  WIN!
                </span>
              </div>

              <span className="text-4xl md:text-8xl font-black italic tracking-tighter mx-4 leading-none">
                6 - 7x
              </span>
            </div>
            <div className="w-1/3 flex flex-col items-center text-center">
              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                Home
              </p>
              <div className="w-12 h-12 md:w-20 md:h-20 bg-blue-50 flex items-center justify-center rounded-2xl">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/3177/3177142.png"
                  className="w-8 h-8 md:w-10 md:h-10"
                  alt="Home"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl bg-slate-50 p-2 md:p-6 border border-slate-100">
            <table className="w-full font-black border-separate border-spacing-y-1">
              <thead>
                <tr className="text-slate-400 tracking-widest">
                  <th className="py-2 text-left px-4 w-30 md:w-45">チーム名</th>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <th key={n} className="w-8 md:w-12 text-center">
                      {n}
                    </th>
                  ))}
                  {/* 合計列：border-lで区切りを強調 */}
                  <th className="w-12 md:w-16 text-slate-900 border-l border-slate-200 text-center">
                    計
                  </th>
                </tr>
              </thead>
              <tbody className="text-xl md:text-3xl italic">
                <tr className="bg-white shadow-sm">
                  <td className="py-4 text-left px-4 text-xs md:text-sm not-italic font-bold whitespace-nowrap">
                    イエローストーンズ
                  </td>
                  {[1, 2, 0, 0, 1, 1, 1].map((score, i) => (
                    <td key={i} className="text-center">
                      {score}
                    </td>
                  ))}
                  <td className="text-center text-slate-900 border-l border-slate-100 rounded-r-xl bg-slate-50/50">
                    6
                  </td>
                </tr>

                <tr className="h-2"></tr>

                <tr className="bg-blue-50/50 shadow-sm text-(--team-color)">
                  <td className="py-4 text-left px-4 text-xs md:text-sm not-italic font-bold text-slate-900 whitespace-nowrap">
                    {teamSettings.teamName}
                  </td>
                  {["1", "0", "2", "0", "1", "1", "2x"].map((score, i) => (
                    <td key={i} className="text-center">
                      {score}
                    </td>
                  ))}
                  <td className="text-center border-l border-blue-100 rounded-r-xl bg-blue-100/50">
                    7
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* --- 2. 試合基本情報 (日時・場所・審判など) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-white rounded-[2rem]4x1 p-6 md:p-8 shadow-sm border border-slate-100">
            <h4 className="flex items-center gap-2 text-lg font-black mb-4">
              <span className="w-1.5 h-5 bg-(--team-color) rounded-full"></span>
              試合情報
            </h4>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-slate-400 font-black mb-1">試合日</p>
                <p className="font-bold">2025年11月17日 (日)</p>
              </div>
              <div>
                <p className="text-slate-400 font-black mb-1">グラウンド</p>
                <p className="font-bold">〇〇河川敷グラウンド</p>
              </div>
              <div>
                <p className="text-slate-400 font-black mb-1">試合開始時間</p>
                <p className="font-bold">13:00～</p>
              </div>
              <div>
                <p className="text-slate-400  font-black mb-1">試合区分</p>
                <p className="font-bold">連盟派遣</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-4x1 p-6 md:p-8 shadow-sm border border-slate-100">
            <h4 className="flex items-center gap-2 text-lg font-black mb-4">
              <span className="w-1.5 h-5 bg-red-500 rounded-full"></span>
              バッテリー
            </h4>
            <p className="font-bold leading-relaxed text-slate-600">
              近藤 - 山下
            </p>
          </div>
        </div>

        {/* --- 3. 試合講評 --- */}
        <section className="bg-white rounded-4x1 p-6 md:p-8 shadow-sm border border-slate-100 mb-8">
          <h4 className="flex items-center gap-2 text-xl font-black mb-4">
            <span className="w-1.5 h-6 bg-(--team-color) rounded-full"></span>
            試合講評
          </h4>
          <p className="text-slate-600 leading-relaxed font-medium">
            今シーズンの最終戦となったこの試合は今年負け越しているイエローが相手。試合は点数を取って取られてのシーソーゲーム。両チームに本塁打も飛び出すなど落ち着く展開が皆無。最後は2死満塁から押し出し死球によりサヨナラ勝ちとなった。
          </p>
        </section>

        {/* --- 打撃成績 (1番〜9番) --- */}
        <section className="bg-white rounded-4x1 p-6 md:p-8 shadow-sm border border-slate-100 mb-8 overflow-hidden">
          <div className="flex justify-between items-end mb-6">
            <h4 className="flex items-center gap-2 text-xl font-black">
              <span className="w-1.5 h-6 bg-(--team-color) rounded-full"></span>
              打撃成績
            </h4>
            <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase italic">
              Batting Box Score
            </span>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full border-collapse min-w-200">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider">
                <tr>
                  <th className="p-3 text-left w-12">打順</th>
                  <th className="p-3 text-left w-12">守備</th>
                  <th className="p-3 text-left w-24">選手名</th>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <th key={n} className="p-3 w-17">
                      {n}
                    </th>
                  ))}
                  <th className="p-3 bg-blue-50/50 text-blue-600">打数</th>
                  <th className="p-3 bg-red-50/50 text-red-600">安打</th>
                  <th className="p-3">打点</th>
                  <th className="p-3">盗塁</th>
                  <th className="p-3">盗失</th>
                  <th className="p-3">得点</th>
                  <th className="p-3">失策</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700">
                {batters.map((row) => (
                  <tr
                    key={row.num}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors text-center"
                  >
                    <td className="p-3 text-left text-slate-300 font-black italic">
                      {row.num}
                    </td>
                    <td className="p-3 text-left font-black text-slate-400">
                      {row.pos}
                    </td>
                    <td className="p-3 text-left font-black text-base whitespace-nowrap">
                      {row.name}
                    </td>
                    {row.res.map((r, idx) => (
                      <td key={idx} className="p-2">
                        <span
                          className={`block py-1 rounded-md text-center border ${
                            r.includes("安") || r.includes("本")
                              ? "bg-red-50 text-red-600 border-red-100 font-black"
                              : r.includes("四") || r.includes("死")
                                ? "bg-green-50 text-green-600 border-green-100"
                                : "text-slate-500 border-transparent"
                          }`}
                        >
                          {r}
                        </span>
                      </td>
                    ))}
                    <td className="p-3 bg-blue-50/30 text-slate-900">
                      {row.ab}
                    </td>
                    <td className="p-3 bg-red-50/30 text-red-600">{row.h}</td>
                    <td className="p-3 text-lg italic text-slate-900">
                      {row.rbi}
                    </td>
                    <td className="p-3 text-slate-400">{row.sb}</td>
                    <td className="p-3 text-slate-400">{row.bb}</td>
                    <td className="p-3 text-slate-400">{row.k}</td>
                    <td className="p-3 text-slate-400">{row.r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- 投手成績 (全項目完全版) --- */}
        <section className="bg-white rounded-4x1 p-6 md:p-8 shadow-sm border border-slate-100 mb-5">
          <div className="flex justify-between items-end mb-6">
            <h4 className="flex items-center gap-2 text-xl font-black">
              <span className="w-1.5 h-6 bg-(--team-color) rounded-full"></span>
              投手成績
            </h4>
            <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase italic">
              Pitching Stats
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center min-w-175">
              <thead className="bg-slate-50 text-slate-400 font-black tracking-wider">
                <tr>
                  <th className="p-3 text-left rounded-l-xl">選手名</th>
                  <th className="p-3">結果</th>
                  <th className="p-3">イニング</th>
                  <th className="p-3">安打</th>
                  <th className="p-3">被本</th>
                  <th className="p-3">奪三振</th>
                  <th className="p-3">四球</th>
                  <th className="p-3">死球</th>
                  <th className="p-3">失点</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700">
                <tr className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-4 text-left font-black text-lg">近藤</td>
                  <td className="p-4">
                    <span className="bg-red-500 text-white font-black px-3 py-1 rounded-full italic shadow-sm">
                      勝利
                    </span>
                  </td>
                  <td className="p-4 text-2xl font-black italic text-slate-900 tracking-tighter">
                    7 <span className="text-xl">2/3</span>
                  </td>
                  <td className="p-4">8</td>
                  <td className="p-4">1</td>
                  <td className="p-4">5</td>
                  <td className="p-4">3</td>
                  <td className="p-4">3</td>
                  <td className="p-4">6</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
