"use client";
import { Database } from "@/types/supabase";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  changeTopBottomAction,
  endGameAction,
  saveBattingResultDetailAction,
} from "../scoring/[id]/actions";
import RealTimeBattingMenuForm from "./RealTimeBattingMenuForm";
import RealTimeScoringFooter from "./RealTimeScoringFooter";
import RealTimeScoringHeader from "./RealTimeScoringHeader";

// ポジション
const POSITIONS = [
  { value: "1", label: "投" },
  { value: "2", label: "捕" },
  { value: "3", label: "一" },
  { value: "4", label: "二" },
  { value: "5", label: "三" },
  { value: "6", label: "遊" },
  { value: "7", label: "左" },
  { value: "8", label: "中" },
  { value: "9", label: "右" },
];

/**
 * リアルタイムスコア入力（攻撃）
 *
 * @param param0
 * @returns
 */
export default function RealTimeBattingForm({
  gameData,
  battingResultData,
  battingResultDetailData,
  playerData,
  atBatResult,
  inning,
  isTop,
  getPlayerNameByPlayerId,
  onSaved,
}: {
  gameData: Database["public"]["Tables"]["games"]["Row"];
  battingResultData: Database["public"]["Tables"]["batting_results"]["Row"][];
  battingResultDetailData: Database["public"]["Tables"]["batting_result_details"]["Row"][];
  playerData: any[];
  atBatResult: any[];
  inning: number;
  isTop: boolean;
  getPlayerNameByPlayerId: (playerId: string) => string;
  onSaved: () => void;
}) {
  // 保存中フラグ
  const [isSaving, setIsSaving] = useState(false);

  // メニュー開閉管理
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 現在のオーダー（途中交代を省く）
  const order = useMemo(
    () =>
      battingResultData.filter((br, index) => {
        if (
          battingResultData.length - 1 !== index &&
          battingResultData[index + 1].batting_order !== br.batting_order
        ) {
          return true;
        }
        if (battingResultData.length - 1 === index) return true;
        return false;
      }),
    [battingResultData],
  );

  // 表示中の打順・index
  const [displayOrder, setDisplayOrder] = useState<{
    batting_order: number;
    batting_index: number;
  }>(() => {
    if (!battingResultDetailData || battingResultDetailData.length === 0)
      return { batting_order: 1, batting_index: 0 };

    // 最後に入力されたデータのbatting_indexを取得
    const lastBattingIndex =
      battingResultDetailData[battingResultDetailData.length - 1].batting_index;

    // battingResultDataから打順を探し出す
    const lastBatter = battingResultData.find(
      (d) => d.batting_index === lastBattingIndex,
    );
    if (!lastBatter) return { batting_order: 1, batting_index: 0 };

    // orderから、その次の打順を指定する
    const currentIndex = order.findIndex(
      (o) => o.batting_order === lastBatter.batting_order,
    );
    if (currentIndex === -1) return { batting_order: 1, batting_index: 0 };

    // 次の打者がいればその打順、いなければ先頭（1番）
    const nextBatter = order[currentIndex + 1] || order[0];
    return {
      batting_order: nextBatter ? nextBatter.batting_order : 1,
      batting_index: nextBatter ? nextBatter.batting_index : 0,
    };
  });

  // 表示中の打席詳細index（battingResultDetailDataの配列index）
  const [displayIndex, setDisplayIndex] = useState(() => {
    return battingResultDetailData.length > 0
      ? battingResultDetailData.length
      : 0;
  });

  // 表示中の打席結果のイニング
  const resultInning =
    gameData.innings?.[battingResultDetailData[displayIndex]?.inning_index] ||
    inning;

  // 表示中の打席がその回の何人目か
  const inningResult = battingResultDetailData.filter(
    (d) => d.inning === resultInning,
  );
  const inningResultCount =
    inningResult.indexOf(battingResultDetailData[displayIndex]) + 1 ||
    inningResult.length + 1;

  // イニング得点の管理
  const [inningScore, setInningScore] = useState(
    gameData.is_batting_first
      ? gameData.top_points?.[inning - 1] || 0
      : gameData.bottom_points?.[inning - 1] || 0,
  );

  // 走者データ
  type Runner = {
    player_id: string;
    batting_index: number;
    batting_order: number;
    steal: number;
    steal_miss: number;
    run: number;
  };
  const [runners, setRunners] = useState<Runner[]>(() => {
    const newRunners: Runner[] = battingResultData.map((br) => ({
      player_id: br.player_id,
      batting_index: br.batting_index,
      batting_order: br.batting_order,
      steal: br.steal || 0,
      steal_miss: br.steal_miss || 0,
      run: br.run || 0,
    }));
    return newRunners;
  });

  // 打者送り
  const moveOrder = (delta: number) => {
    // 次の打順を算出
    let nextOrderNo = displayOrder.batting_order + delta;
    const lastOrder = order[order.length - 1]?.batting_order || 9;
    if (nextOrderNo < 1) nextOrderNo = lastOrder;
    if (nextOrderNo > lastOrder) nextOrderNo = 1;

    let battingIndex;
    let nextPlayerId;
    let atBatResultNo;
    let directionNo;
    let rbi;

    // 「次へ」の場合で表示中の打者が最新の場合は、オーダー情報から次の打者を取得
    if (delta > 0 && displayIndex >= battingResultDetailData.length - 1) {
      const nextBatter = order[nextOrderNo - 1];
      if (!nextBatter) return;

      battingIndex = nextBatter.batting_index;
      nextPlayerId = nextBatter.player_id;
      atBatResultNo = "";
      directionNo = "";
      rbi = 0;

      // それ以外の場合は、打席結果情報から取得
    } else {
      const dispBatter = battingResultDetailData[displayIndex + delta];
      battingIndex = dispBatter.batting_index;
      nextPlayerId = dispBatter.player_id;
      atBatResultNo = dispBatter.at_bat_result_no;
      directionNo = dispBatter.direction_no;
      rbi = dispBatter.rbi;
    }

    setDisplayOrder({
      batting_order: nextOrderNo,
      batting_index: battingIndex,
    });

    // 打席結果フォームのセット
    const nextDispIndex = displayIndex + delta;
    setDisplayIndex(nextDispIndex);

    setplayerId(nextPlayerId);
    setBattingResultNo(String(atBatResultNo) || "");
    setDirectionNo(String(directionNo) || "");
    setRbi(rbi || 0);
  };

  // 走者データ更新
  const updateRunner = (
    index: number,
    field: "steal" | "steal_miss" | "run",
    delta: number,
  ) => {
    const newRunners = [...runners];
    newRunners[index][field] = Math.max(0, newRunners[index][field] + delta);
    setRunners(newRunners);
  };

  // 入力フォームの状態
  const [playerId, setplayerId] = useState(
    () =>
      battingResultData.find(
        (br) => br.batting_index === displayOrder.batting_index,
      )?.player_id || "",
  );
  const [battingResultNo, setBattingResultNo] = useState("");
  const [directionNo, setDirectionNo] = useState("");
  const [rbi, setRbi] = useState(0);

  // 保存して次の打者へ
  const handleSubmit = async () => {
    if (isSaving) return;
    setIsSaving(true);

    // inning_indexの算出
    let inningIndex = battingResultDetailData[displayIndex]?.inning_index;

    // 現inning_indexの打席数がオーダー数以上なら次のinningIndexへ
    if (displayIndex === battingResultDetailData.length - 1) {
      const battingNo = battingResultDetailData.filter(
        (d) =>
          d.inning_index ===
          battingResultDetailData[displayIndex]?.inning_index,
      ).length;

      if (battingNo >= order.length) {
        inningIndex += 1;
      }
    }

    try {
      // 保存アクション実行
      const result = await saveBattingResultDetailAction(
        gameData,
        battingResultDetailData,
        inningScore,
        runners,
        {
          player_id: playerId,
          inning: inning,
          batting_index: displayOrder.batting_index,
          inning_index: inningIndex || 0,
          at_bat_result_no: Number(battingResultNo),
          direction_no: directionNo ? Number(directionNo) : null,
          rbi: rbi,
        },
      );
      // 次のバッターへ
      if (result.success === true) {
        moveOrder(1);
      }
    } catch (e) {
      alert("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // 攻守交替アクション
  const changeToDefenceAction = async () => {
    await changeTopBottomAction({
      gameData,
      innings: gameData.innings || [],
      inningPoints: inningScore,
      runners,
    });
    onSaved();
  };

  // 試合終了ハンドラ（結果一覧へ遷移するために redirect を受け取る）
  const onEndGame = async () => {
    const res = await endGameAction(
      gameData,
      gameData.innings || [],
      inningScore,
      runners,
    );
    return res;
  };

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
        <section className="bg-slate-100 rounded-[2.5rem] border-4 border-slate-300 p-6 shadow-2xl relative overflow-hidden mb-5">
          {/* 打者切り替えナビゲーション */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => moveOrder(-1)}
              disabled={displayIndex === 0}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                displayIndex === 0
                  ? "bg-slate-200 border-slate-400 text-slate-400"
                  : "bg-white border-slate-700 text-slate-700 cursor-pointer"
              }`}
            >
              ◀
            </button>
            <div className="text-center">
              <div className="text-lg font-black text-slate-700 mb-1">
                {resultInning}回{isTop ? "表" : "裏"} {inningResultCount}
                人目
              </div>
              <h2 className="text-2xl font-black italic">
                <span className="text-blue-600 mr-1">
                  {displayOrder.batting_order}.
                </span>
                {getPlayerNameByPlayerId(playerId)}
              </h2>
            </div>
            <button
              onClick={() => moveOrder(1)}
              disabled={displayIndex > battingResultDetailData.length - 1}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                displayIndex > battingResultDetailData.length - 1
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
            className="w-full mb-6 py-3 bg-blue-50 border-2 border-blue-700 rounded-xl font-black text-blue-700 uppercase tracking-[0.2em] cursor-pointer"
          >
            選手交代・打順メニュー ☰
          </button>

          {/* 打席入力（メイン：画面上部）*/}
          <div className="space-y-5">
            {/* 結果プルダウン */}
            <div>
              <label className="font-black text-slate-900 ml-1">打席結果</label>
              <select
                value={battingResultNo}
                onChange={(e) => setBattingResultNo(e.target.value)}
                className="w-full bg-white border-2 border-slate-800 rounded-2xl p-4 font-bold text-lg mt-1 outline-none appearance-none"
              >
                <option value="">選択してください...</option>
                {atBatResult.map((result: any) => (
                  <option key={result.no} value={result.no}>
                    {result.short_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 方向プルダウン */}
              <div>
                <label className="font-black text-slate-900 ml-1">
                  打球方向
                </label>
                <select
                  value={directionNo}
                  onChange={(e) => setDirectionNo(e.target.value)}
                  className="w-full bg-white border-2 border-slate-800 rounded-2xl p-4 font-bold mt-1"
                >
                  <option value="">方向...</option>
                  {POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* 打点カウンター */}
              <div>
                <label className="font-black text-slate-900 ml-1">打点</label>
                <div className="flex items-center bg-white border-2 border-slate-900 rounded-2xl p-1.5 mt-1">
                  <button
                    onClick={() => {
                      setRbi(Math.max(0, rbi - 1));
                      setInningScore(Math.max(0, inningScore - 1));
                    }}
                    disabled={rbi <= 0}
                    className={`w-10 h-10 rounded-lg font-black text-xl border border-slate-300 ${
                      rbi <= 0 ? "bg-slate-50" : "bg-slate-100 cursor-pointer "
                    }`}
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-black text-2xl">
                    {rbi}
                  </span>
                  <button
                    onClick={() => {
                      setRbi(rbi + 1);
                      setInningScore(Math.max(0, inningScore + 1));
                    }}
                    disabled={rbi >= 4}
                    className={`w-10 h-10  text-white rounded-lg font-black text-xl ${
                      rbi >= 4 ? "bg-blue-400" : "bg-blue-700 cursor-pointer"
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!battingResultNo || isSaving}
              className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
                battingResultNo && !isSaving
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
                "登録して次の打者へ"
              )}
            </button>
          </div>

          {/* 走者イベント */}
          <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 mt-6 mb-3">
            <span className="w-4 h-px bg-slate-700"></span>
            走者記録（1試合分）
          </h3>
          <div className="space-y-3">
            {runners.map((runner, idx) => (
              <div
                key={idx}
                className="bg-slate-200 border-2 rounded-3xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold mr-1">
                    {runner.batting_order}.
                  </span>
                  <span className="font-black ">
                    {getPlayerNameByPlayerId(runner.player_id)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* 各ボタンにプラスとマイナスを配置 */}
                  {[
                    { label: "盗塁", key: "steal", color: "blue" },
                    { label: "盗死", key: "steal_miss", color: "orange" },
                    { label: "得点", key: "run", color: "emerald" },
                  ].map((btn) => (
                    <div key={btn.key} className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 text-center tracking-tighter">
                        {btn.label}
                      </span>
                      <div className="bg-white rounded-xl p-1 flex items-center justify-between border border-slate-800">
                        <button
                          onClick={() => updateRunner(idx, btn.key as any, -1)}
                          className="w-7 h-7 bg-slate-100 border border-slate-300 rounded-lg text-xs font-black"
                        >
                          -
                        </button>
                        <span className="text-xl  font-black w-4 text-center">
                          {runner[btn.key as keyof typeof runner]}
                        </span>
                        <button
                          onClick={() => updateRunner(idx, btn.key as any, 1)}
                          className={`w-7 h-7 rounded-lg text-xs font-black ${
                            btn.color === "blue"
                              ? "bg-blue-400"
                              : btn.color === "orange"
                                ? "bg-orange-400"
                                : "bg-emerald-400"
                          }`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {runners.length === 0 && (
              <div className="text-center text-slate-800 font-black">
                走者なし
              </div>
            )}
          </div>
        </section>

        {/* 打順・交代メニュー */}
        {isMenuOpen && (
          <RealTimeBattingMenuForm
            gameData={gameData}
            playerData={playerData}
            runners={runners}
            battingIndex={displayOrder.batting_index}
            battingOrder={displayOrder.batting_order}
            isNewBatter={displayIndex === battingResultDetailData.length}
            inningIndex={(gameData.innings?.length || 1) - 1}
            inningPoints={inningScore}
            inning={inning}
            setIsMenuOpen={setIsMenuOpen}
            getPlayerNameByPlayerId={getPlayerNameByPlayerId}
          />
        )}

        {/* フッター：攻守交代 */}
        <RealTimeScoringFooter
          battingResultNo={battingResultNo}
          changeTopBottomAction={changeToDefenceAction}
          isBatting={true}
          onEndGame={onEndGame}
        />
      </div>
    </>
  );
}
