"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  HelpCircle,
  Save,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import PlayerMenu from "../../components/PlayerMenu";
import Link from "next/link";

export default function AttendanceDetail() {
  const [status, setStatus] = useState<
    "attending" | "absent" | "pending" | null
  >(null);
  const [helpers, setHelpers] = useState(0);
  const [comment, setComment] = useState("");

  // サンプルデータ：チーム全体の状況
  const stats = { attending: 8, absent: 4, pending: 3, helperTotal: 2 };
  const memberComments = [
    {
      name: "田中 健太",
      status: "attending",
      text: "10分ほど遅れます！",
      time: "10:30",
    },
    {
      name: "佐藤 亮",
      status: "pending",
      text: "仕事の調整中です。前日に確定します。",
      time: "昨日",
    },
  ];
  const pendingUsers = ["鈴木 一郎", "高橋 誠", "伊藤 博"];

  return (
    <div className="min-h-screen bg-gray-50/50 flex text-gray-800 relative">
      <PlayerMenu>
        {/* ヘッダー */}
        <header className="top-0 z-20 flex items-center gap-4">
          <Link href="/player/schedule/" className="text-gray-600 p-1">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="font-black text-lg text-gray-900">出欠回答</h1>
        </header>
        <main className="max-w-5xl mx-auto p-4 space-y-6">
          {/* 1. 全体の出欠ステータス (サマリー) */}
          <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-around items-center text-center">
              <div>
                <p className="font-black text-gray-400 uppercase mb-1">参加</p>
                <div className="flex items-baseline gap-1 justify-center">
                  <span className="text-3xl font-black text-emerald-600">
                    {stats.attending + stats.helperTotal}
                  </span>
                  <span className="text-xs font-bold text-gray-400">人</span>
                </div>
                <p className="text-xs text-emerald-500 font-bold mt-1">
                  (選手{stats.attending} + 助っ人{stats.helperTotal})
                </p>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div>
                <p className="font-black text-gray-400 uppercase mb-1">欠席</p>
                <div className="flex items-baseline gap-1 justify-center">
                  <span className="text-2xl font-black text-red-400">
                    {stats.absent}
                  </span>
                  <span className="text-xs font-bold text-gray-400">人</span>
                </div>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div>
                <p className="font-black text-gray-400 uppercase mb-1">
                  未回答
                </p>
                <div className="flex items-baseline gap-1 justify-center">
                  <span className="text-2xl font-black text-orange-400">
                    {stats.pending}
                  </span>
                  <span className="text-xs font-bold text-gray-400">人</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. 自分の回答入力 */}
          <section className="space-y-4 bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 ">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="text-blue-600" /> 出欠入力
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: "attending",
                  label: "参加",
                  icon: CheckCircle2,
                  active: "bg-emerald-500 text-white border-emerald-500",
                },
                {
                  id: "absent",
                  label: "欠席",
                  icon: XCircle,
                  active: "bg-red-500 text-white border--500",
                },
                {
                  id: "pending",
                  label: "保留",
                  icon: HelpCircle,
                  active: "bg-amber-500 text-white border-amber-500",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStatus(item.id as any)}
                  className={`flex flex-col items-center py-3 rounded-2xl border-2 transition-all gap-1 ${
                    status === item.id
                      ? item.active
                      : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  <item.icon size={30} />
                  <span className="font-bold">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <UserPlus className="text-gray-400" />
                <span className="font-bold text-gray-600">
                  助っ人を連れていく
                </span>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                <button
                  onClick={() => setHelpers(Math.max(0, helpers - 1))}
                  className="w-10 h-10 bg-white rounded shadow-sm font-bold"
                >
                  -
                </button>
                <span className="font-black w-4 text-center">{helpers}</span>
                <button
                  onClick={() => setHelpers(helpers + 1)}
                  className="w-10 h-10 bg-white rounded shadow-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <textarea
              placeholder="連絡事項があれば入力（遅刻、車出せます等）"
              className="w-full h-20 bg-gray-50 rounded-2xl p-3 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </section>

          {/* 3. みんなのコメント */}
          <section className="space-y-3">
            <label className="font-black text-gray-400 tracking-widest ml-1">
              コメント
            </label>
            <div className="space-y-2">
              {memberComments.map((c, i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3"
                >
                  <div
                    className={`w-1 h-full rounded-full ${
                      c.status === "attending"
                        ? "bg-emerald-400"
                        : "bg-orange-400"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-gray-800">{c.name}</span>
                      <span className="text-gray-400">{c.time}</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. 未回答者 */}
          <section className="space-y-2">
            <label className="font-black text-red-400 uppercase tracking-widest ml-1 flex items-center gap-1">
              <AlertCircle /> 未回答
            </label>
            <div className="flex flex-wrap gap-2">
              {pendingUsers.map((name) => (
                <span
                  key={name}
                  className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full font-bold"
                >
                  {name}
                </span>
              ))}
            </div>
          </section>
        </main>
        {/* 保存ボタン */}
        <div className="fixed left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-30">
          <button className="w-full max-w-md mx-auto bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-100 transition-transform active:scale-95">
            <Save size={20} />
            回答を保存する
          </button>
        </div>
      </PlayerMenu>
    </div>
  );
}
