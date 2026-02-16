"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LoadingIndicator } from "@/components/LoadingSkeleton";
import { createClient } from "@/lib/supabase/client";
import GameResultForm from "@/admin/games/components/GameResultForm";

interface Game {
  id: string;
  [key: string]: any;
}

interface Player {
  id: string;
  no: string;
  name: string;
}

interface AtBatResult {
  no: number;
  short_name: string;
}

interface BattingResult {
  [key: string]: any;
}

interface PitchingResult {
  [key: string]: any;
}

export default function EditGameResultContent({
  gameId,
  year,
}: {
  gameId: string;
  year?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  const [playerList, setPlayerList] = useState<Player[]>([]);
  const [atBatResult, setAtBatResult] = useState<AtBatResult[]>([]);
  const [battingResult, setBattingResult] = useState<BattingResult[]>([]);
  const [pitchingResult, setPitchingResult] = useState<PitchingResult[]>([]);

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: myTeamId } = await supabase.rpc("get_my_team_id");

      // 試合データを取得
      const { data: gameData } = await supabase
        .from("games")
        .select("*,leagues (name),grounds(name),vsteams(name)")
        .eq("team_id", myTeamId)
        .eq("id", gameId)
        .single();

      if (!gameData) {
        router.push("/admin/games/results");
        return;
      }

      setGame(gameData);

      // 選手一覧を取得
      const { data: playerData } = await supabase
        .from("players")
        .select("id, no, name")
        .eq("team_id", myTeamId)
        .order("sort");

      const helper = { id: "HELPER", no: "", name: "助っ人" };
      setPlayerList(playerData ? [...playerData, helper] : [helper]);

      // 打席結果マスタを取得
      const { data: atBatResultData } = await supabase
        .from("at_bat_results")
        .select("no,short_name")
        .order("no");

      setAtBatResult(atBatResultData || []);

      // 打席結果を取得
      const { data: battingResultData } = await supabase
        .from("batting_results")
        .select("*, batting_result_details (*)")
        .eq("game_id", gameId)
        .order("batting_index")
        .order("inning_index", {
          referencedTable: "batting_result_details",
          ascending: true,
        });

      setBattingResult(battingResultData || []);

      // 投球結果を取得
      const { data: pitchingResultData } = await supabase
        .from("pitching_results")
        .select("*")
        .eq("game_id", gameId)
        .order("pitching_order");

      setPitchingResult(pitchingResultData || []);
    } catch (error) {
      console.error("Error loading game data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-full md:min-w-125 md:max-w-400 mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/admin/games/results?year=${year}`}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">試合結果編集</h1>
        </div>
        <LoadingIndicator />
      </div>
    );
  }

  if (!game) {
    return <div>試合が見つかりません</div>;
  }

  return (
    <div className="max-w-full md:min-w-125 md:max-w-400 mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/admin/games/results?year=${year}`}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">試合結果編集</h1>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border">
        <GameResultForm
          game={game as any}
          playerData={playerList as any}
          atBatResult={atBatResult as any}
          battingResult={battingResult as any}
          pitchingResult={pitchingResult as any}
        />
      </div>
    </div>
  );
}
