"use client";

import { useEffect, useState } from "react";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import TeamProfileFormRow from "./teamProfileForm";
import { Database } from "@/types/supabase";

type TeamProfileRow = Pick<
  Database["public"]["Tables"]["team_profiles"]["Row"],
  "q" | "a"
>;

export default function TeamProfilesContent() {
  const [teamProfiles, setTeamProfiles] = useState<TeamProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamProfiles();
  }, []);

  const loadTeamProfiles = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: myTeamId } = await supabase.rpc("get_my_team_id");
      const { data: profilesData } = await supabase
        .from("team_profiles")
        .select("q,a")
        .eq("team_id", myTeamId)
        .order("no");

      setTeamProfiles(profilesData || []);
    } catch (error) {
      console.error("Error loading team profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          チームプロフィール管理
        </h1>
        <p className="text-gray-600">
          チームプロフィールの作成・編集ができます。
        </p>
        <p className="text-gray-500 my-1">
          リンクは Markdown 形式で入力できます。例:
          [公式サイト](https://example.com)
        </p>

        {loading ? (
          <LoadingIndicator />
        ) : (
          <TeamProfileFormRow teamProfiles={teamProfiles} />
        )}
      </div>
    </div>
  );
}
