import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminLoginClient from "./AdminLoginClient";

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("AdminLoginPage user:", user);

  if (user) {
    const { data: myTeamId } = await supabase.rpc("get_my_team_id");
    if (myTeamId) {
      redirect("/admin/dashboard");
    }

    redirect("/team-register");
  }
  return <AdminLoginClient />;
}
