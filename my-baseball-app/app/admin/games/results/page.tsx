import YearSelector from "@/admin/components/YearSelector";
import { createClient } from "@/lib/supabase/server";
import { Check, Edit } from "lucide-react";
import Link from "next/link";
import AdminMenu from "../../components/AdminMenu";

function getFiscalYearRange(year: number) {
  return {
    start: `${year}-01-01T00:00:00+09:00`,
    end: `${year}-12-31T23:59:59+09:00`,
  };
}

export default async function GameResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: number }>;
}) {
  const supabase = await createClient();

  // 今日の日付を取得
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const todayISO = today.toISOString();
  const currentYear = today.getFullYear();

  // 年度の最小値を取得
  const { data: minYearData } = await supabase
    .from("games")
    .select("start_datetime")
    .order("start_datetime", { ascending: true })
    .limit(1)
    .single();

  let paramMinYear = currentYear;
  if (minYearData) {
    paramMinYear =
      new Date(minYearData?.start_datetime).getFullYear() || currentYear;
  }

  // 表示する年度
  const params = await searchParams;
  const selectedYear = params.year || currentYear;

  // 試合を表示する開始・終了日時の取得
  const range = getFiscalYearRange(selectedYear);

  // 試合を取得
  const { data: games } = await supabase
    .from("games")
    .select("*,leagues (name),grounds(name),vsteams(name)")
    .gte("start_datetime", range.start)
    .lte("start_datetime", range.end)
    .lte("start_datetime", todayISO)
    .order("start_datetime", { ascending: false });

  // 結果未入力を先に表示する
  let sortedGames = [];
  if (games) {
    sortedGames = [
      ...games.filter((g) => g.home_score === null),
      ...games.filter((g) => g.home_score !== null),
    ];
  }

  // 試合開始日付のフォーマット
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 試合結果表示用map
  const gameStatusMap: Record<string, string> = {
    1: "勝利",
    2: "敗戦",
    3: "引き分け",
    4: "不戦勝",
    5: "不戦敗",
    6: "中止",
  };

  return (
    <AdminMenu>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">試合一覧</h1>
        <YearSelector
          selectedYear={selectedYear}
          paramMinYear={paramMinYear}
          paramMaxYear={currentYear}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-auto">
        <table className="w-full min-w-full table-fixed md:table-auto text-left border-collapse">
          <thead className="bg-gray-50 border-b text-center">
            <tr>
              <th className="p-4 font-semibold text-gray-600">試合開始日時</th>
              <th className="p-4 font-semibold text-gray-600">リーグ名</th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                球場
              </th>
              <th className="p-4 font-semibold text-gray-600">対戦相手</th>
              <th className="p-4 font-semibold text-gray-600">試合結果</th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                試合コメント
              </th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                成績集計
              </th>
              <th className="p-4 font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {games?.map((game) => (
              <tr
                key={game.id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="p-4 text-gray-600 text-center">
                  {formatted.format(new Date(game.start_datetime))}
                </td>
                <td className="p-4 text-gray-600">{game.leagues.name}</td>
                <td className="p-4 text-gray-600 hidden md:table-cell">
                  {game.grounds.name}
                </td>
                <td className="p-4 text-gray-600">{game.vsteams.name}</td>
                <td className="p-4 text-gray-600">
                  {gameStatusMap[game.status]}
                </td>
                <td className="p-4 text-gray-600 hidden md:table-cell">
                  {game.game_comment}
                </td>
                <td className="p-4 text-gray-600 text-center hidden md:table-cell">
                  {game.sum_flg ? <Check className="inline-block" /> : ""}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      href={`/admin/games/results/${game.id}?year=${selectedYear}`}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit size={18} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminMenu>
  );
}
