"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Edit, Check } from "lucide-react";
import YearSelector from "../../components/YearSelector";

interface PastPlayer {
  player_id: string;
  no: number;
  name: string;
  throw_hand: string;
  batting_hand: string;
  show_flg: boolean;
}

const handMap: Record<string, string> = {
  L: "左",
  R: "右",
  S: "両",
};

export default function PastPlayersContent() {
  const searchParams = useSearchParams();
  const [pastPlayers, setPastPlayers] = useState<PastPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear() - 1,
  );
  const [paramMinYear, setParamMinYear] = useState<number>(
    new Date().getFullYear() - 1,
  );
  const currentYear = new Date().getFullYear() - 1;

  useEffect(() => {
    // URL パラメータから年度を取得
    const yearParam = searchParams.get("year");
    if (yearParam) {
      setSelectedYear(parseInt(yearParam));
    }
  }, [searchParams]);

  useEffect(() => {
    loadPastPlayers();
  }, [selectedYear]);

  const loadPastPlayers = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: myTeamId } = await supabase.rpc("get_my_team_id");

      // 年度の最小値を取得
      const { data: minYearData } = await supabase
        .from("past_players")
        .select("year")
        .eq("team_id", myTeamId)
        .order("year", { ascending: true })
        .limit(1)
        .single();
      setParamMinYear(minYearData?.year || currentYear);

      // 過去選手の取得
      const { data: playersData } = await supabase
        .from("past_players")
        .select("*")
        .eq("team_id", myTeamId)
        .eq("year", selectedYear)
        .order("sort", { ascending: true })
        .order("no", { ascending: true });

      setPastPlayers(playersData || []);
    } catch (error) {
      console.error("Error loading past players:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-1">
        <h1 className="text-2xl font-bold text-gray-800">過去選手一覧</h1>
        <YearSelector
          selectedYear={selectedYear}
          paramMinYear={paramMinYear}
          paramMaxYear={currentYear - 1}
        />
      </div>
      <p className="text-sm text-gray-600 mb-6">
        前年度以前の試合結果、個人成績の表示名などを編集できます。
      </p>

      {loading ? (
        <LoadingIndicator />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-auto">
          <table className="w-full min-w-full table-fixed md:table-auto text-left border-collapse">
            <thead className="bg-gray-50 border-b text-center">
              <tr>
                <th className="p-4 font-semibold text-gray-600">背番号</th>
                <th className="p-4 font-semibold text-gray-600">名前</th>
                <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                  投 / 打
                </th>
                <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                  表示
                </th>
                <th className="p-4 font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {pastPlayers.map((player) => (
                <tr
                  key={player.player_id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-mono text-blue-600 font-bold">
                    {player.no || "-"}
                  </td>
                  <td className="p-4 font-medium text-gray-800 whitespace-nowrap">
                    {player.name}
                  </td>
                  <td className="p-4 text-gray-600 hidden md:table-cell whitespace-nowrap text-center">
                    {handMap[player.throw_hand]} /{" "}
                    {handMap[player.batting_hand]}
                  </td>
                  <td className="p-4 text-gray-600 hidden md:table-cell text-center">
                    {player.show_flg ? <Check className="inline-block" /> : ""}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        href={`/admin/pastPlayers/${player.player_id}?year=${selectedYear}`}
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
      )}
    </div>
  );
}
