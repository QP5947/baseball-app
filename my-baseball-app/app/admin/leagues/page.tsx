import { createClient } from "@/lib/supabase/server";
import AdminLayout from "../components/AdminMenu";
import LeagueList from "../components/MasterList";
import { saveLeague, deleteLeague, updateSortOrder } from "./actions";

export default async function LeaguesPage() {
  const supabase = await createClient();

  const { data: leagues } = await supabase
    .from("leagues")
    .select("*")
    .order("sort", { ascending: true });

  return (
    <AdminLayout>
      <div className="max-w-2xl items-center mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">リーグ管理</h1>
          <p className="text-gray-600">
            試合登録時に使用するリーグ名の作成・編集・並び替えができます。
          </p>
        </div>

        <LeagueList
          masters={leagues || []}
          upsertaction={saveLeague}
          deleteAction={deleteLeague}
          updateSortAction={updateSortOrder}
        />
      </div>
    </AdminLayout>
  );
}
