import Link from "next/link";
import {
  Calendar,
  Trophy,
  MapPin,
  Clock,
  ChevronRight,
  Settings,
  FileText,
  Megaphone, // 追加
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
          <h1 className="text-4xl md:text-6xl font-black italic text-white drop-shadow-lg">
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
            <div className="bg-gray-800 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Trophy size={28} /> 前回の結果
              </h2>
              <span className="text-xl font-bold">{prevMatchDay.date}</span>
            </div>
            <div className="divide-y-2 divide-gray-100">
              {prevMatchDay.games.map((game) => (
                <div key={game.id} className="p-6 md:p-8">
                  <div className="text-gray-500 font-bold text-lg mb-3">
                    {game.label}
                  </div>
                  <div className="flex justify-between items-center pt-5">
                    <div className="w-1/3 text-right">
                      <div className="relative inline-block">
                        {"markA" in game && game.markA && (
                          <span className="absolute -top-5 left-0 bg-orange-500 text-white px-2 py-0.5 rounded font-black whitespace-nowrap text-xs md:text-sm">
                            準備当番
                          </span>
                        )}
                        <div className="text-xl md:text-2xl font-black">
                          {game.teamA}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-4 w-1/3">
                      <span className="text-4xl md:text-5xl font-black text-blue-700">
                        {game.scoreA}
                      </span>
                      <span className="text-xl text-gray-800">-</span>
                      <span className="text-4xl md:text-5xl font-black text-gray-800">
                        {game.scoreB}
                      </span>
                    </div>
                    <div className="w-1/3 text-left">
                      <div className="relative inline-block">
                        {"markB" in game && game.markB && (
                          <span className="absolute -top-5 left-0 bg-orange-500 text-white px-2 py-0.5 rounded font-black whitespace-nowrap text-xs md:text-sm">
                            片付け当番
                          </span>
                        )}
                        <div className="text-xl md:text-2xl font-black">
                          {game.teamB}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 次回の予告（3試合） */}
          <section className="bg-blue-50 rounded-4xl shadow-lg border-2 border-blue-200 overflow-hidden">
            <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Calendar size={28} /> 次回の予告
              </h2>
              <span className="text-xl font-bold">{nextMatchDay.date}</span>
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
                  <div className="flex justify-around items-center pt-5">
                    <div className="relative inline-block">
                      {"markA" in game && game.markA && (
                        <span className="absolute -top-5 left-0 bg-orange-500 text-white px-2 py-0.5 rounded font-black whitespace-nowrap text-xs md:text-sm">
                          準備当番
                        </span>
                      )}
                      <span className="text-xl md:text-2xl font-black">
                        {game.teamA}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-400 italic">
                      VS
                    </span>
                    <div className="relative inline-block">
                      {"markB" in game && game.markB && (
                        <span className="absolute -top-5 left-0 bg-orange-500 text-white px-2 py-0.5 rounded font-black whitespace-nowrap text-xs md:text-sm">
                          片付け当番
                        </span>
                      )}
                      <span className="text-xl md:text-2xl font-black">
                        {game.teamB}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <footer className="mt-16 p-12 text-center bg-gray-100 border-t">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 text-xl font-bold transition-colors"
        >
          <Settings size={24} /> 管理者メニュー
        </Link>
        <p className="text-gray-400 mt-6 text-lg">© 2026 PENPEN LEAGUE</p>
      </footer>
    </main>
  );
}
