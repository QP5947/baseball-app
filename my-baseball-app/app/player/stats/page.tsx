"use client";

import { BarChart3, Users } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  getBattingStats,
  getPitchingStats,
  getTeamBattingAverage,
  getTeamPitchingAverage,
  hasPitchingStats,
  getAvailableYears,
  getPlayerInfo,
} from "./actions";

type StatType = "batting" | "pitching";

// 打撃指標
const battingMetrics = [
  {
    id: "h",
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
  {
    id: "hr",
    name: "本塁打",
    color: "#f59e0b",
    teamColor: "#fef3c7",
    unit: "本",
  },
  { id: "avg", name: "打率", color: "#dc2626", teamColor: "#fef2f2", unit: "" },
];

// 投手指標
const pitchingMetrics = [
  {
    id: "era",
    name: "防御率",
    color: "#2563eb",
    teamColor: "#e2e8f0",
    unit: "",
  },
  {
    id: "whip",
    name: "WHIP",
    color: "#059669",
    teamColor: "#ecfdf5",
    unit: "",
  },
  {
    id: "so",
    name: "奪三振",
    color: "#f59e0b",
    teamColor: "#fef3c7",
    unit: "個",
  },
  {
    id: "ip",
    name: "投球回",
    color: "#dc2626",
    teamColor: "#fef2f2",
    unit: "回",
  },
];

export default function PerformanceAnalysis() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [statType, setStatType] = useState<StatType>("batting");
  const [yAxisKey, setYAxisKey] = useState("h");
  const [showTeamAvg, setShowTeamAvg] = useState(true);
  const [aiAdvice, setAiAdvice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [battingData, setBattingData] = useState<any[]>([]);
  const [pitchingData, setPitchingData] = useState<any[]>([]);
  const [teamBattingAvg, setTeamBattingAvg] = useState<any[]>([]);
  const [teamPitchingAvg, setTeamPitchingAvg] = useState<any[]>([]);
  const [hasPitching, setHasPitching] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [playerInfo, setPlayerInfo] = useState<any>(null);

  // プレイヤー情報を読み込み
  useEffect(() => {
    const loadPlayerInfo = async () => {
      const info = await getPlayerInfo();
      setPlayerInfo(info);
    };
    loadPlayerInfo();
  }, []);

  // 利用可能な年度を読み込み
  useEffect(() => {
    const loadYears = async () => {
      const years = await getAvailableYears();
      setAvailableYears(years);
      // 最新の年度を選択
      if (years.length > 0 && !years.includes(year)) {
        setYear(years[0]);
      }
    };
    loadYears();
  }, []);

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 投手成績の有無をチェック
        const hasPitchingData = await hasPitchingStats();
        setHasPitching(hasPitchingData);

        // 打撃成績を取得
        const battingResult = await getBattingStats(year);

        // 日付をフォーマット
        const formattedBattingData = battingResult.stats.map((stat: any) => ({
          ...stat,
          match: new Date(stat.game_date).toLocaleDateString("ja-JP", {
            month: "numeric",
            day: "numeric",
          }),
        }));
        setBattingData(formattedBattingData);

        // チーム平均（打撃）を取得
        if (battingResult.teamId) {
          const teamBattingData = await getTeamBattingAverage(
            battingResult.teamId,
            year,
          );
          const formattedTeamBattingData = teamBattingData.map((stat: any) => ({
            ...stat,
            match: new Date(stat.game_date).toLocaleDateString("ja-JP", {
              month: "numeric",
              day: "numeric",
            }),
          }));
          setTeamBattingAvg(formattedTeamBattingData);
        }

        // 投手成績を取得
        if (hasPitchingData) {
          const pitchingResult = await getPitchingStats(year);
          const formattedPitchingData = pitchingResult.stats.map(
            (stat: any) => ({
              ...stat,
              match: new Date(stat.game_date).toLocaleDateString("ja-JP", {
                month: "numeric",
                day: "numeric",
              }),
            }),
          );
          setPitchingData(formattedPitchingData);

          // チーム平均（投手）を取得
          if (pitchingResult.teamId) {
            const teamPitchingData = await getTeamPitchingAverage(
              pitchingResult.teamId,
              year,
            );
            const formattedTeamPitchingData = teamPitchingData.map(
              (stat: any) => ({
                ...stat,
                match: new Date(stat.game_date).toLocaleDateString("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                }),
              }),
            );
            setTeamPitchingAvg(formattedTeamPitchingData);
          }
        }
      } catch (error) {
        console.error("データ読み込みエラー:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [year]);

  // 統計タイプ切り替え時に指標をリセット
  useEffect(() => {
    if (statType === "batting") {
      setYAxisKey("h");
    } else {
      setYAxisKey("era");
    }
  }, [statType]);

  const handleAnalyze = async () => {
    if (isLoading || aiAdvice) return;
    setIsLoading(true);
    try {
      const currentData = statType === "batting" ? battingData : pitchingData;
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerStats: currentData }),
      });
      const data = await res.json();
      setAiAdvice(data.advice);
    } finally {
      setIsLoading(false);
    }
  };

  const currentMetrics =
    statType === "batting" ? battingMetrics : pitchingMetrics;
  const currentMetric =
    currentMetrics.find((m) => m.id === yAxisKey) || currentMetrics[0];
  const currentData = statType === "batting" ? battingData : pitchingData;
  const currentTeamAvg =
    statType === "batting" ? teamBattingAvg : teamPitchingAvg;

  // チーム平均データを日付でマージ
  const mergedData = currentData.map((stat) => {
    const teamStat = currentTeamAvg.find((t) => t.match === stat.match);
    return {
      ...stat,
      teamAvg: teamStat ? teamStat[yAxisKey] : undefined,
    };
  });

  // 年度セレクタの選択肢（データがある年度のみ）
  const yearOptions =
    availableYears.length > 0 ? availableYears : [currentYear];

  return (
    <div className="min-h-screen bg-gray-50/50 flex text-gray-800 relative">
      <PlayerMenu no={playerInfo?.no || ""} name={playerInfo?.name || ""}>
        <header className="mb-5">
          <div className="mb-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="text-blue-600" /> 個人成績分析
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              チーム内でのパフォーマンスを比較
            </p>
          </div>
          {/* 年度セレクター */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-gray-600 text-sm">年度:</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* タブ切り替え */}
        <section className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-5 flex gap-2">
          <button
            onClick={() => setStatType("batting")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
              statType === "batting"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            打撃成績
          </button>
          {hasPitching && (
            <button
              onClick={() => setStatType("pitching")}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                statType === "pitching"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50 cursor-pointer"
              }`}
            >
              投手成績
            </button>
          )}
        </section>

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
              {currentMetrics.map((m) => (
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
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all font-bold cursor-pointer ${
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
            <div className="flex gap-4 text-xs font-bold text-gray-900">
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

          <div className="h-64 md:h-100 w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 font-bold">読み込み中...</div>
              </div>
            ) : mergedData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 font-bold">
                  データがありません
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {/* ComposedChartを使うと異なる種類のグラフを重ねられる */}
                <ComposedChart data={mergedData}>
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
                    allowDecimals={true}
                    tickFormatter={(value) => {
                      // 率の指標は小数点以下3桁、その他は整数表示
                      if (
                        ["avg", "obp", "slg", "ops", "era", "whip"].includes(
                          yAxisKey,
                        )
                      ) {
                        return value.toFixed(3);
                      }
                      return value.toString();
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                    }}
                    labelStyle={{
                      fontWeight: "bold",
                      color: "#1f2937",
                    }}
                    formatter={(
                      value: any,
                      name: string | undefined,
                      props: any,
                    ) => {
                      // 率の指標は小数点以下3桁、その他は整数表示
                      const formattedValue = [
                        "avg",
                        "obp",
                        "slg",
                        "ops",
                        "era",
                        "whip",
                      ].includes(yAxisKey)
                        ? Number(value).toFixed(3)
                        : value;

                      return [formattedValue, name || ""];
                    }}
                  />

                  {/* チーム平均：濃いグレーの棒グラフ */}
                  {showTeamAvg && (
                    <Bar
                      dataKey="teamAvg"
                      fill="#94a3b8"
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
            )}
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
              {currentData.length < 5 ? (
                "5試合以上出場するとAI分析が利用可能になります"
              ) : !aiAdvice && !isLoading ? (
                <span className="cursor-pointer" onClick={handleAnalyze}>
                  クリックで解析
                </span>
              ) : (
                ""
              )}
              {currentData.length >= 5 && (isLoading ? "解析中..." : aiAdvice)}
            </p>
          </div>
        </div>
      </PlayerMenu>
    </div>
  );
}
