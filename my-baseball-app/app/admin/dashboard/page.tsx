import Link from "next/link";
import AdminMenu from "../components/AdminMenu";

export default function DashboardPage() {
  return (
    <AdminMenu>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
          <p className="text-gray-500 text-sm">現在のチームの概要</p>
        </header>

        <Link href="games/scoring/1/">
          <div className="bg-white rounded-xl shadow-sm border-2 border-red-600 p-6 mb-6">
            <p className="text-gray-500">今日の試合</p>
            <p className="text-lg font-bold">12/30 vs 渋谷パンサーズ</p>
            <p className="text-lg font-bold text-red-600">→試合速報入力</p>
          </div>
        </Link>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500">登録選手数</p>
            <p className="text-3xl font-bold">18人</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className=" text-gray-500">今季勝敗</p>
            <p className="text-3xl font-bold text-blue-600">5勝 2敗</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500">チーム打率</p>
            <p className="text-3xl font-bold text-orange-600">.284</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500">次の試合</p>
            <p className="text-lg font-bold">12/30 vs 渋谷パンサーズ</p>
          </div>
        </div>

        {/* 最近の試合一覧などのエリア（仮） */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-bold mb-4">最近の試合記録</h2>
          <div className="text-gray-400"></div>
        </div>
      </div>
    </AdminMenu>
  );
}
