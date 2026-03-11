import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Trophy,
  MapPin,
  Clock,
  ChevronRight,
  FileText,
  Wrench,
  CircleCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchPenpenScheduleEntries, toDisplayDate } from "./lib/penpenData";
import { fetchPenpenHeaderImageUrl } from "./lib/penpenStorage";

const hasScoredGame = (date: {
  games: {
    awayScore: number | null;
    homeScore: number | null;
    isCanceled: boolean;
  }[];
}) =>
  date.games.some(
    (game) =>
      game.isCanceled || (game.awayScore !== null && game.homeScore !== null),
  );

export default async function HomePage() {
  const supabase = await createClient();
  const [entries, headerImageUrl] = await Promise.all([
    fetchPenpenScheduleEntries(supabase),
    fetchPenpenHeaderImageUrl(supabase),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  const previousEntry = [...entries]
    .filter((entry) => entry.date <= today)
    .reverse()
    .find((entry) => hasScoredGame(entry));

  const nextEntry = entries.find(
    (entry) => entry.date >= today && entry.games.length > 0,
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="relative h-48 md:h-64 flex items-center justify-center overflow-hidden">
        <Image
          src={headerImageUrl}
          alt="PENPEN LEAGUE ヘッダー画像"
          fill
          sizes="100vw"
          unoptimized
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
            href="/penpen_league/rules"
            className="flex items-center gap-2 py-3 px-6 text-orange-700 hover:bg-orange-50 rounded-full transition-colors font-bold text-lg md:text-xl"
          >
            <FileText size={24} />
            <span>大会規定・ルール</span>
          </Link>

          <Link
            href="/penpen_league/stadiums"
            className="flex items-center gap-2 py-3 px-6 text-blue-700 hover:bg-blue-50 rounded-full transition-colors font-bold text-lg md:text-xl"
          >
            <MapPin size={24} />
            <span>球場案内</span>
          </Link>
        </div>

        <nav className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/penpen_league/schedule"
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
            href="/penpen_league/standings"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section className="bg-white rounded-4xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-800 text-white p-6 flex justify-between items-center flex-nowrap">
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 whitespace-nowrap shrink-0">
                <Trophy size={28} /> 前回の結果
              </h2>
              <span className="text-base sm:text-xl font-bold whitespace-nowrap ml-3 shrink-0">
                {previousEntry ? toDisplayDate(previousEntry.date) : "-"}
              </span>
            </div>

            {!previousEntry ? (
              <p className="p-6 text-base text-gray-500">
                結果データはまだありません。
              </p>
            ) : (
              <div className="divide-y-2 divide-gray-100">
                {previousEntry.games.map((game, idx) => (
                  <div key={game.id} className="p-6 md:p-8">
                    <div className="text-gray-500 font-bold text-lg mb-3">
                      第{idx + 1}試合
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center pt-1 gap-2 md:gap-3">
                      <div className="flex-1 text-center md:text-right w-full">
                        <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap">
                          {idx === 0 && (
                            <Wrench
                              size={18}
                              className="inline-block mr-1 text-orange-500 align-[-3px]"
                            />
                          )}
                          {game.awayTeam}
                        </div>
                      </div>
                      <div className="flex items-center justify-center space-x-3 shrink-0 px-2">
                        {game.isCanceled ? (
                          <span className="text-base font-black text-red-600">
                            中止
                          </span>
                        ) : (
                          <>
                            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-700">
                              {game.awayScore ?? "-"}
                            </span>
                            <span className="text-lg sm:text-xl text-gray-800">
                              -
                            </span>
                            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800">
                              {game.homeScore ?? "-"}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex-1 text-center md:text-left w-full">
                        <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap">
                          {game.homeTeam}
                          {idx === previousEntry.games.length - 1 && (
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
            )}
          </section>

          <section className="bg-blue-50 rounded-4xl shadow-lg border-2 border-blue-200 overflow-hidden">
            <div className="bg-blue-600 text-white p-6 flex justify-between items-center flex-nowrap">
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 whitespace-nowrap shrink-0">
                <Calendar size={28} /> 次回の予告
              </h2>
              <span className="text-base sm:text-xl font-bold whitespace-nowrap ml-3 shrink-0">
                {nextEntry ? toDisplayDate(nextEntry.date) : "-"}
              </span>
            </div>

            {!nextEntry ? (
              <p className="p-6 text-base text-gray-500">
                次回日程はまだありません。
              </p>
            ) : (
              <>
                <div className="p-4 bg-white mx-6 mt-6 rounded-xl border border-blue-100 flex items-center justify-center gap-2 text-blue-700 font-black text-xl">
                  <MapPin size={24} /> {nextEntry.stadium || "会場未設定"}
                </div>
                <div className="p-6 space-y-4">
                  {nextEntry.games.map((game, idx) => (
                    <div
                      key={game.id}
                      className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100"
                    >
                      <div className="flex items-center gap-2 text-blue-600 font-bold mb-2 text-lg">
                        <Clock size={20} /> {game.startTime}〜 (第{idx + 1}試合)
                      </div>
                      <div className="flex flex-col md:flex-row justify-between items-center pt-1 gap-2 md:gap-4">
                        <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap text-center md:text-left w-full md:w-auto">
                          {idx === 0 && (
                            <Wrench
                              size={18}
                              className="inline-block mr-1 text-orange-500 align-[-3px]"
                            />
                          )}
                          {game.awayTeam}
                        </div>
                        <span className="text-base sm:text-lg font-bold text-gray-400 italic">
                          VS
                        </span>
                        <div className="text-base sm:text-lg md:text-xl font-black whitespace-nowrap text-center md:text-right w-full md:w-auto">
                          {game.homeTeam}
                          {idx === nextEntry.games.length - 1 && (
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
              </>
            )}
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
