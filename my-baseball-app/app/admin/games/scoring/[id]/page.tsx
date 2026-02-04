import RealTimeScoring from "../../components/RealTimeScoring";
import { createClient } from "@/lib/supabase/server";

/**
 * リアルタイムスコア入力（入口）
 *
 * @param param0
 * @returns
 */
export default async function OrderRegistrationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  // サーバーサイドでデータを取得
  const supabase = await createClient();
  const { data: gameData } = await supabase
    .from("games")
    .select(
      `
      *,
      leagues(name),
      grounds(name),
      vsteams(name)
    `,
    )
    .eq("id", id)
    .single();

  if (!gameData) return <div>試合データが見つかりません。</div>;

  // 選手一覧を取得
  let playerList: {
    id: string;
    no: string;
    name: string;
    batting_hand: string;
    throw_hand: string;
  }[] = [];
  const { data: playerData } = await supabase
    .from("players")
    .select("id, no, name, batting_hand, throw_hand")
    .order("sort");

  if (playerData) {
    // 助っ人を追加
    const helper = {
      id: "HELPER",
      no: "",
      name: "助っ人",
      batting_hand: "",
      throw_hand: "",
    };
    playerList = [...playerData, helper];
  }

  // 打席結果を取得
  const { data: battingResult } = await supabase
    .from("batting_results")
    .select("*")
    .eq("game_id", id)
    .order("batting_index");

  // 打席結果を取得
  const { data: battingResultDetail } = await supabase
    .from("batting_result_details")
    .select("*")
    .eq("game_id", id)
    .order("batting_index")
    .order("inning_index");

  // 投球結果を取得
  const { data: pitchingResult } = await supabase
    .from("pitching_results")
    .select("*")
    .eq("game_id", id)
    .order("pitching_order");

  // 各マスタ
  const { data: leagues } = await supabase
    .from("leagues")
    .select("id, name")
    .order("sort");
  const { data: grounds } = await supabase
    .from("grounds")
    .select("id, name")
    .order("sort");
  const { data: vsteams } = await supabase
    .from("vsteams")
    .select("id, name")
    .order("sort");
  const { data: atBatResult } = await supabase
    .from("at_bat_results")
    .select("no,short_name")
    .order("no");

  return (
    <RealTimeScoring
      key={`game-${id}-batting-${battingResult?.length || 0}`}
      gameData={gameData}
      playerData={playerList}
      battingResult={battingResult ? battingResult : []}
      battingResultDetail={battingResultDetail ? battingResultDetail : []}
      pitchingResult={pitchingResult ? pitchingResult : []}
      masters={{ leagues, grounds, vsteams, atBatResult }}
    />
  );
}
