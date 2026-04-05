"use client";
import { Suspense } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

function QuickScoreFormContent() {
  const searchParams = useSearchParams();

  const decodeSafely = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const parseLiffState = () => {
    const rawState =
      searchParams.get("liff.state") ?? searchParams.get("state");
    if (!rawState) {
      return new URLSearchParams();
    }

    const state = decodeSafely(rawState);
    const query = state.startsWith("?") ? state.slice(1) : state;
    const params = new URLSearchParams(query);

    // 一部環境では値がさらにエンコードされて渡るため、1段だけデコードして復元する
    const normalized = new URLSearchParams();
    for (const [key, value] of params.entries()) {
      normalized.set(key, decodeSafely(value));
    }

    return normalized;
  };

  const liffStateParams = parseLiffState();
  const pickParam = (key: string, fallback: string) =>
    searchParams.get(key) ?? liffStateParams.get(key) ?? fallback;
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [resultType, setResultType] = useState<
    "normal" | "canceled" | "forfeit-away" | "forfeit-home"
  >("normal");
  const [isResultTypeOpen, setIsResultTypeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const gameDate = pickParam("date", "日付未設定");
  const gameTime = pickParam("time", "時間未設定");
  const gameId = pickParam("gameId", "");
  const awayTeamName = pickParam("awayTeam", "未定");
  const homeTeamName = pickParam("homeTeam", "未定");

  const normalizeScoreInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 2);
    if (digitsOnly === "") {
      return "";
    }

    return String(Math.min(Number(digitsOnly), 99));
  };

  const isScoreDisabled = resultType !== "normal";

  const selectedResultTypeLabel =
    resultType === "normal"
      ? "通常（スコア入力）"
      : resultType === "canceled"
        ? "中止"
        : resultType === "forfeit-away"
          ? `不戦勝: ${awayTeamName}`
          : `不戦勝: ${homeTeamName}`;

  const handleSubmit = async () => {
    setSubmitMessage("");
    setSubmitError("");

    if (!gameId) {
      setSubmitError(
        "試合IDがありません。LINE通知のリンクから再度開いてください。",
      );
      return;
    }

    let home: number | null = null;
    let away: number | null = null;
    let canceled = false;
    let forfeitWinner: "away" | "home" | null = null;

    if (resultType === "canceled") {
      canceled = true;
    } else if (resultType === "forfeit-away") {
      forfeitWinner = "away";
    } else if (resultType === "forfeit-home") {
      forfeitWinner = "home";
    } else {
      home = Number(homeScore);
      away = Number(awayScore);
      const hasInvalidInput =
        homeScore.trim() === "" ||
        awayScore.trim() === "" ||
        !Number.isInteger(home) ||
        !Number.isInteger(away) ||
        home < 0 ||
        away < 0 ||
        home > 99 ||
        away > 99;

      if (hasInvalidInput) {
        setSubmitError("得点は0以上99以下の整数で入力してください。");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/penpen_league/api/line/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId,
          homeScore: home,
          awayScore: away,
          canceled,
          forfeitWinner,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setSubmitError(
          data?.message ??
            "保存に失敗しました。時間をおいて再度お試しください。",
        );
        return;
      }

      setSubmitMessage("保存しました。");
    } catch (error) {
      console.error("[lineform submit]", error);
      setSubmitError(
        "通信エラーが発生しました。時間をおいて再度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  };

  // Compact表示向けに余白とサイズを調整
  const inputClass =
    "w-full text-center text-4xl font-black py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:bg-blue-50 outline-none transition-all";

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4">
      <div className="max-w-sm mx-auto space-y-4">
        <h1 className="text-xl font-black text-center text-slate-800">
          試合結果の登録
        </h1>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 space-y-1">
            <p>
              <span className="font-semibold text-slate-900">試合日時:</span>{" "}
              {gameDate} {gameTime}
            </p>
          </div>

          <details
            className="rounded-xl border border-slate-200 bg-slate-50"
            onToggle={(event) => {
              setIsResultTypeOpen(event.currentTarget.open);
            }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-bold text-slate-700">
              <span>
                試合結果区分:{" "}
                <span className="text-blue-700">{selectedResultTypeLabel}</span>
              </span>
              <span className="text-xs text-slate-500">
                {isResultTypeOpen ? "▲ 閉じる" : "▼ 開く"}
              </span>
            </summary>
            <div className="border-t border-slate-200 p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="resultType"
                  value="normal"
                  checked={resultType === "normal"}
                  onChange={() => setResultType("normal")}
                />
                通常（スコア入力）
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="resultType"
                  value="canceled"
                  checked={resultType === "canceled"}
                  onChange={() => {
                    setResultType("canceled");
                    setHomeScore("");
                    setAwayScore("");
                  }}
                />
                中止
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="resultType"
                  value="forfeit-away"
                  checked={resultType === "forfeit-away"}
                  onChange={() => {
                    setResultType("forfeit-away");
                    setHomeScore("");
                    setAwayScore("");
                  }}
                />
                不戦勝: {awayTeamName}
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="resultType"
                  value="forfeit-home"
                  checked={resultType === "forfeit-home"}
                  onChange={() => {
                    setResultType("forfeit-home");
                    setHomeScore("");
                    setAwayScore("");
                  }}
                />
                不戦勝: {homeTeamName}
              </label>
            </div>
          </details>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-blue-700 text-center">
                {awayTeamName}
              </label>
              <input
                type="number"
                maxLength={2}
                className={inputClass}
                min={0}
                max={99}
                value={awayScore}
                onChange={(e) =>
                  setAwayScore(normalizeScoreInput(e.target.value))
                }
                disabled={isScoreDisabled}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-red-700 text-center">
                {homeTeamName}
              </label>
              <input
                type="number"
                maxLength={2}
                className={inputClass}
                min={0}
                max={99}
                value={homeScore}
                onChange={(e) =>
                  setHomeScore(normalizeScoreInput(e.target.value))
                }
                disabled={isScoreDisabled}
              />
            </div>
          </div>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="w-full mt-1 bg-blue-600 text-white text-lg font-black py-4 rounded-xl shadow active:scale-95 transition-all disabled:bg-slate-300"
          >
            {loading ? "保存中..." : "結果を送信する"}
          </button>

          {submitMessage ? (
            <p className="text-center text-sm font-semibold text-emerald-700">
              {submitMessage}
            </p>
          ) : null}
          {submitError ? (
            <p className="text-center text-sm font-semibold text-rose-700">
              {submitError}
            </p>
          ) : null}
        </div>

        <p className="text-center text-slate-400 text-xs">
          ※保存するとチーム全員に通知されます
        </p>
      </div>
    </div>
  );
}

export default function QuickScoreForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-3 py-4">
          <div className="max-w-sm mx-auto space-y-4">
            <h1 className="text-xl font-black text-center text-slate-800">
              試合結果の登録
            </h1>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center text-sm text-slate-500">
              読み込み中...
            </div>
          </div>
        </div>
      }
    >
      <QuickScoreFormContent />
    </Suspense>
  );
}
