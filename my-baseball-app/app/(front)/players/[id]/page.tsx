"use client";

import React from "react";
import FrontMenu from "../../components/FrontMenu";
import Footer from "../../components/Footer";
import Link from "next/link";

export default function PlayerDetailPage() {
  const teamSettings = {
    primaryColor: "#3b82f6",
    teamName: "森野クマサンズ",
  };

  const themeStyle = {
    "--team-color": teamSettings.primaryColor,
  } as React.CSSProperties;

  // サンプルデータ
  const player = {
    number: "18",
    name: "近藤 健太",
    role: "投手",
    img: "https://cdn-icons-png.flaticon.com/512/3177/3177142.png",
    profile:
      "チームの大黒柱。キレのある直球とスライダーを武器に、ピンチでも動じないマウンドさばきを見せる。",
    // 獲得タイトル
    titles: ["最多勝 (2024)", "最優秀防御率 (2024)", "打点王 (2023)"],
    // 年度別成績（投手）
    pitchingHistory: [
      {
        year: 2023,
        era: "3.12",
        games: 10,
        win: 4,
        lose: 4,
        sv: 1,
        ip: "52.0",
        k: 38,
        bb: 20,
        r: 25,
        er: 18,
        whip: "1.35",
      },
      {
        year: 2024,
        era: "2.45",
        games: 8,
        win: 5,
        lose: 2,
        sv: 0,
        ip: "48.1",
        k: 42,
        bb: 12,
        r: 18,
        er: 13,
        whip: "1.12",
      },
    ],
    // 投手通算
    pitchingTotal: {
      era: "2.80",
      games: 18,
      win: 9,
      lose: 6,
      sv: 1,
      ip: "100.1",
      k: 80,
      bb: 32,
      r: 43,
      er: 31,
      whip: "1.23",
    },

    // 年度別成績（打者）
    battingHistory: [
      {
        year: 2023,
        games: 15,
        avg: ".345",
        ab: 40,
        h: 14,
        hr: 1,
        rbi: 12,
        bb: 6,
        k: 3,
        sb: 2,
        obp: ".435",
        ops: ".910",
      },
      {
        year: 2024,
        games: 12,
        avg: ".312",
        ab: 34,
        h: 11,
        hr: 2,
        rbi: 8,
        bb: 4,
        k: 5,
        sb: 1,
        obp: ".395",
        ops: ".895",
      },
    ],
    // 打者通算
    battingTotal: {
      games: 27,
      avg: ".338",
      ab: 74,
      h: 25,
      hr: 3,
      rbi: 20,
      bb: 10,
      k: 8,
      sb: 3,
      obp: ".416",
      ops: ".903",
    },
  };

  return (
    <div
      className="min-h-screen bg-gray-50 text-slate-800 pb-20"
      style={themeStyle}
    >
      <FrontMenu teamName={teamSettings.teamName} />

      <main className="pt-32 md:pt-40 max-w-6xl mx-auto px-4 md:px-6">
        {/* 戻るボタン */}
        <div className="mb-6">
          <Link
            href="/players"
            className="inline-flex items-center text-sm font-black text-slate-400 hover:text-(--team-color) transition-colors"
          >
            <span className="mr-2">←</span> 選手一覧
          </Link>
        </div>

        {/* --- 1. 基本プロフィール & 個人タイトル --- */}
        <section className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-xl border border-slate-100 mb-8 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="relative w-48 h-48 md:w-96 md:h-96 bg-slate-50 rounded-4xl flex items-center justify-center p-8 shrink-0">
              <span className="absolute top-2 left-4 text-7xl md:text-9xl font-black italic text-slate-200/50">
                {player.number}
              </span>
              <img
                src={player.img}
                alt={player.name}
                className="relative z-10 w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                <span className="bg-blue-50 text-(--team-color) text-[14px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase">
                  {player.role}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tighter">
                <span className="text-(--team-color) mr-6 italic">
                  #{player.number}
                </span>
                {player.name}
              </h1>
              <p className="text-slate-500 leading-relaxed font-medium text-sm md:text-base max-w-2xl mb-3">
                {player.profile}
              </p>
              <p className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                {/* 個人タイトルバッジ */}
                {player.titles.map((title, i) => (
                  <span
                    key={i}
                    className="bg-amber-500 text-white text-[14px] font-medium px-4 py-1.5 rounded-full shadow-sm mr-1 whitespace-nowrap"
                  >
                    🏆 {title}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </section>

        {/* --- 年度別成績（打者） --- */}
        <section className="bg-white rounded-4xl p-6 md:p-8 mb-5 shadow-sm border border-slate-100 overflow-hidden">
          <h4 className="flex items-center gap-2 text-xl font-black mb-6 text-blue-600">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            打者成績（年度別）
          </h4>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-center min-w-200">
              <thead className="bg-slate-50 text-slate-400 font-bold tracking-wider border-y border-slate-100">
                <tr>
                  <th className="p-4 text-left">年度</th>
                  <th className="p-4">打率</th>
                  <th className="p-4">試合</th>
                  <th className="p-4">打数</th>
                  <th className="p-4">安打</th>
                  <th className="p-4">本塁打</th>
                  <th className="p-4">打点</th>
                  <th className="p-4">四球</th>
                  <th className="p-4">三振</th>
                  <th className="p-4">盗塁</th>
                  <th className="p-4">出塁率</th>
                  <th className="p-4">OPS</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700 italic">
                {player.battingHistory.map((h, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 text-left not-italic font-black text-slate-400">
                      {h.year}
                    </td>
                    <td className="p-4 text-blue-600 text-lg">{h.avg}</td>
                    <td>{h.games}</td>
                    <td>{h.ab}</td>
                    <td>{h.h}</td>
                    <td>{h.hr}</td>
                    <td>{h.rbi}</td>
                    <td>{h.bb}</td>
                    <td>{h.k}</td>
                    <td>{h.sb}</td>
                    <td>{h.obp}</td>
                    <td>{h.ops}</td>
                  </tr>
                ))}
              </tbody>
              {/* 通算行（打者） */}
              <tfoot className="bg-blue-50/50 font-black italic text-slate-900 border-t-2 border-blue-100">
                <tr>
                  <td className="p-4 text-left not-italic text-blue-600">
                    通算
                  </td>
                  <td className="p-4 text-blue-600 text-xl">
                    {player.battingTotal.avg}
                  </td>
                  <td>{player.battingTotal.games}</td>
                  <td>{player.battingTotal.ab}</td>
                  <td>{player.battingTotal.h}</td>
                  <td>{player.battingTotal.hr}</td>
                  <td>{player.battingTotal.rbi}</td>
                  <td>{player.battingTotal.bb}</td>
                  <td>{player.battingTotal.k}</td>
                  <td>{player.battingTotal.sb}</td>
                  <td>{player.battingTotal.obp}</td>
                  <td>{player.battingTotal.ops}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* --- 年度別成績（投手） --- */}
        <section className="bg-white rounded-4xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8 overflow-hidden">
          <h4 className="flex items-center gap-2 text-xl font-black mb-6 text-red-500">
            <span className="w-1.5 h-6 bg-red-500 rounded-full"></span>
            投手成績（年度別）
          </h4>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-center min-w-200">
              <thead className="bg-slate-50 text-slate-400 font-bold tracking-wider border-y border-slate-100">
                <tr>
                  <th className="p-4 text-left">年度</th>
                  <th className="p-4">防御率</th>
                  <th className="p-4">登板</th>
                  <th className="p-4">勝利</th>
                  <th className="p-4">敗戦</th>
                  <th className="p-4">セーブ</th>
                  <th className="p-4">投球回</th>
                  <th className="p-4">奪三振</th>
                  <th className="p-4">四球</th>
                  <th className="p-4">失点</th>
                  <th className="p-4">自責点</th>
                  <th className="p-4">WHIP</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700 italic">
                {player.pitchingHistory.map((h, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 text-left not-italic font-black text-slate-400">
                      {h.year}
                    </td>
                    <td className="p-4 text-red-600 text-lg">{h.era}</td>
                    <td>{h.games}</td>
                    <td>{h.win}</td>
                    <td>{h.lose}</td>
                    <td>{h.sv}</td>
                    <td>{h.ip}</td>
                    <td>{h.k}</td>
                    <td>{h.bb}</td>
                    <td>{h.r}</td>
                    <td>{h.er}</td>
                    <td>{h.whip}</td>
                  </tr>
                ))}
              </tbody>
              {/* 通算行（投手） */}
              <tfoot className="bg-red-50/50 font-black italic text-slate-900 border-t-2 border-red-100">
                <tr>
                  <td className="p-4 text-left not-italic text-red-600">
                    通算
                  </td>
                  <td className="p-4 text-red-600 text-xl">
                    {player.pitchingTotal.era}
                  </td>
                  <td>{player.pitchingTotal.games}</td>
                  <td>{player.pitchingTotal.win}</td>
                  <td>{player.pitchingTotal.lose}</td>
                  <td>{player.pitchingTotal.sv}</td>
                  <td>{player.pitchingTotal.ip}</td>
                  <td>{player.pitchingTotal.k}</td>
                  <td>{player.pitchingTotal.bb}</td>
                  <td>{player.pitchingTotal.r}</td>
                  <td>{player.pitchingTotal.er}</td>
                  <td>{player.pitchingTotal.whip}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
