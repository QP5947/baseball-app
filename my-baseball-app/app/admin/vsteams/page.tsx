import { createClient } from "@/lib/supabase/server";
import AdminLayout from "../components/AdminMenu";
import VsTeamList from "../components/MasterList";
import { saveVsTeam, deleteVsTeam, updateSortOrder } from "./actions";

export default async function VsTeamsPage() {
  const supabase = await createClient();

  const { data: VsTeams } = await supabase
    .from("vsteams")
    .select("*")
    .order("sort", { ascending: true });

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
          upsertaction={saveVsTeam}
          deleteAction={deleteVsTeam}
          updateSortAction={updateSortOrder}
        />
      </div>
    </AdminLayout>
  );
}
