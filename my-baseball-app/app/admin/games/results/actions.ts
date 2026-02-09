"use server";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type BattingResultsType =
  Database["public"]["Tables"]["batting_results"][`Insert`];
type BattingResultDetails =
  Database["public"]["Tables"]["batting_result_details"][`Insert`];
interface BattingResults extends Omit<BattingResultsType, "positions"> {
  batting_result_details: BattingResultDetails[];
}
type PitchingResultsType =
  Database["public"]["Tables"]["pitching_results"][`Insert`];

// 新規・更新
export async function saveGame(formData: FormData) {
  // ログイン者のチームIDを取得
  const supabase = await createClient();
  const { data: myTeamId, error: rpcError } =
    await supabase.rpc("get_my_team_id");
  if (rpcError || !myTeamId) {
    console.error("チームIDの取得に失敗しました:", rpcError);
    return;
  }

  const gameId = formData.get("id");
  const status = formData.get("status");
  // フォームデータの抽出
  const gameData = {
    status: (status ? Number(status) : null) as number | null,
    game_comment: formData.get("game_comment") as string,
    is_batting_first: (formData.get("is_batting_first") === "on") as boolean,
    top_points: formData
      .getAll("top_points")
      .map((point) => (point ? Number(point) : 0)) as number[],
    bottom_points: formData
      .getAll("bottom_points")
      .map((point) => (point ? Number(point) : 0)) as number[],
    innings: formData
      .getAll("innings")
      .map((inning) => Number(inning)) as number[],
  };

  // 試合データの更新
  const { error } = await supabase
    .from("games")
    .update(gameData)
    .eq("team_id", myTeamId)
    .eq("id", gameId);

  if (error) {
    console.error("Error creating game:", error.message);
    // 実際はここでエラーを呼び出し元に返して表示させるのが理想ですが、
    // まずは最小実装で進めます
    return;
  }

  // 打席結果の生成
  const playerIds = formData.getAll("player_uuid");
  const battingResut: BattingResults[] = playerIds
    .map((id, battingIdx) => {
      const playerId = formData.get(`player_id[${id}]`);
      const run = formData.get(`run[${id}]`);
      const steal = formData.get(`steal[${id}]`);
      const stealMiss = formData.get(`steal_miss[${id}]`);
      const dfError = formData.get(`df_error[${id}]`);
      return {
        team_id: myTeamId as string,
        game_id: gameId as string,
        player_id: playerId as string,
        batting_index: Number(battingIdx) as number,
        batting_order: Number(formData.get(`batting_order[${id}]`)) as number,
        pisitions: formData
          .getAll(`positions[${id}]`)
          .filter((position) => position)
          .map((position) => Number(position)) as number[],
        run: (run ? Number(run) : 0) as number,
        steal: (steal ? Number(steal) : 0) as number,
        steal_miss: (stealMiss ? Number(stealMiss) : 0) as number,
        df_error: (dfError ? Number(dfError) : 0) as number,
        batting_result_details: formData
          .getAll("innings")
          .map((inning, detailIdx) => {
            const atBatResultNo = formData.getAll(`at_bat_result_no[${id}]`)[
              detailIdx
            ];
            const directionNo = formData.getAll(`direction_no[${id}]`)[
              detailIdx
            ];
            const rbi = formData.getAll(`rbi[${id}]`)[detailIdx];
            return {
              inning: Number(inning) as number,
              inning_index: detailIdx as number,
              at_bat_result_no: (atBatResultNo
                ? Number(atBatResultNo)
                : null) as number | null,
              direction_no: (atBatResultNo && directionNo !== ""
                ? Number(directionNo)
                : null) as number | null,
              rbi: (atBatResultNo && rbi !== "" ? Number(rbi) : null) as
                | number
                | null,
            };
          })
          .filter(
            (inning, detailIdx) =>
              formData.getAll(`at_bat_result_no[${id}]`)[detailIdx],
          ) as any[],
      };
    })
    .filter((player) => player.player_id !== null && player.player_id !== "");

  // 投球結果の生成
  const pitcherIds = formData.getAll("pitcher_uuid");
  const pitchingResut: PitchingResultsType[] = pitcherIds
    .filter((id) => formData.get(`pitcher_id[${id}]`))
    .map((id, idx) => {
      const playerId = formData.get(`pitcher_id[${id}]`);
      const innings = formData.get(`pitcher_innings[${id}]`);
      const outs = formData.get(`pitcher_outs[${id}]`);
      const runs = formData.get(`pitcher_runs[${id}]`);
      const strikeout = formData.get(`pitcher_strikeout[${id}]`);
      const walks = formData.get(`pitcher_walks[${id}]`);
      const hbp = formData.get(`pitcher_hbp[${id}]`);
      const hits = formData.get(`pitcher_hits[${id}]`);
      const homeruns = formData.get(`pitcher_homeruns[${id}]`);
      return {
        team_id: myTeamId as string,
        game_id: gameId as string,
        player_id: playerId as string,
        pitching_order: idx + 1,
        innings: (innings ? Number(innings) : 0) as number,
        outs: (outs ? Number(outs) : 0) as number,
        runs: (runs ? Number(runs) : 0) as number,
        strikeout: (strikeout ? Number(runs) : 0) as number,
        walks: (walks ? Number(walks) : 0) as number,
        hbp: (hbp ? Number(hbp) : 0) as number,
        hits: (hits ? Number(hits) : 0) as number,
        homeruns: (homeruns ? Number(homeruns) : 0) as number,
        is_win_lose: (formData.get("pitcher_win_lose") === id) as boolean,
        is_hold: (formData.get(`pitcher_hold[${id}]`) === "on") as boolean,
        is_save: (formData.get("pitcher_save") === id) as boolean,
      };
    });
  const { error: upsertError } = await supabase.rpc("upsert_game_result", {
    p_team_id: myTeamId,
    p_game_id: gameId,
    p_batting_result: battingResut,
    p_pitching_result: pitchingResut,
  });
  if (upsertError) {
    console.error("登録処理に失敗しました:", upsertError);
    return;
  }

  const { error: refreshError } = await supabase.rpc(
    "refresh_all_materialized_views",
  );
  if (refreshError) {
    console.error("成績ビュー更新に失敗しました:", refreshError);
  }

  // 一覧画面のデータを最新の状態に更新（キャッシュクリア）
  revalidatePath("/admin/games/results/");

  // 一覧画面へリダイレクト
  redirect("/admin/games/results/");
}

// 削除
export async function deleteGame(formData: FormData) {
  const supabase = await createClient();
  const { data: myTeamId, error: rpcError } =
    await supabase.rpc("get_my_team_id");

  await supabase
    .from("games")
    .delete()
    .eq("team_id", myTeamId)
    .eq("id", formData.get("id"));

  revalidatePath("/admin/games");
}
