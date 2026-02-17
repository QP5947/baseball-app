"use client";

import { useActionState, useEffect as useEffect_react, useState } from "react";
import toast from "react-hot-toast";
import { Database } from "@/types/supabase";
import { PlusCircle, Save } from "lucide-react";
import { saveTeamProfile, type ActionResult } from "../actions";

type TeamProfileRow = Pick<
  Database["public"]["Tables"]["team_profiles"]["Row"],
  "q" | "a"
>;

export default function TeamProfileFormRow({
  teamProfiles,
}: {
  teamProfiles: TeamProfileRow[];
}) {
  const [profiles, setProfiles] = useState<{ q: string; a: string }[]>([
    { q: "プロフィール", a: "" },
  ]);

  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(async (_prevState: ActionResult | undefined, formData: FormData) => {
    const questions = formData.getAll("q");
    const answers = formData.getAll("a");
    const submittedProfiles = questions.map((q, idx) => ({
      q: String(q ?? ""),
      a: String(answers[idx] ?? ""),
    }));

    const result = await saveTeamProfile(formData);
    return {
      ...result,
      formData: {
        profiles: submittedProfiles,
      },
    };
  }, undefined);

  useEffect_react(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }

      if (state.formData?.profiles?.length) {
        setProfiles(state.formData.profiles);
      }
    }
  }, [state]);

  useEffect_react(() => {
    if (teamProfiles && teamProfiles.length > 0) {
      setProfiles(teamProfiles.map((p) => ({ q: p.q ?? "", a: p.a ?? "" })));
      return;
    }
    setProfiles([{ q: "プロフィール", a: "" }]);
  }, [teamProfiles]);

  const addRow = () => {
    setProfiles((prev) => [...prev, { q: "", a: "" }]);
  };

  const updateProfile = (idx: number, field: "q" | "a", value: string) => {
    setProfiles((prev) =>
      prev.map((profile, profileIdx) =>
        profileIdx === idx ? { ...profile, [field]: value } : profile,
      ),
    );
  };

  const clearRow = () => {
    if (confirm("入力をすべてクリアしますか？")) {
      setProfiles([{ q: "プロフィール", a: "" }]);
    }
  };

  return (
    <form action={formAction} className="space-y-8">
      {profiles.map((profile, idx) => (
        <div
          key={idx}
          className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 relative"
        >
          {idx === 0 ? (
            <div>
              <label className="block font-bold text-gray-800 text-lg mb-2">
                基本プロフィール
              </label>
              <textarea
                name="a"
                rows={3}
                placeholder="チームの紹介文を入力してください"
                className="w-full p-4 border rounded-lg focus:ring-2 border-gray-300 focus:ring-blue-500 outline-none transition text-base text-gray-800 bg-white"
                value={profile.a || ""}
                onChange={(e) => updateProfile(idx, "a", e.target.value)}
              />
              <input
                type="hidden"
                name="q"
                value={profile.q || "プロフィール"}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-800 text-lg mb-2">
                  項目タイトル {idx}
                </label>
                <input
                  name="q"
                  type="text"
                  placeholder="例：ホームグラウンド、部費など"
                  className="w-full p-4 border rounded-lg focus:ring-2 border-gray-300 focus:ring-blue-500 outline-none transition text-base text-gray-800 bg-white"
                  value={profile?.q || ""}
                  onChange={(e) => updateProfile(idx, "q", e.target.value)}
                />
              </div>
              <div>
                <label className="block font-bold text-gray-800 text-lg mb-2">
                  内容
                </label>
                <textarea
                  name="a"
                  rows={2}
                  className="w-full p-4 border rounded-lg focus:ring-2 border-gray-300 focus:ring-blue-500 outline-none transition text-base text-gray-800 bg-white"
                  value={profile?.a || ""}
                  onChange={(e) => updateProfile(idx, "a", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 改善された追加ボタンエリア */}
      <div className="flex justify-center py-2">
        <button
          type="button"
          onClick={addRow}
          className="w-full py-6 border-4 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all group cursor-pointer"
        >
          <PlusCircle
            size={32}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="text-lg font-bold">項目を追加する</span>
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-800 text-base leading-relaxed">
          💡 リンクは
          [タイトル](URL)の形式で入力すると自動的にリンクになります。
        </p>
      </div>

      <div className="pt-6 flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          className="flex-1 px-6 py-4 border border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-200 text-lg transition cursor-pointer"
          onClick={clearRow}
        >
          内容をリセット
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-2 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-3 text-xl shadow-lg active:transform active:scale-95 order-1 sm:order-2 disabled:bg-blue-300 cursor-pointer"
        >
          <Save size={24} />
          {isPending ? "保存中..." : "プロフィールを保存"}
        </button>
      </div>
    </form>
  );
}
