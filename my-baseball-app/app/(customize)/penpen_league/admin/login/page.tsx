"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PenpenAdminLoginPage() {
  useEffect(() => {
    document.title = "管理画面ログイン | ペンペンリーグ";
  }, []);

  const router = useRouter();

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/penpen-admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId,
          password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setMessage(payload?.message ?? "ログインに失敗しました。");
        return;
      }

      router.push("/penpen_league/admin");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-200 p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            PENPEN LEAGUE
          </h1>
          <p className="text-gray-600 font-bold">管理画面ログイン</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label
              htmlFor="admin-id"
              className="block text-base font-bold text-gray-700"
            >
              ID
            </label>
            <input
              id="admin-id"
              type="text"
              value={adminId}
              onChange={(event) => setAdminId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="admin-password"
              className="block text-base font-bold text-gray-700"
            >
              パスワード
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="block w-full text-center bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? "確認中..." : "ログイン"}
          </button>
        </form>

        {message ? (
          <p className="text-sm text-red-600 text-center">{message}</p>
        ) : null}

        <div className="text-center">
          <Link
            href="/penpen_league"
            className="text-blue-700 font-bold hover:underline"
          >
            ← トップへ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
