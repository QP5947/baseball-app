"use client";

import { Save, Trash2 } from "lucide-react";

interface GoalsDivision {
  no: number;
  goal_group_no: number | null;
  goal_name: string | null;
  goal_type: number | null;
  high_goal_flg: boolean | null;
}

interface Goal {
  player_id: string | null;
  team_id: string;
  year: number | null;
  goal_no: number | null;
  goal: string | null;
  memo: string | null;
  created_at: string;
}

interface Props {
  goal: Goal;
  division: GoalsDivision | undefined;
  groupName: string;
  editValue: { value: string; memo: string } | undefined;
  onUpdate: (value: string, memo: string) => void;
  onSave: () => void;
  onDelete: () => void;
  isPending: boolean;
}

export default function GoalItem({
  goal,
  division,
  groupName,
  editValue,
  onUpdate,
  onSave,
  onDelete,
  isPending,
}: Props) {
  const isCustomGoal = goal.goal_no === 99 || !division;
  const isEditing = editValue !== undefined;
  const currentValue = editValue?.value ?? goal.goal ?? "";
  const currentMemo = editValue?.memo ?? goal.memo ?? "";

  const goalName = isCustomGoal ? "カスタム目標" : division?.goal_name;

  // 数値に変換（率の目標の場合は％を削除）
  const numericValue =
    parseFloat(currentValue.toString().replace("%", "")) || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 animate-in zoom-in-95 duration-200 group">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 左側：目標情報 */}
        <div className="flex-1 space-y-5">
          {/* ヘッダー */}
          <div className="flex justify-between items-start">
            <div>
              <span className="font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase mb-1 inline-block tracking-tighter text-xs">
                {groupName}
              </span>
              <h3 className="text-lg font-bold text-gray-800 mt-1">
                {goalName}
              </h3>
            </div>
            <button
              onClick={onDelete}
              disabled={isPending}
              className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* 入力エリア */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 目標値入力 */}
            <div>
              <p className="text-blue-600 font-bold uppercase mb-2 text-sm">
                目標値を入力
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0"
                  value={currentValue}
                  onChange={(e) => onUpdate(e.target.value, currentMemo)}
                  disabled={isPending}
                  className={`w-full text-2xl font-black bg-blue-50/50 border-2 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50 ${
                    isEditing && currentValue !== goal.goal
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-900"
                  }`}
                />
                {!isCustomGoal && division?.goal_type === 2 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-400">
                    %
                  </span>
                )}
              </div>
            </div>

            {/* 達成率表示（数値目標の場合のみ） */}
            {!isCustomGoal && division?.goal_type === 1 && (
              <div>
                <p className="text-gray-400 font-bold uppercase mb-2 text-sm">
                  進捗状況
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-700"
                      style={{
                        width: `${
                          numericValue > 0
                            ? Math.min((numericValue / numericValue) * 100, 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="font-black text-blue-600 text-sm min-w-12">
                    {currentValue}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右側：メモ */}
        <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
          <p className="text-gray-400 font-bold uppercase mb-2 tracking-widest text-sm">
            メモ
          </p>
          <textarea
            placeholder="達成のための秘策を記入..."
            value={currentMemo}
            onChange={(e) => onUpdate(currentValue, e.target.value)}
            disabled={isPending}
            className="w-full h-20 bg-transparent font-medium text-gray-600 focus:outline-none placeholder:text-gray-300 resize-none leading-relaxed border-b md:border-b-0 md:border-l-2 md:pl-4 border-gray-200 disabled:opacity-50"
          />

          {/* 保存ボタン */}
          {isEditing && (
            <button
              onClick={onSave}
              disabled={isPending}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={16} />
              保存
            </button>
          )}
          {!isEditing && goal.goal && (
            <p className="w-full mt-4 text-center text-xs text-gray-400 font-semibold">
              保存済み
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
