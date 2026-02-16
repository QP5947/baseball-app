"use client";

import { useEffect, useState } from "react";
import { Check, Edit, Plus } from "lucide-react";
import Link from "next/link";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import DeleteButton from "../../components/DeleteButton";
import ImageHoverPreview from "./ImageHoverPreview";
import { deletePlayer } from "../actions";

interface Player {
  id: string;
  no?: string | null;
  name: string;
  position?: string;
  throw_hand?: string;
  batting_hand?: string;
  list_image?: string | null;
  detail_image?: string | null;
  comment?: string;
  is_player?: boolean;
  is_admin?: boolean;
  is_manager?: boolean;
  show_flg?: boolean;
  invite_code?: string;
  user_id?: string | null;
  list_image_url?: string;
  detail_image_url?: string;
}

export default function PlayersContent() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: myTeamId } = await supabase.rpc("get_my_team_id");
      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", myTeamId)
        .order("sort", { ascending: true, nullsFirst: false })
        .order("no", { ascending: true, nullsFirst: false });

      const playersWithImageUrls = (playersData || []).map((player) => ({
        ...player,
        list_image_url: player.list_image
          ? supabase.storage
              .from("player_images")
              .getPublicUrl(player.list_image).data.publicUrl
          : "",
        detail_image_url: player.detail_image
          ? supabase.storage
              .from("player_images")
              .getPublicUrl(player.detail_image).data.publicUrl
          : "",
      }));

      setPlayers(playersWithImageUrls);
    } catch (error) {
      console.error("Error loading players:", error);
    } finally {
      setLoading(false);
    }
  };

  const handMap: Record<string, string> = {
    L: "左",
    R: "右",
    S: "両",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">チームメイト一覧</h1>
        <Link
          href="/admin/players/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> 新規登録
        </Link>
      </div>

      {loading ? (
        <LoadingIndicator />
      ) : (
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
                  一覧画像
                </th>
                <th className="p-4 font-semibold text-gray-600 hidden md:table-cell">
                  詳細画像
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
              {players.map((player) => (
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
                    {handMap[player.throw_hand || ""]} /{" "}
                    {handMap[player.batting_hand || ""]}
                  </td>
                  <td className="p-4 text-gray-600 hidden md:table-cell text-center">
                    {player.list_image_url ? (
                      <ImageHoverPreview
                        imageUrl={player.list_image_url}
                        alt={`${player.name} 一覧画像`}
                        previewAlt={`${player.name} 一覧画像プレビュー`}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4 text-gray-600 hidden md:table-cell text-center">
                    {player.detail_image_url ? (
                      <ImageHoverPreview
                        imageUrl={player.detail_image_url}
                        alt={`${player.name} 詳細画像`}
                        previewAlt={`${player.name} 詳細画像プレビュー`}
                      />
                    ) : (
                      "-"
                    )}
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
                      {!player.user_id && (
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
      )}
    </div>
  );
}
