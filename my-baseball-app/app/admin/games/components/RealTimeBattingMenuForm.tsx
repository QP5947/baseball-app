"use client";
import { Database } from "@/types/supabase";
import {
  ChevronLast,
  ChevronsRight,
  Loader2,
  Plus,
  Redo2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { battingMenuAction } from "../scoring/[id]/actions";

// 打ち手の記号
const handMap: Record<string, string> = {
  L: "△",
  R: "",
  S: "□",
};

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
export default function RealTimeBattingMenuForm({
  gameData,
  playerData,
  runners,
  battingIndex,
  battingOrder,
  isNewBatter,
  inningIndex,
  inningPoints,
  inning,
  setIsMenuOpen,
  getPlayerNameByPlayerId,
}: {
  gameData: Database["public"]["Tables"]["games"]["Row"];
  playerData: any[];
  runners: any[];
  battingIndex: number;
  battingOrder: number;
  isNewBatter: boolean;
  inningIndex: number;
  inningPoints: number;
  inning: number;
  setIsMenuOpen: (isOpen: boolean) => void;
  getPlayerNameByPlayerId: (playerId: string) => string;
}) {
  // メニューの表示モード
  const [menuMode, setMenuMode] = useState<
    | "main"
    | "pinchHitter"
    | "selectRunner"
    | "pinchRunner"
    | "skipOrder"
    | "addOrder"
    | "changeBatter"
  >("main");

  // 交代後選手
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  // 交代走者index
  const [selectedRunner, setSelectedRunner] = useState<any>();

  // 保存中フラグ
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // メニューを閉じる
  const closeMenu = () => {
    setIsMenuOpen(false);
    // アニメーション終了後にリセット
    setTimeout(() => {
      setMenuMode("main");
      setSelectedPlayerId("");
    }, 300);
  };

  // メニュー表示中はスクロールを禁止する
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // 送信処理
  const handleSubmit = async (submitMenuMode: string = menuMode) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // 保存アクション実行
      const result = await battingMenuAction(
        gameData,
        submitMenuMode,
        battingIndex,
        battingOrder,
        inningIndex,
        inningPoints,
        inning,
        selectedPlayerId,
        selectedRunner,
        runners,
      );
      // データ再取得（App Router）
      if (result.success === true) {
        router.refresh();
      }
    } catch (e) {
      console.error("保存エラー:", e);
      alert(
        `保存に失敗しました。\n${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={closeMenu}
      ></div>

      {/* メニュー本体 */}
      <div className="relative bg-slate-100 border-t border-slate-700 rounded-t-4xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
        <div className="w-12 h-1 bg-slate-900 rounded-full mx-auto mb-6 shrink-0"></div>

        {menuMode === "main" || menuMode === "skipOrder" ? (
          <div className="overflow-y-auto">
            <h3 className="font-black text-center mb-6 text-slate-800 uppercase tracking-widest">
              選手交代・打順メニュー
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <button
                className={`flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl transition-colors ${!isNewBatter ? " opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                disabled={!isNewBatter}
                onClick={() => setMenuMode("pinchHitter")}
              >
                <span className="text-2xl">
                  <Zap size={24} />
                </span>
                <span className="font-black text-[12px]">代打を送る</span>
              </button>
              <button
                onClick={() => setMenuMode("selectRunner")}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl transition-colors cursor-pointer"
              >
                <span className="text-2xl">
                  <ChevronsRight size={24} />
                </span>
                <span className="font-black text-[12px]">代走を送る</span>
              </button>

              <button
                onClick={() => {
                  handleSubmit("skipOrder");
                }}
                className={`flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl transition-colors  ${!isNewBatter ? " opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className="text-2xl">
                  <ChevronLast size={24} />
                </span>
                <span className="font-black text-[12px]">打席を飛ばす</span>
              </button>
              <button
                className={`flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl transition-colors  ${!isNewBatter ? " opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => setMenuMode("addOrder")}
              >
                <span className="text-2xl">
                  <Plus size={24} />
                </span>
                <span className="font-black text-[12px]">打順を追加</span>
              </button>
              <button
                className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl transition-colors cursor-pointer"
                onClick={() => setMenuMode("changeBatter")}
              >
                <span className="text-2xl">
                  <Redo2 size={24} />
                </span>
                <span className="font-black text-[12px]">打者を差し替え</span>
              </button>
            </div>

            <button
              onClick={closeMenu}
              className="w-full py-4 bg-slate-100 border-2 rounded-xl font-black cursor-pointer"
            >
              閉じる
            </button>
          </div>
        ) : menuMode === "selectRunner" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-black text-center mb-6 text-slate-800 uppercase tracking-widest">
              交代する走者を選択
            </h3>
            <div className="flex-1 grid content-start gap-3 mb-8 overflow-y-auto">
              {runners.length > 0 ? (
                runners.map((runner, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedRunner(runner);
                      setMenuMode("pinchRunner");
                    }}
                    className="flex items-center justify-between p-4 bg-white border-2 border-slate-200 rounded-xl active:bg-blue-50 active:border-blue-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-black text-blue-600 text-xl">
                        {runner.batting_order}.
                      </span>
                      <span className="font-bold text-lg">
                        {getPlayerNameByPlayerId(runner.player_id)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-400">
                      選択 &gt;
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-center text-slate-500 font-bold py-4">
                  走者がいません
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
        ) : (
          <div className="overflow-y-auto">
            <h3 className="font-black text-center mb-6 text-slate-800 uppercase tracking-widest">
              {(() => {
                switch (menuMode) {
                  case "pinchHitter":
                    return "代打を選択";
                  case "pinchRunner":
                    return "代走を選択";
                  case "addOrder":
                    return (
                      <div>
                        <p className="text-xl">打順を追加</p>
                        <p className="text-slate-600">
                          ※表示中の打者は次の打者になり、以降の打順は繰り下がります
                        </p>
                      </div>
                    );
                  case "changeBatter":
                    return (
                      <div>
                        <p className="text-xl">打者を差し替え</p>
                        <p className="text-slate-600">
                          ※登録済みの成績は差し替えた選手に引き継がれます
                        </p>
                      </div>
                    );
                  default:
                    return "";
                }
              })()}
            </h3>
            <div className="mb-8">
              <Select
                options={playerData}
                getOptionValue={(opt) => opt.id}
                getOptionLabel={(opt) => `#${opt.no} ${opt.name}`}
                value={playerData.find((p: any) => p.id === selectedPlayerId)}
                onChange={(opt: any) => {
                  setSelectedPlayerId(opt?.id);
                }}
                filterOption={customFilter}
                placeholder="選手を検索..."
                className="text-xl font-bold"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "12px",
                    minHeight: "56px",
                    marginBottom: "300px",
                  }),
                  menu: (base) => ({ ...base, zIndex: 9999 }),
                }}
                formatOptionLabel={(option: any, { context }) =>
                  context === "menu"
                    ? `#${option.no}: ${
                        option.batting_hand ? handMap[option.batting_hand] : ""
                      }${option.name}`
                    : option.name
                }
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMenuMode(
                    menuMode === "pinchRunner" ? "selectRunner" : "main",
                  );
                  setSelectedPlayerId("");
                  setSelectedRunner(null);
                }}
                className="flex-1 py-4 bg-slate-100 border-2 rounded-xl font-black cursor-pointer"
              >
                戻る
              </button>
              <button
                onClick={() => {
                  handleSubmit(menuMode);
                }}
                disabled={!selectedPlayerId || isSaving}
                className={`flex-1 py-4 border-2 rounded-xl font-black text-white flex items-center justify-center gap-2 ${
                  selectedPlayerId && !isSaving
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
