import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchPenpenHeaderImageUrl } from "../lib/penpenStorage";

export const metadata: Metadata = { title: "大会規定" };

export default async function RulesPage() {
  const supabase = await createClient();

  const [{ data }, headerImageUrl] = await Promise.all([
    supabase
      .schema("penpen")
      .from("rule_blocks")
      .select("id, title, body")
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true }),
    fetchPenpenHeaderImageUrl(supabase),
  ]);

  const rulesData = (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    content: item.body,
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="relative h-48 md:h-64 flex items-center justify-center overflow-hidden">
        <Image
          src={headerImageUrl}
          alt="ペンペンリーグ ヘッダー画像"
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
          {rulesData.length === 0 ? (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <p className="text-base text-gray-500">
                大会規定はまだ登録されていません。
              </p>
            </section>
          ) : (
            rulesData.map((section) => (
              <section
                key={section.id}
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
