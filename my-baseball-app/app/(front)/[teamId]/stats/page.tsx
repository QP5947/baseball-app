import { createClient } from "@/lib/supabase/server";
import StatsAnalysisClient from "./components/StatsAnalysisClient";
import ToastRedirect from "@/components/ToastRedirect";

interface Props {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function StatsAnalysisPage({ params }: Props) {
  const { teamId } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("myteams")
    .select("id, name, team_color, team_logo")
    .eq("id", teamId)
    .single();

  if (!team) {
    return <ToastRedirect message="チームが見つかりません" redirectPath="/" />;
  }

  const { data: battingDaily } = await supabase
    .from("mv_player_daily_stats")
    .select("*")
    .eq("team_id", teamId);

  const { data: pitchingDaily } = await supabase
    .from("mv_player_daily_pitching_stats")
    .select("*")
    .eq("team_id", teamId);

  const { data: pitchingRaw } = await supabase
    .from("pitching_results")
    .select("game_id, player_id, innings, outs")
    .eq("team_id", teamId);

  const { data: players } = await supabase
    .from("players")
    .select("id, name, no")
    .eq("team_id", teamId);

  const { data: games } = await supabase
    .from("games")
    .select("id, start_datetime, league_id, ground_id, vsteam_id")
    .eq("team_id", teamId)
    .eq("sum_flg", true)
    .not("status", "is", null)
    .not("status", "in", "(0,6)");

  const [{ data: leagues }, { data: grounds }, { data: vsteams }] =
    await Promise.all([
      supabase.from("leagues").select("id, name"),
      supabase.from("grounds").select("id, name"),
      supabase.from("vsteams").select("id, name"),
    ]);

  const playerNameMap: Record<string, string> = {};
  const playerNumberMap: Record<string, number | null> = {};
  (players || []).forEach((player) => {
    playerNameMap[player.id] = player.name || "不明";
    playerNumberMap[player.id] = player.no ?? null;
  });

  const getStorageUrl = (
    path: string | null,
    bucket: string = "team_assets",
  ) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  };

  const leagueMap = new Map<string, string>();
  (leagues || []).forEach((league) => {
    leagueMap.set(league.id, league.name || "未設定");
  });

  const groundMap = new Map<string, string>();
  (grounds || []).forEach((ground) => {
    groundMap.set(ground.id, ground.name || "未設定");
  });

  const vsteamMap = new Map<string, string>();
  (vsteams || []).forEach((vsteam) => {
    vsteamMap.set(vsteam.id, vsteam.name || "未設定");
  });

  const gamesForQualification = (games || []).map((game) => ({
    gameId: game.id,
    seasonYear: game.start_datetime
      ? String(new Date(game.start_datetime).getFullYear())
      : "",
    leagueName: game.league_id
      ? (leagueMap.get(game.league_id) ?? "未設定")
      : "未設定",
    groundName: game.ground_id
      ? (groundMap.get(game.ground_id) ?? "未設定")
      : "未設定",
    vsteamName: game.vsteam_id
      ? (vsteamMap.get(game.vsteam_id) ?? "未設定")
      : "未設定",
  }));

  const toNumber = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const rawOutsMap = new Map<string, number>();
  (pitchingRaw || []).forEach((row) => {
    if (!row.game_id || !row.player_id) return;
    const innings = toNumber(row.innings);
    const outs = toNumber(row.outs);
    const whole = Math.floor(Math.max(0, innings));
    const decimalOuts = Math.round((Math.max(0, innings) - whole) * 10);
    const totalOuts =
      outs > 0 ? whole * 3 + outs : whole * 3 + Math.max(0, decimalOuts);
    rawOutsMap.set(`${row.game_id}:${row.player_id}`, totalOuts);
  });

  const normalizedPitchingDaily = (pitchingDaily || []).map((row) => {
    const key = `${row.game_id}:${row.player_id}`;
    const fallbackOuts = rawOutsMap.get(key);
    if (
      fallbackOuts === undefined ||
      (row.outs !== null && row.outs !== undefined)
    ) {
      return row;
    }

    return {
      ...row,
      outs: fallbackOuts,
      ip: fallbackOuts / 3,
    };
  });

  return (
    <StatsAnalysisClient
      teamId={teamId}
      teamName={team.name}
      teamColor={team.team_color || "#3b82f6"}
      teamLogo={getStorageUrl(team.team_logo)}
      battingDaily={(battingDaily || []) as Record<string, any>[]}
      pitchingDaily={normalizedPitchingDaily as Record<string, any>[]}
      playerNameMap={playerNameMap}
      playerNumberMap={playerNumberMap}
      gamesForQualification={gamesForQualification}
    />
  );
}
