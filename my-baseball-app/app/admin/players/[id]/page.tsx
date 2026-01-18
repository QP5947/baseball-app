import AdminLayout from "@/admin/components/AdminMenu";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PlayerForm from "../components/PlayerForm";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (!player) return <div>チームメイトが見つかりません</div>;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー部分 */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/players"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            チームメイト情報編集
          </h1>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border">
          <PlayerForm initialData={player} />
        </div>
      </div>
    </AdminLayout>
  );
}
