"use client";

import { Database } from "@/types/supabase";
import { useState } from "react";
import { startGameAction } from "../scoring/[id]/actions";
import BeforeGamePage from "./BeforeGamePage";
import OrderEditorForm from "./OrderEditorForm";
import RealTimeBattingForm from "./RealTimeBattingForm";
import RealTimePitchingForm from "./RealTimePitchingForm";
// 型定義
type GameRow = Database["public"]["Tables"]["games"]["Row"] & {
  leagues: { name: string; id: string };
  grounds: { name: string; id: string };
  vsteams: { name: string; id: string };
};
type PlayerRow = Pick<
  Database["public"]["Tables"]["players"]["Row"],
  "id" | "no" | "name" | "batting_hand" | "throw_hand"
>;

/**
 * リアルタイムスコア入力
 *
 * @param param0
 * @returns
 */
export default function RealTimeScoringPage({
  gameData,
  battingResult,
  battingResultDetail,
  pitchingResult,
  playerData,
  masters,
}: {
  gameData: GameRow;
  battingResult: Database["public"]["Tables"]["batting_results"]["Row"][];
  battingResultDetail: Database["public"]["Tables"]["batting_result_details"]["Row"][];
  pitchingResult: Database["public"]["Tables"]["pitching_results"]["Row"][];
  playerData: PlayerRow[];
  masters: {
    leagues: { id: string; name: string }[] | null;
    grounds: { id: string; name: string }[] | null;
    vsteams: { id: string; name: string }[] | null;
    atBatResult: { no: number; short_name: string }[] | null;
  };
}) {
  //表示モード管理
  const [mode, setMode] = useState<
    "lineup" | "beforeGame" | "offense" | "defense"
  >(
    gameData.status === null
      ? battingResult && battingResult.length > 0
        ? "beforeGame"
        : "lineup"
      : gameData.is_batting_first === gameData.now_is_top
        ? "offense"
        : "defense",
  );

  // イニング数
  const [inning, setInning] = useState(gameData.now_inning || 1);

  // 表・裏
  const [isTop, setIsTop] = useState<boolean>(gameData.now_is_top === true);

  // 試合開始処理
  const handleStartGame = async (isTop: boolean) => {
    await startGameAction(gameData.id, isTop);
    setMode(isTop ? "offense" : "defense");
  };

  // 攻撃終了
  const handleEndOffense = () => {
    setMode("defense");
    setIsTop((prev) => !prev);
    setInning((prev) => (isTop === false ? prev + 1 : prev));
  };

  // 守備終了
  const handleEndDefense = () => {
    setMode("offense");
    setIsTop((prev) => !prev);
    setInning((prev) => (isTop === false ? prev + 1 : prev));
  };

  // 選手IDから選手名を取得
  function getPlayerNameByPlayerId(playerId: string) {
    if (playerId === "HELPER") {
      return "助っ人";
    }

    const player = playerData.find((o) => o.id === playerId);
    return player ? player.name : "登録なし";
  }

  return (
    <>
      {mode === "lineup" && (
        <OrderEditorForm
          gameData={gameData}
          battingResult={battingResult}
          playerData={playerData}
          masters={masters}
          onSaved={() => setMode("beforeGame")}
        />
      )}
      {mode === "beforeGame" && (
        <BeforeGamePage
          battingResult={battingResult}
          playerData={playerData}
          onStartGame={handleStartGame}
          onBackToOrder={() => setMode("lineup")}
        />
      )}
      {mode === "offense" && (
        <RealTimeBattingForm
          gameData={gameData}
          battingResultData={battingResult}
          battingResultDetailData={battingResultDetail}
          playerData={playerData}
          atBatResult={masters.atBatResult || []}
          inning={inning}
          isTop={isTop}
          getPlayerNameByPlayerId={getPlayerNameByPlayerId}
          onSaved={() => {
            handleEndOffense();
          }}
        />
      )}
      {mode === "defense" && (
        <RealTimePitchingForm
          gameData={gameData}
          pitchingResult={pitchingResult}
          battingResultData={battingResult}
          playerData={playerData}
          inning={inning}
          isTop={isTop}
          getPlayerNameByPlayerId={getPlayerNameByPlayerId}
          onSaved={() => {
            handleEndDefense();
          }}
        />
      )}
    </>
  );
}
