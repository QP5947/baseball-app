"use server";

import { createClient } from "@/lib/supabase/server";

export type RegisterEntryResult = {
  success: boolean;
  message: string;
};

export async function registerEntry(
  _prevState: RegisterEntryResult | undefined,
  formData: FormData,
): Promise<RegisterEntryResult | undefined> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      success: false,
      message: "メールアドレスとパスワードを入力してください。",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: "/team-register",
    },
  });

  if (data?.user?.identities?.length === 0) {
    return {
      success: false,
      message:
        "このメールアドレスは既に登録されています。ログインしてください。",
    };
  }

  if (error) {
    return {
      success: false,
      message: error.message || "登録に失敗しました。",
    };
  }

  return {
    success: true,
    message: "登録用メールを送信しました。メールをご確認ください。",
  };
}
