"use client";

import { Database } from "@/types/supabase";
import { PlusCircle, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { saveTeamProfile } from "../actions";

type TeamProfileRow = Pick<
  Database["public"]["Tables"]["team_profiles"]["Row"],
  "q" | "a"
>;

export default function TeamProfileFormRow({
  teamProfiles,
}: {
  teamProfiles: TeamProfileRow[];
}) {
  // QA管理
  const [profiles, setProfiles] = useState<{ q: string; a: string }[]>(
    Array.from({ length: 2 }, () => ({ q: "", a: "" })),
  );
  useEffect(() => {
    if (teamProfiles && teamProfiles.length > 0) {
      setProfiles(teamProfiles.map((p) => ({ q: p.q ?? "", a: p.a ?? "" })));
      if (teamProfiles.length === 1) {
        addRow();
      }
    }
  }, [teamProfiles]);

  // 行の追加
  const addRow = () => {
    setProfiles((prev) => {
      const newPlayer = { q: "", a: "" };
      return [...prev, newPlayer];
    });
  };
  // 行のクリア
  const clearRow = () => {
    setProfiles((prev) => {
      return Array.from({ length: 2 }, () => ({ q: "", a: "" }));
    });
  };

  return (
    <form action={saveTeamProfile} className="space-y-6">
      {profiles?.map((profile, idx) =>
        idx === 0 ? (
          <div key={`profile-row-${idx}`}>
            <label className="block font-medium text-gray-700 mb-1">
              プロフィール
            </label>
            <textarea
              name="a"
              className="w-full p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
              defaultValue={profile.a || ""}
            />
            <input type="hidden" name="q" value="プロフィール" />
          </div>
        ) : (
          <div key={idx}>
            <label className="block font-medium text-gray-700 mb-1">
              項目{idx}
            </label>
            <input
              name="q"
              type="text"
              className="w-full mb-2 p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
              defaultValue={profile?.q || ""}
            />
            <label className="block font-medium text-gray-700 mb-1">
              回答{idx}
            </label>
            <input
              name="a"
              type="text"
              className="w-full p-3 border rounded-lg focus:ring-2 border-gray-400 focus:ring-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
              defaultValue={profile?.a || ""}
            />
          </div>
        ),
      )}
      {/* 追加ボタン */}
      <button
        type="button"
        onClick={() => addRow()}
        className="ml-2 bg-blue-500 text-white rounded-full p-0.5 shadow-md transform hover:scale-125 pointer-coarse:scale-125 transition-all flex items-center justify-center border-2 border-white cursor-pointer"
      >
        <PlusCircle size={14} />
      </button>

      {/* ボタン類 */}
      <div className="pt-4 flex gap-4">
        <button
          type="button"
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 text-center transition cursor-pointer"
          onClick={clearRow}
        >
          クリア
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save size={20} />
          保存
        </button>
      </div>
    </form>
  );
}
