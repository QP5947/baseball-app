"use client";

import {
  Award,
  ChevronRight,
  Plus,
  Save,
  ShieldCheck,
  Target,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import PlayerMenu from "../components/PlayerMenu";

export default function GoalSettingPage() {
  // 1. 目標リスト
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "シーズン安打数",
      target: 20,
      current: 13,
      unit: "本",
      category: "打撃",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCat, setSelectedCat] = useState<any>(null);

  const categories = [
    {
      id: "batting",
      name: "打撃",
      icon: Target,
      color: "text-blue-600",
      bg: "bg-blue-50",
      items: ["安打数", "打点", "本塁打", "打率", "OPS"],
    },
    {
      id: "running",
      name: "走塁",
      icon: Zap,
      color: "text-orange-600",
      bg: "bg-orange-50",
      items: ["盗塁成功数", "盗塁成功率"],
    },
    {
      id: "defense",
      name: "守備",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      items: ["守備率", "刺殺・補殺"],
    },
  ];

  // 目標追加：targetは0（未設定）で追加
  const addNewGoal = (title: string) => {
    const isRate = title.includes("率") || title === "OPS";
    const newGoal = {
      id: Date.now(),
      title: title,
      target: 0,
      current: 0,
      unit: isRate ? "" : "本",
      category: selectedCat.name,
    };
    setGoals([newGoal, ...goals]); // 新しいものを上に
    setIsModalOpen(false);
    setStep(1);
  };

  // 画面上で目標値を更新する関数
  const updateTarget = (id: number, value: number) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, target: value } : g)));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex text-gray-800 relative">
      <PlayerMenu>
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            個人目標設定
          </h1>
        </header>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Award size={20} /> 目標リスト
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-bold text-blue-600 bg-white border border-blue-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={16} /> 目標を追加
            </button>
          </div>

          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 animate-in zoom-in-95 duration-200 group"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-5">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase mb-1 inline-block tracking-tighter">
                        {goal.category}
                      </span>
                      <h3 className="text-lg font-bold text-gray-800">
                        {goal.title}
                      </h3>
                    </div>
                    <button
                      onClick={() =>
                        setGoals(goals.filter((g) => g.id !== goal.id))
                      }
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* 入力・数値エリア */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <p className="text-gray-400 font-bold uppercase mb-1.5">
                        現在の実績
                      </p>
                      <div className="text-2xl font-black text-gray-900 px-1">
                        {goal.current}
                        <span className="text-xs ml-1">{goal.unit}</span>
                      </div>
                    </div>

                    <div>
                      <p className=" text-blue-600 font-bold uppercase mb-1.5 flex items-center gap-1">
                        目標値を入力 <ChevronRight size={10} />
                      </p>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0"
                          value={goal.target === 0 ? "" : goal.target}
                          onChange={(e) =>
                            updateTarget(goal.id, Number(e.target.value))
                          }
                          className={`w-full text-2xl font-black text-blue-600 bg-blue-50/50 border-2 rounded-xl px-3 focus:outline-none focus:border-blue-500 transition-all ${
                            goal.target === 0
                              ? "border-blue-200 animate-pulse"
                              : "border-transparent"
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-400">
                          {goal.unit}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      <p className="text-gray-400 font-bold uppercase mb-1.5 text-right md:text-left">
                        達成率
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-700"
                            style={{
                              width: `${
                                goal.target > 0
                                  ? Math.min(
                                      (goal.current / goal.target) * 100,
                                      100,
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="font-black italic text-blue-600 text-xl min-w-12.5 text-right">
                          {goal.target > 0
                            ? Math.round((goal.current / goal.target) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 右側：意気込みメモ */}
                <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-gray-500 pt-4 md:pt-0 md:pl-6">
                  <p className=" text-gray-400 font-bold uppercase mb-2 tracking-widest">
                    Memo / Plan
                  </p>
                  <textarea
                    placeholder="達成のための秘策を記入..."
                    className="w-full h-20 bg-transparent font-medium text-gray-600 focus:outline-none placeholder:text-gray-300 resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          ))}
          <button className="w-50 max-w-md mx-auto bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-100 transition-transform active:scale-95">
            <Save size={20} />
            保存
          </button>
        </section>

        {/* モーダル */}
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold">目標を選択</h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setStep(1);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                {step === 1 ? (
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCat(cat);
                          setStep(2);
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <cat.icon size={18} className={cat.color} />
                          <span className="font-bold text-gray-700">
                            {cat.name}
                          </span>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-gray-300 group-hover:text-blue-500"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCat.items.map((item: string) => (
                      <button
                        key={item}
                        onClick={() => addNewGoal(item)}
                        className="p-3 text-sm font-bold text-gray-600 border border-gray-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                      >
                        {item}
                      </button>
                    ))}
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
