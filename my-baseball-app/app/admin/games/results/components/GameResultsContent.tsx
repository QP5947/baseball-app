"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Edit, Zap } from "lucide-react";
import Link from "next/link";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import DeleteButton from "../../../components/DeleteButton";
import YearSelector from "../../../components/YearSelector";
import { deleteGame } from "../actions";

interface Game {
  id: string;
  start_datetime: string;
  status?: number | null;
  home_score?: number | null;
  game_comment?: string;
  sum_flg?: boolean;
  leagues: { name: string };
  grounds: { name: string };
  vsteams: { name: string };
}

function getFiscalYearRange(year: number) {
  return {
    start: `${year}-01-01T00:00:00+09:00`,
    end: `${year}-12-31T23:59:59+09:00`,
  };
}

const gameStatusMap: Record<string, string> = {
  0: "試合中",
  1: "勝利",
  2: "敗戦",
  3: "引き分け",
  4: "不戦勝",
  5: "不戦敗",
  6: "中止",
};

export default function GameResultsContent() {
  const searchParams = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [paramMinYear, setParamMinYear] = useState<number>(
    new Date().getFullYear(),
  );
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const yearParam = searchParams.get("year");
    if (yearParam) {
      setSelectedYear(parseInt(yearParam));
    }
  }, [searchParams]);

  useEffect(() => {
    loadGameResults();
  }, [selectedYear]);

  const loadGameResults = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: myTeamId } = await supabase.rpc("get_my_team_id");

      // 今日の日付を取得
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const todayISO = today.toISOString();

      // 年度の最小値を取得
      const { data: minYearData } = await supabase
        .from("games")
        .select("start_datetime")
        .eq("team_id", myTeamId)
        .order("start_datetime", { ascending: true })
        .limit(1)
        .single();

      let minYear = currentYear;
      if (minYearData) {
        minYear =
          new Date(minYearData?.start_datetime).getFullYear() || currentYear;
      }
      setParamMinYear(minYear);

      // 試合を表示する開始・終了日時の取得
      const range = getFiscalYearRange(selectedYear);

      // 試合を取得
      const { data: gamesData } = await supabase
        .from("games")
        .select("*,leagues (name),grounds(name),vsteams(name)")
        .eq("team_id", myTeamId)
        .gte("start_datetime", range.start)
        .lte("start_datetime", range.end)
        .lte("start_datetime", todayISO)
        .order("start_datetime", { ascending: false });

      // 結果未入力を先に表示する
      let sortedGames: Game[] = [];
      if (gamesData) {
        sortedGames = [
          ...(gamesData.filter((g) => g.home_score === null) as Game[]),
          ...(gamesData.filter((g) => g.home_score !== null) as Game[]),
        ];
      }

      setGames(sortedGames);
    } catch (error) {
      console.error("Error loading game results:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatted = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">試合一覧</h1>
        <YearSelector
          selectedYear={selectedYear}
          paramMinYear={paramMinYear}
          paramMaxYear={currentYear}
        />
      </div>

      {loading ? (
        <LoadingIndicator />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-auto">
          <table className="w-full min-w-full table-fixed md:table-auto text-left border-collapse">
            <thead className="bg-gray-50 border-b text-center">
              <tr>
                <th className="p-4 font-semibold text-gray-600">
                  試合開始日時
                </th>
                <th className="p-4 font-semibold text-gray-600">リーグ名</th>
                <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                  球場
                </th>
                <th className="p-4 font-semibold text-gray-600">対戦相手</th>
                <th className="p-4 font-semibold text-gray-600">試合結果</th>
                <th className="p-4 font-semibold text-gray-600 hidden md:table-cell w-80">
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
                    {game.status !== null && game.status !== undefined
                      ? gameStatusMap[game.status]
                      : ""}
                  </td>
                  <td className="p-4 text-gray-600 hidden md:table-cell">
                    {game.game_comment}
                  </td>
                  <td className="p-4 text-gray-600 text-center hidden md:table-cell">
                    {game.sum_flg ? <Check className="inline-block" /> : ""}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      {(game.status === 0 || !game.status) && (
                        <Link
                          href={`/admin/games/scoring/${game.id}`}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Zap size={18} />
                        </Link>
                      )}
                      <Link
                        href={`/admin/games/results/${game.id}?year=${selectedYear}`}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={18} />
                      </Link>

                      <DeleteButton
                        id={game.id}
                        deleteName={
                          formatted.format(new Date(game.start_datetime)) +
                          "～ VS" +
                          game.vsteams.name
                        }
                        action={deleteGame}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
