"use client";
import Link from "next/link";
import { useState } from "react";
import { savePlayer } from "../actions";
import { HelpCircle } from "lucide-react";
import { Save } from "lucide-react";

// 既存データがある場合は initialData として受け取る
export default function PlayerForm({ initialData }: { initialData?: any }) {
  const [text, setText] = useState(initialData?.position || "");
  const suggestions = [
    "投",
    "捕",
    "一",
    "二",
    "三",
    "遊",
    "左",
    "中",
    "右",
    "DH",
  ];

  const addSuggestion = (suggestion: string) => {
    // 現在の入力をトリミング
    const currentText = text.trim();

    if (currentText === "") {
      setText(suggestion);
    } else {
      // すでに同じ単語が含まれていないかチェック
      const items = currentText.split(",").map((s: string) => s.trim());
      if (!items.includes(suggestion)) {
        setText(`${currentText}, ${suggestion}`);
      }
    }
  };

  return (
    <form action={savePlayer} className="space-y-6">
      {/* 選手ID */}
      {initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
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

      <div className="space-y-3">
        <label className="block font-medium text-gray-700">守備位置</label>

        {/* 守備位置 */}
        <input
          type="text"
          name="position"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="自由に入力、または下のボタンで追加"
        />

        {/* 候補リスト（チップ形式） */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => addSuggestion(item)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 rounded border border-gray-200 transition"
            >
              + {item}
            </button>
          ))}
        </div>
      </div>

      {/* コメント */}
      <div>
        <label className="block font-medium text-gray-700 mb-1">コメント</label>
        <textarea
          name="comment"
          className="w-full h-30 p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
          defaultValue={initialData?.comment || ""}
        />
      </div>

      {/* 表示 */}
      <div className="flex items-center gap-1 mb-1">
        <label className="block font-medium text-gray-700">
          選手一覧、チーム成績に表示
        </label>
      </div>
      <div className="flex items-center gap-1 mb-6">
        <label className="font-medium text-blue-900">
          <input
            type="checkbox"
            name="show_flg"
            id="show_flg"
            className=" text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            defaultChecked={initialData ? initialData?.show_flg : true}
          />
          表示する
        </label>
      </div>

      {/* 権限 */}
      <div className="flex items-center gap-1 mb-1">
        <label className="block font-medium text-gray-700">権限</label>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center gap-1">
          <label className="font-medium text-blue-900">
            <input
              type="checkbox"
              name="is_player"
              id="is_player"
              className="text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              defaultChecked={initialData ? initialData.is_player : true}
            />
            選手権限
          </label>
          <div className="relative group mr-5">
            <HelpCircle size={14} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-50 text-[12px] p-2 bg-gray-900 text-white rounded-md shadow-xl z-20">
              選手画面のログインが可能です
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <label className="font-medium text-blue-900">
            <input
              type="checkbox"
              name="is_manager"
              id="is_manager"
              className=" text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              defaultChecked={initialData?.is_manager}
            />
            マネージャー権限
          </label>
          <div className="relative group mr-5">
            <HelpCircle size={14} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-50 text-[12px] p-2 bg-gray-900 text-white rounded-md shadow-xl z-20">
              管理画面のログインが可能です。
              <br />
              試合登録など一部メニューが利用可能です。
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <label className="font-medium text-blue-900">
            <input
              type="checkbox"
              name="is_admin"
              id="is_admin"
              className=" text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              defaultChecked={initialData?.is_admin}
            />
            管理者権限
          </label>
          <div className="relative group mr-5">
            <HelpCircle size={14} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-50 text-[12px] p-2 bg-gray-900 text-white rounded-md shadow-xl z-20">
              管理画面のログインが可能です。
              <br />
              全てのメニューが利用可能です。
            </div>
          </div>
        </div>
      </div>

      {/* ボタン類 */}
      <div className="pt-4 flex gap-4">
        <Link
          href="/admin/players"
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
