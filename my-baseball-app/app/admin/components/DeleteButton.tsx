"use client";

import { useActionState, useEffect } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

export type ActionResult = {
  success: boolean;
  message: string;
};

export default function DeleteButton({
  id,
  deleteName,
  action,
  onSuccess,
}: {
  id: string;
  deleteName: string;
  action: (formData: FormData) => Promise<ActionResult>;
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(async (_prevState, formData) => {
    if (!confirm(`${deleteName} を削除してもよろしいですか？`)) {
      return undefined;
    }
    return await action(formData);
  }, undefined);

  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message);
        onSuccess?.();
      } else {
        toast.error(state.message);
      }
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex items-center">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={isPending}
        className="text-gray-400 hover:text-red-600 transition-colors leading-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 size={18} />
      </button>
    </form>
  );
}
