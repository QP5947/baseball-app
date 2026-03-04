import Link from "next/link";

export default function PenpenAdminLoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-200 p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            PENPEN LEAGUE
          </h1>
          <p className="text-gray-600 font-bold">管理画面ログイン</p>
        </div>

        <form className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="admin-id"
              className="block text-base font-bold text-gray-700"
            >
              ID
            </label>
            <input
              id="admin-id"
              type="text"
              placeholder="admin"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="admin-password"
              className="block text-base font-bold text-gray-700"
            >
              パスワード
            </label>
            <input
              id="admin-password"
              type="password"
              placeholder="********"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Link
            href="/penpen_league/admin"
            className="block w-full text-center bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ログイン
          </Link>
        </form>

        <p className="text-base text-gray-500 text-center">
          ※ モック画面のため認証は行いません
        </p>
      </section>
    </main>
  );
}
