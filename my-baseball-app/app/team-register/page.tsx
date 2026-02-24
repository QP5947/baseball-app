import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TeamRegisterClient from "./TeamRegisterClient";

export default async function TeamRegisterPage() {
  // 未認証の場合は新規登録画面にリダイレクト
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/register-entry");
  }

  //　すでにチーム登録済みの場合はダッシュボードへリダイレクト
  const { data: myTeamId } = await supabase.rpc("get_my_team_id");
  if (myTeamId) {
    redirect("/admin/dashboard");
  }

  return <TeamRegisterClient />;
}
