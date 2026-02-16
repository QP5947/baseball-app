"use client";

import { useEffect, useState } from "react";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import AdminLayout from "../components/AdminMenu";
import GroundList from "../components/MasterList";
import { saveGround, deleteGround, updateSortOrder } from "./actions";

export default function GroundsPage() {
  const [grounds, setGrounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrounds();
  }, []);

  const loadGrounds = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: myTeamId } = await supabase.rpc("get_my_team_id");
      const { data: groundsData } = await supabase
        .from("grounds")
        .select("*")
        .eq("team_id", myTeamId)
        .order("sort", { ascending: true });

      setGrounds(groundsData || []);
    } catch (error) {
      console.error("Error loading grounds:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl items-center mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">球場管理</h1>
          <p className="text-gray-600">
            試合登録時に使用する球場名の作成・編集・並び替えができます。
          </p>
        </div>

        {loading ? (
          <LoadingIndicator />
        ) : (
          <GroundList
            masters={grounds}
            upsertaction={saveGround}
            deleteAction={deleteGround}
            updateSortAction={updateSortOrder}
          />
        )}
      </div>
    </AdminLayout>
  );
}
