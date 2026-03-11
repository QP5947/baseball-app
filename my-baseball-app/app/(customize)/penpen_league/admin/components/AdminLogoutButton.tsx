"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await fetch("/api/penpen-admin/session", { method: "DELETE" });
      router.push("/penpen_league/admin/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={isSubmitting}
      className="inline-block rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      {isSubmitting ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
