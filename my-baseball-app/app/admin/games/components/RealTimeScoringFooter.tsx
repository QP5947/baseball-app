"use client";
import { Database } from "@/types/supabase";
import { Repeat } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RealTimeScoringFooter({
  battingResultNo,
  changeTopBottomAction,
  isBatting,
  onEndGame,
}: {
  battingResultNo: string;
  changeTopBottomAction: () => void;
  isBatting: boolean;
  onEndGame?: () => Promise<{ redirect?: string } | void>;
}) {
  const router = useRouter();
  // 送信ボタン切替管理
  const [isEndButtonOpen, setIsEndButtonOpen] = useState(false);

  return (
    <footer className="fixed bottom-0 left-0 right-0 p-4 bg-slate-100 backdrop-blur-lg border-t border-slate-500">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            setIsEndButtonOpen(!isEndButtonOpen);
          }}
          className="bg-white border rounded-2xl p-4.5 cursor-pointer"
        >
          <Repeat />
        </button>
        {!isEndButtonOpen ? (
          <button
            className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all cursor-pointer"
            onClick={async () => {
              const message = isBatting
                ? "守備に移りますか？\n入力中の打席結果は保存されません\n（イニング得点、走者記録は保存されます）"
                : "攻撃に移りますか？";
              if (window.confirm(message)) {
                // 保存処理
                changeTopBottomAction();
              }
            }}
          >
            攻守交替
          </button>
        ) : (
          <button
            onClick={async () => {
              if (window.confirm("試合を終了して結果を保存しますか？")) {
                if (onEndGame) {
                  const res = await onEndGame();
                  if (res?.redirect) {
                    // サーバーが返した redirect に遷移
                    router.push(res.redirect);
                    return;
                  }
                }

                alert("試合を終了しました");
              }
            }}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            試合を終了 / 一時保存
          </button>
        )}
      </div>
    </footer>
  );
}
