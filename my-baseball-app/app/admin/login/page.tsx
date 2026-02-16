"use client";

import { useActionState } from "react";
import { login, signup } from "./actions";

type LoginState = { error?: string };

export default function LoginPage() {
  const [loginState, loginAction, isLoginPending] = useActionState<
    LoginState,
    FormData
  >(login, { error: undefined });
  const [signupState, signupAction, isSignupPending] = useActionState<
    LoginState,
    FormData
  >(signup, { error: undefined });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-3 md:p-24 ">
      <div className="w-full max-w-md space-y-8 rounded-xl border p-10 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">管理者ログイン</h1>
          <p className="mt-2 text-sm text-gray-600">
            チーム管理を開始するにはログインしてください
          </p>
        </div>

        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={isLoginPending || isSignupPending}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={isLoginPending || isSignupPending}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              formAction={loginAction}
              disabled={isLoginPending || isSignupPending}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            {/* 開発時のみ使用。本番では隠すか、特定のURLからのみに制限するのが一般的です */}
            <button
              formAction={signupAction}
              disabled={isLoginPending || isSignupPending}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </div>
        </form>
      </div>
    </div>
  );
}
