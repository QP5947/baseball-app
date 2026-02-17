"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface ToastRedirectProps {
  message: string;
  redirectPath: string;
}

export default function ToastRedirect({
  message,
  redirectPath,
}: ToastRedirectProps) {
  const router = useRouter();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!hasShownToast.current) {
      toast.error(message);
      hasShownToast.current = true;
    }
    router.push(redirectPath);
  }, [message, redirectPath, router]);

  return null;
}
