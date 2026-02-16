"use client";

import { useActionState, useState } from "react";
import { login, signup } from "@/player/login/actions";

type SignupState = {
  error?: string;
};

export default function PlayerLoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, isLoginPending] = useActionState<
    SignupState,
    FormData
  >(login, {});
  const [signupState, signupAction, isSignupPending] = useActionState<
    SignupState,
    FormData
  >(signup, {});

  const isPending = isLoginPending || isSignupPending;

  return (
    <div className="w-full max-w-md space-y-8 rounded-xl border p-10 shadow-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold">選手ログイン</h1>
      </div>

      <div className="flex rounded-full border bg-gray-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("login")}
          disabled={isPending}
          className={`flex-1 rounded-full px-3 py-2 font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === "login" ? "bg-white text-gray-900 shadow" : "text-gray-500"
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

      {(loginState.error || signupState.error) && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-red-700">
          {loginState.error || signupState.error}
        </div>
      )}

      <form className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={isPending}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          {mode === "login" && (
            <div>
              <label
                htmlFor="password"
                className="block font-medium text-gray-700"
              >
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={isPending}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {mode === "login" ? (
            <button
              formAction={loginAction}
              disabled={isPending}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none cursor-pointer disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  );
}
