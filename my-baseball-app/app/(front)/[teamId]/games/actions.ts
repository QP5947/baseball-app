"use server";
import { createClient } from "@/lib/supabase/server";

export async function fetchGamesForMonth(
  teamId: string,
  year: number,
  month: number,
) {
  const supabase = await createClient();

  // 該当月の開始・終了日時を計算
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  // ゲームデータを取得
  const { data: games, error } = await supabase
    .from("games")
    .select("*,vsteams(name),grounds(name),leagues(name)")
    .eq("team_id", teamId)
    .gte("start_datetime", startISO)
    .lte("start_datetime", endISO)
    .order("start_datetime", { ascending: true });

  if (error) {
    console.error("Error fetching games:", error);
    return [];
  }

  // データを整形
  return (games || []).map((game) => {
    const startDate = new Date(game.start_datetime);
    const month = startDate.getMonth();
    const date = startDate.getDate();
    const year = startDate.getFullYear();

    // スコアを計算
    let topScore = 0;
    let bottomScore = 0;
    if (game.top_points && game.top_points.length > 0) {
      topScore = game.top_points.reduce((a: number, b: number) => a + b, 0);
    }
    if (game.bottom_points && game.bottom_points.length > 0) {
      bottomScore = game.bottom_points.reduce(
        (a: number, b: number) => a + b,
        0,
      );
    }

    // 試合結果を判定
    let result = "next"; // デフォルト：予定
    if (game.status !== null && game.status !== 0) {
      if (game.status === 1) result = "win";
      else if (game.status === 2) result = "lose";
      else if (game.status === 3) result = "draw";
      else result = "other";
    }

    // 自分たちのスコアと相手のスコアを判定（先攻・後攻による）
    let myScore = game.is_batting_first ? topScore : bottomScore;
    let opponentScore = game.is_batting_first ? bottomScore : topScore;

    return {
      id: game.id,
      date,
      month,
      year,
      opponent: game.vsteams?.name || "未定",
      result,
      score: `${myScore} - ${opponentScore}`,
      location: game.grounds?.name,
      leagueName: game.leagues?.name || "",
      startDatetime: game.start_datetime,
      status: game.status,
      gameComment: game.game_comment,
    };
  });
}

export async function fetchAvailableYears(teamId: string) {
  const supabase = await createClient();

  // チームの全ての試合を取得（年度のみ）
  const { data: games, error } = await supabase
    .from("games")
    .select("start_datetime")
    .eq("team_id", teamId)
    .order("start_datetime", { ascending: false });

  if (error || !games || games.length === 0) {
    return [new Date().getFullYear()];
  }

  // 年度を抽出してユニークな配列にする
  const years = games.map((game) =>
    new Date(game.start_datetime).getFullYear(),
  );
  const uniqueYears = [...new Set(years)].sort((a, b) => b - a);

  return uniqueYears;
}
