"use client";

import {
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  Save,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveScheduleAttendance } from "../actions";

interface AttendanceDetailClientProps {
  gameId: string;
  playerId: string;
  initialStatus: "attending" | "absent" | "pending" | null;
  initialHelpers: number;
  initialComment: string;
  attendedPlayers: any[];
  absentPlayers: any[];
  pendingPlayers: any[];
  unansweredPlayers: any[];
  helperTotal: number;
}

export default function AttendanceDetailClient({
  gameId,
  playerId,
  initialStatus,
  initialHelpers,
  initialComment,
  attendedPlayers,
  absentPlayers,
  pendingPlayers,
  unansweredPlayers,
  helperTotal,
}: AttendanceDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "attending" | "absent" | "pending" | null
  >(initialStatus);
  const [helpers, setHelpers] = useState(initialHelpers);
  const [comment, setComment] = useState(initialComment);
  const [isSaving, setIsSaving] = useState(false);

  // どのプレイヤーのツールチップを開いているかを管理
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // 表示タブの管理
  const [activeTab, setActiveTab] = useState<
    "attending" | "absent" | "pending" | "unanswered"
  >("attending");

  const handleSave = async () => {
    if (!status) return;
    setIsSaving(true);
    await saveScheduleAttendance({
      gameId,
      playerId,
      status,
      helperCount: helpers,
      comment,
    });
    setIsSaving(false);
    router.refresh(); // ページを更新して最新データを反映
  };

  const tabs = [
    {
      id: "attending",
      label: "出席",
      count: attendedPlayers.length + helperTotal,
      color: "emerald",
      list: attendedPlayers,
    },
    {
      id: "absent",
      label: "欠席",
      count: absentPlayers.length,
      color: "red",
      list: absentPlayers,
    },
    {
      id: "pending",
      label: "未定",
      count: pendingPlayers.length,
      color: "amber",
      list: pendingPlayers,
    },
    {
      id: "unanswered",
      label: "未回答",
      count: unansweredPlayers.length,
      color: "orange",
      list: unansweredPlayers,
    },
  ];

  const currentList = tabs.find((t) => t.id === activeTab)?.list || [];

  return (
    <div className="space-y-8">
      {/* チーム状況エリア（タブ切り替え型） */}
      <section className="space-y-4">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 px-1 mb-3">
          <UserPlus className="text-blue-600" size={24} /> チームの状況
        </h3>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden p-6">
          {/* タブボタン */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-20 py-3 rounded-2xl border-b-4 transition-all flex flex-col items-center shadow-sm ${
                  activeTab === tab.id
                    ? `bg-white border-${tab.color}-500 shadow-md translate-y-px`
                    : `bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200 hover:border-gray-400 cursor-pointer active:translate-y-0.5 active:border-b-0`
                }`}
              >
                <span className="font-black mb-1 text-sm">{tab.label}</span>
                <span
                  className={`text-2xl font-black ${activeTab === tab.id ? `text-${tab.color}-600` : ""}`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* リスト表示 */}
          <div className="p-3 min-h-35 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div className="flex flex-wrap gap-2">
              {currentList.map((p: any) => (
                <div
                  key={p.id}
                  className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 relative"
                  onClick={() => {
                    if (p.comment) {
                      setActiveCommentId(
                        activeCommentId === p.id ? null : p.id,
                      );
                    }
                  }}
                >
                  <span className="text-xl font-bold text-gray-800">
                    {p.name}
                  </span>

                  {p.helperCount > 0 && (
                    <span className="text-sm bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-black border border-blue-100">
                      +{p.helperCount}
                    </span>
                  )}

                  {/* コメントアイコン */}
                  {p.comment && (
                    <div className="relative flex items-center">
                      <MessageCircle
                        size={20}
                        className={`${activeCommentId === p.id ? "text-blue-600" : "text-blue-400"} transition-colors cursor-pointer`}
                      />

                      {/* ツールチップ：activeCommentId と一致する場合のみ表示 */}
                      {activeCommentId === p.id && (
                        <>
                          {/* 背後に透明な画面を敷いて、外側タップで閉じれるようにする */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCommentId(null);
                            }}
                          />

                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-gray-900 text-white text-base rounded-2xl z-50 shadow-2xl animate-in fade-in zoom-in duration-200">
                            <p className="font-medium leading-relaxed wrap-break-word">
                              {p.comment}
                            </p>
                            {/* 吹き出しの三角 */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 自分の回答エリア */}
      <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-3">
        <CheckCircle2 className="text-blue-600" /> 自分の回答
      </h3>
      <section className="space-y-4 bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              id: "attending",
              label: "参加",
              icon: CheckCircle2,
              active:
                "bg-emerald-500 text-white border-emerald-600 shadow-inner",
              inactive: "bg-white border-gray-200 text-gray-400 shadow-sm",
            },
            {
              id: "absent",
              label: "欠席",
              icon: XCircle,
              active: "bg-red-500 text-white border-red-600 shadow-inner",
              inactive: "bg-white border-gray-200 text-gray-400 shadow-sm",
            },
            {
              id: "pending",
              label: "未定",
              icon: HelpCircle,
              active: "bg-amber-500 text-white border-amber-600 shadow-inner",
              inactive: "bg-white border-gray-200 text-gray-400 shadow-sm",
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatus(item.id as any)}
              className={`flex flex-col items-center py-5 rounded-4xl border-2 border-b-4 transition-all gap-1 cursor-pointer active:translate-y-0.5 active:border-b-2 ${status === item.id ? item.active : `${item.inactive} hover:border-gray-300 hover:bg-gray-50`}`}
            >
              <item.icon size={36} strokeWidth={2.5} />
              <span className="font-black text-xl">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 助っ人・コメント入力*/}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <UserPlus className="text-gray-400" />
            <span className="font-bold text-gray-600">助っ人を連れていく</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 w-fit">
            <button
              onClick={() => setHelpers(Math.max(0, helpers - 1))}
              className="w-10 h-10 bg-white rounded shadow-sm font-bold cursor-pointer"
            >
              -
            </button>
            <span className="font-black w-4 text-center">{helpers}</span>
            <button
              onClick={() => setHelpers(helpers + 1)}
              className="w-10 h-10 bg-white rounded shadow-sm font-bold cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <textarea
          placeholder="連絡事項があれば入力（遅刻、車出せます等）"
          className="w-full h-20 bg-gray-50 rounded-2xl p-3 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:bg-gray-300 cursor-pointer"
        >
          <Save size={24} />
          {isSaving ? "保存中..." : "回答を保存する"}
        </button>
      </section>
    </div>
  );
}
