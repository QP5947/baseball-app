"use client";
import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { registerTeam, type RegisterTeamResult } from "./actions";

export default function TeamRegisterClient() {
  const [state, action, isPending] = useActionState<
    RegisterTeamResult | undefined,
    FormData
  >(registerTeam, undefined);

  // 入力値保持用
  const formData = state?.formData ?? {};

  const [inputs, setInputs] = useState<{
    team_id: string;
    team_name: string;
    one_name: string;
    team_color: string;
    representative_name: string;
    representative_email: string;
    representative_password: string;
  }>({
    team_id: "",
    team_name: "",
    one_name: "",
    team_color: "#000000",
    representative_name: "",
    representative_email: "",
    representative_password: "",
  });

  useEffect(() => {
    if (state && state.formData) {
      setInputs({
        team_id: state.formData.team_id ?? "",
        team_name: state.formData.team_name ?? "",
        one_name: state.formData.one_name ?? "",
        team_color: state.formData.team_color ?? "#000000",
        representative_name: state.formData.representative_name ?? "",
        representative_email: state.formData.representative_email ?? "",
        representative_password: state.formData.representative_password ?? "",
      });
    }
  }, [state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-lg space-y-8 rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">
            チーム新規登録
          </h1>
          <p className="text-lg text-slate-500 mt-3">
            チーム情報を入力してください
          </p>
        </div>

        <form className="space-y-6" action={action}>
          <div className="space-y-5">
            <div>
              <label
                htmlFor="team_id"
                className="block text-xl font-bold text-slate-800 mb-2"
              >
                チームID
              </label>
              <input
                id="team_id"
                name="team_id"
                type="text"
                required
                pattern="[A-Za-z0-9]+"
                title="英数字のみ入力してください"
                disabled={isPending}
                value={inputs.team_id}
                onChange={handleChange}
                placeholder="例: dashbase2024"
                className="block w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="team_name"
                className="block text-xl font-bold text-slate-800 mb-2"
              >
                チーム名
              </label>
              <input
                id="team_name"
                name="team_name"
                type="text"
                required
                disabled={isPending}
                value={inputs.team_name}
                onChange={handleChange}
                placeholder="例: ダッシュベース"
                className="block w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="one_name"
                className="block text-xl font-bold text-slate-800 mb-2"
              >
                チーム名1文字
              </label>
              <input
                id="one_name"
                name="one_name"
                type="text"
                maxLength={1}
                required
                disabled={isPending}
                value={inputs.one_name}
                onChange={handleChange}
                placeholder="例: ダ"
                className="block w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="team_color"
                className="block text-xl font-bold text-slate-800 mb-2"
              >
                チームカラー
              </label>
              <input
                id="team_color"
                name="team_color"
                type="color"
                required
                disabled={isPending}
                value={inputs.team_color}
                onChange={handleChange}
                className="block w-16 h-10 rounded-2xl border-2 border-slate-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-2xl bg-blue-600 px-6 py-5 text-2xl font-black text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:bg-blue-300 flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-200 cursor-pointer"
          >
            {isPending ? (
              <>
                <span className="h-6 w-6 animate-spin rounded-full border-4 border-white border-t-transparent"></span>
                登録中...
              </>
            ) : (
              "チームを登録する"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
