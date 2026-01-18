import AdminLayout from "@/admin/components/AdminMenu";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PastPlayerForm from "../components/PastPlayerForm";

export default async function EditPastPlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const { year } = await searchParams;

  const supabase = await createClient();
  const { data: pastPlayer } = await supabase
    .from("past_players")
    .select("*")
    .eq("year", year)
    .eq("player_id", id)
    .single();

  if (!pastPlayer) return <div>選手が見つかりません</div>;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー部分 */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/admin/pastPlayers?year=${year}`}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">選手情報編集</h1>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border">
          <PastPlayerForm initialData={pastPlayer} />
        </div>
      </div>
    </AdminLayout>
  );
}
