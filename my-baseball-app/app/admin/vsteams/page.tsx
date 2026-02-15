import { createClient } from "@/lib/supabase/server";
import AdminLayout from "../components/AdminMenu";
import VsTeamList from "./components/VsTeamList";
import { saveVsTeam, deleteVsTeam, updateSortOrder } from "./actions";

export default async function VsTeamsPage() {
  const supabase = await createClient();
  const { data: myTeamId } = await supabase.rpc("get_my_team_id");

  const { data: VsTeams } = await supabase
    .from("vsteams")
    .select("*")
    .eq("team_id", myTeamId)
    .order("sort", { ascending: true });

  // アイコンのPublic URLを生成
  const iconUrls: { [key: string]: string } = {};
  if (VsTeams) {
    VsTeams.forEach((vsTeam) => {
      if (vsTeam.icon) {
        iconUrls[vsTeam.id] = supabase.storage
          .from("vsteams")
          .getPublicUrl(vsTeam.icon).data.publicUrl;
      }
    });
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl items-center mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">対戦相手管理</h1>
          <p className="text-gray-600">
            試合登録時に使用する対戦相手の作成・編集・並び替えができます。
          </p>
        </div>

        <VsTeamList
          masters={VsTeams || []}
          iconUrls={iconUrls}
          upsertaction={saveVsTeam}
          deleteAction={deleteVsTeam}
          updateSortAction={updateSortOrder}
        />
      </div>
    </AdminLayout>
  );
}
