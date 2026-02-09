import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlayerLoginForm from "@/player/login/components/PlayerLoginForm";

export default async function PlayerLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: player } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (player) {
      redirect("/player/dashboard");
    }

    redirect("/player/first-login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-3 md:p-24">
      <PlayerLoginForm />
    </div>
  );
}
