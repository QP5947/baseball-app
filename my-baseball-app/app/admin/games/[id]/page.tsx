import AdminLayout from "@/admin/components/AdminMenu";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import GameForm from "../components/GameForm";
import DeletedItemRedirect from "../../components/DeletedItemRedirect";

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: myTeamId } = await supabase.rpc("get_my_team_id");

  // マスタを取得
  const [leagues, grounds, vsteams] = await Promise.all([
    supabase
      .from("leagues")
      .select("id, name")
      .eq("team_id", myTeamId)
      .eq("show_flg", true)
      .order("sort"),
    supabase
      .from("grounds")
      .select("id, name")
      .eq("team_id", myTeamId)
      .eq("show_flg", true)
      .order("sort"),
    supabase
      .from("vsteams")
      .select("id, name")
      .eq("team_id", myTeamId)
      .eq("show_flg", true)
      .order("sort"),
  ]);

  // 試合データを取得
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("team_id", myTeamId)
    .eq("id", id)
    .single();

  if (!game)
    return (
      <DeletedItemRedirect
        message="試合が見つかりません"
        redirectPath="/admin/games"
      />
    );

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー部分 */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/games"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">試合情報編集</h1>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border">
          <GameForm
            initialData={game}
            leagues={leagues.data || []}
            grounds={grounds.data || []}
            vsteams={vsteams.data || []}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
