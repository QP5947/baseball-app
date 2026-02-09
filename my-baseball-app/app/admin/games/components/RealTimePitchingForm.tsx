"use client";
import { Database } from "@/types/supabase";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  savePitchingResultAction,
  saveGameInningPointAction,
} from "../scoring/[id]/actions";
import RealTimePitchingMenuForm from "./RealTimePitchingMenuForm";
import RealTimeScoringFooter from "./RealTimeScoringFooter";
import RealTimeScoringHeader from "./RealTimeScoringHeader";
import { changeTopBottomAction, endGameAction } from "../scoring/[id]/actions";

/**
 * リアルタイムスコア入力（投球）
 *
 * @param param0
 * @returns
 */
export default function RealTimePitchingForm({
  gameData,
  pitchingResult,
  battingResultData,
  playerData,
  inning,
  isTop,
  getPlayerNameByPlayerId,
  onSaved,
}: {
  gameData: Database["public"]["Tables"]["games"]["Row"];
  pitchingResult: Database["public"]["Tables"]["pitching_results"]["Row"][];
  battingResultData: Database["public"]["Tables"]["batting_results"]["Row"][];
  playerData: any[];
  inning: number;
  isTop: boolean;
  getPlayerNameByPlayerId: (playerId: string) => string;
  onSaved: () => void;
}) {
  // メニュー管理
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 現在の投手
  const currentPitcherIndex = pitchingResult.length - 1 || 0;

  // 表示中の投手
  const [displayPitcherIndex, setDisplayPitcherIndex] = useState(
    pitchingResult.length - 1 || 0,
  );

  // ローカルに保持する投手成績（背景保存後に反映するため）
  const [localPitchingResults, setLocalPitchingResults] =
    useState(pitchingResult);
  // props 更新時はローカルを上書き
  useEffect(() => setLocalPitchingResults(pitchingResult), [pitchingResult]);
  // イニング得点の管理
  const [inningScore, setInningScore] = useState(
    !gameData.is_batting_first
      ? gameData.top_points?.[inning - 1] || 0
      : gameData.bottom_points?.[inning - 1] || 0,
  );

  // 投手項目の管理
  const [pitchingStats, setPitchingStats] = useState({
    innings: pitchingResult[currentPitcherIndex]?.innings || 0,
    outs: pitchingResult[currentPitcherIndex]?.outs || 0,
    runs: pitchingResult[currentPitcherIndex]?.runs || 0,
    walks: pitchingResult[currentPitcherIndex]?.walks || 0,
    hbp: pitchingResult[currentPitcherIndex]?.hbp || 0,
    hits: pitchingResult[currentPitcherIndex]?.hits || 0,
    homeruns: pitchingResult[currentPitcherIndex]?.homeruns || 0,
    strikeout: pitchingResult[currentPitcherIndex]?.strikeout || 0,
  });

  // displayPitcherIndex または localPitchingResults が変わったら pitchingStats を更新
  useEffect(() => {
    const row = localPitchingResults[displayPitcherIndex];
    setPitchingStats({
      innings: row?.innings || 0,
      outs: row?.outs || 0,
      runs: row?.runs || 0,
      walks: row?.walks || 0,
      hbp: row?.hbp || 0,
      hits: row?.hits || 0,
      homeruns: row?.homeruns || 0,
      strikeout: row?.strikeout || 0,
    });
  }, [displayPitcherIndex, localPitchingResults]);
  // 保存中フラグ
  const [isSaving, setIsSaving] = useState(false);

  // 投手成績の保存
  // background=true の場合は UI ブロック（isSaving）を行わずに非同期で保存する（moveOrder 用）
  const handleSubmit = async (background: boolean = false) => {
    if (!background && isSaving) return;
    if (!background) setIsSaving(true);

    try {
      // 試合得点の保存
      await saveGameInningPointAction(
        gameData,
        gameData.innings || [],
        inningScore,
      );

      // 投手成績の保存（更新行を受け取ってローカルに反映）
      const updatedRow = await savePitchingResultAction(
        gameData,
        localPitchingResults[displayPitcherIndex].pitching_order,
        pitchingStats,
      );

      if (updatedRow) {
        setLocalPitchingResults((prev) =>
          prev.map((r) =>
            r.pitching_order === updatedRow.pitching_order ? updatedRow : r,
          ),
        );
      }
    } catch (e) {
      if (background) {
        console.error("自動保存に失敗しました。", e);
      } else {
        alert("保存に失敗しました。");
      }
    } finally {
      if (!background) setIsSaving(false);
    }
  };

  // 投手送り
  const moveOrder = async (delta: number) => {
    // 成績の保存をバックグラウンドで始める（UI はブロックしない）
    handleSubmit(true).catch((e) => {
      // 自動保存失敗はログ出力に留める
      console.error("自動保存に失敗しました。", e);
    });

    // 投手の表示変更（即時）
    const newIndex = displayPitcherIndex + delta;
    setDisplayPitcherIndex(newIndex);

    setPitchingStats({
      innings: pitchingResult[newIndex]?.innings || 0,
      outs: pitchingResult[newIndex]?.outs || 0,
      runs: pitchingResult[newIndex]?.runs || 0,
      walks: pitchingResult[newIndex]?.walks || 0,
      hbp: pitchingResult[newIndex]?.hbp || 0,
      hits: pitchingResult[newIndex]?.hits || 0,
      homeruns: pitchingResult[newIndex]?.homeruns || 0,
      strikeout: pitchingResult[newIndex]?.strikeout || 0,
    });
  };

  // 攻守交替アクション
  const changeToBattingAction = async () => {
    await changeTopBottomAction({
      gameData,
      innings: gameData.innings || [],
      inningPoints: inningScore,
      pitchingStats: pitchingStats,
      pitchingOrder:
        localPitchingResults[displayPitcherIndex]?.pitching_order || 0,
    });
    onSaved();
  };

  const onEndGame = async () => {
    const res = await endGameAction(
      gameData,
      gameData.innings || [],
      inningScore,
      undefined,
      pitchingStats,
      localPitchingResults[displayPitcherIndex]?.pitching_order,
    );
    return res;
  };

  // 投手成績項目
  const PITCHING_ITEM = [
    {
      label: "イニング",
      value: "innings",
    },
    {
      label: "アウト",
      value: "outs",
    },
    {
      label: "失点",
      value: "runs",
    },
    {
      label: "四球",
      value: "walks",
    },
    {
      label: "死球",
      value: "hbp",
    },
    {
      label: "被安打",
      value: "hits",
    },
    {
      label: "被本塁打",
      value: "homeruns",
    },
    {
      label: "奪三振",
      value: "strikeout",
    },
  ];

  return (
    <>
      <RealTimeScoringHeader
        inning={inning}
        isTop={isTop}
        topPoints={gameData.top_points}
        bottomPoints={gameData.bottom_points}
        inningScore={inningScore}
        setInningScore={setInningScore}
      />
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col p-4 gap-6 mb-20">
        <section className="bg-slate-100 rounded-[2.5rem] border-2 border-slate-300 p-6 shadow-2xl relative overflow-hidden mb-5">
          {/* 投手切り替えナビゲーション */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => moveOrder(-1)}
              disabled={displayPitcherIndex === 0 || isSaving}
              className={`w-10 h-10 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center ${
                displayPitcherIndex === 0 || isSaving
                  ? "bg-slate-200 border-slate-400 text-slate-400"
                  : "bg-white border-slate-700 text-slate-700 cursor-pointer"
              }`}
            >
              ◀
            </button>
            <div className="p-4 text-center">
              <span className="text-slate-500 font-bold mr-3">
                {localPitchingResults[displayPitcherIndex]?.pitching_order || 1}{" "}
                番手
              </span>

              <div className="flex justify-between items-end">
                <h3 className="text-2xl font-black text-slate-800 whitespace-nowrap">
                  {getPlayerNameByPlayerId(
                    localPitchingResults[displayPitcherIndex]?.player_id || "",
                  )}
                </h3>
              </div>
            </div>
            <button
              onClick={() => moveOrder(1)}
              disabled={
                displayPitcherIndex === pitchingResult.length - 1 || isSaving
              }
              className={`w-10 h-10 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center ${
                displayPitcherIndex === pitchingResult.length - 1 || isSaving
                  ? "bg-slate-200 border-slate-400 text-slate-400"
                  : "bg-white border-slate-700 text-slate-700 cursor-pointer"
              }`}
            >
              ▶
            </button>
          </div>

          {/* 選手交代ボタンを打者のすぐ下に配置 */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="w-full mb-6 py-3 bg-blue-50 border-2 border-blue-800 rounded-xl font-black text-blue-800 uppercase tracking-[0.2em] cursor-pointer"
          >
            投手・守備交代 ☰
          </button>

          {PITCHING_ITEM.map((item) => (
            <div
              key={item.value}
              className="bg-white p-2 rounded-2xl border-2 border-slate-800 mb-3"
            >
              <p className="text-slate-900 font-bold text-center">
                {item.label}
              </p>
              <div className="flex justify-center gap-6">
                <button
                  className={`w-10 h-10 rounded-lg font-black text-xl border border-slate-300 ${pitchingStats[item.value as keyof typeof pitchingStats] === 0 ? "bg-slate-200" : "bg-slate-50 cursor-pointer"}`}
                  disabled={
                    pitchingStats[item.value as keyof typeof pitchingStats] ===
                    0
                  }
                  onClick={() => {
                    setPitchingStats((prev) => ({
                      ...prev,
                      [item.value]: Math.max(
                        0,
                        prev[item.value as keyof typeof prev] - 1,
                      ),
                    }));
                    if (item.value === "runs") {
                      setInningScore(Math.max(0, inningScore - 1));
                    }
                  }}
                >
                  -
                </button>
                <span className="text-3xl font-black italic">
                  {pitchingStats[item.value as keyof typeof pitchingStats]}
                </span>
                <button
                  className="w-10 h-10 bg-blue-700 text-white rounded-lg font-black text-xl cursor-pointer"
                  onClick={() => {
                    setPitchingStats((prev) => ({
                      ...prev,
                      [item.value]: prev[item.value as keyof typeof prev] + 1,
                    }));
                    if (item.value === "runs") {
                      setInningScore(inningScore + 1);
                    }
                  }}
                >
                  +
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => handleSubmit()}
            disabled={isSaving}
            className={`w-full py-5 mt-10 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
              !isSaving
                ? "bg-blue-600 text-white shadow-blue-900/20 cursor-pointer"
                : "bg-blue-200 text-white cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" />
                保存中...
              </>
            ) : (
              "保存"
            )}
          </button>
        </section>

        {/* 選手交代メニュー */}
        {isMenuOpen && (
          <RealTimePitchingMenuForm
            gameData={gameData}
            playerData={playerData}
            pitchingResultData={pitchingResult}
            displayPitcherIndex={displayPitcherIndex}
            battingResultData={battingResultData}
            inningPoints={inningScore}
            pitchingStats={pitchingStats}
            setIsMenuOpen={setIsMenuOpen}
            getPlayerNameByPlayerId={getPlayerNameByPlayerId}
          />
        )}

        {/* フッター：攻守交代 */}
        <RealTimeScoringFooter
          battingResultNo={""}
          changeTopBottomAction={changeToBattingAction}
          isBatting={false}
          onEndGame={onEndGame}
        />
      </div>
    </>
  );
}
