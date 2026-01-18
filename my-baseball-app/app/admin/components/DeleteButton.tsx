"use client";

import { Trash2 } from "lucide-react";

export default function DeleteButton({
  id,
  deleteName,
  action,
}: {
  id: string;
  deleteName: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const handleDelete = async (formData: FormData) => {
    if (!confirm(`${deleteName} を削除してもよろしいですか？`)) {
      return;
    }
    // OKだった場合のみサーバーアクションを実行
    await action(formData);
  };

  return (
    <form action={handleDelete} className="flex items-center">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-gray-400 hover:text-red-600 transition-colors leading-none cursor-pointer"
      >
        <Trash2 size={18} />
      </button>
    </form>
  );
}
