"use client";

import React from "react";
import Link from "next/link";
import FrontMenu from "./components/FrontMenu";
import Footer from "./components/Footer";

export default function TopPage() {
  // 色の定義
  const teamSettings = {
    primaryColor: "#3b82f6", // メインカラー（青）
    victoryColor: "#ef4444", // 勝利の色（赤）
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

      {/* ヘッダー2段分(約160px〜180px)の余白を確保 */}
      <main className="pt-40 md:pt-48">
        {/* トップ写真 */}
        <section className="relative w-full overflow-hidden bg-gray-50 px-4 md:px-0">
          <div className="max-w-6xl mx-auto relative">
            <div className="relative aspect-video md:aspect-21/9 lg:aspect-25/9 w-full">
              <img
                src="https://gylktpbmsqzmjrzbzpkd.supabase.co/storage/v1/object/public/web_images/top.jpg"
                alt="チーム集合写真"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-transparent " />
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto -mt-8 md:-mt-16 relative z-20 px-6 space-y-12 pb-20">
          <div className="grid md:grid-cols-2 gap-8">
            {/* 次の試合 */}
            <Link href="/games/next" className="block group">
              <div className="bg-white h-full rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-white hover:border-(--team-color) cursor-pointer">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-white text-xs font-black px-4 py-1.5 rounded-full bg-(--team-color)">
                    次の試合
                  </span>
                  <span className="text-slate-400 font-bold">1月20日</span>
                </div>
                <div className="flex items-center justify-between md:justify-center mx-auto">
                  <div className="text-center font-black">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-3xl mb-3 flex items-center justify-center border border-slate-100 mx-auto">
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/3177/3177142.png"
                        className="w-10 h-10 md:w-12 md:h-12"
                        alt="Home"
                      />
                    </div>
                    <div className="w-30 md:w-40 text-(--team-color) truncate">
                      森野クマサンズ
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-200 italic">
                    対
                  </div>
                  <div className="text-center font-black">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-3xl mb-3 flex items-center justify-center border border-slate-100 mx-auto">
                      <span className="text-slate-300">相手</span>
                    </div>
                    <p className="w-30 md:w-40 text-slate-400 truncate">
                      イエローストーンズ
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 最新結果 */}
            <Link href="/games/next" className="block group">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-white hover:border-(--team-color) cursor-pointer">
                <div className="flex justify-between items-center mb-8">
                  <span
                    className="text-white text-xs font-black px-4 py-1.5 rounded-full"
                    style={{ backgroundColor: "var(--victory-color)" }}
                  >
                    直近の結果
                  </span>
                  <span className="text-slate-400 font-bold">1月12日</span>
                </div>
                {/* flex-col で縦並び、md:flex-row で横並びに変更 */}
                <div className="flex flex-col md:items-center justify-between gap-6 md:gap-0 text-center md:text-left">
                  <div>
                    <span
                      className="text-6xl font-black italic leading-none whitespace-nowrap"
                      style={{ color: "var(--victory-color)" }}
                    >
                      勝利
                    </span>
                    <p className="text-sm font-bold text-slate-400 mt-4">
                      対 レッドイーグルス
                    </p>
                  </div>
                  {/* スコア部分 */}
                  <div className="text-6xl md:text-7xl font-black tracking-tighter italic text-slate-900 whitespace-nowrap">
                    99 - 99
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* チーム成績 */}
          <Link href="/stats" className="block group">
            <div className="bg-white rounded-[3rem] p-12 shadow-md border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center hover:border-(--team-color) cursor-pointer">
              {/* 試合数 */}
              <div className="flex flex-col items-center">
                <p className="text-sm font-black text-slate-400 tracking-[0.4em] mb-2">
                  今季試合数
                </p>
                <div className="flex items-baseline gap-1 text-slate-900">
                  <p className="text-6xl font-black italic tracking-tighter">
                    48
                  </p>
                  <span className="text-xl font-bold italic">試合</span>
                </div>
              </div>

              {/* 勝敗 */}
              <div className="flex flex-col items-center border-y md:border-y-0 md:border-x border-slate-100 py-6 md:py-0">
                <p className="text-sm font-black text-slate-400 tracking-[0.4em] mb-2">
                  勝敗
                </p>
                <div className="flex items-baseline gap-2 text-slate-900">
                  <p className="text-6xl font-black italic tracking-tighter">
                    14
                  </p>
                  <span className="text-xl font-bold italic">勝</span>
                  <p className="text-6xl font-black italic tracking-tighter">
                    14
                  </p>
                  <span className="text-xl font-bold italic">敗</span>
                </div>
              </div>

              {/* チーム打率 */}
              <div className="flex flex-col items-center">
                <p className="text-sm font-black text-slate-400 tracking-[0.4em] mb-2">
                  チーム打率
                </p>
                <p className="text-6xl font-black italic tracking-tighter text-slate-900">
                  .284
                </p>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
