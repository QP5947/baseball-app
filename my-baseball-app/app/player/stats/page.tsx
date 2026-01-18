"use client";

import { BarChart3, Users } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PlayerMenu from "../components/PlayerMenu";

// サンプルデータ：自分の成績とチーム平均の比較
const performanceData = [
  { match: "4/01", hits: 1, teamAvgHits: 1.2 },
  { match: "4/08", hits: 3, teamAvgHits: 0.8 },
  { match: "4/15", hits: 0, teamAvgHits: 1.1 },
  { match: "4/22", hits: 2, teamAvgHits: 1.5 },
  { match: "4/29", hits: 1, teamAvgHits: 1.0 },
];

const metrics = [
  {
    id: "hits",
    name: "安打数",
    color: "#2563eb",
    teamColor: "#e2e8f0",
    unit: "本",
  },
  {
    id: "rbi",
    name: "打点",
    color: "#059669",
    teamColor: "#ecfdf5",
    unit: "点",
  },
  { id: "avg", name: "打率", color: "#dc2626", teamColor: "#fef2f2", unit: "" },
];

export default function PerformanceAnalysis() {
  const [yAxisKey, setYAxisKey] = useState("hits");
  const [showTeamAvg, setShowTeamAvg] = useState(true);
  const [aiAdvice, setAiAdvice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (isLoading || aiAdvice) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerStats: performanceData }),
      });
      const data = await res.json();
      setAiAdvice(data.advice);
    } finally {
      setIsLoading(false);
    }
  };

  const currentMetric = metrics.find((m) => m.id === yAxisKey) || metrics[0];

  return (
    <div className="min-h-screen bg-gray-50/50 flex text-gray-800 relative">
      <PlayerMenu>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="text-blue-600" /> 個人成績分析
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              チーム内でのパフォーマンスを比較
            </p>
          </div>
        </header>

        {/* 分析設定パネル */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 mb-5">
          <div className="flex-1">
            <label className="font-black text-gray-400 uppercase mb-2 block">
              指標
            </label>
            <select
              value={yAxisKey}
              onChange={(e) => setYAxisKey(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
            >
              {metrics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="font-black text-gray-400 uppercase mb-2 block">
              表示設定
            </label>
            <button
              onClick={() => setShowTeamAvg(!showTeamAvg)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all font-bold ${
                showTeamAvg
                  ? "bg-blue-50 border-blue-600 text-blue-600"
                  : "bg-gray-50 border-transparent text-gray-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={18} /> チーム平均と比較
              </div>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  showTeamAvg ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                    showTeamAvg ? "left-6" : "left-1"
                  }`}
                />
              </div>
            </button>
          </div>
        </section>

        {/* メイングラフ */}
        <section className="bg-white p-6 md:p-8 rounded-4xl shadow-sm border border-gray-100 mb-5">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="font-black text-blue-600 uppercase mb-1">
                Performance Chart
              </p>
              <h2 className="text-2xl font-black text-gray-900">
                {currentMetric.name}
              </h2>
            </div>
            {/* 凡例カスタム */}
            <div className="flex gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                自分
              </div>
              {showTeamAvg && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-gray-200" />
                  チーム平均
                </div>
              )}
            </div>
          </div>

          <div className="h-100 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {/* ComposedChartを使うと異なる種類のグラフを重ねられる */}
              <ComposedChart data={performanceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="match"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  allowDecimals={yAxisKey === "avg"}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                  }}
                />

                {/* チーム平均：薄いグレーの棒グラフ（背景っぽく見せる） */}
                {showTeamAvg && (
                  <Bar
                    dataKey="teamAvgHits"
                    fill="#f1f5f9"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                    name="チーム平均"
                    animationDuration={1500}
                  />
                )}

                {/* 自分：鮮やかな青の折れ線（メイン） */}
                <Line
                  type="monotone"
                  dataKey={yAxisKey}
                  stroke={currentMetric.color}
                  strokeWidth={4}
                  dot={{
                    r: 6,
                    fill: currentMetric.color,
                    strokeWidth: 3,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  name="自分"
                  animationDuration={1000}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 分析インサイト */}
        <div className="bg-blue-600 rounded-4xl p-8 text-white flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-blue-100">
          <div className="bg-white/20 p-4 rounded-2xl">
            <Users size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">AI分析インサイト</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              {!aiAdvice && !isLoading ? (
                <span className="cursor-pointer" onClick={handleAnalyze}>
                  クリックで解析
                </span>
              ) : (
                ""
              )}
              {isLoading ? "解析中..." : aiAdvice}
            </p>
          </div>
        </div>
      </PlayerMenu>
    </div>
  );
}
