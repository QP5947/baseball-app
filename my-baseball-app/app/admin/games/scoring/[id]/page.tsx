"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Repeat } from "lucide-react";

export default function RealTimeScoringPage() {
  const [mode, setMode] = useState<"lineup" | "offense" | "defense">("lineup");
  const [inning, setInning] = useState(1);
  const [isTop, setIsTop] = useState(true); // 表・裏

  // メニュー管理
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // メニュー管理
  const [isEndButtonOpen, setIsEndButtonOpen] = useState(false);

  // メニュー用のアクション
  const skipOrder = () => {
    moveOrder(1);
    setIsMenuOpen(false);
  };

  // 現在の打者（送信ごとにインデックスを増やす想定）
  const [currentOrder, setCurrentOrder] = useState(1);

  // イニング得点の管理
  const [inningScore, setInningScore] = useState(0);

  // 走者データ
  const [runners, setRunners] = useState([
    { base: 3, name: "山下 剛", sb: 0, cs: 0, runs: 0 },
    { base: 2, name: "櫛田 亮", sb: 0, cs: 0, runs: 0 },
    { base: 1, name: "市橋 翼", sb: 0, cs: 0, runs: 0 },
  ]);

  const moveOrder = (delta: number) => {
    let next = currentOrder + delta;
    if (next < 1) next = 9;
    if (next > 9) next = 1;
    setCurrentOrder(next);
  };

  const updateRunner = (
    index: number,
    field: "sb" | "cs" | "runs",
    delta: number,
  ) => {
    const newRunners = [...runners];
    newRunners[index][field] = Math.max(0, newRunners[index][field] + delta);
    setRunners(newRunners);
  };

  // 入力フォームの状態
  const [battingResult, setBattingResult] = useState("");
  const [direction, setDirection] = useState("");
  const [rbi, setRbi] = useState(0);

  const handleSubmit = () => {
    alert(
      `登録完了: ${currentOrder}番バッター\n結果: ${battingResult}\n方向: ${direction}\n打点: ${rbi}`,
    );

    // 次のバッターへ（9番の次は1番に戻る）
    setCurrentOrder(currentOrder < 9 ? currentOrder + 1 : 1);

    // フォームをリセット
    setBattingResult("");
    setDirection("");
    setRbi(0);
  };

  return (
    <div className="min-h-screen bg-slate-200  text-slate-900 pb-24 select-none">
      {/* --- ヘッダー：現在のスコアと状況 --- */}
      <header
        className={`bg-slate-100 p-4 sticky top-0 z-40 border-b-2 border-slate-300 shadow-sm ${
          mode === "lineup" ? "hidden" : ""
        }`}
      >
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Inning
            </span>
            <span className="text-xl font-black italic leading-none text-blue-700">
              {inning}回{isTop ? "表" : "裏"}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase mb-1">
              Inning Score
            </span>
            <div className="flex items-center gap-3 bg-white px-4 py-1 rounded-full border-2 border-slate-700">
              <button
                onClick={() => setInningScore(Math.max(0, inningScore - 1))}
                className="text-slate-400 font-black w-6 text-xl"
              >
                -
              </button>
              <span className="text-2xl font-black italic text-slate-900 w-4 text-center">
                {inningScore}
              </span>
              <button
                onClick={() => setInningScore(inningScore + 1)}
                className="text-slate-400 font-black w-6 text-xl"
              >
                +
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-500 font-black uppercase text-[10px]">
              Score
            </p>
            <span className="text-2xl font-black italic tracking-widest text-slate-900">
              3 - 1
            </span>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* --- 1. オーダー設定モード --- */}
        {mode === "lineup" && (
          <section className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/admin/games"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">スコア入力</h1>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <div
                  key={num}
                  className="flex gap-2 bg-white p-3 rounded-xl border border-slate-700 items-center"
                >
                  <span className="w-6 font-black italic text-slate-500">
                    {num}
                  </span>
                  <select className="flex-1 bg-transparent font-bold">
                    <option>選手を選択</option>
                    <option>市橋 翼 (#51)</option>
                  </select>
                  <select className="w-16 bg-slate-100 border rounded p-1">
                    <option>中</option>
                    <option>遊</option>
                  </select>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- 2. 攻撃中モード --- */}
        {mode === "offense" && (
          <section className="bg-slate-100 rounded-[2.5rem] border-4 border-slate-300 p-6 shadow-2xl relative overflow-hidden mb-5">
            {/* 打者切り替えナビゲーション */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => moveOrder(-1)}
                className="w-10 h-10 rounded-full bg-white border-2 border-slate-700 text-slate-700 flex items-center justify-center"
              >
                ◀
              </button>
              <div className="text-center">
                <h2 className="text-3xl font-black italic">
                  <span className="text-blue-600 mr-1">{currentOrder}.</span>
                  市橋 翼
                </h2>
              </div>
              <button
                onClick={() => moveOrder(1)}
                className="w-10 h-10 rounded-full bg-white border-2 border-slate-700 text-slate-700 flex items-center justify-center"
              >
                ▶
              </button>
            </div>

            {/* 選手交代ボタンを打者のすぐ下に配置 */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-full mb-6 py-3 bg-blue-50 border-2 border-blue-700 rounded-xl font-black text-blue-700 uppercase tracking-[0.2em]"
            >
              選手交代・打順メニュー ☰
            </button>

            {/* --- 1. 打席入力（メイン：画面上部） --- */}
            <div className="space-y-5">
              {/* 結果プルダウン */}
              <div>
                <label className="font-black text-slate-900 ml-1">
                  打席結果
                </label>
                <select
                  value={battingResult}
                  onChange={(e) => setBattingResult(e.target.value)}
                  className="w-full bg-white border-2 border-slate-800 rounded-2xl p-4 font-bold text-lg mt-1 outline-none appearance-none"
                >
                  <option value="">選択してください...</option>
                  <optgroup label="ヒット系">
                    <option value="H">単打</option>
                    <option value="2B">二塁打</option>
                    <option value="3B">三塁打</option>
                    <option value="HR">本塁打</option>
                  </optgroup>
                  <optgroup label="アウト系">
                    <option value="K">三振</option>
                    <option value="GO">ゴロ</option>
                    <option value="FO">フライ</option>
                    <option value="LO">ライナー</option>
                  </optgroup>
                  <optgroup label="四死球・その他">
                    <option value="BB">四球</option>
                    <option value="HBP">死球</option>
                    <option value="SAC">バント</option>
                    <option value="SF">犠飛</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 方向プルダウン */}
                <div>
                  <label className="font-black text-slate-900 ml-1">
                    打球方向
                  </label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full bg-white border-2 border-slate-800 rounded-2xl p-4 font-bold mt-1"
                  >
                    <option value="">方向...</option>
                    {["投", "捕", "一", "二", "三", "遊", "左", "中", "右"].map(
                      (n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                {/* 打点カウンター */}
                <div>
                  <label className="font-black text-slate-900 ml-1">打点</label>
                  <div className="flex items-center bg-white border-2 border-slate-900 rounded-2xl p-1.5 mt-1">
                    <button
                      onClick={() => setRbi(Math.max(0, rbi - 1))}
                      className="w-10 h-10 bg-slate-100 rounded-lg font-black text-xl border border-slate-300"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-black text-2xl">
                      {rbi}
                    </span>
                    <button
                      onClick={() => setRbi(rbi + 1)}
                      className="w-10 h-10 bg-blue-700 text-white rounded-lg font-black text-xl"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!battingResult}
                className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 ${
                  battingResult
                    ? "bg-blue-600 text-white shadow-blue-900/20"
                    : "bg-blue-200 text-white cursor-not-allowed"
                }`}
              >
                登録して次の打者へ
              </button>
            </div>

            {/* --- 2. 走者イベント（補足：画面下部） --- */}
            <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] ml-2 flex items-center gap-2 mt-6 mb-3">
              <span className="w-4 h-px bg-slate-700"></span>
              走者記録
            </h3>
            <div className="space-y-3">
              {runners.map((runner, idx) => (
                <div
                  key={idx}
                  className="bg-slate-200 border-2 rounded-3xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold mr-1">
                      {runner.base}.
                    </span>
                    <span className="font-black ">{runner.name}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* 各ボタンにプラスとマイナスを配置 */}
                    {[
                      { label: "盗塁", key: "sb", color: "blue" },
                      { label: "盗死", key: "cs", color: "orange" },
                      { label: "得点", key: "runs", color: "emerald" },
                    ].map((btn) => (
                      <div key={btn.key} className="flex flex-col gap-1">
                        <span className="font-black text-slate-800 text-center tracking-tighter">
                          {btn.label}
                        </span>
                        <div className="bg-white rounded-xl p-1 flex items-center justify-between border border-slate-800">
                          <button
                            onClick={() =>
                              updateRunner(idx, btn.key as any, -1)
                            }
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
            </div>
          </section>
        )}

        {/* --- 3. 守備中モード --- */}
        {mode === "defense" && (
          <section className="bg-slate-100 rounded-[2.5rem] border-2 border-slate-300 p-6 shadow-2xl relative overflow-hidden mb-5">
            {/* 打者切り替えナビゲーション */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => moveOrder(-1)}
                className="w-10 h-10 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center"
              >
                ◀
              </button>
              <div className="p-4 ">
                <span className="text-slate-500 font-bold">4 イニング目</span>

                <div className="flex justify-between items-end">
                  <h3 className="text-3xl font-black text-slate-800">
                    近藤 健太
                  </h3>
                </div>
              </div>
              <button
                onClick={() => moveOrder(1)}
                className="w-10 h-10 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center"
              >
                ▶
              </button>
            </div>

            {/* 選手交代ボタンを打者のすぐ下に配置 */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-full mb-6 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl font-black text-blue-700 uppercase tracking-[0.2em]"
            >
              投手・守備交代 ☰
            </button>

            <div className="bg-white p-2 rounded-2xl border-2 border-slate-800 mb-3">
              <p className="text-slate-900 font-bold text-center">失点</p>
              <div className="flex justify-center gap-6">
                <button className="w-10 h-10 bg-slate-100 rounded-lg font-black text-xl border border-slate-300">
                  -
                </button>
                <span className="text-3xl font-black italic">0</span>
                <button className="w-10 h-10 bg-blue-700 text-white rounded-lg font-black text-xl">
                  +
                </button>
              </div>
            </div>
            <div className="bg-white p-2 rounded-2xl border-2 border-slate-800 mb-3">
              <p className="text-slate-900 font-bold text-center">奪三振</p>
              <div className="flex justify-center gap-6">
                <button className="w-10 h-10 bg-slate-100 rounded-lg font-black text-xl border border-slate-300">
                  -
                </button>
                <span className="text-3xl font-black italic">0</span>
                <button className="w-10 h-10 bg-blue-700 text-white rounded-lg font-black text-xl">
                  +
                </button>
              </div>
            </div>
            <div className="bg-white p-2 rounded-2xl border-2 border-slate-800 mb-3">
              <p className="text-slate-900 font-bold text-center">四球</p>
              <div className="flex justify-center gap-6">
                <button className="w-10 h-10 bg-slate-100 rounded-lg font-black text-xl border border-slate-300">
                  -
                </button>
                <span className="text-3xl font-black italic">0</span>
                <button className="w-10 h-10 bg-blue-700 text-white rounded-lg font-black text-xl">
                  +
                </button>
              </div>
            </div>
            <div className="bg-white p-2 rounded-2xl border-2 border-slate-800 mb-3">
              <p className="text-slate-900 font-bold text-center">死球</p>
              <div className="flex justify-center gap-6">
                <button className="w-10 h-10 bg-slate-100 rounded-lg font-black text-xl border border-slate-300">
                  -
                </button>
                <span className="text-3xl font-black italic">0</span>
                <button className="w-10 h-10 bg-blue-700 text-white rounded-lg font-black text-xl">
                  +
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* 背景オーバーレイ */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          {/* メニュー本体 */}
          <div className="relative bg-slate-100 border-t border-slate-700 rounded-t-4xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-900 rounded-full mx-auto mb-6"></div>

            <h3 className="font-black text-center mb-6 text-slate-800 uppercase tracking-widest">
              選手メニュー
            </h3>

            {mode === "offense" ? (
              <div className="grid grid-cols-3 gap-3 mb-8">
                {/* 代打アクション */}
                <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl active:bg-blue-600 group transition-colors">
                  <span className="text-2xl">⚡</span>
                  <span className="font-black text-[12px]">代打を送る</span>
                </button>

                {/* 打順操作アクション */}
                <button
                  onClick={skipOrder}
                  className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl active:bg-orange-600 transition-colors"
                >
                  <span className="text-2xl">⏭️</span>
                  <span className="font-black text-[12px]">打順を飛ばす</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl active:bg-emerald-600 transition-colors">
                  <span className="text-2xl">➕</span>
                  <span className="font-black text-[12px]">打順を追加</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 mb-8">
                {/* 投手交代アクション */}
                <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl active:bg-blue-600 group transition-colors">
                  <span className="text-2xl">⚡</span>
                  <span className="font-black">投手交代</span>
                </button>

                {/* 守備交代アクション */}
                <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-700 rounded-2xl active:bg-orange-600 transition-colors">
                  <span className="text-2xl">⏭️</span>
                  <span className="font-black">守備交代</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-full py-4 bg-slate-100 border-2 rounded-xl font-black"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* フッター：攻守交代 */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-slate-100 backdrop-blur-lg border-t border-slate-500">
        {mode === "lineup" ? (
          <button
            onClick={() => setMode("offense")}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all"
          >
            オーダーを確定して開始
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsEndButtonOpen(!isEndButtonOpen);
              }}
              className="bg-white border rounded-2xl p-4.5"
            >
              <Repeat />
            </button>
            {!isEndButtonOpen ? (
              <button
                onClick={() => {
                  if (mode === "offense") {
                    setMode("defense");
                    setIsTop(false);
                  } else {
                    setMode("offense");
                    setInning(inning + 1);
                    setIsTop(true);
                  }
                }}
                className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all"
              >
                攻守交替
              </button>
            ) : (
              <button
                onClick={() => {
                  if (window.confirm("試合を終了して結果を保存しますか？")) {
                    // 終了処理
                    alert("試合を終了しました");
                  }
                }}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all"
              >
                試合を終了 / 一時保存
              </button>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
