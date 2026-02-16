"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlayerMenu from "../../components/PlayerMenu";
import AttendanceDetailContent from "./components/AttendanceDetailContent";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";

export default function AttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [gameId, setGameId] = useState<string>("");
  const [playerNo, setPlayerNo] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setGameId(id);
      loadPlayerInfo();
    };
    getParams();
  }, [params]);

  const loadPlayerInfo = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/player/login");
        return;
      }

      const { data: player } = await supabase
        .from("players")
        .select("id,name,no")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!player) {
        router.push("/player/login");
        return;
      }

      setPlayerNo(player.no ?? "");
      setPlayerName(player.name ?? "");
    } catch (error) {
      console.error("Error loading player info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !gameId) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex text-gray-800 relative">
        <PlayerMenu no={null} name={null}>
          <div className="flex-1 flex items-center justify-center">
            <LoadingIndicator />
          </div>
        </PlayerMenu>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex text-gray-800 relative">
      <PlayerMenu no={playerNo} name={playerName}>
        <AttendanceDetailContent gameId={gameId} />
      </PlayerMenu>
    </div>
  );
}
