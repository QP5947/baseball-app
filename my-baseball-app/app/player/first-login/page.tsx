import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FirstLoginForm from "./components/FirstLoginForm";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "すべての項目を入力してください。",
  invalid: "入力内容が一致しませんでした。確認して再入力してください。",
  password_mismatch: "パスワードが一致しません。",
  password: "パスワードの設定に失敗しました。再度お試しください。",
};

export default async function PlayerFirstLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/player/login");
  }

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (player) {
    redirect("/player/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-3 md:p-24">
      <div className="w-full max-w-md space-y-6 rounded-xl border p-10 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">初回ログイン設定</h1>
        </div>

        <FirstLoginForm />
      </div>
    </div>
  );
}
