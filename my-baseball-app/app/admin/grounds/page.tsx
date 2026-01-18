import { createClient } from "@/lib/supabase/server";
import AdminLayout from "../components/AdminMenu";
import GroundList from "../components/MasterList";
import { saveGround, deleteGround, updateSortOrder } from "./actions";

export default async function GroundsPage() {
  const supabase = await createClient();

  const { data: Grounds } = await supabase
    .from("grounds")
    .select("*")
    .order("sort", { ascending: true });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">球場管理</h1>
        <p className="text-sm text-gray-600">
          試合登録時に使用する球場名の作成・編集・並び替えができます。
        </p>
      </div>

      <GroundList
        masters={Grounds || []}
        upsertaction={saveGround}
        deleteAction={deleteGround}
        updateSortAction={updateSortOrder}
      />
    </AdminLayout>
  );
}
