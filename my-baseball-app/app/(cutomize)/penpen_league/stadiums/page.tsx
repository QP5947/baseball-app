import Link from "next/link";
import { ArrowLeft, MapPin, ExternalLink } from "lucide-react";

const stadiums = [
  {
    id: "shonai-nishi",
    name: "庄内川西グラウンド（下流側）",
    address: "愛知県名古屋市西区山田町大字上小田井",
    // Googleマップの「地図を埋め込む」からsrcの中身だけを抽出
    mapUrl:
      "https://maps.google.com/maps?q=35.2098614,136.883316&hl=ja&z=16&output=embed",
    note: "車は庄内緑地公園の第三～五駐車場（有料）に止めて下さい。",
  },
];

export default function StadiumsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
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
            球場案内
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Link
          href="./"
          className="inline-flex items-center gap-2 mb-6 font-bold text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={20} /> ホームへ戻る
        </Link>

        <div className="space-y-10">
          {stadiums.map((stadium) => (
            <section
              key={stadium.id}
              className="bg-white rounded-4xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
                      {stadium.name}
                    </h2>
                    <p className="flex items-center gap-2 text-gray-500 font-bold">
                      <MapPin size={18} className="text-blue-600" />
                      {stadium.address}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stadium.address)}`}
                    target="_blank"
                    className="p-3 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <ExternalLink size={24} />
                  </a>
                </div>

                {/* Google Map 埋め込み部分 */}
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner">
                  <iframe
                    src={stadium.mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={stadium.name}
                  ></iframe>
                </div>

                {stadium.note && (
                  <p className="mt-4 p-4 bg-yellow-50 rounded-xl text-gray-700 font-bold border border-yellow-100">
                    💡 {stadium.note}
                  </p>
                )}
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
