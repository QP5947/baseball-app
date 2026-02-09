"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { createClient } from "@/lib/supabase/client";
import { completeFirstLogin, FirstLoginState } from "../actions";

type PlayerOption = {
  id: string;
  name: string;
  no: string | null;
};

export default function FirstLoginForm() {
  const supabase = useMemo(() => createClient(), []);
  const [state, formAction, isPending] = useActionState<FirstLoginState, FormData>(
    completeFirstLogin,
    {}
  );

  const [teamId, setTeamId] = useState(state?.teamId || "");
  const [passphrase, setPassphrase] = useState(state?.passphrase || "");
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(
    state?.playerId || "",
  );
  const [loading, setLoading] = useState(false);

  const ERROR_MESSAGES: Record<string, string> = {
    missing: "すべての項目を入力してください。",
    invalid: "入力内容が一致しませんでした。確認して再入力してください。",
    password_mismatch: "パスワードが一致しません。",
    password: "パスワードの設定に失敗しました。再度お試しください。",
  };

  const errorMessage = state?.error ? ERROR_MESSAGES[state.error] : null;

  useEffect(() => {
    if (state?.teamId !== undefined) {
      setTeamId(state.teamId);
    }
    if (state?.passphrase !== undefined) {
      setPassphrase(state.passphrase);
    }
    if (state?.playerId !== undefined) {
      setSelectedPlayerId(state.playerId);
    }
  }, [state]);

  useEffect(() => {
    let active = true;

    if (!teamId || !passphrase) {
      setPlayers([]);
      setSelectedPlayerId("");
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      if (!active) return;

      // myteams から passphrase を確認
      const { data: teamData, error: teamError } = await supabase
        .from("myteams")
        .select("id")
        .eq("id", teamId)
        .eq("passphrase", passphrase)
        .maybeSingle();

      if (teamError || !teamData) {
        setPlayers([]);
        setSelectedPlayerId("");
        setLoading(false);
        return;
      }

      // 照合成功後、players を取得
      const { data, error: playerError } = await supabase
        .from("players")
        .select("id, name, no")
        .eq("team_id", teamId)
        .is("user_id", null)
        .order("sort", { ascending: true, nullsFirst: false })
        .order("no", { ascending: true, nullsFirst: false });

      if (!active) return;

      if (playerError) {
        setPlayers([]);
        setSelectedPlayerId("");
        setLoading(false);
        return;
      }

      const nextPlayers = data ?? [];
      setPlayers(nextPlayers);
      if (!nextPlayers.find((player) => player.id === selectedPlayerId)) {
        setSelectedPlayerId(nextPlayers[0]?.id ?? "");
      }
      setLoading(false);
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [teamId, passphrase, supabase, selectedPlayerId]);

  return (
    <form className="space-y-6" action={formAction}>
      <div className="space-y-4">
        {errorMessage && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </div>
        )}

        <div>
          <label htmlFor="team_id" className="block font-medium text-gray-700">
            チームID
          </label>
          <input
            id="team_id"
            name="team_id"
            type="text"
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            placeholder="例: 0f7e..."
          />
        </div>

        <div>
          <label
            htmlFor="passphrase"
            className="block font-medium text-gray-700"
          >
            合言葉
          </label>
          <input
            id="passphrase"
            name="passphrase"
            type="text"
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            placeholder="合言葉を入力"
          />
        </div>

        <div>
          <label
            htmlFor="player_id"
            className="block font-medium text-gray-700"
          >
            自分の名前
          </label>
          <select
            id="player_id"
            name="player_id"
            value={selectedPlayerId}
            onChange={(event) => setSelectedPlayerId(event.target.value)}
            required
            disabled={!teamId || loading || players.length === 0}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          >
            <option value="">
              {teamId && passphrase
                ? loading
                  ? "読み込み中..."
                  : players.length === 0
                    ? "候補がありません"
                    : "選択してください"
                : "チームIDと合言葉を入力してください"}
            </option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.no ? `#${player.no} ` : ""}
                {player.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="password" className="block font-medium text-gray-700">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            placeholder="8文字以上を推奨"
          />
        </div>

        <div>
          <label
            htmlFor="password_confirm"
            className="block font-medium text-gray-700"
          >
            パスワード（確認）
          </label>
          <input
            id="password_confirm"
            name="password_confirm"
            type="password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!teamId || !selectedPlayerId || isPending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? "処理中..." : "初回登録を完了"}
      </button>
    </form>
  );
}
