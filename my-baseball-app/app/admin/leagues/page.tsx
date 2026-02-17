"use client";

import { useEffect, useState } from "react";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import AdminLayout from "../components/AdminMenu";
import LeagueList from "../components/MasterList";
import { saveLeague, deleteLeague, updateSortOrder } from "./actions";

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeagues();
  }, []);

  const loadLeagues = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const supabase = createClient();
      const { data: myTeamId } = await supabase.rpc("get_my_team_id");
      const { data: leaguesData } = await supabase
        .from("leagues")
        .select("*")
        .eq("team_id", myTeamId)
        .order("sort", { ascending: true });

      setLeagues(leaguesData || []);
    } catch (error) {
      console.error("Error loading leagues:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl items-center mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">リーグ管理</h1>
          <p className="text-gray-600">
            試合登録時に使用するリーグ名の作成・編集・並び替えができます。
          </p>
        </div>

        {loading ? (
          <LoadingIndicator />
        ) : (
          <LeagueList
            masters={leagues}
            upsertaction={saveLeague}
            deleteAction={deleteLeague}
            updateSortAction={updateSortOrder}
            onChanged={() => loadLeagues(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
