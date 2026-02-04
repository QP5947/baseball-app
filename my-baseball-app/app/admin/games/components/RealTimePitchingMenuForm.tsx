"use client";
import { Database } from "@/types/supabase";
import { ChevronsRight, Loader2, Redo2, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { pitchingMenuAction } from "../scoring/[id]/actions";

const customFilter = (option: any, inputValue: string) => {
  if (!inputValue) return true;
  const label = option.data.no + option.data.name;
  return label.includes(inputValue);
};

/**
 * リアルタイムスコア入力（攻撃メニュー）
 *
 * @param param0
 * @returns
 */
export default function RealTimePitchingMenuForm({
  gameData,
  playerData,
  pitchingResultData,
  displayPitcherIndex,
  battingResultData,
  inningPoints,
  pitchingStats,
  setIsMenuOpen,
  getPlayerNameByPlayerId,
}: {
  gameData: Database["public"]["Tables"]["games"]["Row"];
  playerData: any[];
  pitchingResultData: Database["public"]["Tables"]["pitching_results"]["Row"][];
  displayPitcherIndex: number;
  battingResultData: Database["public"]["Tables"]["batting_results"]["Row"][];
  inningPoints: number;
  pitchingStats: any;
  setIsMenuOpen: (isOpen: boolean) => void;
  getPlayerNameByPlayerId: (playerId: string) => string;
}) {
  // メニューの表示モード
  const [menuMode, setMenuMode] = useState<
    | "main"
    | "switchPitcher"
    | "selectDefence"
    | "switchPlayer"
    | "changeDefence"
    | "changePitcher"
  >("main");

  // ポジションのマップ
  const positions = {
    1: "投",
    2: "捕",
    3: "一",
    4: "二",
    5: "三",
    6: "遊",
    7: "左",
    8: "中",
    9: "右",
  };

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

  // ローカルに保持するオーダー（サーバー更新後に表示を即時反映するため）
  const [localOrder, setLocalOrder] = useState<any[]>(order);
  useEffect(() => setLocalOrder(order), [order]);

  // 交代後選手
  const [toPlayerId, setToPlayerId] = useState<string>("");

  // 交代選手
  const [selectedPlayer, setSelectedPlayer] = useState<any>();

  // 交代先ポジション
  const [toPosition, setToPosition] = useState<any>();

  // 選手交代セレクトを表示するか
  const [showPlayerSelect, setShowPlayerSelect] = useState<boolean>(false);

  // メニュー表示中はスクロールを禁止する
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // 保存中フラグ
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // メニューを閉じる
  const closeMenu = () => {
    setIsMenuOpen(false);
    // アニメーション終了後にリセット
    setTimeout(() => {
      setMenuMode("main");
      setToPlayerId("");
    }, 300);
  };

  // 送信処理
  const handleSubmit = async (submitMenuMode: string = menuMode) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // 交代投手の打席結果
      if (submitMenuMode === "switchPitcher") {
        const battingResult = order.find((player) => {
          if (player.positions?.[player.positions?.length - 1] === 1) {
            return true;
          }
          return false;
        });
        setSelectedPlayer(battingResult);
      }

      // 保存アクション実行
      await pitchingMenuAction(
        gameData,
        submitMenuMode,
        inningPoints,
        selectedPlayer,
        toPlayerId,
        pitchingResultData[displayPitcherIndex].pitching_order,
        pitchingStats,
        toPosition,
      );

      // 守備変更時の処理
      if (submitMenuMode === "changeDefence") {
        // ローカルのオーダーに変更を反映して画面に戻す
        if (selectedPlayer && toPosition) {
          setLocalOrder((prev) =>
            prev.map((p) =>
              p.batting_index === selectedPlayer.batting_index
                ? { ...p, positions: [...(p.positions || []), toPosition] }
                : p,
            ),
          );
        }

        setToPlayerId("");
        setSelectedPlayer(null);
        setToPosition(null);
        setShowPlayerSelect(false);
        setMenuMode("selectDefence");
      }

      // 投手差し替え時の処理
      else if (submitMenuMode === "changePitcher") {
        // メニューを閉じる
        closeMenu();
        setMenuMode("main");
      }

      // 投手交代
      else {
        router.refresh();
      }
    } catch (e) {
      alert("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => setIsMenuOpen(false)}
      ></div>

      {/* メニュー本体 */}
      <div className="relative bg-slate-100 border-t border-slate-700 rounded-t-4xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
        <div className="w-12 h-1 bg-slate-900 rounded-full mx-auto mb-6 shrink-0"></div>

        {menuMode === "main" ? (
          <div className="overflow-y-auto">
            <h3 className="font-black text-center mb-6 text-slate-800 uppercase tracking-widest">
              投手・守備交代メニュー
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {/* 投手交代アクション */}
              <button
                disabled={pitchingResultData.length - 1 !== displayPitcherIndex}
                className={`flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl active:bg-blue-600 group transition-colors" ${
                  pitchingResultData.length - 1 !== displayPitcherIndex
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                onClick={() => setMenuMode("switchPitcher")}
              >
                <span className="text-2xl">
                  <Zap size={24} />
                </span>
                <span className="font-black">投手交代</span>
              </button>

              {/* 守備交代アクション */}
              <button
                className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl active:bg-orange-600 transition-colors cursor-pointer"
                onClick={() => setMenuMode("selectDefence")}
              >
                <span className="text-2xl">
                  <ChevronsRight size={24} />
                </span>
                <span className="font-black">守備交代</span>
              </button>

              {/* 投手差し替えアクション */}
              <button
                className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl active:bg-blue-600 group transition-colors cursor-pointer"
                onClick={() => setMenuMode("changePitcher")}
              >
                <span className="text-2xl">
                  <Redo2 size={24} />
                </span>
                <span className="font-black">投手を差し替え</span>
              </button>
            </div>

            <button
              onClick={() => closeMenu()}
              className="w-full py-4 bg-slate-100 border-2 rounded-xl font-black cursor-pointer"
            >
              閉じる
            </button>
          </div>
        ) : // 守備交代
        menuMode === "selectDefence" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-black text-center mb-6 text-slate-800 uppercase tracking-widest">
              交代する選手を選択
            </h3>

            <div className="flex-1 grid content-start gap-3 mb-8 overflow-y-auto">
              {localOrder.length > 0 ? (
                localOrder.map((player, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPlayer(player);
                      // 行選択で直接守備交代画面へ。選手交代セレクトは後から表示する。
                      setMenuMode("changeDefence");
                      setShowPlayerSelect(false);
                    }}
                    className="flex items-center justify-between p-4 bg-white border-2 border-slate-200 rounded-xl active:bg-blue-50 active:border-blue-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-black text-blue-600 text-xl">
                        {player.batting_order}.
                      </span>
                      <span className="font-bold text-lg">
                        {getPlayerNameByPlayerId(player.player_id)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-400">
                      {
                        positions[
                          (player.positions?.[player.positions.length - 1] ||
                            0) as keyof typeof positions
                        ]
                      }{" "}
                      &gt;
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-center text-slate-500 font-bold py-4">
                  守備がいません
                </p>
              )}
            </div>
            <button
              onClick={() => setMenuMode("main")}
              className="w-full py-4 bg-slate-100 border-2 rounded-xl font-black cursor-pointer"
            >
              戻る
            </button>
          </div>
        ) : // 守備交代詳細
        menuMode === "changeDefence" || menuMode === "switchPlayer" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-black text-center mb-6 text-slate-800 uppercase tracking-widest">
              守備交代
            </h3>
            <div className="flex-1 grid content-start gap-3 mb-8 overflow-y-auto">
              <div className="p-4 bg-white border-2 border-slate-200 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-black text-blue-600 text-xl">
                    {selectedPlayer?.batting_order}.
                  </span>
                  <span className="font-bold text-lg">
                    {getPlayerNameByPlayerId(selectedPlayer?.player_id)}
                  </span>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    現在のポジション:{" "}
                    {
                      positions[
                        (selectedPlayer?.positions?.[
                          selectedPlayer.positions.length - 1
                        ] || 0) as keyof typeof positions
                      ]
                    }
                  </label>
                  <label className=" text-sm font-bold text-slate-700 mb-2">
                    交代先ポジション:
                  </label>
                  <select
                    value={toPosition}
                    onChange={(e) => setToPosition(Number(e.target.value))}
                    className="w-full p-2 border-2 border-slate-300 rounded-lg"
                  >
                    <option value={0}>選択してください</option>
                    {Object.entries(positions).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (showPlayerSelect) {
                      setToPlayerId("");
                    }
                    setShowPlayerSelect((s) => !s);
                  }}
                  className="w-full py-2 bg-blue-50 border-2 border-blue-200 rounded-xl font-black text-blue-700 mb-4 cursor-pointer"
                >
                  {showPlayerSelect ? "選手交代なしに戻す" : "選手交代"}
                </button>

                {showPlayerSelect && (
                  <div className="p-4 bg-white border-2 border-slate-200 rounded-xl mb-4">
                    <Select
                      options={playerData}
                      getOptionValue={(opt) => opt.id}
                      getOptionLabel={(opt) => `#${opt.no} ${opt.name}`}
                      value={playerData.find((p: any) => p.id === toPlayerId)}
                      onChange={(opt: any) => setToPlayerId(opt?.id)}
                      filterOption={customFilter}
                      menuPlacement="top"
                      menuPosition="fixed"
                      placeholder="交代する選手を検索..."
                      className="text-xl font-bold"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: "12px",
                          minHeight: "56px",
                        }),
                        menu: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMenuMode("selectDefence");
                  setToPosition(null);
                }}
                className="flex-1 py-4 bg-slate-100 border-2 rounded-xl font-black cursor-pointer"
              >
                戻る
              </button>
              <button
                onClick={() => handleSubmit(menuMode)}
                disabled={toPosition === 0 || isSaving}
                className={`flex-1 py-4 border-2 rounded-xl font-black text-white flex items-center justify-center gap-2 ${
                  toPosition !== 0 && !isSaving
                    ? "bg-blue-600 border-blue-600 cursor-pointer"
                    : "bg-gray-400 border-gray-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" />
                    保存中
                  </>
                ) : (
                  "確定"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="overflow-y-auto mb-4 pr-2">
              <h3 className="font-black text-center items-center mb-6 text-slate-800 uppercase tracking-widest flex flex-col gap-3">
                <div>
                  <p className="text-xl">選手を選択</p>
                </div>
                {menuMode === "switchPitcher" && (
                  <>
                    <div className="text-slate-600 text-left">
                      <p>※ベンチの投手と交代になります</p>
                      <p>
                        ※出場中の選手との交代は「守備交代」を選択してください
                      </p>
                    </div>
                  </>
                )}

                {menuMode === "changePitcher" && (
                  <p className="text-slate-600">
                    ※登録済みの成績は差し替えた選手に引き継がれます
                  </p>
                )}
              </h3>

              <div className="mb-8">
                <Select
                  options={playerData}
                  getOptionValue={(opt) => opt.id}
                  getOptionLabel={(opt) => `#${opt.no} ${opt.name}`}
                  value={playerData.find((p: any) => p.id === toPlayerId)}
                  onChange={(opt: any) => {
                    setToPlayerId(opt?.id);
                  }}
                  filterOption={customFilter}
                  menuPlacement="top"
                  menuPosition="fixed"
                  placeholder="選手を検索..."
                  className="text-xl font-bold"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "12px",
                      minHeight: "56px",
                    }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                  formatOptionLabel={(option: any, { context }) =>
                    context === "menu"
                      ? `#${option.no}: 
                      ${option.name}`
                      : option.name
                  }
                />
              </div>
            </div>
            <div className="sticky bottom-0 left-0 w-full bg-slate-100 border-t border-slate-200 p-4 flex gap-3">
              <button
                onClick={() => {
                  setMenuMode("main");
                  setToPlayerId("");
                }}
                className="flex-1 py-4 bg-slate-100 border-2 rounded-xl font-black cursor-pointer"
              >
                戻る
              </button>
              <button
                onClick={() => {
                  handleSubmit(menuMode);
                }}
                disabled={!toPlayerId || isSaving}
                className={`flex-1 py-4 border-2 rounded-xl font-black text-white flex items-center justify-center gap-2 ${
                  toPlayerId && !isSaving
                    ? "bg-blue-600 border-blue-600 cursor-pointer"
                    : "bg-gray-400 border-gray-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" />
                    保存中
                  </>
                ) : (
                  "確定"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
