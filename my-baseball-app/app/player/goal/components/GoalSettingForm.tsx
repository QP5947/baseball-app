"use client";

import { formatRate } from "@/utils/rateFormat";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Award,
  ChevronRight,
  GripVertical,
  Plus,
  Save,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import PlayerMenu from "../../components/PlayerMenu";
import {
  addGoal,
  deleteGoal,
  fetchPlayerGoals,
  saveGoal,
  updateGoalSort,
} from "../actions";

const GOAL_GROUP_NAMES = {
  1: "打撃",
  2: "走塁",
  3: "守備",
  4: "投球",
  99: "その他",
};

interface GoalsDivision {
  no: number;
  goal_group_no: number | null;
  goal_name: string | null;
  goal_type: number | null;
  high_goal_flg: boolean | null;
  table_name: string | null;
  column_name: string | null;
}

interface Goal {
  player_id: string;
  team_id: string;
  year: number;
  goal_no: number;
  goal_value: string | null;
  memo: string | null;
  sort: number | null;
  created_at: string;
}

interface Props {
  playerNo: string | null;
  playerName: string;
  playerId: string;
  teamId: string;
  goalsDivisions: GoalsDivision[];
  initialGoals: Goal[];
  availableYears: number[];
  defaultYear: number;
  playerStats: any;
}

// ドラッグ可能なGoalItemコンポーネント
function SortableGoalItem({
  goal,
  children,
}: {
  goal: Goal;
  children: (dragHandleProps: {
    setActivatorNodeRef: (element: HTMLElement | null) => void;
    attributes: any;
    listeners: any;
  }) => React.ReactNode;
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: goal.goal_no || 0,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ setActivatorNodeRef, attributes, listeners })}
    </div>
  );
}

export default function GoalSettingForm({
  playerNo,
  playerName,
  playerId,
  teamId,
  goalsDivisions,
  initialGoals,
  availableYears,
  defaultYear,
  playerStats: initialPlayerStats,
}: Props) {
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [playerStats, setPlayerStats] = useState(initialPlayerStats);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editValues, setEditValues] = useState<
    Record<number, { value: string; memo: string }>
  >({});

  // Dnd-kitセンサーの設定
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

  // ドラッグ終了時のハンドラー
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = goals.findIndex((g) => g.goal_no === active.id);
      const newIndex = goals.findIndex((g) => g.goal_no === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newGoals = arrayMove(goals, oldIndex, newIndex);
        setGoals(newGoals);

        // sort値を更新
        startTransition(async () => {
          for (let i = 0; i < newGoals.length; i++) {
            const goal = newGoals[i];
            if (goal.goal_no) {
              try {
                await updateGoalSort(
                  playerId,
                  teamId,
                  selectedYear,
                  goal.goal_no,
                  i,
                );
              } catch (error) {
                console.error("Error updating sort:", error);
              }
            }
          }
        });
      }
    }
  };

  // グループごとに目標を分類
  const groupedDivisions = [1, 2, 3, 4, 99].map((groupNo) => ({
    groupNo,
    name: GOAL_GROUP_NAMES[groupNo as keyof typeof GOAL_GROUP_NAMES],
    items: goalsDivisions.filter((d) => d.goal_group_no === groupNo),
  }));

  const currentGroupDivisions = selectedGroup
    ? goalsDivisions.filter((d) => d.goal_group_no === selectedGroup)
    : [];

  // 実績値を取得する関数
  const getActualValue = (goalNo: number): number | string => {
    if (!playerStats) return 0;

    const division = goalsDivisions.find((d) => d.no === goalNo);
    if (!division) return 0;

    // table_name と column_name が設定されている場合はそれを使用
    if (
      division.column_name &&
      playerStats[division.column_name] !== undefined
    ) {
      const value = playerStats[division.column_name];
      // 値がnullやundefinedの場合は0を返す、それ以外はそのまま返す
      return value ?? 0;
    }

    return 0;
  };
  const handleYearChange = async (year: number) => {
    setSelectedYear(year);
    startTransition(async () => {
      const { fetchPlayerYearlyStats } = await import("../actions");
      const [updatedGoals, updatedStats] = await Promise.all([
        fetchPlayerGoals(playerId, teamId, year),
        fetchPlayerYearlyStats(playerId, teamId, year),
      ]);
      setGoals(updatedGoals);
      setPlayerStats(updatedStats);
      setEditValues({});
    });
  };

  // 目標追加
  const handleAddGoal = (goalNo: number) => {
    const division = goalsDivisions.find((d) => d.no === goalNo);
    if (!division) return;

    // 既に存在するかチェック
    const existingGoal = goals.find((g) => g.goal_no === goalNo);
    if (existingGoal) {
      setIsModalOpen(false);
      setSelectedGroup(null);
      return;
    }

    const newGoal: Goal = {
      player_id: playerId,
      team_id: teamId,
      year: selectedYear,
      goal_no: goalNo,
      goal_value: "",
      memo: null,
      sort: 0,
      created_at: new Date().toISOString(),
    };

    // 既存の目標のsortを1ずつインクリメント
    const updatedGoals = goals.map((g) => ({
      ...g,
      sort: (g.sort || 0) + 1,
    }));

    setGoals([newGoal, ...updatedGoals]);

    // サーバーに既存goalのsort更新と新しいgoalの追加を通知
    startTransition(async () => {
      try {
        const existingGoals = updatedGoals.map((g) => ({
          goal_no: g.goal_no,
          sort: g.sort,
        }));
        await addGoal(playerId, teamId, selectedYear, goalNo, existingGoals);
      } catch (error) {
        console.error("Error adding goal:", error);
        // エラーの場合はローカル状態をロールバック
        setGoals(goals);
      }
    });

    setIsModalOpen(false);
    setSelectedGroup(null);
  };

  // 目標値更新
  const handleUpdateGoal = (goalNo: number, value: string, memo: string) => {
    setEditValues((prev) => ({
      ...prev,
      [goalNo]: { value, memo },
    }));
  };

  // 目標保存
  const handleSaveGoal = (goalNo: number) => {
    const editValue = editValues[goalNo];
    if (!editValue) return;

    const goalToSave = goals.find((g) => g.goal_no === goalNo);
    const sort = goalToSave?.sort || 0;

    startTransition(async () => {
      try {
        await saveGoal(
          playerId,
          teamId,
          selectedYear,
          goalNo,
          editValue.value,
          editValue.memo || null,
          sort,
        );

        // ローカル状態を更新
        setGoals((prev) =>
          prev.map((g) =>
            g.goal_no === goalNo
              ? {
                  ...g,
                  goal_value: editValue.value,
                  memo: editValue.memo || null,
                }
              : g,
          ),
        );

        // 編集値をクリア
        setEditValues((prev) => {
          const newState = { ...prev };
          delete newState[goalNo];
          return newState;
        });
      } catch (error) {
        console.error("Error saving goal:", error);
      }
    });
  };

  // 目標削除
  const handleDeleteGoal = (goalNo: number) => {
    if (confirm("この目標を削除してもよろしいですか？")) {
      startTransition(async () => {
        try {
          // 削除後に残るゴールの一覧を取得
          const remainingGoals = goals
            .filter((g) => g.goal_no !== goalNo)
            .map((g) => ({ goal_no: g.goal_no || 0, sort: g.sort }));

          await deleteGoal(
            playerId,
            teamId,
            selectedYear,
            goalNo,
            remainingGoals,
          );
          setGoals((prev) => prev.filter((g) => g.goal_no !== goalNo));
        } catch (error) {
          console.error("Error deleting goal:", error);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex text-gray-800 relative">
      <PlayerMenu no={playerNo} name={playerName}>
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target size={28} className="text-blue-600" />
            個人目標設定
          </h1>
        </header>

        {/* 年度選択 */}
        <div className="mb-6 flex items-center gap-3">
          <label className="font-bold text-gray-600 uppercase tracking-wider">
            年度選択
          </label>
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            disabled={isPending}
            className="px-4 py-2 border border-gray-200 rounded-lg font-semibold text-gray-700 bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}年度
              </option>
            ))}
          </select>
        </div>

        <section className="space-y-4">
          {/* ヘッダー */}
          <div className="flex justify-between items-center px-1">
            <h2 className="font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Award size={20} /> 目標リスト
            </h2>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setSelectedGroup(null);
              }}
              disabled={isPending}
              className="font-bold text-blue-600 bg-white border border-blue-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Plus size={16} /> 目標を追加
            </button>
          </div>

          {/* 目標一覧 */}
          {goals.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <Award size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">目標がまだ設定されていません。</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={goals.map((g) => g.goal_no || 0)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {goals.map((goal) => {
                    const division = goalsDivisions.find(
                      (d) => d.no === goal.goal_no,
                    );
                    const groupName = division
                      ? GOAL_GROUP_NAMES[
                          division.goal_group_no as keyof typeof GOAL_GROUP_NAMES
                        ]
                      : "その他";

                    const isCustomGoal = goal.goal_no === 99 || !division;
                    const isEditing =
                      editValues[goal.goal_no || 0] !== undefined;
                    const currentValue =
                      editValues[goal.goal_no || 0]?.value ??
                      goal.goal_value ??
                      "";
                    const currentMemo =
                      editValues[goal.goal_no || 0]?.memo ?? goal.memo ?? "";
                    const goalName = isCustomGoal
                      ? "カスタム目標"
                      : division?.goal_name;
                    const numericValue =
                      parseFloat(currentValue.toString().replace("%", "")) || 0;

                    return (
                      <SortableGoalItem goal={goal} key={goal.goal_no}>
                        {({ setActivatorNodeRef, attributes, listeners }) => (
                          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 animate-in zoom-in-95 duration-200 group">
                            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                              {/* ドラッグハンドルと目標情報の左側グループ */}
                              <div className="flex-1 md:flex-initial flex flex-row gap-4 md:gap-6">
                                {/* ドラッグハンドルアイコン */}
                                <div
                                  ref={setActivatorNodeRef}
                                  {...attributes}
                                  {...listeners}
                                  className="flex items-center justify-center shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing bg-slate-50"
                                >
                                  <GripVertical size={20} />
                                </div>

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
                                      onClick={() =>
                                        handleDeleteGoal(goal.goal_no || 0)
                                      }
                                      disabled={isPending}
                                      className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>

                                  {/* 入力エリア */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* 実績値表示（その他以外） */}
                                    {!isCustomGoal && (
                                      <div>
                                        <p className="text-gray-600 font-bold uppercase mb-2">
                                          実績値
                                        </p>
                                        <div className="text-2xl font-black text-gray-900 px-3 py-2">
                                          {division?.goal_type === 3
                                            ? `${Math.round(Number(getActualValue(goal.goal_no || 0)) * 100)}%`
                                            : division?.goal_type === 2
                                              ? formatRate(
                                                  Number(
                                                    getActualValue(
                                                      goal.goal_no || 0,
                                                    ),
                                                  ),
                                                )
                                              : getActualValue(
                                                  goal.goal_no || 0,
                                                )}
                                        </div>
                                      </div>
                                    )}

                                    {/* 目標値入力 */}
                                    <div>
                                      <p className="text-blue-600 font-bold uppercase mb-2">
                                        目標値を入力
                                      </p>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          step={
                                            !isCustomGoal &&
                                            division?.goal_type === 2
                                              ? "0.001"
                                              : "1"
                                          }
                                          placeholder={
                                            !isCustomGoal &&
                                            division?.goal_type === 2
                                              ? "0.000"
                                              : !isCustomGoal &&
                                                  division?.goal_type === 3
                                                ? "0"
                                                : "0"
                                          }
                                          value={currentValue}
                                          onChange={(e) =>
                                            handleUpdateGoal(
                                              goal.goal_no || 0,
                                              e.target.value,
                                              currentMemo,
                                            )
                                          }
                                          disabled={isPending}
                                          className={`w-full text-2xl font-black bg-blue-50/50 border-2 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50 ${
                                            isEditing &&
                                            currentValue !== goal.goal_value
                                              ? "border-blue-500 text-blue-600"
                                              : "border-transparent text-gray-900"
                                          }`}
                                        />
                                        {!isCustomGoal &&
                                          division?.goal_type === 3 && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-400">
                                              %
                                            </span>
                                          )}
                                      </div>
                                    </div>

                                    {/* 達成率表示 */}
                                    {!isCustomGoal && (
                                      <div>
                                        <p className="text-gray-400 font-bold uppercase mb-2">
                                          進捗状況
                                        </p>
                                        <div className="flex items-center gap-3">
                                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-blue-600 transition-all duration-700"
                                              style={{
                                                width: `${
                                                  numericValue > 0
                                                    ? (() => {
                                                        let actualValue =
                                                          Number(
                                                            getActualValue(
                                                              goal.goal_no || 0,
                                                            ),
                                                          );
                                                        // goal_type === 3の場合のみ実績値を100倍してパーセンテージに変換
                                                        if (
                                                          division?.goal_type ===
                                                          3
                                                        ) {
                                                          actualValue *= 100;
                                                        }
                                                        if (
                                                          division?.high_goal_flg
                                                        ) {
                                                          return (
                                                            (actualValue /
                                                              numericValue) *
                                                            100
                                                          );
                                                        } else {
                                                          return Math.max(
                                                            100 -
                                                              ((actualValue -
                                                                numericValue) /
                                                                numericValue) *
                                                                100,
                                                            0,
                                                          );
                                                        }
                                                      })()
                                                    : 0
                                                }%`,
                                              }}
                                            />
                                          </div>
                                          <span className="font-black text-blue-600 min-w-12">
                                            {numericValue > 0
                                              ? (() => {
                                                  let actualValue = Number(
                                                    getActualValue(
                                                      goal.goal_no || 0,
                                                    ),
                                                  );
                                                  // goal_type === 3の場合のみ実績値を100倍してパーセンテージに変換
                                                  if (
                                                    division?.goal_type === 3
                                                  ) {
                                                    actualValue *= 100;
                                                  }
                                                  let progress = 0;
                                                  if (division?.high_goal_flg) {
                                                    progress =
                                                      (actualValue /
                                                        numericValue) *
                                                      100;
                                                  } else {
                                                    progress = Math.max(
                                                      100 -
                                                        ((actualValue -
                                                          numericValue) /
                                                          numericValue) *
                                                          100,
                                                      0,
                                                    );
                                                  }
                                                  return `${Math.round(progress)}%`;
                                                })()
                                              : "0%"}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 右側：メモ */}
                              <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
                                <p className="text-gray-400 font-bold uppercase mb-2 tracking-widest">
                                  メモ
                                </p>
                                <textarea
                                  placeholder="達成のための秘策を記入..."
                                  value={currentMemo}
                                  onChange={(e) =>
                                    handleUpdateGoal(
                                      goal.goal_no || 0,
                                      currentValue,
                                      e.target.value,
                                    )
                                  }
                                  disabled={isPending}
                                  className="w-full h-20 bg-transparent font-medium text-gray-600 focus:outline-none placeholder:text-gray-300 resize-none leading-relaxed border-b md:border-b-0 md:border-l-2 md:pl-4 border-gray-200 disabled:opacity-50"
                                />

                                {/* 保存ボタン */}
                                {isEditing && (
                                  <button
                                    onClick={() =>
                                      handleSaveGoal(goal.goal_no || 0)
                                    }
                                    disabled={isPending}
                                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    <Save size={16} />
                                    保存
                                  </button>
                                )}
                                {!isEditing && goal.goal_value && (
                                  <p className="w-full mt-4 text-center text-gray-400 font-semibold">
                                    保存済み
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </SortableGoalItem>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>

        {/* モーダル：目標追加 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold">
                  {selectedGroup ? "目標を選択" : "カテゴリーを選択"}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedGroup(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                {selectedGroup === null ? (
                  // カテゴリー選択
                  <div className="space-y-2">
                    {groupedDivisions.map((group) => (
                      <button
                        key={group.groupNo}
                        onClick={() => setSelectedGroup(group.groupNo)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-all group cursor-pointer"
                      >
                        <span className="font-bold text-gray-700">
                          {group.name}
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-gray-300 group-hover:text-blue-500"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  // 目標選択
                  <div className="space-y-2">
                    {currentGroupDivisions.map((division) => (
                      <div key={division.no}>
                        <button
                          onClick={() => handleAddGoal(division.no)}
                          className="w-full text-left p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-all cursor-pointer"
                        >
                          <p className="font-bold text-gray-700">
                            {division.goal_name}
                          </p>
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => setSelectedGroup(null)}
                      className="w-full mt-4 p-2 text-gray-500 font-semibold hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                    >
                      ← 戻る
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PlayerMenu>
    </div>
  );
}
