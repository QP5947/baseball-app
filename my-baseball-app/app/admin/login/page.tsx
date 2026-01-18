import { login, signup } from "./actions";

export default function LoginPage() {
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              formAction={login}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none"
            >
              ログイン
            </button>
            {/* 開発時のみ使用。本番では隠すか、特定のURLからのみに制限するのが一般的です */}
            <button
              formAction={signup}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              新規アカウント登録
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
