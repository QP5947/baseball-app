"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { login, type LoginResult } from "./actions";
import { supabase } from "@/utils/supabase";

export default function AdminLoginClient() {
  const router = useRouter();
  const [loginState, loginAction, isLoginPending] = useActionState<
    LoginResult | undefined,
    FormData
  >(login, undefined);

  // URLクエリのエラーメッセージを表示
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorDescription = searchParams.get("error_description");
    if (errorDescription) {
      toast.error(errorDescription);
      // エラー表示後にクエリパラメータを削除
      const newUrl = `${window.location.pathname}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // ログインのトースト表示・成功時遷移
  useEffect(() => {
    if (loginState) {
      if (loginState.success) {
        toast.success(loginState.message);
        router.push("/admin/dashboard");
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
  }, [loginState, router]);

  // SNSログイン
  const handleSocialLogin = async (provider: "google" | "facebook" | "x") => {
    try {
      const callbackUrl = `${window.location.origin}/auth/callback?next=/admin/dashboard&flow=login&origin=/admin/login`;
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
            管理者ログイン
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            チーム管理を開始するにはログインしてください
          </p>
        </div>

        {/* SNSログインボタン群 */}
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
            Googleでログイン
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin("facebook")}
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
            onClick={() => handleSocialLogin("x")}
            disabled={true}
            className="w-full rounded-2xl bg-black px-6 py-4 text-xl font-bold text-white hover:opacity-90 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
          >
            <span className="text-2xl">𝕏</span>
            Xでログイン
          </button>
        </div>

        <div className="relative flex items-center py-4">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink mx-4 text-lg text-slate-400 font-medium">
            または
          </span>
          <div className="grow border-t border-slate-200"></div>
        </div>

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
                disabled={isLoginPending}
                className="block w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 disabled:text-gray-500 transition-all"
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
                disabled={isLoginPending}
                className="block w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none disabled:bg-slate-100 disabled:text-gray-500 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button
              formAction={loginAction}
              disabled={isLoginPending}
              className="w-full rounded-2xl bg-blue-600 px-6 py-5 text-2xl font-black text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:bg-blue-300 flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-200 cursor-pointer"
            >
              {isLoginPending ? (
                <>
                  <span className="h-6 w-6 animate-spin rounded-full border-4 border-white border-t-transparent"></span>
                  処理中...
                </>
              ) : (
                "ログイン"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
