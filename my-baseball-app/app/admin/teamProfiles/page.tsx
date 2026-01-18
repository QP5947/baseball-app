import { createClient } from "@/lib/supabase/server";
import AdminMenu from "../components/AdminMenu";
import TeamProfileFormRow from "./components/teamProfileForm";
import { Database } from "@/types/supabase";

type TeamProfileRow = Pick<
  Database["public"]["Tables"]["team_profiles"]["Row"],
  "q" | "a"
>;

export default async function TeamProfielPage() {
  const supabase = await createClient();

  const { data: teamProfiles } = await supabase
    .from("team_profiles")
    .select("q,a")
    .order("no");

  return (
    <AdminMenu>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            チームプロフィール管理
          </h1>
          <p className="text-sm text-gray-600">
            チームプロフィールの作成・編集ができます。
          </p>
          <TeamProfileFormRow teamProfiles={teamProfiles ? teamProfiles : []} />
        </div>
      </div>
    </AdminMenu>
  );
}
