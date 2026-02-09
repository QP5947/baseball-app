"use client";
import { AlertCircle, BarChart3, Home, MapPin, Target } from "lucide-react";
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
import PlayerMenu from "../../components/PlayerMenu";
import { Database } from "@/types/supabase";
import { formatRate } from "@/utils/rateFormat";

// 型宣言
type GameRow = Database["public"]["Tables"]["games"]["Row"] & {
  leagues: { name: string };
  grounds: { name: string };
  vsteams: { name: string };
};

type DailyStat = {
  game: string; // 日付や試合名
  hits: number; // 安打数
};

interface GoalsDivision {
  no: number;
  goal_group_no: number | null;
  goal_name: string | null;
  goal_type: number | null;
  high_goal_flg: boolean | null;
  table_name: string | null;
  column_name: string | null;
}

interface Goal {
  player_id: string;
  team_id: string;
  year: number;
  goal_no: number;
  goal_value: string | null;
  memo: string | null;
  sort: number | null;
  created_at: string;
}

// 試合開始日付のフォーマット
const formatted = new Intl.DateTimeFormat("ja-JP", {
  month: "short",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const GOAL_GROUP_NAMES = {
  1: "打撃",
  2: "走塁",
  3: "守備",
  4: "投球",
  99: "その他",
};

export default function PlayerDashboard({
  player,
  nextGame,
  nextAttendance,
  dailyStats,
  goals,
  goalsDivisions,
  playerStats,
}: {
  player: Database["public"]["Tables"]["players"]["Row"];
  nextGame: GameRow | null;
  nextAttendance: Database["public"]["Tables"]["attendance"]["Row"] | null;
  dailyStats: DailyStat[];
  goals: Goal[];
  goalsDivisions: GoalsDivision[];
  playerStats: any;
}) {
  // 実績値を取得する関数
  const getActualValue = (goalNo: number): number | string => {
    if (!playerStats) return 0;

    const division = goalsDivisions.find((d) => d.no === goalNo);
    if (!division) return 0;

    // table_name と column_name が設定されている場合はそれを使用
    if (
      division.column_name &&
      playerStats[division.column_name] !== undefined
    ) {
      const value = playerStats[division.column_name];
      // 値がnullやundefinedの場合は0を返す、それ以外はそのまま返す
      return value ?? 0;
    }

    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex text-gray-800 relative">
      <PlayerMenu no={player.no} name={player.name}>
        {/* PC用ヘッダー */}
        <header className="mb-8 block">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Home size={28} className="text-blue-600" />
            ダッシュボード
          </h1>
          <p className="text-gray-500">現在のチーム状況とあなたのスタッツ</p>
        </header>

        {/* 出欠通知（管理画面テイストの2pxボーダー） */}
        <section className="mb-8">
          {nextGame && !nextAttendance && (
            <Link href={`/player/schedule/${nextGame.id}`}>
              <div
                className={`bg-white rounded-xl shadow-sm border-2  p-5 flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:bg-orange-50
                ${!nextAttendance ? "border-orange-500" : "border-gray-200"}`}
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-ls text-orange-600 font-black tracking-widest mb-0.5">
                      出欠未入力
                    </p>
                    <p className="text-lg font-bold text-gray-900 leading-tight mb-0.5">
                      {formatted.format(new Date(nextGame.start_datetime))}～
                    </p>
                    <p className="text-lg font-bold text-gray-900 leading-tight mb-0.5">
                      {nextGame.leagues.name}
                      <br /> vs {nextGame.vsteams.name}
                    </p>
                    <p className="flex text-ls font-bold text-gray-400 leading-tight gap-1">
                      <MapPin size={18} />
                      <span>{nextGame.grounds.name}</span>
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </section>

        {/* グリッドレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* サマリー：4枚の管理画面風カード */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "打率",
                  value: formatRate(playerStats.avg),
                  color: "text-blue-600",
                },
                {
                  label: "安打",
                  value: playerStats.h,
                  color: "text-gray-900",
                },
                {
                  label: "本塁打",
                  value: playerStats.hr,
                  color: "text-red-600",
                },
                {
                  label: "打点",
                  value: playerStats.rbi,
                  color: "text-gray-900",
                },
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
            {playerStats.pitch_appearances !== undefined && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: "登板数",
                    value: playerStats.pitch_appearances,
                    color: "text-gray-900",
                  },
                  {
                    label: "勝ち",
                    value: playerStats.pitch_wins,
                    color: "text-gray-900",
                  },
                  {
                    label: "負け",
                    value: playerStats.pitch_losses,
                    color: "text-red-600",
                  },
                  {
                    label: "失点率",
                    value: playerStats.pitch_era.toFixed(2).replace(/^0/, ""),
                    color: "text-blue-600",
                  },
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
            )}
            {/* パフォーマンスグラフ（プレースホルダー） */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 size={16} className="text-blue-600" /> 安打数推移
                </h3>
                <span className="font-bold text-gray-400">直近5試合</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyStats}
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

          <div className="space-y-6">
            {/* シーズン目標 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                <Target size={18} /> シーズン目標
              </h3>
              <div className="space-y-6">
                {goals.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">
                    目標がまだ設定されていません
                  </p>
                ) : (
                  goals.map((goal) => {
                    const division = goalsDivisions.find(
                      (d) => d.no === goal.goal_no,
                    );
                    const isCustomGoal = goal.goal_no === 99 || !division;
                    const goalName = isCustomGoal
                      ? "カスタム目標"
                      : division?.goal_name;
                    const goalValue =
                      parseFloat(
                        goal.goal_value?.toString().replace("%", "") || "0",
                      ) || 0;
                    let actualValue = Number(getActualValue(goal.goal_no));
                    // goal_type === 3の場合のみ実績値を100倍してパーセンテージに変換
                    if (division?.goal_type === 3) {
                      actualValue *= 100;
                    }
                    let progress = 0;
                    if (goalValue > 0) {
                      if (division?.high_goal_flg) {
                        // 高い方が良い目標（達成率 = 実績 / 目標 × 100）
                        progress = (actualValue / goalValue) * 100;
                      } else {
                        // 低い方が良い目標（達成率 = 100 - (実績 - 目標) / 目標 × 100）
                        progress = Math.max(
                          100 - ((actualValue - goalValue) / goalValue) * 100,
                          0,
                        );
                      }
                    }

                    return (
                      <div key={goal.goal_no}>
                        <div className="flex justify-between font-bold mb-2">
                          <span className="text-gray-500 text-sm">
                            <span>{goalName}</span>
                            {!isCustomGoal && (
                              <span>
                                {division?.goal_type === 3
                                  ? ` ${Math.round(
                                      Number(getActualValue(goal.goal_no)) *
                                        100,
                                    )}% / ${goalValue}%`
                                  : division?.goal_type === 2
                                    ? ` ${formatRate(
                                        Number(getActualValue(goal.goal_no)),
                                      )} / ${formatRate(goalValue)}`
                                    : ` ${Number(
                                        getActualValue(goal.goal_no),
                                      )} / ${goalValue}`}
                              </span>
                            )}
                          </span>
                          <span className="text-blue-600">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full shadow-sm transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <Link href="/player/goal/">
                <button className="w-full mt-6 py-2 font-bold border text-gray-400 rounded-full hover:text-blue-600 transition-colors cursor-pointer">
                  目標を編集する
                </button>
              </Link>
            </div>
            {/* 次の予定*/}
            {nextGame && (
              <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl italic font-black">
                  NEXT
                </div>
                <p className="font-bold text-blue-100 mb-1 uppercase">
                  Next Schedule
                </p>
                <p className="text-lg font-bold leading-tight">
                  {formatted.format(new Date(nextGame.start_datetime))}〜
                  <br />
                  {nextGame.leagues.name}
                  <br />
                  vs {nextGame.vsteams.name}
                </p>
                <div className="flex items-center gap-2 text-blue-100">
                  <MapPin size={15} />
                  <span>{nextGame.grounds.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </PlayerMenu>
    </div>
  );
}
