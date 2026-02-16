"use client";

import { useEffect, useState } from "react";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import VsTeamList from "./VsTeamList";
import { saveVsTeam, deleteVsTeam, updateSortOrder } from "../actions";

export default function VsTeamsContent() {
  const [vsTeams, setVsTeams] = useState<any[]>([]);
  const [iconUrls, setIconUrls] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVsTeams();
  }, []);

  const loadVsTeams = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: myTeamId } = await supabase.rpc("get_my_team_id");
      const { data: vsTeamsData } = await supabase
        .from("vsteams")
        .select("*")
        .eq("team_id", myTeamId)
        .order("sort", { ascending: true });

      // アイコンのPublic URLを生成
      const urls: { [key: string]: string } = {};
      if (vsTeamsData) {
        vsTeamsData.forEach((vsTeam) => {
          if (vsTeam.icon) {
            urls[vsTeam.id] = supabase.storage
              .from("vsteams")
              .getPublicUrl(vsTeam.icon).data.publicUrl;
          }
        });
      }

      setVsTeams(vsTeamsData || []);
      setIconUrls(urls);
    } catch (error) {
      console.error("Error loading vsteams:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl items-center mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">対戦相手管理</h1>
        <p className="text-gray-600">
          試合登録時に使用する対戦相手の作成・編集・並び替えができます。
        </p>
      </div>

      {loading ? (
        <LoadingIndicator />
      ) : (
        <VsTeamList
          masters={vsTeams}
          iconUrls={iconUrls}
          upsertaction={saveVsTeam}
          deleteAction={deleteVsTeam}
          updateSortAction={updateSortOrder}
        />
      )}
    </div>
  );
}
