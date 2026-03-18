import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchPenpenHeaderImageUrl } from "../lib/penpenStorage";

export const metadata: Metadata = { title: "球場案内" };

export default async function StadiumsPage() {
  const supabase = await createClient();

  const [{ data }, headerImageUrl] = await Promise.all([
    supabase
      .schema("penpen")
      .from("stadiums")
      .select("id, name, address, google_map_url, note")
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true }),
    fetchPenpenHeaderImageUrl(supabase),
  ]);

  const stadiums = (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    address: item.address ?? "",
    mapUrl: item.google_map_url ?? "",
    note: item.note ?? "",
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="relative h-48 md:h-64 flex items-center justify-center overflow-hidden">
        <Image
          src={headerImageUrl}
          alt="PENPEN LEAGUE ヘッダー画像"
          fill
          sizes="100vw"
          unoptimized
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
          {stadiums.length === 0 ? (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <p className="text-base text-gray-500">
                球場情報はまだ登録されていません。
              </p>
            </section>
          ) : (
            stadiums.map((stadium) => (
              <section
                key={stadium.id}
                className="bg-white rounded-4xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
                        {stadium.name}
                      </h2>
                      <p className="flex items-center gap-2 text-gray-500 font-bold">
                        {stadium.address && (
                          <>
                            <MapPin size={18} className="text-blue-600" />
                            {stadium.address}
                          </>
                        )}
                      </p>
                    </div>
                    {stadium.address ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stadium.address)}`}
                        target="_blank"
                        className="p-3 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <ExternalLink size={24} />
                      </a>
                    ) : null}
                  </div>

                  {stadium.mapUrl ? (
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
                  ) : (
                    <p className="text-base text-gray-500">
                      地図URLは未登録です。
                    </p>
                  )}

                  {stadium.note ? (
                    <p className="mt-4 p-4 bg-yellow-50 rounded-xl text-gray-700 font-bold border border-yellow-100 whitespace-pre-wrap">
                      💡 {stadium.note}
                    </p>
                  ) : null}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <footer className="py-20 border-t border-slate-100 text-center bg-white">
        <div className="opacity-30 font-black tracking-widest hover:underline">
          <a href="/" target="_blank">
            Powered by DashBase
          </a>
        </div>
      </footer>
    </main>
  );
}
