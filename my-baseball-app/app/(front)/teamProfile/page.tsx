"use client";

import React from "react";
import FrontMenu from "../components/FrontMenu";
import Footer from "../components/Footer";

export default function AboutPage() {
  const teamSettings = {
    primaryColor: "#3b82f6",
    victoryColor: "#ef4444",
    teamName: "森野クマサンズ",
  };

  const themeStyle = {
    "--team-color": teamSettings.primaryColor,
    "--victory-color": teamSettings.victoryColor,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen bg-gray-50 text-slate-800 font-sans"
      style={themeStyle}
    >
      <FrontMenu teamName={teamSettings.teamName} />

      <main className="pt-40 md:pt-48">
        <div className="max-w-4xl mx-auto px-6 space-y-20 pb-20">
          {/* セクション1：チーム概要 */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="w-2 h-10 bg-(--team-color) rounded-full"></span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
                チームについて
              </h2>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-white">
              <p className="text-xl md:text-2xl font-bold leading-relaxed text-slate-700">
                {teamSettings.teamName}は、2020年に結成された草野球チームです。
                <br />
                「週末を最高に熱くする」をモットーに、20代から40代まで幅広いメンバーが所属しています。
                経験者も未経験者も、野球を心から楽しむことを一番に大切にしています。
              </p>
            </div>
          </section>

          {/* セクション2：活動内容（グリッド配置） */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-4xl p-10 shadow-lg border border-slate-50">
              <h3 className="text-xl font-black text-slate-400 mb-4 tracking-widest">
                活動場所
              </h3>
              <p className="text-2xl font-black text-slate-900">
                主に〇〇区内の
                <br />
                河川敷グラウンド
              </p>
            </div>
            <div className="bg-white rounded-4xl p-10 shadow-lg border border-slate-50">
              <h3 className="text-xl font-black text-slate-400 mb-4 tracking-widest">
                活動頻度
              </h3>
              <p className="text-2xl font-black text-slate-900">
                毎週日曜日
                <br />
                （午前中メイン）
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
