import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Wrench,
  CircleCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchPenpenScheduleEntries, toDisplayDate } from "../lib/penpenData";
import { fetchPenpenHeaderImageUrl } from "../lib/penpenStorage";

export default async function SchedulePage() {
  const supabase = await createClient();
  const [schedules, headerImageUrl] = await Promise.all([
    fetchPenpenScheduleEntries(supabase),
    fetchPenpenHeaderImageUrl(supabase),
  ]);

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

        <div className="space-y-12">
          {schedules.length === 0 ? (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <p className="text-base text-gray-500">
                日程はまだ登録されていません。
              </p>
            </section>
          ) : (
            schedules.map((day) => (
              <section key={day.id} className="relative">
                <div className="top-4 z-20 mb-4 inline-block bg-zinc-800 text-white px-6 py-2 rounded-full shadow-lg font-black text-xl md:text-2xl">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Calendar size={24} />
                    {toDisplayDate(day.date)}
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 text-gray-600 font-bold text-lg pl-2">
                  <MapPin size={20} className="text-blue-600" />
                  <span>会場: {day.stadium || "未設定"}</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {day.games.map((game, index) => (
                    <div
                      key={game.id}
                      className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-black whitespace-nowrap">
                          第{index + 1}試合
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl whitespace-nowrap">
                          <Clock size={20} />
                          {game.startTime}〜
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 w-full md:flex-1">
                        <div className="flex flex-col items-center md:items-end flex-1 min-w-0 w-full">
                          <div className="inline-block">
                            <div className="text-base sm:text-lg md:text-xl font-black text-center md:text-right whitespace-nowrap">
                              {index === 0 && (
                                <Wrench
                                  size={18}
                                  className="inline-block mr-1 text-orange-500 align-[-3px]"
                                />
                              )}
                              {game.awayTeam}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center shrink-0 px-2">
                          {game.isCanceled ? (
                            <div className="text-sm sm:text-base font-black text-red-600 bg-red-50 px-3 py-1 rounded-xl border border-red-200 whitespace-nowrap">
                              中止
                            </div>
                          ) : game.awayScore !== null &&
                            game.homeScore !== null ? (
                            <div className="text-base sm:text-lg md:text-xl font-black text-zinc-800 bg-zinc-50 px-3 py-1 rounded-xl border border-zinc-200 whitespace-nowrap">
                              {game.awayScore} - {game.homeScore}
                            </div>
                          ) : (
                            <div className="text-gray-300 font-black italic text-base sm:text-lg px-2 whitespace-nowrap">
                              VS
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-center md:items-start flex-1 min-w-0 w-full">
                          <div className="inline-block">
                            <div className="text-base sm:text-lg md:text-xl font-black text-center md:text-left whitespace-nowrap">
                              {game.homeTeam}
                              {index === day.games.length - 1 && (
                                <CircleCheck
                                  size={18}
                                  className="inline-block ml-1 text-orange-500 align-[-3px]"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {day.restTeams.length > 0 && (
                    <div className="mt-2 bg-red-100 border-2 border-dashed border-red-200 rounded-2xl p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-red-400 text-white font-black px-2 py-1 rounded">
                          休み
                        </span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {day.restTeams.map((team) => (
                            <span
                              key={team}
                              className="text-gray-500 font-bold"
                            >
                              {team}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="text-sm md:text-base text-gray-500 font-bold px-1 mt-8">
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
