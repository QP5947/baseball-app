"use client";

import React, { useState } from "react";
import FrontMenu from "../components/FrontMenu";
import Footer from "../components/Footer";

export default function StatsAnalysisPage() {
  const [activeTab, setActiveTab] = useState("年度別");
  const teamSettings = { primaryColor: "#3b82f6", teamName: "森野クマサンズ" };
  const themeStyle = {
    "--team-color": teamSettings.primaryColor,
  } as React.CSSProperties;

  // フィルター用ダミーデータ
  const filters = {
    years: ["2024", "2023", "2022"],
    teams: ["イエローストーンズ", "品川パイレーツ", "目黒バスターズ"],
    venues: ["多摩川グラウンド", "駒沢公園野球場", "大田スタジアム"],
    leagues: ["大田区リーグ", "草野球サンデー杯", "練習試合"],
  };

  // --- ダミーデータ：打者 15名 ---
  const batters = [
    {
      name: "市橋 翼",
      avg: ".425",
      games: 12,
      ab: 40,
      h: 17,
      hr: 2,
      rbi: 12,
      sb: 8,
      obp: ".480",
      ops: "1.120",
      isQualified: true,
    },
    {
      name: "山下 剛",
      avg: ".382",
      games: 11,
      ab: 34,
      h: 13,
      hr: 1,
      rbi: 15,
      sb: 2,
      obp: ".440",
      ops: ".980",
      isQualified: true,
    },
    {
      name: "櫛田 亮",
      avg: ".355",
      games: 12,
      ab: 31,
      h: 11,
      hr: 4,
      rbi: 18,
      sb: 1,
      obp: ".410",
      ops: "1.050",
      isQualified: true,
    },
    {
      name: "三浦 翔",
      avg: ".298",
      games: 12,
      ab: 37,
      h: 11,
      hr: 0,
      rbi: 5,
      sb: 5,
      obp: ".380",
      ops: ".740",
      isQualified: true,
    },
    {
      name: "近藤 健太",
      avg: ".285",
      games: 10,
      ab: 28,
      h: 8,
      hr: 1,
      rbi: 6,
      sb: 0,
      obp: ".350",
      ops: ".780",
      isQualified: true,
    },
    {
      name: "佐藤 大介",
      avg: ".270",
      games: 11,
      ab: 30,
      h: 8,
      hr: 0,
      rbi: 4,
      sb: 4,
      obp: ".330",
      ops: ".680",
      isQualified: true,
    },
    // --- 規定打席ライン ---
    {
      name: "田中 健一",
      avg: ".210",
      games: 5,
      ab: 15,
      h: 3,
      hr: 0,
      rbi: 2,
      sb: 1,
      obp: ".280",
      ops: ".550",
      isQualified: false,
    },
    {
      name: "渡辺 裕二",
      avg: ".188",
      games: 4,
      ab: 16,
      h: 3,
      hr: 0,
      rbi: 1,
      sb: 0,
      obp: ".220",
      ops: ".450",
      isQualified: false,
    },
    {
      name: "伊藤 淳",
      avg: ".143",
      games: 3,
      ab: 7,
      h: 1,
      hr: 0,
      rbi: 0,
      sb: 1,
      obp: ".250",
      ops: ".393",
      isQualified: false,
    },
    {
      name: "高橋 誠",
      avg: ".000",
      games: 2,
      ab: 4,
      h: 0,
      hr: 0,
      rbi: 0,
      sb: 0,
      obp: ".200",
      ops: ".200",
      isQualified: false,
    },
  ];

  // --- ダミーデータ：投手 6名 ---
  const pitchers = [
    {
      name: "近藤 健太",
      era: "1.85",
      games: 8,
      win: 6,
      lose: 1,
      ip: "48.1",
      k: 42,
      bb: 12,
      whip: "1.10",
      isQualified: true,
    },
    {
      name: "佐藤 大介",
      era: "2.40",
      games: 6,
      win: 3,
      lose: 2,
      ip: "35.0",
      k: 28,
      bb: 15,
      whip: "1.25",
      isQualified: true,
    },
    // --- 規定投球回ライン ---
    {
      name: "渡辺 裕二",
      era: "3.12",
      games: 4,
      win: 1,
      lose: 1,
      ip: "10.0",
      k: 8,
      bb: 5,
      whip: "1.45",
      isQualified: false,
    },
    {
      name: "中村 浩",
      era: "4.50",
      games: 2,
      win: 0,
      lose: 1,
      ip: "6.2",
      k: 4,
      bb: 8,
      whip: "1.80",
      isQualified: false,
    },
    {
      name: "小林 龍",
      era: "9.00",
      games: 3,
      win: 0,
      lose: 0,
      ip: "3.0",
      k: 1,
      bb: 4,
      whip: "2.50",
      isQualified: false,
    },
  ];

  return (
    <div
      className="min-h-screen bg-gray-50 text-slate-800 pb-20"
      style={themeStyle}
    >
      <FrontMenu teamName={teamSettings.teamName} />

      <main className="pt-40 md:pt-48 max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-4">
          <span className="w-2 h-10 bg-(--team-color) rounded-full"></span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
            個人成績
          </h2>
        </div>

        {/* 1. カテゴリ選択タブ */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-4xl shadow-sm border border-slate-100 mt-5">
          {["年度別", "対チーム別", "球場別", "リーグ別"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-25 py-3 px-6 rounded-full font-black transition-all ${
                activeTab === tab
                  ? "bg-(--team-color) text-white shadow-lg scale-105"
                  : "text-slate-400 hover:bg-slate-50 cursor-pointer"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 2. 条件フィルター (年度、チーム、球場などを動的に切り替え) */}
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-100 mb-8 flex flex-wrap gap-4 items-center">
          <span className="font-black text-slate-400 uppercase tracking-widest">
            分析条件:
          </span>
          <select className="bg-slate-50 border-none rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-(--team-color)">
            {activeTab === "年度別" &&
              filters.years.map((y) => <option key={y}>{y}年度</option>)}
            {activeTab === "対チーム別" &&
              filters.teams.map((t) => <option key={t}>{t}</option>)}
            {activeTab === "球場別" &&
              filters.venues.map((v) => <option key={v}>{v}</option>)}
            {activeTab === "リーグ別" &&
              filters.leagues.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* --- 打者セクション --- */}
        <section className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 overflow-hidden mb-12">
          <div className="flex justify-between items-end mb-6">
            <h4 className="flex items-center gap-2 text-xl font-black text-blue-500">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              打撃成績
            </h4>
          </div>

          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-center min-w-225">
              <thead className="bg-slate-50 text-slate-400 font-bold border-y border-slate-100">
                <tr>
                  <th className="p-4 pl-10 text-left sticky left-0 bg-slate-50 z-10">
                    選手名
                  </th>
                  {[
                    "打率",
                    "試合",
                    "打数",
                    "安打",
                    "本塁打",
                    "打点",
                    "盗塁",
                    "出塁率",
                    "OPS",
                  ].map((h) => (
                    <th
                      key={h}
                      className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      {h} ▼
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700 italic">
                {batters.map((p, i) => (
                  <React.Fragment key={p.name}>
                    {/* 規定打席ラインの挿入 */}
                    {!p.isQualified && batters[i - 1]?.isQualified && (
                      <tr className="bg-blue-50/50">
                        <td
                          colSpan={2}
                          className="sticky left-0 bg-blue-50 z-10 py-2 pl-10 text-[12px] font-black text-blue-400 text-left whitespace-nowrap"
                        >
                          ▼ 規定打席未到達（規定打席: 28）
                        </td>
                        <td
                          colSpan={8}
                          className="py-2 px-4 font-black bg-blue-50 text-blue-400 text-left"
                        ></td>
                      </tr>
                    )}
                    <tr
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        !p.isQualified && "opacity-50"
                      }`}
                    >
                      <td className="p-4 pl-10 text-left not-italic font-black text-slate-900 sticky left-0 bg-white z-10 border-b border-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        {p.name}
                      </td>
                      <td className="p-4 text-blue-600 text-lg">{p.avg}</td>
                      <td>{p.games}</td>
                      <td>{p.ab}</td>
                      <td>{p.h}</td>
                      <td>{p.hr}</td>
                      <td>{p.rbi}</td>
                      <td>{p.sb}</td>
                      <td>{p.obp}</td>
                      <td>{p.ops}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- 投手セクション --- */}
        <section className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 overflow-hidden mb-5">
          <div className="flex justify-between items-end mb-6">
            <h4 className="flex items-center gap-2 font-black text-red-600">
              <span className="w-1.5 h-6 bg-red-600 rounded-full"></span>
              投手成績
            </h4>
          </div>

          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-center min-w-225">
              <thead className="bg-slate-50 text-slate-400 font-bold border-y border-slate-100">
                <tr>
                  <th className="p-4 pl-10 text-left sticky left-0 bg-slate-50 z-10">
                    選手名
                  </th>
                  {[
                    "防御率",
                    "勝利",
                    "敗戦",
                    "試合",
                    "投球回",
                    "奪三振",
                    "与四球",
                    "WHIP",
                  ].map((h) => (
                    <th
                      key={h}
                      className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      {h} ▼
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700 italic">
                {pitchers.map((p, i) => (
                  <React.Fragment key={p.name}>
                    {!p.isQualified && pitchers[i - 1]?.isQualified && (
                      <tr className="bg-red-50/50">
                        <td
                          colSpan={2}
                          className="sticky left-0 bg-red-50 z-10 py-2 pl-10 text-[12px] font-black text-red-400 text-left whitespace-nowrap"
                        >
                          ▼ 規定投球回未到達（規定投球回: 12.0）
                        </td>
                        <td
                          colSpan={8}
                          className="py-2 px-4 font-black bg-red-50 text-red-400 text-left"
                        ></td>
                      </tr>
                    )}
                    <tr
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        !p.isQualified && "opacity-50"
                      }`}
                    >
                      <td className="p-4 pl-10 text-left not-italic font-black text-slate-900 sticky left-0 bg-white">
                        {p.name}
                      </td>
                      <td className="p-4 text-red-600 text-lg">{p.era}</td>
                      <td>{p.win}</td>
                      <td>{p.lose}</td>
                      <td>{p.games}</td>
                      <td>{p.ip}</td>
                      <td>{p.k}</td>
                      <td>{p.bb}</td>
                      <td>{p.whip}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
