"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/supabase";
import { Menu } from "lucide-react";
import { revalidatePath } from "next/cache";

/**
 * 直近の試合のオーダーを取得して返すアクション
 *
 * @param currentGameId
 * @returns
 */
export async function getPreviousOrderAction(currentGameId: string) {
  const supabase = await createClient();

  // 「今の試合」の日時を取得する
  const { data: currentGame } = await supabase
    .from("games")
    .select("start_datetime")
    .eq("id", currentGameId)
    .single();

  if (!currentGame) return { error: "現在の試合が見つかりません" };

  // 「今の試合より前」で「最も新しい」試合を取得する
  const { data: previousResultData, error } = await supabase
    .from("games")
    .select(
      `
      id,
      start_datetime,
      batting_results (
        player_id,
        batting_index,
        batting_order,
        positions
      )
    `,
    )
    .lt("start_datetime", currentGame.start_datetime)
    .in("status", [0, 1, 2, 3])
    .order("start_datetime", { ascending: false })
    .order("batting_index", {
      referencedTable: "batting_results",
      ascending: true,
    })
    .limit(1)
    .single();

  if (error || !previousResultData) {
    return { error: "コピーできる過去の試合データが見つかりませんでした" };
  }

  let previousOrder = 0;
  let isStarting = true;
  const previousStarting = previousResultData.batting_results.filter(
    (result) => {
      isStarting = result.batting_order !== previousOrder;
      previousOrder = result.batting_order;
      return isStarting;
    },
  );

  return {
    success: true,
    order: previousStarting,
  };
}

/**
 * 試合オーダー保存アクション
 *
 * @param gameId
 * @param gameUpdateData
 * @param orderData
 * @returns
 */
export async function saveGameOrderAction(
  gameId: string,
  gameUpdateData: any,
  orderData: any[],
) {
  const supabase = await createClient();

  const { data: myTeamId, error: rpcError } =
    await supabase.rpc("get_my_team_id");

  // 試合情報の更新
  const { error: gameError } = await supabase
    .from("games")
    .update({
      vsteam_id: gameUpdateData.vsteam_id,
      ground_id: gameUpdateData.ground_id,
      league_id: gameUpdateData.league_id,
      start_datetime: gameUpdateData.start_datetime,
    })
    .eq("team_id", myTeamId)
    .eq("id", gameId);

  if (gameError) throw new Error(gameError.message);

  // オーダーの更新
  const { error: orderDeleteError } = await supabase
    .from("batting_results")
    .delete()
    .eq("team_id", myTeamId)
    .eq("game_id", gameId);

  if (orderDeleteError) throw new Error(orderDeleteError.message);

  const inserts = orderData.map((slot, index) => ({
    team_id: myTeamId,
    game_id: gameId,
    player_id: slot.playerId,
    batting_index: index,
    batting_order: index + 1,
    positions: [Number(slot.position)],
  }));
  const { error: orderError } = await supabase
    .from("batting_results")
    .insert(inserts);

  if (orderError) throw new Error(orderError.message);

  // 投手成績の更新
  const pitcher = orderData.find((order) => order.position === 1);
  if (pitcher) {
    const { error: pitcherError } = await supabase
      .from("pitching_results")
      .upsert({
        team_id: myTeamId,
        game_id: gameId,
        player_id: pitcher.playerId,
        pitching_order: 1,
      });
    if (pitcherError) throw new Error(pitcherError.message);
  }

  revalidatePath(`/admin/games/scoring/${gameId}`);

  return { success: true };
}

/**
 * 試合開始アクション
 *
 * @param gameId
 * @param isTop
 * @returns
 */
export async function startGameAction(gameId: string, isTop: boolean) {
  const supabase = await createClient();
  const { data: myTeamId, error: rpcError } =
    await supabase.rpc("get_my_team_id");

  // 試合情報を更新
  const { error } = await supabase
    .from("games")
    .update({
      status: 0,
      is_batting_first: isTop,
      top_points: [0],
      innings: [1],
      now_is_top: true,
      now_inning: 1,
    })
    .eq("team_id", myTeamId)
    .eq("id", gameId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/games/scoring/${gameId}`);
  return { success: true };
}

/**
 * 打席結果保存アクション
 *
 * @param gameId
 * @param gameUpdateData
 * @param orderData
 * @returns
 */
export async function saveBattingResultDetailAction(
  gameData: Database["public"]["Tables"]["games"]["Row"],
  battingResultDetailData: Database["public"]["Tables"]["batting_result_details"]["Row"][],
  inningPoints: number,
  runners: any[],
  battingResultData: any,
) {
  const supabase = await createClient();

  // 試合情報のinning_indexの拡張
  let innings = gameData.innings;
  if (
    battingResultDetailData[battingResultDetailData.length - 1]
      ?.inning_index === battingResultData.inning_index
  ) {
    innings = [...(gameData.innings || []), battingResultData.inning];
  }

  // 試合得点の更新
  await saveGameInningPointAction(gameData, innings || [], inningPoints);

  // 走者データの更新
  await saveRunnerResultAction(gameData, runners);

  // 打席結果詳細の更新
  const { error: resultDetailError } = await supabase
    .from("batting_result_details")
    .upsert({
      team_id: gameData.team_id,
      game_id: gameData.id,
      ...battingResultData,
    });

  if (resultDetailError) throw new Error(resultDetailError.message);

  revalidatePath(`/admin/games/scoring/${gameData.id}`);

  return { success: true };
}

/**
 * 打者メニューアクション
 *
 * @param gameId
 * @param gameUpdateData
 * @param orderData
 * @returns
 */
export async function battingMenuAction(
  gameData: Database["public"]["Tables"]["games"]["Row"],
  menuMode: string,
  battingIndex: number,
  battingOrder: number,
  inningIndex: number,
  inningPoints: number,
  inning: number,
  selectedPlayerId: string,
  selectedRunner: any,
  runners: any[],
) {
  const supabase = await createClient();

  // 試合得点の更新
  await saveGameInningPointAction(
    gameData,
    gameData.innings || [] || [],
    inningPoints,
  );

  // 走者データの更新
  await saveRunnerResultAction(gameData, runners);

  // 代打・代走・打者追加
  if (
    menuMode === "pinchHitter" ||
    menuMode === "pinchRunner" ||
    menuMode === "addOrder"
  ) {
    let addBattingIndex = battingIndex;
    let addBattingOrder = battingOrder;
    let newPosition = null;
    if (menuMode === "pinchHitter") {
      addBattingIndex = battingIndex + 1;
      newPosition = 11;
    } else if (menuMode === "pinchRunner") {
      addBattingIndex = selectedRunner.batting_index + 1;
      addBattingOrder = selectedRunner.batting_order;
      newPosition = 12;
    }

    // 打席indexのシフト+追加
    await updateBattingIndexAction(
      gameData,
      menuMode,
      addBattingIndex,
      addBattingOrder,
      selectedPlayerId,
      newPosition,
    );
  }

  // 打順を飛ばす
  else if (menuMode === "skipOrder") {
    // 打席結果詳細の更新
    const { error: resultDetailError } = await supabase
      .from("batting_result_details")
      .upsert({
        team_id: gameData.team_id,
        game_id: gameData.id,
        player_id: selectedPlayerId,
        batting_index: battingIndex,
        inning_index: inningIndex,
        inning: inning,
      });

    if (resultDetailError) throw new Error(resultDetailError.message);
  }

  // 打者入れ替え
  else if (menuMode === "changeBatter") {
    // 打席結果詳細の更新
    const { error: resultDetailError } = await supabase
      .from("batting_result_details")
      .update({
        player_id: selectedPlayerId,
      })
      .eq("team_id", gameData.team_id)
      .eq("game_id", gameData.id)
      .eq("batting_index", battingIndex)
      .eq("inning_index", inningIndex);

    if (resultDetailError) throw new Error(resultDetailError.message);

    // 打席結果の更新
    const { error: resultError } = await supabase
      .from("batting_results")
      .update({
        player_id: selectedPlayerId,
      })
      .eq("team_id", gameData.team_id)
      .eq("game_id", gameData.id)
      .eq("batting_index", battingIndex);

    if (resultError) throw new Error(resultError.message);
  } else {
    throw new Error("不明なメニュー操作です:" + menuMode);
  }

  revalidatePath(`/admin/games/scoring/${gameData.id}`);

  return { success: true };
}

/**
 * 打順indexをシフトするアクション
 *
 * @param gameData
 * @param menuMode
 * @param addBattingIndex
 * @param addBattingOrder
 * @param selectedPlayerId
 */
export async function updateBattingIndexAction(
  gameData: Database["public"]["Tables"]["games"]["Row"],
  menuMode: string,
  addBattingIndex: number,
  addBattingOrder: number,
  selectedPlayerId: string,
  newPosition: number | null,
) {
  const supabase = await createClient();

  // 1. シフト対象のデータを取得（降順）
  const { data: shiftTargets, error: fetchError } = await supabase
    .from("batting_results")
    .select("*")
    .eq("team_id", gameData.team_id)
    .eq("game_id", gameData.id)
    .gte("batting_index", addBattingIndex)
    .order("batting_index", { ascending: false });
  if (fetchError) throw new Error(fetchError.message);

  // 2. データを後ろにずらす (PK衝突回避のため降順で更新)
  for (const row of shiftTargets) {
    let updateColmun = {
      batting_index: row.batting_index + 1,
      batting_order: row.batting_order,
    };
    // 「打順を追加」の時は打順もずらす
    if (menuMode === "addOrder") {
      updateColmun = {
        batting_index: row.batting_index + 1,
        batting_order: row.batting_order + 1,
      };
    }

    await supabase
      .from("batting_results")
      .update(updateColmun)
      .eq("team_id", gameData.team_id)
      .eq("game_id", gameData.id)
      .eq("batting_index", row.batting_index);
  }

  // 3. 新しいデータを挿入
  const { error: insertError } = await supabase.from("batting_results").insert({
    team_id: gameData.team_id,
    game_id: gameData.id,
    player_id: selectedPlayerId,
    batting_index: addBattingIndex,
    batting_order: addBattingOrder,
    positions: newPosition ? [newPosition] : [],
  });

  if (insertError) throw new Error(insertError.message);
}

/**
 * 試合得点の更新
 *
 * @param gameData
 * @param innings
 * @param inningPoints
 * @returns
 */
export async function saveGameInningPointAction(
  gameData: Database["public"]["Tables"]["games"]["Row"],
  innings: number[],
  inningPoints: number,
) {
  const supabase = await createClient();

  // 試合得点
  const inning = gameData.now_inning || 1;
  let topPoints = gameData.top_points || [];
  let bottomPoints = gameData.bottom_points || [];
  if (gameData.now_is_top) {
    topPoints[inning - 1] = inningPoints;
  } else {
    bottomPoints[inning - 1] = inningPoints;
  }

  // 試合情報の更新
  const { error: gameError } = await supabase
    .from("games")
    .update({
      innings: innings,
      top_points: topPoints,
      bottom_points: bottomPoints,
    })
    .eq("team_id", gameData.team_id)
    .eq("id", gameData.id);

  if (gameError) throw new Error(gameError.message);

  return { success: true };
}

/**
 * 走者記録の保存アクション
 *
 * @param gameId
 * @param gameUpdateData
 * @param orderData
 * @returns
 */
export async function saveRunnerResultAction(
  gameData: Database["public"]["Tables"]["games"]["Row"],
  runners: any[],
) {
  // 走者記録の更新
  const supabase = await createClient();
  await Promise.all(
    runners.map(async (runner) => {
      const { error: resultError } = await supabase
        .from("batting_results")
        .upsert({
          team_id: gameData.team_id,
          game_id: gameData.id,
          ...runner,
        });
      if (resultError) throw new Error(resultError.message);
    }),
  );

  return { success: true };
}

/**
 * 投手メニューアクション
 *
 * @param gameData
 * @param menuMode
 * @param inningPoints
 * @param addBattingIndex
 * @param addBattingOrder
 * @param selectedPlayerId
 * @param pitchingOrder
 * @param pitchingStats
 * @returns
 */
export async function pitchingMenuAction(
  gameData: Database["public"]["Tables"]["games"]["Row"],
  menuMode: string,
  inningPoints: number,
  selectedPlayer: Database["public"]["Tables"]["batting_results"]["Row"],
  toPlayerId: string,
  pitchingOrder: number,
  pitchingStats: any,
  selectedPosition: number,
) {
  // 試合得点の更新
  await saveGameInningPointAction(
    gameData,
    gameData.innings || [],
    inningPoints,
  );

  // 投手成績の更新
  await savePitchingResultAction(gameData, pitchingOrder, pitchingStats);

  const supabase = await createClient();

  // 守備位置変更
  if (menuMode === "changeDefence") {
    if (selectedPosition && selectedPlayer) {
      // 現在の positions を取得
      const { data: currentPlayer } = await supabase
        .from("batting_results")
        .select("positions")
        .eq("team_id", gameData.team_id)
        .eq("game_id", gameData.id)
        .eq("batting_index", selectedPlayer.batting_index)
        .single();

      if (currentPlayer) {
        // ポジションを追加
        const newPositions = [
          ...(currentPlayer.positions || []),
          selectedPosition,
        ];
        const { error: updateError } = await supabase
          .from("batting_results")
          .update({ positions: newPositions })
          .eq("team_id", gameData.team_id)
          .eq("game_id", gameData.id)
          .eq("batting_index", selectedPlayer.batting_index);
        if (updateError) throw new Error(updateError.message);

        // 投手交代の場合は投手成績を登録
        if (selectedPosition === 1) {
          await updatePitchingOrderAction(
            gameData,
            pitchingOrder + 1,
            toPlayerId,
          );
        }
      }
    }
  }
  // 守備選手交代
  else if (menuMode === "switchPlayer") {
    // 打席結果の選手交代
    if (selectedPlayer) {
      await updateBattingIndexAction(
        gameData,
        menuMode,
        selectedPlayer.batting_index + 1,
        selectedPlayer.batting_order,
        toPlayerId,
        selectedPosition || null,
      );
    }

    // 投手交代の場合は投手成績を登録
    if (selectedPosition === 1) {
      await updatePitchingOrderAction(gameData, pitchingOrder + 1, toPlayerId);
    }
  }

  // 投手交代
  else if (menuMode === "switchPitcher") {
    // 打席結果の選手交代
    if (selectedPlayer) {
      await updateBattingIndexAction(
        gameData,
        menuMode,
        selectedPlayer.batting_index + 1,
        selectedPlayer.batting_order,
        toPlayerId,
        1,
      );
    }

    // 投手成績の登録
    await updatePitchingOrderAction(gameData, pitchingOrder + 1, toPlayerId);
  }

  // 投手差し替え
  else if (menuMode === "changePitcher") {
    const { error: resultError } = await supabase
      .from("pitching_results")
      .update({
        player_id: toPlayerId,
      })
      .eq("team_id", gameData.team_id)
      .eq("game_id", gameData.id)
      .eq("pitching_order", pitchingOrder);
    if (resultError) throw new Error(resultError.message);
  } else {
    throw new Error("不明なメニュー操作です:" + menuMode);
  }

  return { success: true };
}

/**
 * 指定した投球順の箇所に投手を登録する
 *
 * @param gameData
 * @param startOrder
 * @param selectedPlayerId
 */
export async function updatePitchingOrderAction(
  gameData: Database["public"]["Tables"]["games"]["Row"],
  pitchingOrder: number,
  selectedPlayerId: string,
) {
  const supabase = await createClient();
  // startOrder 以上の投手成績を取得（降順で更新）
  const { data: targets, error: fetchError } = await supabase
    .from("pitching_results")
    .select("pitching_order")
    .eq("team_id", gameData.team_id)
    .eq("game_id", gameData.id)
    .gte("pitching_order", pitchingOrder)
    .order("pitching_order", { ascending: false });

  if (fetchError) throw new Error(fetchError.message);

  for (const row of targets || []) {
    const { error: updateError } = await supabase
      .from("pitching_results")
      .update({ pitching_order: row.pitching_order + 1 })
      .eq("team_id", gameData.team_id)
      .eq("game_id", gameData.id)
      .eq("pitching_order", row.pitching_order);
    if (updateError) throw new Error(updateError.message);
  }

  const { error: resultError } = await supabase
    .from("pitching_results")
    .insert({
      team_id: gameData.team_id,
      game_id: gameData.id,
      player_id: selectedPlayerId,
      pitching_order: pitchingOrder,
    });
  if (resultError) throw new Error(resultError.message);

  return { success: true };
}

/**
 * 投手記録の保存アクション
 *
 * @param gameId
 * @param gameUpdateData
 * @param orderData
 * @returns
 */
export async function savePitchingResultAction(
  gameData: Database["public"]["Tables"]["games"]["Row"],
  pitchingOrder: number,
  pitchingStats: any,
) {
  // 投手記録の更新
  const supabase = await createClient();
  const { error: resultError } = await supabase
    .from("pitching_results")
    .update({
      ...pitchingStats,
    })
    .eq("team_id", gameData.team_id)
    .eq("game_id", gameData.id)
    .eq("pitching_order", pitchingOrder);
  if (resultError) throw new Error(resultError.message);

  // 更新後の行を取得して返す（クライアント側で反映するため）
  const { data: updatedRow, error: fetchError } = await supabase
    .from("pitching_results")
    .select("*")
    .eq("team_id", gameData.team_id)
    .eq("game_id", gameData.id)
    .eq("pitching_order", pitchingOrder)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  return updatedRow;
}

/**
 * 攻守交替アクション
 *
 * @param myTeamId
 * @param gameData
 * @param innings
 * @param inningPoints
 * @param runners
 */
export async function changeTopBottomAction({
  gameData,
  innings,
  inningPoints,
  runners,
  pitchingStats,
  pitchingOrder,
}: {
  gameData: Database["public"]["Tables"]["games"]["Row"];
  innings: any[];
  inningPoints: number;
  runners?: any[];
  pitchingStats?: any;
  pitchingOrder?: number;
}) {
  // 攻撃→守備の場合
  if (
    (gameData.is_batting_first === true && gameData.now_is_top === true) ||
    (gameData.is_batting_first === false && gameData.now_is_top === false)
  ) {
    await saveRunnerResultAction(gameData, runners || []);
  }

  // 守備→攻撃の場合
  else {
    await savePitchingResultAction(gameData, pitchingOrder || 0, pitchingStats);
  }

  // 試合得点の更新
  await saveGameInningPointAction(gameData, innings, inningPoints);

  // 裏→表の場合イニングを進める
  let updateInning = gameData.now_inning || 1;
  let updateInnings = gameData.innings || [1];
  if (!gameData.now_is_top) {
    updateInning++;
    updateInnings.push(updateInning);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("games")
    .update({
      now_is_top: !gameData.now_is_top,
      now_inning: updateInning,
      innings: updateInnings,
    })
    .eq("team_id", gameData.team_id)
    .eq("id", gameData.id);
  if (error) throw new Error(error.message);
}

/**
 *試合終了アクション

 * @param gameData
 * @param innings
 * @param inningPoints
 * @param runners
 */
export async function endGameAction(
  gameData: Database["public"]["Tables"]["games"]["Row"],
  innings: any[],
  inningPoints: number,
  runners?: any[],
  pitchingStats?: any,
  pitchingOrder?: number,
) {
  // 攻撃中の場合
  if (
    (gameData.is_batting_first === true && gameData.now_is_top === true) ||
    (gameData.is_batting_first === false && gameData.now_is_top === false)
  ) {
    await saveRunnerResultAction(gameData, runners || []);
  }

  // 守備中の場合
  else {
    await savePitchingResultAction(gameData, pitchingOrder || 0, pitchingStats);
  }

  // 試合得点の更新
  await saveGameInningPointAction(gameData, innings, inningPoints);

  // 勝敗の設定
  let gameStatus = gameData.status;
  if (gameData.is_batting_first) {
    const topPoints = gameData.top_points?.reduce((a, b) => a + b, 0) || 0;
    const bottomPoints =
      gameData.bottom_points?.reduce((a, b) => a + b, 0) || 0;
    if (topPoints > bottomPoints) {
      gameStatus = 1;
    } else if (topPoints < bottomPoints) {
      gameStatus = 2;
    } else {
      gameStatus = 3;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("games")
    .update({
      status: gameStatus,
    })
    .eq("team_id", gameData.team_id)
    .eq("id", gameData.id);
  if (error) throw new Error(error.message);

  // キャッシュ再検証
  revalidatePath(`/admin/games/scoring/${gameData.id}`);

  // 終了処理後に運営画面の結果一覧へ遷移できるようリダイレクトURLを返す
  const redirect = `/admin/games/results/${gameData.id}?year=${new Date().getFullYear()}`;
  return { success: true, redirect };
}
