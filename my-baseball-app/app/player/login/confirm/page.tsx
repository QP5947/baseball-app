import Link from "next/link";

export default function PlayerSignupConfirmPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-3 md:p-24">
      <div className="w-full max-w-md space-y-6 rounded-xl border p-10 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">認証メールを送信しました</h1>
          <p className="mt-3 text-gray-600">
            登録したメールアドレスに認証リンクを送信しました。メール内のURLから初回ログイン設定をお願いします。
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
          届かない場合は迷惑メールフォルダもご確認ください。
        </div>

        <Link
          href="/player/login"
          className="block w-full rounded-md border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50"
        >
          ログイン画面に戻る
        </Link>
      </div>
    </div>
  );
}
