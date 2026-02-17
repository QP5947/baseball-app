"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface DeletedItemRedirectProps {
  message?: string;
  redirectPath: string;
}

export default function DeletedItemRedirect({
  message = "アイテムが見つかりません",
  redirectPath,
}: DeletedItemRedirectProps) {
  const router = useRouter();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!hasShownToast.current) {
      toast.error(message);
      hasShownToast.current = true;
    }
    router.push(redirectPath);
  }, [router, redirectPath, message]);

  return null;
}
