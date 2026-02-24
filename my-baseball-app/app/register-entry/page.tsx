"use client";

import { supabase } from "@/utils/supabase";
import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { registerEntry, type RegisterEntryResult } from "./actions";

export default function RegisterEntryPage() {
  const [state, action, isPending] = useActionState<
    RegisterEntryResult | undefined,
    FormData
  >(registerEntry, undefined);

  const [inputs, setInputs] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (state && !state.success && "email" in state) {
      setInputs({
        email: (state as any).email ?? "",
        password: (state as any).password ?? "",
      });
    }
  }, [state]);

  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message, { duration: 5000 });
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // ソーシャルログインの実装
  const handleSocialLogin = async (provider: "google" | "facebook" | "x") => {
    try {
      const options: any = {
        redirectTo: `${window.location.origin}/auth/callback?next=/team-register`,
      };
      if (provider === "facebook") {
        options.scopes = "public_profile,email";
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      });
      if (error) throw error;
    } catch (error: any) {
      if (error) {
        console.error("詳細エラー:", error);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-lg space-y-8 rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">
            DashBaseを始める
          </h1>
          <p className="text-lg text-slate-500 mt-3">
            まずはアカウントを作成しましょう
          </p>
        </div>

        {/* ソーシャルボタン群を先に配置（登録のハードルを下げる） */}
        <div className="grid grid-cols-1 gap-4">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
          >
            <img
              src="https://www.google.com/favicon.ico"
              className="w-6 h-6"
              alt=""
            />
            Googleで登録
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("facebook")}
            className="w-full rounded-2xl bg-[#1877F2] px-6 py-4 text-xl font-bold text-white hover:opacity-90 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
          >
            <img
              src="https://www.facebook.com/favicon.ico"
              className="w-6 h-6 brightness-200"
              alt=""
            />
            Facebookで登録
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("x")}
            className="w-full rounded-2xl bg-black px-6 py-4 text-xl font-bold text-white hover:opacity-90 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
          >
            <span className="text-2xl">𝕏</span>
            Xで登録
          </button>
        </div>

        <div className="relative flex items-center py-4">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink mx-4 text-lg text-slate-400 font-medium">
            または
          </span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        <form className="space-y-6" action={action}>
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xl font-bold text-slate-800 mb-2"
              >
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={isPending}
                value={inputs.email}
                onChange={handleChange}
                placeholder="baseball@example.com"
                className="block w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xl font-bold text-slate-800 mb-2"
              >
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={isPending}
                value={inputs.password}
                onChange={handleChange}
                placeholder="8文字以上"
                className="block w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 transition-all"
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
              "メールアドレスで登録"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
