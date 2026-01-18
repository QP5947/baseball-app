"use client";

import { Clock, MapPin } from "lucide-react";
import Link from "next/link";
import PlayerMenu from "../components/PlayerMenu";

export default function AttendancePage() {
  // サンプルデータ：今後の予定
  const schedules = [
    {
      id: 1,
      date: "2026/01/25",
      day: "日",
      time: "10:00",
      title: "練習試合",
      vsteam: "葛西マリーンズ",
      location: "江戸川球場 B",
      status: "",
    },
    {
      id: 2,
      date: "2026/02/01",
      day: "日",
      time: "09:00",
      title: "通常練習",
      vsteam: "",
      location: "墨田区営グラウンド",
      status: "going",
    },
    {
      id: 3,
      date: "2026/02/08",
      day: "日",
      time: "13:00",
      title: "春季大会 1回戦",
      vsteam: "イエローストーンズ",
      location: "大田スタジアム",
      status: "not_going",
    },
    {
      id: 4,
      date: "2026/02/15",
      day: "日",
      time: "13:00",
      title: "春季大会 2回戦",
      vsteam: "未定",
      location: "大田スタジアム",
      status: "unanswered",
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      going: "bg-emerald-600 text-white whitespace-nowrap",
      not_going: "bg-red-600 text-white whitespace-nowrap",
      unanswered: "bg-gray-100 text-gray-400 whitespace-nowrap",
    };
    const labels = { going: "出席", not_going: "欠席", unanswered: "未入力" };

    return (
      <span
        className={`px-3 py-1 rounded text-sm font-bold ${
          styles[status as keyof typeof styles] || styles.unanswered
        }`}
      >
        {labels[status as keyof typeof labels] || "未入力"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex text-gray-800 relative">
      <PlayerMenu>
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">スケジュール</h1>
              <p className="text-gray-500">
                試合や練習のスケジュール確認と回答
              </p>
            </div>
            <div className="hidden md:block text-sm font-medium text-gray-500">
              回答済み: <span className="text-gray-800">3 / 4</span>
            </div>
          </header>

          {/* 出欠サマリー（PC用） */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
              <p className=" text-gray-500 mb-1">未回答</p>
              <p className="text-2xl font-bold text-orange-600">1件</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
              <p className="text-gray-500 mb-1">出席予定</p>
              <p className="text-2xl font-bold text-blue-600">1件</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
              <p className="text-gray-500 mb-1">出席率</p>
              <p className="text-2xl font-bold text-gray-800">66%</p>
            </div>
          </div>

          {/* スケジュール一覧 */}
          <div className="space-y-4">
            <h2 className="font-bold text-gray-700 ml-1">今後の予定</h2>

            {schedules.map((event) => {
              const [year, month, day] = event.date.split("/");
              const isSunday = event.day === "日";
              const isSaturday = event.day === "土";

              return (
                <Link href={`/player/schedule/${event.id}`} key={event.id}>
                  <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 mb-4 overflow-hidden hover:border-blue-500">
                    <div className="flex">
                      {/* 左側：日付表示 */}
                      <div
                        className={`w-15 md:w-24 flex flex-col items-center justify-center border-r-2 border-gray-100 py-4 ${
                          isSunday
                            ? "bg-red-50"
                            : isSaturday
                              ? "bg-blue-50"
                              : "bg-gray-50"
                        }`}
                      >
                        <p className="font-bold text-gray-500">{month}月</p>
                        <p
                          className={`text-2xl md:text-4xl font-black ${
                            isSunday
                              ? "text-red-600"
                              : isSaturday
                                ? "text-blue-600"
                                : "text-gray-800"
                          }`}
                        >
                          {day}
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            isSunday
                              ? "text-red-600"
                              : isSaturday
                                ? "text-blue-600"
                                : "text-gray-800"
                          }`}
                        >
                          ({event.day})
                        </p>
                      </div>

                      {/* 右側：内容とステータス */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xl font-black text-gray-900 mb-1 leading-tight">
                              {event.title}
                            </p>
                            {event.vsteam && (
                              <p className="text-blue-500 font-bold text-base">
                                VS：{event.vsteam}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(event.status)}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-auto">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Clock size={15} />
                            {event.time}〜
                          </div>
                          <div className="flex items-center gap-1 text-gray-700">
                            <MapPin size={15} />
                            {event.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* チームの動員状況 */}
                    <div className="bg-gray-50 p-2 flex justify-around items-center">
                      <div className="flex gap-2 text-gray-600">
                        <span>参加</span>
                        <span className="font-black">10(8+2)</span>
                      </div>
                      <div className="w-px h-4 bg-gray-600"></div>
                      <div className="flex gap-2 text-red-600">
                        <span className="">欠席</span>
                        <span className="font-black">3</span>
                      </div>
                      <div className="w-px h-4 bg-gray-600"></div>
                      <div className="flex gap-2 text-gray-500">
                        <span className="">保留</span>
                        <span className="font-black">3</span>
                      </div>
                      <div className="w-px h-4 bg-gray-600"></div>
                      <div className="flex gap-2 text-orange-600">
                        <span>未回答</span>
                        <span className="font-black">3</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </PlayerMenu>
    </div>
  );
}
