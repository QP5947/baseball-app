import { deletePlayer } from "@/admin/players/actions";
import { createClient } from "@/lib/supabase/server";
import { Check, Edit, Plus } from "lucide-react";
import Link from "next/link";
import AdminMenu from "../components/AdminMenu";
import DeleteButton from "../components/DeleteButton";

export default async function PlayersPage() {
  const supabase = await createClient();
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("sort", { ascending: true, nullsFirst: false })
    .order("no", { ascending: true, nullsFirst: false });

  const handMap: Record<string, string> = {
    L: "左",
    R: "右",
    S: "両",
  };

  return (
    <AdminMenu>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">チームメイト一覧</h1>
        <Link
          href="/admin/players/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> 新規登録
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-auto">
        <table className="w-full min-w-full table-fixed md:table-auto text-left border-collapse">
          <thead className="bg-gray-50 border-b text-center">
            <tr>
              <th className="p-4 font-semibold text-gray-600">背番号</th>
              <th className="p-4 font-semibold text-gray-600">名前</th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                守備
              </th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                投 / 打
              </th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                コメント
              </th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                権限
              </th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                表示
              </th>
              <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                認証コード
              </th>
              <th className="p-4 font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {players?.map((player) => (
              <tr
                key={player.id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="p-4 font-mono text-blue-600 font-bold">
                  {player.no || "-"}
                </td>
                <td className="p-4 font-medium text-gray-800 whitespace-nowrap">
                  {player.name}
                </td>
                <td className="p-4 text-gray-600 hidden md:table-cell">
                  {player.position}
                </td>
                <td className="p-4 text-gray-600 hidden md:table-cell whitespace-nowrap text-center">
                  {handMap[player.throw_hand]} / {handMap[player.batting_hand]}
                </td>
                <td className="p-4 text-gray-600 hidden md:table-cell max-w-100">
                  <div className="line-clamp-3 whitespace-pre-wrap">
                    {player.comment}
                  </div>
                </td>
                <td className="p-4 text-gray-600 hidden md:table-cell whitespace-pre">
                  {[
                    player.is_player && "選手",
                    player.is_admin && "管理者",
                    player.is_manager && "マネージャー",
                  ]
                    .filter(Boolean)
                    .join("\n")}
                </td>
                <td className="p-4 text-gray-600 hidden md:table-cell text-center">
                  {player.show_flg ? <Check className="inline-block" /> : ""}
                </td>
                <td className="p-4 text-gray-600 hidden md:table-cell text-center">
                  {player.is_player || player.is_admin || player.is_manager
                    ? player.invite_code
                    : ""}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      href={`/admin/players/${player.id}`}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit size={18} />
                    </Link>
                    {player.user_id ? (
                      ""
                    ) : (
                      <DeleteButton
                        id={player.id}
                        deleteName={player.name}
                        action={deletePlayer}
                      />
                    )}
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
