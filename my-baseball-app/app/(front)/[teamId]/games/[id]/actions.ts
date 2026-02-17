"use server";
import { createClient } from "@/lib/supabase/server";

export async function fetchGameDetail(gameId: string, teamId: string) {
  const supabase = await createClient();

  // 試合情報を取得
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*,vsteams(name,icon,one_name),grounds(name),leagues(name)")
    .eq("team_id", teamId)
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    console.error("Error fetching game:", gameError);
    return null;
  }

  // 打撃結果を取得
  const { data: battingResults, error: battingError } = await supabase
    .from("batting_results")
    .select("*")
    .eq("game_id", gameId)
    .order("batting_order");

  // 打撃結果詳細を取得
  const { data: battingDetails, error: detailsError } = await supabase
    .from("batting_result_details")
    .select(
      "*,at_bat_results(no,name,display_name,short_name,with_direction,is_at_bat,bases)",
    )
    .eq("game_id", gameId)
    .order("batting_index")
    .order("inning");

  // 投手結果を取得
  const { data: pitchingResults, error: pitchingError } = await supabase
    .from("pitching_results")
    .select("*")
    .eq("game_id", gameId)
    .order("pitching_order");

  // プレイヤー情報を取得
  const playerIds = [
    ...(battingResults || []).map((b) => b.player_id),
    ...(pitchingResults || []).map((p) => p.player_id),
  ];
  const uniquePlayerIds = [...new Set(playerIds)];

  const { data: players } = await supabase
    .from("players")
    .select("id,name")
    .in("id", uniquePlayerIds);

  const playerMap = new Map(players?.map((p) => [p.id, p.name]) || []);

  // スコア計算
  let topScore = 0;
  let bottomScore = 0;
  if (game.top_points && game.top_points.length > 0) {
    topScore = game.top_points.reduce((a: number, b: number) => a + b, 0);
  }
  if (game.bottom_points && game.bottom_points.length > 0) {
    bottomScore = game.bottom_points.reduce((a: number, b: number) => a + b, 0);
  }

  const myScore = game.is_batting_first ? topScore : bottomScore;
  const opponentScore = game.is_batting_first ? bottomScore : topScore;

  // 試合結果を判定
  let result = "next";
  if (game.status !== null && game.status !== 0) {
    if (game.status === 1) result = "win";
    else if (game.status === 2) result = "lose";
    else if (game.status === 3) result = "draw";
    else result = "other";
  }

  const getPlayerName = (playerId: string) => {
    if (playerId === "HELPER") return "助っ人";
    return playerMap.get(playerId) || "不明";
  };

  return {
    game: {
      ...game,
      myScore,
      opponentScore,
      result,
      opponentName: game.vsteams?.name || "",
      groundName: game.grounds?.name || "未定",
      leagueName: game.leagues?.name || "",
    },
    battingResults: (battingResults || []).map((br) => ({
      ...br,
      playerName: getPlayerName(br.player_id),
    })),
    battingDetails: battingDetails || [],
    pitchingResults: (pitchingResults || []).map((pr) => ({
      ...pr,
      playerName: getPlayerName(pr.player_id),
    })),
  };
}
