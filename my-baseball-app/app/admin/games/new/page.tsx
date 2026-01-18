import AdminMenu from "@/admin/components/AdminMenu";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GameForm from "../components/GameForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewGamePage() {
  const supabase = await createClient();

  // マスタを取得
  const [leagues, grounds, vsteams] = await Promise.all([
    supabase
      .from("leagues")
      .select("id, name")
      .eq("show_flg", true)
      .order("sort"),
    supabase
      .from("grounds")
      .select("id, name")
      .eq("show_flg", true)
      .order("sort"),
    supabase
      .from("vsteams")
      .select("id, name")
      .eq("show_flg", true)
      .order("sort"),
  ]);

  return (
    <AdminMenu>
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/games"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">試合新規登録</h1>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border">
          <GameForm
            leagues={leagues.data || []}
            grounds={grounds.data || []}
            vsteams={vsteams.data || []}
          />
        </div>
      </div>
    </AdminMenu>
  );
}
