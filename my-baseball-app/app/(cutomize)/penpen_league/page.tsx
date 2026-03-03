import Link from "next/link";
import {
  Calendar,
  Trophy,
  MapPin,
  Clock,
  ChevronRight,
  Settings,
  FileText,
  Wrench,
  CircleCheck,
} from "lucide-react";

// ダミーデータ：1日3試合の構成
const prevMatchDay = {
  date: "2025.03.23 (日)",
  games: [
    {
      id: 1,
      label: "第1試合",
      teamA: "フレンドリー",
      teamB: "ウインズ",
      scoreA: 5,
      scoreB: 2,
      markA: true,
    },
    {
      id: 2,
      label: "第2試合",
      teamA: "KJフェニックス",
      teamB: "ノンベーズ",
      scoreA: 0,
      scoreB: 3,
    },
    {
      id: 3,
      label: "第3試合",
      teamA: "イエローストーン",
      teamB: "ロケッツ",
      scoreA: 4,
      scoreB: 4,
      markB: true,
    },
  ],
};

const nextMatchDay = {
  date: "2025.04.06 (日)",
  stadium: "庄内川西",
  games: [
    {
      id: 4,
      label: "第1試合",
      time: "08:30",
      teamA: "イエローストーン",
      teamB: "KJフェニックス",
      markA: true,
    },
    {
      id: 5,
      label: "第2試合",
      time: "10:30",
      teamA: "ウインズ",
      teamB: "ロケッツ",
    },
    {
      id: 6,
      label: "第3試合",
      time: "12:30",
      teamA: "フレンドリー",
      teamB: "ノンベーズ",
      markB: true,
    },
  ],
};

export default async function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="relative h-48 md:h-64 flex items-center justify-center overflow-hidden">
        <img
          src="/league.jpg"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-blue-900/60 z-10"></div>
        <div className="relative z-30 text-center">
          <h1 className="text-4xl md:text-6xl font-black italic text-white drop-shadow-lg whitespace-nowrap">
            PENPEN LEAGUE
          </h1>
          <p className="text-white font-bold text-lg md:text-xl mt-2">
            ペンペンリーグ 公式サイト
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10">
        <div className="flex flex-wrap justify-center gap-4 py-2 border-y border-gray-200 bg-white shadow-sm -mx-4 px-4 md:mx-0 md:rounded-xl">
          <Link
            href={`/penpen_league/rules`}
            className="flex items-center gap-2 py-3 px-6 text-orange-700 hover:bg-orange-50 rounded-full transition-colors font-bold text-lg md:text-xl"
          >
            <FileText size={24} />
            <span>大会規定・ルール</span>
          </Link>

          <Link
            href={`/penpen_league/stadiums`}
            className="flex items-center gap-2 py-3 px-6 text-blue-700 hover:bg-blue-50 rounded-full transition-colors font-bold text-lg md:text-xl"
          >
            <MapPin size={24} />
            <span>球場案内</span>
          </Link>
        </div>

        {/* 主要ナビゲーション */}
        <nav className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href={`/penpen_league/schedule`}
            className="group flex items-center justify-between bg-white border-4 border-blue-600 p-8 rounded-3xl shadow-md hover:bg-blue-600 transition-all"
          >
            <div className="flex items-center space-x-6">
              <Calendar
                size={48}
                className="text-blue-600 group-hover:text-white"
              />
              <span className="text-2xl md:text-3xl font-black text-blue-800 group-hover:text-white">
                日程表
              </span>
            </div>
            <ChevronRight
              size={32}
              className="text-blue-200 group-hover:text-white"
            />
          </Link>
          <Link
            href={`/penpen_league/standings`}
            className="group flex items-center justify-between bg-white border-4 border-blue-600 p-8 rounded-3xl shadow-md hover:bg-blue-600 transition-all"
          >
            <div className="flex items-center space-x-6">
              <Trophy
                size={48}
                className="text-blue-600 group-hover:text-white"
              />
              <span className="text-2xl md:text-3xl font-black text-blue-800 group-hover:text-white">
                勝敗表
              </span>
            </div>
            <ChevronRight
              size={32}
              className="text-blue-200 group-hover:text-white"
            />
          </Link>
        </nav>

        {/* 試合情報セクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* 前回の結果（3試合） */}
          <section className="bg-white rounded-4xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-800 text-white p-6 flex justify-between items-center flex-nowrap">
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 whitespace-nowrap shrink-0">
                <Trophy size={28} /> 前回の結果
              </h2>
              <span className="text-base sm:text-xl font-bold whitespace-nowrap ml-3 shrink-0">
                {prevMatchDay.date}
              </span>
            </div>
            <div className="divide-y-2 divide-gray-100">
              {prevMatchDay.games.map((game) => (
                <div key={game.id} className="p-6 md:p-8">
                  <div className="text-gray-500 font-bold text-lg mb-3">
                    {game.label}
                  </div>
                  <div className="flex flex-col md:flex-row justify-between items-center pt-1 gap-2 md:gap-3">
                    <div className="flex-1 text-center md:text-right w-full">
                      <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap">
                        {"markA" in game && game.markA && (
                          <Wrench
                            size={18}
                            className="inline-block mr-1 text-orange-500 align-[-3px]"
                          />
                        )}
                        {game.teamA}
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-3 shrink-0 px-2">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-700">
                        {game.scoreA}
                      </span>
                      <span className="text-lg sm:text-xl text-gray-800">
                        -
                      </span>
                      <span className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800">
                        {game.scoreB}
                      </span>
                    </div>
                    <div className="flex-1 text-center md:text-left w-full">
                      <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap">
                        {game.teamB}
                        {"markB" in game && game.markB && (
                          <CircleCheck
                            size={18}
                            className="inline-block ml-1 text-orange-500 align-[-3px]"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 次回の予告（3試合） */}
          <section className="bg-blue-50 rounded-4xl shadow-lg border-2 border-blue-200 overflow-hidden">
            <div className="bg-blue-600 text-white p-6 flex justify-between items-center flex-nowrap">
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 whitespace-nowrap shrink-0">
                <Calendar size={28} /> 次回の予告
              </h2>
              <span className="text-base sm:text-xl font-bold whitespace-nowrap ml-3 shrink-0">
                {nextMatchDay.date}
              </span>
            </div>
            <div className="p-4 bg-white mx-6 mt-6 rounded-xl border border-blue-100 flex items-center justify-center gap-2 text-blue-700 font-black text-xl">
              <MapPin size={24} /> {nextMatchDay.stadium}
            </div>
            <div className="p-6 space-y-4">
              {nextMatchDay.games.map((game) => (
                <div
                  key={game.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100"
                >
                  <div className="flex items-center gap-2 text-blue-600 font-bold mb-2 text-lg">
                    <Clock size={20} /> {game.time}〜 ({game.label})
                  </div>
                  <div className="flex flex-col md:flex-row justify-between items-center pt-1 gap-2 md:gap-4">
                    <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap text-center md:text-left w-full md:w-auto">
                      {"markA" in game && game.markA && (
                        <Wrench
                          size={18}
                          className="inline-block mr-1 text-orange-500 align-[-3px]"
                        />
                      )}
                      {game.teamA}
                    </div>
                    <span className="text-base sm:text-lg font-bold text-gray-400 italic">
                      VS
                    </span>
                    <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap text-center md:text-right w-full md:w-auto">
                      {game.teamB}
                      {"markB" in game && game.markB && (
                        <CircleCheck
                          size={18}
                          className="inline-block ml-1 text-orange-500 align-[-3px]"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="text-sm md:text-base text-gray-500 font-bold px-1">
          <span className="inline-flex items-center mr-4">
            <Wrench size={18} className="mr-1 text-orange-500" /> 準備当番
          </span>
          <span className="inline-flex items-center">
            <CircleCheck size={18} className="mr-1 text-orange-500" />{" "}
            片付け当番
          </span>
        </div>
      </div>
      <footer className="py-20 border-t border-slate-100 text-center bg-white">
        <div className="opacity-30 font-black tracking-widest hover:underline">
          <a href="/" target="_blank">
            Powered by DashBase
          </a>
        </div>
      </footer>
    </main>
  );
}
