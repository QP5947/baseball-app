"use client";

import { useEffect, useState } from "react";
import { Check, Edit, Plus } from "lucide-react";
import Link from "next/link";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import DeleteButton from "../../components/DeleteButton";
import { deleteGame } from "../actions";

interface Game {
  id: string;
  start_datetime: string;
  status?: number | null;
  leagues: { name: string };
  grounds: { name: string };
  vsteams: { name: string };
}

export default function GamesContent() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTeamId, setMyTeamId] = useState<string>("");

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: teamId } = await supabase.rpc("get_my_team_id");
      setMyTeamId(teamId);

      const { data: gamesData } = await supabase
        .from("games")
        .select("*,leagues (name),grounds(name),vsteams(name)")
        .eq("team_id", teamId)
        .is("status", null)
        .order("start_datetime", { ascending: true });

      setGames(gamesData || []);
    } catch (error) {
      console.error("Error loading games:", error);
    } finally {
      setLoading(false);
    }
  };

  // 開始日付のフォーマット
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">試合予定一覧</h1>
        <Link
          href="games/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          新規登録
        </Link>
      </div>

      {loading ? (
        <LoadingIndicator />
      ) : games.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          試合予定がまだ登録されていません
        </div>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-white p-4 rounded-lg shadow border"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-600">
                    {formatted.format(new Date(game.start_datetime))}
                  </div>
                  <div className="font-bold text-gray-900 mt-1">
                    {game.leagues?.name || ""} VS{" "}
                    {game.vsteams?.name || "（未選択）"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    球場: {game.grounds?.name || ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`games/${game.id}`}
                    className="text-gray-400 hover:text-blue-600 p-2"
                  >
                    <Edit size={18} />
                  </Link>
                  <DeleteButton
                    id={game.id}
                    deleteName={`${game.leagues?.name || ""} vs ${game.vsteams?.name || "（未選択）"}`}
                    action={deleteGame}
                    onSuccess={loadGames}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
