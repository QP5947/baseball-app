import { createClient } from "@/lib/supabase/server";
import { Check, Edit, Plus } from "lucide-react";
import Link from "next/link";
import AdminMenu from "../components/AdminMenu";
import DeleteButton from "../components/DeleteButton";
import { deleteGame } from "./actions";

export default async function GamersPage() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from("games")
    .select("*,leagues (name),grounds(name),vsteams(name)")
    .is("status", null)
    .order("start_datetime", { ascending: true });

  // 開始日付のフォーマット
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AdminMenu>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">試合予定一覧</h1>
        <Link
          href="/admin/games/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> 新規登録
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-auto">
        <table className="w-full min-w-full table-fixed md:table-auto text-left border-collapse">
          <thead className="bg-gray-50 border-b text-center">
            <tr>
              <th className="p-4 font-semibold text-gray-600">試合開始日時</th>
              <th className="p-4 font-semibold text-gray-600">リーグ名</th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                球場
              </th>
              <th className="p-4 font-semibold text-gray-600">対戦相手</th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                成績集計
              </th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                備考
              </th>
              <th className="p-4 font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {games?.map((game) => (
              <tr
                key={game.id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="p-4 text-gray-600 text-center">
                  {formatted.format(new Date(game.start_datetime))}
                </td>
                <td className="p-4  text-gray-600">
                  {game.leagues?.[0]?.name}
                </td>
                <td className="p-4 text-gray-600 hidden md:table-cell">
                  {game.grounds.name}
                </td>
                <td className="p-4 text-gray-600">{game.vsteams.name}</td>
                <td className="p-4 text-gray-600 text-center hidden md:table-cell">
                  {game.sum_flg ? <Check className="inline-block" /> : ""}
                </td>
                <td className="p-4 text-gray-600 hidden md:table-cell max-w-100">
                  <div className="line-clamp-3 whitespace-pre-wrap">
                    {game.remarks}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      href={`/admin/games/${game.id}`}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit size={18} />
                    </Link>
                    <DeleteButton
                      id={game.id}
                      deleteName={
                        formatted.format(new Date(game.start_datetime)) +
                        "～ VS" +
                        game.vsteams.name
                      }
                      action={deleteGame}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminMenu>
  );
}
