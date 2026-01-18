"use client";
import {
  AlertCircle,
  BarChart3,
  ChevronRight,
  MapPin,
  Target,
} from "lucide-react";
import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PlayerMenu from "../components/PlayerMenu";

const data = [
  { game: "1/4", hits: 1 },
  { game: "1/11", hits: 3 },
  { game: "1/15", hits: 2 },
  { game: "1/18", hits: 0 },
  { game: "1/20", hits: 2 },
];

export default function PlayerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50/50 flex text-gray-800 relative">
      <PlayerMenu>
        {/* PC用ヘッダー */}
        <header className="mb-8 block">
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-500">現在のチーム状況とあなたのスタッツ</p>
        </header>

        {/* 出欠通知（管理画面テイストの2pxボーダー） */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border-2 border-orange-500 p-5 flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:bg-orange-50/20">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-ls text-orange-600 font-black tracking-widest mb-0.5">
                  出欠未入力
                </p>
                <p className="text-lg font-bold text-gray-900 leading-tight mb-0.5">
                  1/25(日) 10:00～
                </p>
                <p className="text-lg font-bold text-gray-900 leading-tight mb-0.5">
                  練習試合 vs 葛西マリーンズ
                </p>
                <p className="flex text-ls font-bold text-gray-400 leading-tight gap-1">
                  <MapPin size={18} />
                  <span>江戸川球場 B</span>
                </p>
              </div>
            </div>
            <Link
              href="/player/schedule/1/"
              className="w-full md:w-auto px-6 py-2.5 bg-white border border-orange-200 text-orange-600 rounded-xl font-bold text-sm shadow-sm hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              出欠を回答する <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        {/* グリッドレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* サマリー：4枚の管理画面風カード */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "打率", value: ".342", color: "text-blue-600" },
                { label: "安打", value: "13", color: "text-gray-900" },
                { label: "本塁打", value: "4", color: "text-red-600" },
                { label: "打点", value: "18", color: "text-gray-900" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white p-5 rounded-xl shadow-sm border  border-gray-200"
                >
                  <p className="font-black text-gray-400 uppercase tracking-widest mb-1">
                    {s.label}
                  </p>
                  <p
                    className={`text-2xl font-black italic tracking-tighter ${s.color}`}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* パフォーマンスグラフ（プレースホルダー） */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 size={16} className="text-blue-600" /> 安打数推移
                </h3>
                <span className="font-bold text-gray-400">直近5試合</span>
              </div>

              <div className="h-64 w-full">
                {/* ResponsiveContainerが親要素の幅に合わせて自動調整してくれる */}
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data}
                    margin={{ top: 5, right: 20, bottom: 5, left: -20 }}
                  >
                    {/* グリッド線：管理画面に合わせて薄く */}
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />

                    {/* X軸：日付 */}
                    <XAxis
                      dataKey="game"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      dy={10}
                    />

                    {/* YAxis：安打数（0〜4本くらいを想定） */}
                    <YAxis
                      // 軸の範囲を指定（0から5まで）
                      domain={[0, "dataMax + 1"]}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                    />

                    {/* ホバー時のツールチップ */}
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                    />

                    {/* 折れ線：チームカラーの青 */}
                    <Line
                      type="monotone"
                      dataKey="hits"
                      stroke="#2563eb"
                      strokeWidth={4}
                      dot={{
                        r: 6,
                        fill: "#2563eb",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                      name="安打数"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* サイドパネル */}
          <div className="space-y-6">
            {/* シーズン目標プログレス */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                <Target size={18} /> シーズン目標
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between font-bold mb-2">
                    <span className="text-gray-500">シーズン 20安打</span>
                    <span className="text-blue-600">65%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-[65%] rounded-full shadow-sm"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-bold mb-2">
                    <span className="text-gray-500">盗塁成功率 80%</span>
                    <span className="text-emerald-500">100%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
              <Link href="/player/goal/">
                <button className="w-full mt-6 py-2 font-bold border text-gray-400 rounded-full hover:text-blue-600 transition-colors cursor-pointer">
                  目標を編集する
                </button>
              </Link>
            </div>
            {/* 次の予定*/}
            <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl italic font-black">
                NEXT
              </div>
              <p className="text-xs font-bold text-blue-100 mb-1 uppercase tracking-widest">
                Next Schedule
              </p>
              <p className="text-lg font-bold mb-4 leading-tight">
                1/25(日) 10:00〜
                <br />
                vs 葛西マリーンズ
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-100">
                <MapPin size={15} />
                <span>江戸川球場 B</span>
              </div>
            </div>
          </div>
        </div>
      </PlayerMenu>
    </div>
  );
}
