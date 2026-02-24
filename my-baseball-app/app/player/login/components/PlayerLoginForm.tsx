"use client";

import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { login, signup, type LoginResult } from "@/player/login/actions";
import { supabase } from "@/utils/supabase";

export default function PlayerLoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, isLoginPending] = useActionState<
    LoginResult | undefined,
    FormData
  >(login, undefined);
  const [signupState, signupAction, isSignupPending] = useActionState<
    LoginResult | undefined,
    FormData
  >(signup, undefined);

  const isPending = isLoginPending || isSignupPending;

  // URLクエリパラメータからのエラー表示
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorDescription = searchParams.get("error_description");
    if (errorDescription) {
      toast.error(errorDescription);
      // エラー表示後にクエリパラメータを削除
      const newUrl = `${window.location.pathname}`;
      window.history.replaceState({}, "", newUrl);
    }
    const error = searchParams.get("error");
    if (error === "already_registered") {
      setMode("login");
    }
  }, []);

  // ログインのトースト表示
  useEffect(() => {
    if (loginState) {
      if (loginState.success) {
        toast.success(loginState.message);
      } else {
        if (loginState.errorType === "auth") {
          toast.error(
            "認証に失敗しました。メールアドレスまたはパスワードが正しくありません。",
          );
        } else {
          toast.error(
            loginState.message ||
              "ログイン時に予期しないエラーが発生しました。",
          );
        }
      }
    }
  }, [loginState]);

  // 新規登録のトースト表示
  useEffect(() => {
    if (signupState) {
      if (signupState.success) {
        toast.success(signupState.message);
      } else {
        toast.error(signupState.message);
      }
    }
  }, [signupState]);

  // SNSログイン/新規登録を明示的に分ける
  const handleSocialLogin = async (
    provider: "google" | "facebook" | "x",
    mode: "login" | "signup",
  ) => {
    try {
      // modeに応じて成功時の遷移先を決定
      const nextPath =
        mode === "login" ? "/player/dashboard" : "/player/first-login";
      // 失敗時に戻る場所は常に現在のページ
      const originPath = "/player/login";

      const callbackUrl = `${window.location.origin}/auth/callback?next=${nextPath}&flow=${mode}&origin=${originPath}`;

      const options: any = {
        redirectTo: callbackUrl,
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
        console.error("SNS認証エラー:", error);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-lg space-y-8 rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">
            選手ログイン
          </h1>
        </div>

        {/* ログイン/新規登録タブ */}
        <div className="flex rounded-full border bg-gray-100 p-1 text-sm mb-10">
          <button
            type="button"
            onClick={() => setMode("login")}
            disabled={isPending}
            className={`flex-1 rounded-full px-3 py-2 font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === "login"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-500"
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            disabled={isPending}
            className={`flex-1 rounded-full px-3 py-2 font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === "signup"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-500"
            }`}
          >
            新規登録
          </button>
        </div>

        {/* SNSログイン/新規登録ボタン群（タブに応じて出し分け） */}
        <div className="grid grid-cols-1 gap-4">
          {mode === "login" && (
            <>
              <button
                type="button"
                onClick={() => handleSocialLogin("google", "login")}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  className="w-6 h-6"
                  alt=""
                />
                Googleでログイン
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("facebook", "login")}
                disabled={true}
                className="w-full rounded-2xl bg-[#1877F2] px-6 py-4 text-xl font-bold text-white hover:opacity-90 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  src="https://www.facebook.com/favicon.ico"
                  className="w-6 h-6 brightness-200"
                  alt=""
                />
                Facebookでログイン
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("x", "login")}
                className="w-full rounded-2xl bg-black px-6 py-4 text-xl font-bold text-white hover:opacity-90 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-2xl">𝕏</span>
                Xでログイン
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              <button
                type="button"
                onClick={() => handleSocialLogin("google", "signup")}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  className="w-6 h-6"
                  alt=""
                />
                Googleで新規登録
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("facebook", "signup")}
                disabled={true}
                className="w-full rounded-2xl bg-[#1877F2] px-6 py-4 text-xl font-bold text-white hover:opacity-90 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  src="https://www.facebook.com/favicon.ico"
                  className="w-6 h-6 brightness-200"
                  alt=""
                />
                Facebookで新規登録
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("x", "signup")}
                className="w-full rounded-2xl bg-black px-6 py-4 text-xl font-bold text-white hover:opacity-90 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-2xl">𝕏</span>
                Xで新規登録
              </button>
            </>
          )}
        </div>

        <div className="relative flex items-center py-1">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink mx-4 text-lg text-slate-400 font-medium">
            または
          </span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        {/* メールアドレス認証 */}

        <form className="space-y-6 mt-0">
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
                className="block w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 disabled:text-gray-500 transition-all"
              />
            </div>
            {mode === "login" && (
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
                  className="block w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 disabled:text-gray-500 transition-all"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {mode === "login" ? (
              <button
                formAction={loginAction}
                disabled={isPending}
                className="w-full rounded-2xl bg-blue-600 px-6 py-5 text-2xl font-black text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:bg-blue-300 flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-200 cursor-pointer"
              >
                {isLoginPending ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    処理中...
                  </>
                ) : (
                  "ログイン"
                )}
              </button>
            ) : (
              <button
                formAction={signupAction}
                disabled={isPending}
                className="w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-xl shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSignupPending ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-transparent"></span>
                    処理中...
                  </>
                ) : (
                  "新規アカウント登録"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
