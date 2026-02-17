import AdminLayout from "@/admin/components/AdminMenu";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PlayerForm from "../components/PlayerForm";
import DeletedItemRedirect from "../../components/DeletedItemRedirect";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: myTeamId } = await supabase.rpc("get_my_team_id");
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", myTeamId)
    .eq("id", id)
    .single();

  if (!player)
    return (
      <DeletedItemRedirect
        message="チームメイトが見つかりません"
        redirectPath="/admin/players"
      />
    );

  const playerWithImageUrls = {
    ...player,
    list_image_url: player.list_image
      ? supabase.storage.from("player_images").getPublicUrl(player.list_image)
          .data.publicUrl
      : undefined,
    detail_image_url: player.detail_image
      ? supabase.storage.from("player_images").getPublicUrl(player.detail_image)
          .data.publicUrl
      : undefined,
  };

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
          <PlayerForm initialData={playerWithImageUrls} />
        </div>
      </div>
    </AdminLayout>
  );
}
