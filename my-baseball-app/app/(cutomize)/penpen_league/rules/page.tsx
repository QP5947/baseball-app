"use client";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

// 管理画面で編集する想定のデータ（本来はSupabaseから取得）
const rulesData = [
  {
    title: "基本方針",
    content:
      "【酷暑対策】7月、9月は試合時間を30分早めます。8月はリーグ戦はお休みです。\n今年は庄内川西（下流の狭い方）のグランドを利用します。\nリーグ３回戦総当たり（各チーム１５試合）＋春秋トーナメントを行う予定です。\n事前に了承が得られれば、相手チームから”3人まで”メンバーを借りて試合を行ってもOKとします。\n試合終了後速やかに、試合結果と石灰の有無などを連絡してください。\n試合中止の場合は、審判、次のチームに必ず連絡してください。",
  },
  {
    title: "庄内球場グランドルール",
    content:
      "・（東）ライト：川・土手に直接入った場合はHR。ゴロ等は二塁打。\n・（西）ライト：すべて二塁打。\n・レフト：隣の敷地境界まで飛べばHR。\n・その他：すべてフリー（三塁打まで）。ランニングHR無し。送球逸れワンベース無し。",
  },
  {
    title: "試合進行・終了規定",
    content:
      "・7イニング制。開始1時間40分で新イニング不可。\n・5回10点差以上でコールド。\n・雨天コールドは4回完了で成立。\n・裏の攻撃中に時間切れの場合も、次のイニングには入らない。",
  },
];

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="relative h-48 md:h-64 flex items-center justify-center overflow-hidden">
        <img
          src="/league.jpg"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-blue-900/60 z-10"></div>
        <div className="relative z-30 text-center">
          <h1 className="text-4xl md:text-6xl font-black italic text-white drop-shadow-lg">
            PENPEN LEAGUE
          </h1>
          <p className="text-white font-bold text-lg md:text-xl mt-2">
            大会規定
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <Link
          href="./"
          className="inline-flex items-center gap-2 mb-8 font-bold text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={20} /> ホームへ戻る
        </Link>

        <div className="space-y-6">
          {rulesData.map((section, index) => (
            <section
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="bg-gray-800 p-4 flex items-center gap-3 text-white">
                <FileText size={20} />
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
              <div className="p-6">
                <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>
      {/* フッター導線 */}
      <footer className="mt-16 p-12 text-center bg-gray-100 border-t">
        <p className="text-gray-400 mt-6 text-lg">© 2026 PENPEN LEAGUE</p>
      </footer>
    </main>
  );
}
