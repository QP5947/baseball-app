"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlayerMenu from "../components/PlayerMenu";
import ScheduleContent from "./components/ScheduleContent";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";

export default function SchedulePage() {
  const router = useRouter();
  const [playerNo, setPlayerNo] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerInfo();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex text-slate-900">
        <PlayerMenu no={null} name={null}>
          <div className="flex-1 flex items-center justify-center">
            <LoadingIndicator />
          </div>
        </PlayerMenu>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      <PlayerMenu no={playerNo} name={playerName}>
        <ScheduleContent />
      </PlayerMenu>
    </div>
  );
}
