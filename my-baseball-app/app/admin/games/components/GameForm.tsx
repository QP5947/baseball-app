import { Save } from "lucide-react";
import Link from "next/link";
import { saveGame } from "../actions";
import { getDefaultDateTime } from "@/utils/getDefaultDateTime";

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
  return (
    <form action={saveGame} className="space-y-6">
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
          className="w-1/3 p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none text-gray-800 placeholder-gray-400"
          defaultValue={getDefaultDateTime(initialData?.start_datetime) || ""}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* リーグ */}
        <div>
          <label className="block font-bold text-gray-700 mb-2">リーグ</label>
          <select
            name="league_id"
            required
            className="w-full border rounded-md p-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            defaultValue={initialData?.league_id || ""}
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
            required
            className="w-full border rounded-md p-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            defaultValue={initialData?.ground_id || ""}
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
            required
            className="w-full border rounded-md p-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            defaultValue={initialData?.vsteam_id || ""}
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
          defaultValue={initialData?.remarks || ""}
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
          defaultChecked={initialData?.sum_flg || true}
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
          className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <Save size={20} />
          保存
        </button>
      </div>
    </form>
  );
}
