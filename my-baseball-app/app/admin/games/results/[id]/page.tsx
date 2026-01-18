import AdminMenu from "@/admin/components/AdminMenu";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import GameResultForm from "../../components/GameResultForm";

export default async function EditGameResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const { year } = await searchParams;

  // 試合データを取得
  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select("*,leagues (name),grounds(name),vsteams(name)")
    .eq("id", id)
    .single();

  if (!game) return <div>試合が見つかりません</div>;

  // 選手一覧を取得
  let playerList: { id: string; no: string; name: string }[] = [];
  const { data: playerData } = await supabase
    .from("players")
    .select("id, no, name")
    .order("sort");

  if (playerData) {
    // 助っ人を追加
    const helper = { id: "HELPER", no: "", name: "助っ人" };
    playerList = [...playerData, helper];
  }

  // 打席結果マスタを取得
  const { data: atBatResult } = await supabase
    .from("at_bat_results")
    .select("no,short_name")
    .order("no");

  // 打席結果を取得
  const { data: battingResult } = await supabase
    .from("batting_results")
    .select(
      `
      *, 
      batting_result_details (*)
      `
    )
    .eq("game_id", id)
    .order("batting_index")
    .order("inning_index", {
      referencedTable: "batting_result_details",
      ascending: true,
    });

  // 投球結果を取得
  const { data: pitchingResult } = await supabase
    .from("pitching_results")
    .select("*")
    .eq("game_id", id)
    .order("pitching_order");

  return (
    <AdminMenu>
      <div className="max-w-full md:min-w-125 md:max-w-400 mx-auto">
        {/* ヘッダー部分 */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/admin/games/results?year=${year}`}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">試合結果編集</h1>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border">
          <GameResultForm
            game={game}
            playerData={playerList}
            atBatResult={atBatResult ? atBatResult : []}
            battingResult={battingResult ? battingResult : []}
            pitchingResult={pitchingResult ? pitchingResult : []}
          />
        </div>
      </div>
    </AdminMenu>
  );
}
