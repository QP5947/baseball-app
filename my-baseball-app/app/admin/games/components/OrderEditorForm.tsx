"use client";

import { Database } from "@/types/supabase";
import { getDefaultDateTime } from "@/utils/getDefaultDateTime";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  getPreviousOrderAction,
  saveGameOrderAction,
} from "../scoring/[id]/actions";
import SortableOrderSlot from "./SortableOrderSlot";

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
 * オーダー作成フォーム
 *
 * 試合の基本情報（日時、対戦相手など）の編集と、
 * ドラッグ＆ドロップによるスターティングメンバー（打順・守備）の登録を行います。
 *
 * @param props.gameData - 編集対象の試合データ
 * @param props.playerData - 選択可能な選手のリスト
 * @param props.masters - リーグ、球場、対戦相手などのマスタデータ
 * @returns オーダー登録画面のJSX
 */
export default function OrderEditorForm({
  gameData,
  battingResult,
  playerData,
  masters,
  onSaved,
}: {
  gameData: GameRow;
  battingResult: Database["public"]["Tables"]["batting_results"]["Row"][];
  playerData: PlayerRow[];
  masters: {
    leagues: { id: any; name: any }[] | null;
    grounds: { id: any; name: any }[] | null;
    vsteams: { id: any; name: any }[] | null;
  };
  onSaved: () => void;
}) {
  const router = useRouter();

  const leagues = masters.leagues || [];
  const grounds = masters.grounds || [];
  const vsteams = masters.vsteams || [];

  // 試合情報の管理
  const [editableGame, setEditableGame] = useState({
    start_datetime: gameData.start_datetime,
    vsteam_id: gameData.vsteam_id || "",
    ground_id: gameData.ground_id || "",
    league_id: gameData.league_id || "",
    is_batting_first: true,
  });

  // 試合情報表示切替の管理
  const [showGameDetails, setShowGameDetails] = useState(false);

  // オーダー情報の管理
  const [order, setOrder] = useState<any[]>(() => {
    const loopLength = battingResult.length >= 9 ? battingResult.length : 9;

    return Array.from({ length: loopLength }, (_, i) => {
      return {
        id: `slot-${i}`,
        playerId: battingResult[i]?.player_id || "",
        position:
          (battingResult[i]?.positions ? battingResult[i]?.positions[0] : "") ||
          "",
      };
    });
  });

  // ドラッグ＆ドロップの設定
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // 10px動くまでドラッグを開始しない（遊びを作る）
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5, // 指が少し震えてもキャンセルしない
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrder((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 前回のオーダーをコピー
  const copyPreviousOrder = async () => {
    if (!confirm("前回のオーダーをコピーしますか？")) return;

    const result = await getPreviousOrderAction(gameData.id);

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.success && result.order) {
      // オーダーの最大値 と 9番 の大きい方までループする
      const loopLength = Math.max(
        ...result.order.map((p) => p.batting_order),
        9,
      );

      // 空欄の打者は空で埋める
      const newOrder = Array.from({ length: loopLength }, (_, i) => {
        let order = result.order?.find((d) => d.batting_order === i + 1);
        if (order) {
          return {
            id: `slot-${Date.now()}-${i}`, // Dnd-kit用のユニークID
            playerId: order.player_id,
            position: order.positions[0],
          };
        }
        return {
          id: `slot-${Date.now()}-${i}`, // Dnd-kit用のユニークID
          playerId: "",
          position: "",
        };
      });
      setOrder(newOrder);
    }
  };

  // 試合開始
  const handleSave = async () => {
    try {
      // サーバーアクションを呼び出す
      await saveGameOrderAction(gameData.id, editableGame, order);
      onSaved();
    } catch (e) {
      alert("保存に失敗しました。");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-200 pb-50">
      {/* ヘッダー */}
      <div className="bg-black text-white p-3 flex items-center gap-4 top-0 z-50 shadow-2xl">
        <button
          onClick={() => router.back()}
          className="p-2 active:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft size={40} strokeWidth={3} className="cursor-pointer" />
        </button>
        <h1 className="text-2xl font-black tracking-tight">オーダー登録</h1>
      </div>

      <div className="w-full max-w-2xl mx-auto flex-1">
        {/* 試合情報：マスタ選択セクション */}
        <div className="bg-white border-b-8 border-gray-300 shadow-md">
          <button
            onClick={() => setShowGameDetails(!showGameDetails)}
            className="w-full p-6 flex justify-between items-center text-black font-black text-2xl cursor-pointer"
          >
            <div className="flex items-center gap-3 text-left">
              <Trophy size={32} className="text-amber-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 tracking-widest">
                  試合設定
                </span>
                <span className="truncate">
                  VS{" "}
                  {vsteams.find((v) => v.id === editableGame.vsteam_id)?.name ||
                    "未選択"}
                </span>
              </div>
            </div>
            {showGameDetails ? (
              <ChevronUp size={40} />
            ) : (
              <ChevronDown size={40} />
            )}
          </button>

          {showGameDetails && (
            <div className="p-6 pt-2 space-y-6 bg-gray-50 border-t-4 border-gray-100">
              {/* 日時入力 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-gray-500 uppercase">
                  <Clock size={16} /> 試合開始日時
                </label>
                <input
                  type="datetime-local"
                  value={getDefaultDateTime(editableGame.start_datetime)}
                  onChange={(e) =>
                    setEditableGame({
                      ...editableGame,
                      start_datetime: e.target.value,
                    })
                  }
                  className="w-full p-4 text-xl font-bold border-4 border-gray-300 rounded-xl bg-white focus:border-blue-600 outline-none"
                />
              </div>

              {/* 対戦相手プルダウン */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-gray-500 uppercase">
                  <Users size={16} /> 対戦相手
                </label>
                <select
                  value={editableGame.vsteam_id}
                  onChange={(e) =>
                    setEditableGame({
                      ...editableGame,
                      vsteam_id: e.target.value,
                    })
                  }
                  className="w-full p-4 text-xl font-bold border-4 border-gray-300 rounded-xl bg-white focus:border-blue-600 outline-none appearance-none"
                >
                  <option value="">選択してください</option>
                  {vsteams.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 球場プルダウン */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-gray-500 uppercase">
                  <MapPin size={16} /> 球場
                </label>
                <select
                  value={editableGame.ground_id}
                  onChange={(e) =>
                    setEditableGame({
                      ...editableGame,
                      ground_id: e.target.value,
                    })
                  }
                  className="w-full p-4 text-xl font-bold border-4 border-gray-300 rounded-xl bg-white focus:border-blue-600 outline-none appearance-none"
                >
                  <option value="">選択してください</option>
                  {grounds.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* リーグプルダウン */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-gray-500 uppercase">
                  <Trophy size={16} /> リーグ
                </label>
                <select
                  value={editableGame.league_id}
                  onChange={(e) =>
                    setEditableGame({
                      ...editableGame,
                      league_id: e.target.value,
                    })
                  }
                  className="w-full p-4 text-xl font-bold border-4 border-gray-300 rounded-xl bg-white focus:border-blue-600 outline-none appearance-none"
                >
                  <option value="">選択してください</option>
                  {leagues.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* オーダーリスト部分 (変更なし) */}
        <div className="px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-black font-black text-3xl italic">
              <UserPlus size={40} strokeWidth={4} className="text-blue-700" />
              <span>オーダー</span>
            </div>

            {/* コピーボタン：黒背景に白文字で目立たせる */}
            <button
              className="bg-gray-800 text-white px-4 py-3 rounded-xl font-black flex items-center gap-2 active:scale-95 transition-all shadow-lg cursor-pointer w-40"
              onClick={copyPreviousOrder}
            >
              <Users size={40} />
              前回オーダーをコピー
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-3">
              <SortableContext
                items={order.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {order.map((slot, index) => (
                  <SortableOrderSlot
                    key={slot.id}
                    slot={slot}
                    index={index}
                    playerData={playerData}
                    onUpdate={(id: string, f: string, v: any) =>
                      setOrder(
                        order.map((s) => (s.id === id ? { ...s, [f]: v } : s)),
                      )
                    }
                    onRemove={(id: string) =>
                      setOrder(order.filter((s) => s.id !== id))
                    }
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>

          <button
            onClick={() =>
              setOrder([
                ...order,
                { id: `slot-${Date.now()}`, playerId: "", position: "" },
              ])
            }
            className="w-full h-24 border-8 border-dashed border-gray-400 rounded-3xl text-gray-500 text-3xl font-black mt-8 bg-white/40 active:bg-white transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            ＋ 打者を追加
          </button>
        </div>
      </div>

      {/* フッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t-4 border-blue-700 z-50 px-4 pt-3 pb-3">
        <div className="max-w-2xl mx-auto justify-center flex">
          <button
            className="w-full max-w-md h-20 rounded-2xl text-2xl font-black shadow-xl transition-all active:scale-95 bg-blue-600 text-white cursor-pointer hover:bg-blue-500"
            onClick={() => {
              handleSave();
            }}
          >
            オーダーを保存
          </button>
        </div>
      </div>
    </div>
  );
}
