"use client";

import { Database } from "@/types/supabase";
import { ArrowLeft, Edit, Shield, Swords, User } from "lucide-react";
import { useState } from "react";

type PlayerRow = Pick<
  Database["public"]["Tables"]["players"]["Row"],
  "id" | "no" | "name" | "batting_hand"
>;

const POSITIONS_MAP: { [key: number]: string } = {
  1: "投",
  2: "捕",
  3: "一",
  4: "二",
  5: "三",
  6: "遊",
  7: "左",
  8: "中",
  9: "右",
  10: "DH",
};

export default function BeforeGamePage({
  battingResult,
  playerData,
  onStartGame,
  onBackToOrder,
}: {
  battingResult: Database["public"]["Tables"]["batting_results"]["Row"][];
  playerData: PlayerRow[];
  onStartGame: (isTop: boolean) => void;
  onBackToOrder: () => void;
}) {
  const [isTop, setIsTop] = useState<boolean | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-200 pb-40">
      {/* ヘッダー */}
      <div className="bg-black text-white p-3 flex items-center gap-4 top-0 z-50 shadow-2xl">
        <button
          onClick={onBackToOrder}
          className="p-2 active:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft size={40} strokeWidth={3} className="cursor-pointer" />
        </button>
        <h1 className="text-2xl font-black tracking-tight">オーダー確認</h1>
      </div>

      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col p-4 gap-6 mb-20">
        {/* 攻守選択 */}
        <div className="w-full space-y-4">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Swords size={28} className="text-blue-700" />
            自チームの攻守
          </h2>
          <div className="flex gap-4 h-32">
            <button
              onClick={() => setIsTop(true)}
              className={`flex-1 rounded-3xl border-8 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                isTop === true
                  ? "border-red-600 bg-red-600 text-white shadow-xl scale-105"
                  : "border-white bg-white text-gray-400"
              }`}
            >
              <Swords size={40} strokeWidth={3} />
              <span className="text-2xl font-black italic">先攻</span>
            </button>
            <button
              onClick={() => setIsTop(false)}
              className={`flex-1 rounded-3xl border-8 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                isTop === false
                  ? "border-blue-600 bg-blue-600 text-white shadow-xl scale-105"
                  : "border-white bg-white text-gray-400"
              }`}
            >
              <Shield size={40} strokeWidth={3} />
              <span className="text-2xl font-black italic">後攻</span>
            </button>
          </div>
        </div>

        {/* オーダー確認リスト：文字を大きく、太く */}
        <div className="w-full flex-1 min-h-0">
          <div className="flex justify-between items-end mb-3 px-2">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              <User size={28} className="text-blue-700" />
              スターティングメンバー
            </h2>
            <button
              onClick={onBackToOrder}
              className="text-gray-400 hover:text-blue-600 cursor-pointer"
            >
              <Edit size={30} />
            </button>
          </div>

          <div className="bg-white rounded-4xl shadow-xl border-4 border-gray-300 overflow-hidden">
            {battingResult.length > 0 ? (
              <div className="divide-y-4 divide-gray-100">
                {battingResult.map((item) => {
                  const player = playerData.find(
                    (p) => p.id === item.player_id,
                  );
                  const posNum = item.positions ? item.positions[0] : null;
                  const posName = posNum ? POSITIONS_MAP[posNum] || "-" : "-";

                  return (
                    <div
                      key={item.batting_order}
                      className={`flex items-center p-4 gap-4 bg-white border-l-6
                          ${
                            player?.batting_hand === "L"
                              ? "border-l-blue-800"
                              : player?.batting_hand === "S"
                                ? "border-l-amber-600"
                                : "border-l-transparent"
                          }
                          `}
                    >
                      <div
                        className={`w-10 text-center font-black text-2xl italic 
                          `}
                      >
                        {item.batting_order}.
                      </div>
                      <div className="w-14 h-10 flex items-center justify-center font-black text-white bg-blue-700 rounded-lg text-xl shadow-sm">
                        {posName}
                      </div>
                      <div className="flex-1 font-black text-gray-900 text-2xl truncate">
                        {player ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-gray-500">#{player.no}</span>
                            <span>{player.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic">未選択</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 font-black text-xl">
                オーダーが未登録です
              </div>
            )}
          </div>
        </div>
      </div>

      {/* フッター：試合開始ボタンを最大化 */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t-8 border-green-600 z-50 px-4 pt-3 pb-3">
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          <button
            disabled={isTop === null}
            onClick={() => isTop !== null && onStartGame(isTop)}
            className={`w-full py-6 rounded-[2.5rem] text-4xl font-black shadow-2xl transition-all active:scale-95 ${
              isTop !== null
                ? "bg-green-500 text-black cursor-pointer"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isTop === null ? "先攻・後攻を選択" : "試合開始！"}
          </button>
        </div>
      </div>
    </div>
  );
}
