import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AdminMenu from "../components/AdminMenu";
import { formatRate } from "../../utils/rateFormat";
import { Clock, MapPin } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: myTeamId, error: rpcError } =
    await supabase.rpc("get_my_team_id");

  // 今日
  const now = new Date().toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartStr = todayStart.toISOString();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayEndStr = todayEnd.toISOString();

  // 今日の試合
  const { data: todayGame } = await supabase
    .from("games")
    .select("*,leagues (name),grounds(name),vsteams(name)")
    .gte("start_datetime", todayStartStr)
    .lte("start_datetime", todayEndStr)
    .or("status.is.null,status.eq.0")
    .order("start_datetime", { ascending: true })
    .limit(1)
    .maybeSingle();

  // 登録メンバー数
  const { count: playerCount } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .or("is_player.eq.true,is_admin.eq.true,is_manager.eq.true");

  // 勝ち数
  const { count: winCount } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .eq("sum_flg", true)
    .in("status", [1, 4]);

  // 負け数
  const { count: loseCount } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .eq("sum_flg", true)
    .in("status", [2, 5]);

  // チーム打率
  const { data: teamAvg } = await supabase
    .from("mv_team_total_stats")
    .select("avg")
    .eq("team_id", myTeamId)
    .maybeSingle();

  // 次の試合
  const { data: nextGame } = await supabase
    .from("games")
    .select("*,leagues (name),grounds(name),vsteams(name)")
    .gt("start_datetime", now)
    .order("start_datetime", { ascending: true })
    .limit(1)
    .maybeSingle();

  // 直近の試合
  const { data: games } = await supabase
    .from("games")
    .select("*,leagues (name),grounds(name),vsteams(name)")
    .lt("start_datetime", now)
    .order("start_datetime", { ascending: false })
    .limit(5);

  // 日付のフォーマット
  const formatDate = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
  });

  // 時間のフォーマット
  const formatTime = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 試合ステータス
  const statusMap: { [key: number]: string[] } = {
    1: ["勝利"],
    2: ["敗戦"],
    3: ["引き分け"],
    4: ["不戦勝"],
    5: ["不戦敗"],
  };

  // 試合ステータス文字色
  const statusColorMap: { [key: number]: string[] } = {
    1: ["text-red-500"],
    2: ["text-blue-500"],
    3: ["text-slate-500"],
    4: ["text-red-500"],
    5: ["text-blue-500"],
  };

  return (
    <AdminMenu>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
          <p className="text-gray-500 text-sm">現在のチームの概要</p>
        </header>

        {todayGame ? (
          <Link href="games/scoring/1/">
            <div className="bg-white rounded-xl shadow-sm border-2 border-red-600 p-6 mb-6">
              <p className="text-gray-500">今日の試合</p>
              <div className="flex flex-col md:flex-row text-lg font-bold">
                <div>
                  <span className="mr-1">
                    {formatDate.format(new Date(todayGame.start_datetime))}
                  </span>
                </div>
                <div className="flex">
                  <div className="mr-1">{todayGame.leagues.name}</div>
                  <div>VS {todayGame.vsteams.name}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-auto text-base">
                <div className="flex items-center gap-1 text-gray-700">
                  <Clock size={15} />
                  {formatTime.format(new Date(todayGame.start_datetime))}〜
                </div>
                <div className="flex items-center gap-1 text-gray-700">
                  <MapPin size={15} />
                  {todayGame.grounds.name}
                </div>
              </div>
              <p className="text-lg font-bold text-red-600">→試合速報入力</p>
            </div>
          </Link>
        ) : (
          <Link href="games/scoring/1/">
            {/* デモ用 */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-red-600 p-6 mb-6">
              <p className="text-gray-500">今日の試合（デモ用表示）</p>
              <div className="flex flex-col md:flex-row text-lg font-bold">
                <div>
                  <span className="mr-1">04/01</span>
                </div>
                <div className="flex">
                  <div className="mr-1">練習試合</div>
                  <div>VS 足立ヤンキース</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-auto text-base">
                <div className="flex items-center gap-1 text-gray-700">
                  <Clock size={15} />
                  09:30〜
                </div>
                <div className="flex items-center gap-1 text-gray-700">
                  <MapPin size={15} />
                  北千住グラウンド
                </div>
              </div>
              <p className="text-lg font-bold text-red-600">→試合速報入力</p>
            </div>
          </Link>
        )}

        {/* サマリーカード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500">登録メンバー数</p>
            <p className="text-3xl font-bold">{playerCount}人</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className=" text-gray-500">今季勝敗</p>
            <p className="text-3xl font-bold text-blue-600">
              {winCount}勝 {loseCount}敗
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500">チーム打率</p>
            <p className="text-3xl font-bold text-orange-600">
              {formatRate(teamAvg?.avg)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500">次の試合</p>
            <p className="text-lg font-bold">
              <div>
                {nextGame ? (
                  <>
                    <p>
                      {formatDate.format(new Date(nextGame.start_datetime)) +
                        " " +
                        nextGame.leagues.name}
                    </p>
                    <p className="text-blue-500 font-bold">
                      VS {nextGame.vsteams.name}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-auto text-base">
                      <div className="flex items-center gap-1 text-gray-700">
                        <Clock size={15} />
                        {formatTime.format(new Date(nextGame.start_datetime))}〜
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                        <MapPin size={15} />
                        {nextGame.grounds.name}
                      </div>
                    </div>
                  </>
                ) : (
                  "試合はありません"
                )}
              </div>
            </p>
          </div>
        </div>

        {/* 最近の試合一覧 */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-bold mb-4 text-gray-800">直近5試合の記録</h2>
          <div className="divide-y divide-gray-100">
            {games?.map((game) => (
              <div
                key={game.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* 左側：日付とステータス */}
                <div className="flex items-center gap-4">
                  <div className=" text-gray-500 tabular-nums">
                    {formatDate.format(new Date(game.start_datetime))}
                  </div>
                  <div
                    className={`
            w-16 py-1 font-bold rounded-full text-center border
            ${
              game.status === 1 || game.status === 4
                ? "bg-red-50 border-red-200 text-red-600"
                : game.status === 2 || game.status === 5
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-gray-50 border-gray-200 text-gray-500"
            }
          `}
                  >
                    {statusMap[game.status] || "未入力"}
                  </div>
                </div>

                {/* 中央：試合詳細 */}
                <div className="flex-1">
                  <div className="text-gray-400 mb-0.5">
                    {game.leagues.name}
                  </div>
                  <div className="font-bold text-gray-800">
                    <span className="text-gray-400 font-normal mr-2">VS</span>
                    {game.vsteams.name}
                  </div>
                </div>

                {/* 右側：詳細リンク */}
                <div className="text-center md:right">
                  {statusMap[game.status] ? (
                    <Link
                      href={`/games/${game.id}`}
                      className=" text-blue-600 hover:underline font-medium"
                      target="_blank"
                    >
                      詳細を見る
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/games/results/${game.id}?year=${new Date(game.start_datetime).getFullYear()}`}
                      className=" text-blue-600 hover:underline font-medium"
                    >
                      試合結果入力
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminMenu>
  );
}
