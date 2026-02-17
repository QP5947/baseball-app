"use client";

import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import Link from "next/link";
import { saveGame, type ActionResult } from "../actions";
import { getDefaultDateTime } from "@/utils/getDefaultDateTime";
import { useRouter } from "next/navigation";

// 既存データがある場合は initialData として受け取る
export default function GameForm({
  initialData,
  leagues = [],
  grounds = [],
  vsteams = [],
}: {
  initialData?: any;
  leagues?: { id: string; name: string }[];
  grounds?: { id: string; name: string }[];
  vsteams?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [startDateTime, setStartDateTime] = useState(
    getDefaultDateTime(initialData?.start_datetime) || "",
  );
  const [leagueId, setLeagueId] = useState(initialData?.league_id || "");
  const [groundId, setGroundId] = useState(initialData?.ground_id || "");
  const [vsteamId, setVsteamId] = useState(initialData?.vsteam_id || "");
  const [remarks, setRemarks] = useState(initialData?.remarks || "");
  const [sumFlg, setSumFlg] = useState(initialData?.sum_flg ?? true);

  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(async (_prevState: ActionResult | undefined, formData: FormData) => {
    const formValues = {
      start_datetime: (formData.get("start_datetime") as string) || "",
      league_id: (formData.get("league_id") as string) || "",
      ground_id: (formData.get("ground_id") as string) || "",
      vsteam_id: (formData.get("vsteam_id") as string) || "",
      remarks: (formData.get("remarks") as string) || "",
      sum_flg: formData.get("sum_flg") === "on",
    };

    const result = await saveGame(formData);

    if (!result.success) {
      return {
        ...result,
        formData: formValues,
      };
    }

    return result;
  }, undefined);

  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message);
        router.push("/admin/games");
      } else {
        toast.error(state.message);

        if (state.formData) {
          setStartDateTime(state.formData.start_datetime ?? "");
          setLeagueId(state.formData.league_id ?? "");
          setGroundId(state.formData.ground_id ?? "");
          setVsteamId(state.formData.vsteam_id ?? "");
          setRemarks(state.formData.remarks ?? "");
          setSumFlg(Boolean(state.formData.sum_flg));
        }

        if (state.message.includes("削除済み")) {
          router.refresh();
        }
      }
    }
  }, [state, router]);

  useEffect(() => {
    if (leagueId && !leagues.some((league) => league.id === leagueId)) {
      setLeagueId("");
    }
    if (groundId && !grounds.some((ground) => ground.id === groundId)) {
      setGroundId("");
    }
    if (vsteamId && !vsteams.some((vsteam) => vsteam.id === vsteamId)) {
      setVsteamId("");
    }
  }, [leagueId, groundId, vsteamId, leagues, grounds, vsteams]);

  return (
    <form action={formAction} className="space-y-6">
      {/* 試合ID */}
      {initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      {/* 試合開始日時 */}
      <div>
        <label className="block font-bold text-gray-700 mb-1">
          試合開始日時
        </label>
        <input
          name="start_datetime"
          type="datetime-local"
          required
          className="w-1/3 p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none text-gray-800 placeholder-gray-400"
          value={startDateTime}
          onChange={(e) => setStartDateTime(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* リーグ */}
        <div>
          <label className="block font-bold text-gray-700 mb-2">リーグ</label>
          <select
            name="league_id"
            className="w-full border rounded-md p-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
          >
            <option value=""></option>
            {leagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
        </div>

        {/* 球場 */}
        <div>
          <label className="block font-bold text-gray-700 mb-2">球場</label>
          <select
            name="ground_id"
            className="w-full border rounded-md p-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            value={groundId}
            onChange={(e) => setGroundId(e.target.value)}
          >
            <option value=""></option>
            {grounds.map((ground) => (
              <option key={ground.id} value={ground.id}>
                {ground.name}
              </option>
            ))}
          </select>
        </div>

        {/* 対戦相手 */}
        <div>
          <label className="block font-bold text-gray-700 mb-2">対戦相手</label>
          <select
            name="vsteam_id"
            className="w-full border rounded-md p-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            value={vsteamId}
            onChange={(e) => setVsteamId(e.target.value)}
          >
            <option value=""></option>
            {vsteams.map((vsteam) => (
              <option key={vsteam.id} value={vsteam.id}>
                {vsteam.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 備考 */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">備考</label>
        <input
          name="remarks"
          type="text"
          className="w-full p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
          placeholder="例：準備当番"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      {/* 成績反映 */}
      <div className="flex items-center gap-1 mb-1">
        <label className="block font-medium text-gray-700">成績反映</label>
      </div>
      <div className="flex items-center gap-1 mb-6">
        <input
          type="checkbox"
          name="sum_flg"
          id="sum_flg"
          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          checked={sumFlg}
          onChange={(e) => setSumFlg(e.target.checked)}
        />
        <label htmlFor="sum_flg" className="font-medium text-blue-900">
          成績反映する
        </label>
      </div>

      {/* ボタン類 */}
      <div className="pt-4 flex gap-4">
        <Link
          href="/admin/games"
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 text-center transition"
        >
          キャンセル
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save size={20} />
          保存
        </button>
      </div>
    </form>
  );
}
