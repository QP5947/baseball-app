import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Clock, ChevronDown } from "lucide-react";

// 2025年度 前期日程のデータ
const schedules = [
  {
    date: "2025.03.23 (日)",
    stadium: "庄内川西",
    isFinished: true,
    games: [
      {
        id: 1,
        time: "08:30",
        teamA: "フレンドリー",
        teamB: "ウインズ",
        label: "第1試合",
        scoreA: 5,
        scoreB: 2,
        markA: true,
      }, // Aチームのみ印
      {
        id: 2,
        time: "10:30",
        teamA: "KJフェニックス",
        teamB: "ノンベーズ",
        label: "第2試合",
        scoreA: 0,
        scoreB: 3,
      },
      {
        id: 3,
        time: "12:30",
        teamA: "イエローストーン",
        teamB: "ロケッツ",
        label: "第3試合",
        scoreA: 4,
        scoreB: 4,
        markB: true,
      }, // Bチームのみ印
    ],
  },
  {
    date: "2025.04.06 (日)",
    stadium: "庄内川西",
    isFinished: false,
    games: [
      {
        id: 4,
        time: "08:30",
        teamA: "ＫＪフェニックス",
        teamB: "イエローストーン",
        label: "第1試合",
        markA: true,
      },
      {
        id: 5,
        time: "10:30",
        teamA: "ノンベーズ",
        teamB: "ロケッツ",
        label: "第2試合",
        markB: true,
      },
    ],
    holidayTeams: ["フレンドリー", "ウインズ"], // 休みチームの追加
  },
];

export default function SchedulePage() {
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
          <p className="text-white font-bold text-lg md:text-xl mt-2">日程表</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Link
          href="./"
          className="inline-flex items-center gap-2 mb-8 font-bold text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={20} /> ホームへ戻る
        </Link>

        {/* 年・月のプルダウン（UIのみ） */}
        <div className="flex gap-2 mb-8 w-full md:w-auto">
          <div className="relative flex-1 md:w-32">
            <select className="w-full appearance-none bg-white border-2 border-blue-600 rounded-xl px-4 py-2 font-black text-blue-800 focus:outline-none shadow-sm cursor-pointer">
              <option>2026</option>
              <option>それ以前</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-3 text-blue-600 pointer-events-none"
              size={20}
            />
          </div>
          <div className="relative flex-1 md:w-48">
            <select className="w-full appearance-none bg-white border-2 border-blue-600 rounded-xl px-4 py-2 font-black text-blue-800 focus:outline-none shadow-sm cursor-pointer">
              <option>3月～5月</option>
              <option>6月～8月</option>
              <option>9月～11月</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-3 text-blue-600 pointer-events-none"
              size={20}
            />
          </div>
        </div>

        {/* 日程リスト */}
        <div className="space-y-12">
          {schedules.map((day, dayIndex) => (
            <section key={dayIndex} className="relative">
              {/* 日付見出し */}
              <div className="top-4 z-20 mb-4 inline-block bg-zinc-800 text-white px-6 py-2 rounded-full shadow-lg font-black text-xl md:text-2xl">
                <div className="flex items-center gap-3">
                  <Calendar size={24} />
                  {day.date}
                </div>
              </div>

              {/* 球場名 */}
              <div className="mb-4 flex items-center gap-2 text-gray-600 font-bold text-lg pl-2">
                <MapPin size={20} className="text-blue-600" />
                <span>会場: {day.stadium}</span>
              </div>

              {/* 試合カード群 */}
              <div className="grid grid-cols-1 gap-4">
                {day.games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-black whitespace-nowrap">
                        {game.label}
                      </div>
                      <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
                        <Clock size={20} />
                        {game.time}〜
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 md:gap-8 w-full md:flex-1">
                      {/* チームA */}
                      <div className="flex flex-col items-end flex-1">
                        <div className="relative inline-block">
                          {"markA" in game && game.markA && (
                            <span className="absolute -top-5 left-0 bg-orange-500 text-white px-2 py-0.5 rounded font-black whitespace-nowrap text-xs md:text-sm">
                              準備当番
                            </span>
                          )}
                          <div className="text-xl md:text-2xl font-black text-right">
                            {game.teamA}
                          </div>
                        </div>
                      </div>

                      {/* 中央：VS または スコア */}
                      <div className="flex items-center justify-center min-w-25">
                        {"scoreA" in game && "scoreB" in game ? (
                          <div className="text-xl md:text-2xl font-black text-zinc-800 bg-zinc-50 px-4 py-1 rounded-xl border border-zinc-200">
                            {game.scoreA} - {game.scoreB}
                          </div>
                        ) : (
                          <div className="text-gray-300 font-black italic text-xl px-2">
                            VS
                          </div>
                        )}
                      </div>

                      {/* チームB */}
                      <div className="flex flex-col items-start flex-1">
                        <div className="relative inline-block">
                          <div className="text-xl md:text-2xl font-black text-left">
                            {game.teamB}
                          </div>
                          {"markB" in game && game.markB && (
                            <span className="absolute -top-5 left-0 bg-orange-500 text-white px-2 py-0.5 rounded font-black whitespace-nowrap text-xs md:text-sm">
                              片付け当番
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {/* 「休み」のチームを表示する行 */}
                {day.holidayTeams && (
                  <div className="mt-2 bg-red-100 border-2 border-dashed border-red-200 rounded-2xl p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-red-400 text-white font-black px-2 py-1 rounded">
                        休み
                      </span>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {day.holidayTeams.map((team, tIdx) => (
                          <span key={tIdx} className="text-gray-500 font-bold">
                            {team}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
      <footer className="mt-16 p-12 text-center bg-gray-100 border-t">
        <p className="text-gray-400 mt-6 text-lg">© 2026 PENPEN LEAGUE</p>
      </footer>
    </main>
  );
}
