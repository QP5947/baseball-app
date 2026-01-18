"use client";
import Link from "next/link";
import { savePastPlayer } from "../actions";
import { Save } from "lucide-react";

// 既存データがある場合は initialData として受け取る
export default function PastPlayerForm({ initialData }: { initialData?: any }) {
  return (
    <form action={savePastPlayer} className="space-y-6">
      {/* 年度、選手ID */}
      {initialData?.year && (
        <input type="hidden" name="year" value={initialData.year} />
      )}
      {initialData?.player_id && (
        <input type="hidden" name="player_id" value={initialData.player_id} />
      )}

      {/* 背番号 */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">背番号</label>
        <input
          name="no"
          type="number"
          className="w-1/3 p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none text-gray-800 placeholder-gray-400"
          placeholder="00"
          defaultValue={initialData?.no || ""}
        />
      </div>

      {/* 選手名 */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">選手名</label>
        <input
          name="name"
          type="text"
          required
          className="w-full p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
          placeholder="例：山田 太郎"
          defaultValue={initialData?.name || ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 投 */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">投</label>
          <select
            name="throw_hand"
            className="w-full p-3 border rounded-lg border-gray-400 text-gray-800"
            defaultValue={initialData?.throw_hand || ""}
          >
            <option value=""></option>
            <option value="R">右投げ</option>
            <option value="L">左投げ</option>
            <option value="S">両投げ</option>
          </select>
        </div>

        {/* 打 */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">打</label>
          <select
            name="batting_hand"
            className="w-full p-3 border rounded-lg border-gray-400 text-gray-800"
            defaultValue={initialData?.batting_hand || ""}
          >
            <option value=""></option>
            <option value="R">右打ち</option>
            <option value="L">左打ち</option>
            <option value="S">両打ち</option>
          </select>
        </div>
      </div>

      {/* 表示 */}
      <div className="flex items-center gap-1 mb-1">
        <label className="block font-medium text-gray-700">
          年度別チーム成績に表示
        </label>
      </div>
      <div className="flex items-center gap-1 mb-6">
        <input
          type="checkbox"
          name="show_flg"
          id="show_flg"
          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          defaultChecked={initialData?.show_flg}
        />
        <label htmlFor="show_flg" className="font-medium text-blue-900">
          表示する
        </label>
      </div>

      {/* ボタン類 */}
      <div className="pt-4 flex gap-4">
        <Link
          href={`/admin/pastPlayers?year=${initialData.year}`}
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
