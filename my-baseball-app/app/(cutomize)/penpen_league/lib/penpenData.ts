import type { SupabaseClient } from "@supabase/supabase-js";

export type GameTypeLabel = "リーグ戦" | "トーナメント";

export type PenpenMaster = {
  id: string;
  name: string;
  isEnabled: boolean;
  sortOrder: number;
};

export type PenpenStadium = PenpenMaster & {
  address: string;
  googleMapUrl: string;
  note: string;
};

export type PenpenGame = {
  id: string;
  displayOrder: number;
  startTime: string;
  endTime: string;
  awayTeamId: string;
  awayTeam: string;
  homeTeamId: string;
  homeTeam: string;
  leagueId: string | null;
  gameType: GameTypeLabel;
  awayScore: number | null;
  homeScore: number | null;
  isCanceled: boolean;
};

export type PenpenScheduleEntry = {
  id: string;
  date: string;
  stadiumId: string | null;
  stadium: string;
  note: string;
  resultNote: string;
  games: PenpenGame[];
  restTeamIds: string[];
  restTeams: string[];
};

type TeamRow = {
  id: string;
  name: string;
  is_enabled: boolean;
  sort_order: number;
};

type StadiumRow = {
  id: string;
  name: string;
  address: string | null;
  google_map_url: string | null;
  note: string | null;
  is_enabled: boolean;
  sort_order: number;
};

type ScheduleDayRow = {
  id: string;
  match_date: string;
  stadium_id: string | null;
  note: string | null;
};

type ScheduledGameRow = {
  id: string;
  schedule_day_id: string;
  display_order: number;
  start_time: string;
  end_time: string;
  away_team_id: string;
  home_team_id: string;
  game_type: string;
  league_id: string | null;
};

type RestRow = {
  schedule_day_id: string;
  team_id: string;
};

type GameResultRow = {
  scheduled_game_id: string;
  away_score: number | null;
  home_score: number | null;
  is_canceled: boolean;
};

type DayResultRow = {
  schedule_day_id: string;
  note: string | null;
};

const toHm = (value: string | null | undefined) => (value ?? "").slice(0, 5);

const mapGameType = (value: string): GameTypeLabel => {
  if (value === "tournament" || value === "トーナメント") {
    return "トーナメント";
  }
  return "リーグ戦";
};

const formatWeekdayDate = (dateInput: string) => {
  if (!dateInput) {
    return "";
  }

  const date = new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateInput;
  }

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d} (${weekdays[date.getDay()]})`;
};

export const toIsoDateInput = (value: string) => value.slice(0, 10);

export const toDisplayDate = (value: string) => formatWeekdayDate(value);

export async function fetchPenpenMasters(supabase: SupabaseClient) {
  const penpen = supabase.schema("penpen");

  const [leagueRes, teamRes, stadiumRes] = await Promise.all([
    penpen
      .from("leagues")
      .select("id, name, is_enabled, sort_order")
      .order("sort_order", { ascending: true }),
    penpen
      .from("teams")
      .select("id, name, is_enabled, sort_order")
      .order("sort_order", { ascending: true }),
    penpen
      .from("stadiums")
      .select("id, name, address, google_map_url, note, is_enabled, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (leagueRes.error) {
    throw leagueRes.error;
  }
  if (teamRes.error) {
    throw teamRes.error;
  }
  if (stadiumRes.error) {
    throw stadiumRes.error;
  }

  const leagues: PenpenMaster[] = ((leagueRes.data ?? []) as TeamRow[]).map(
    (item) => ({
      id: item.id,
      name: item.name,
      isEnabled: item.is_enabled,
      sortOrder: item.sort_order,
    }),
  );

  const teams: PenpenMaster[] = ((teamRes.data ?? []) as TeamRow[]).map(
    (item) => ({
      id: item.id,
      name: item.name,
      isEnabled: item.is_enabled,
      sortOrder: item.sort_order,
    }),
  );

  const stadiums: PenpenStadium[] = (
    (stadiumRes.data ?? []) as StadiumRow[]
  ).map((item) => ({
    id: item.id,
    name: item.name,
    isEnabled: item.is_enabled,
    sortOrder: item.sort_order,
    address: item.address ?? "",
    googleMapUrl: item.google_map_url ?? "",
    note: item.note ?? "",
  }));

  return { leagues, teams, stadiums };
}

export async function fetchPenpenScheduleEntries(supabase: SupabaseClient) {
  const penpen = supabase.schema("penpen");

  const [
    daysRes,
    gamesRes,
    restsRes,
    teamsRes,
    stadiumsRes,
    resultRes,
    dayResultRes,
  ] = await Promise.all([
    penpen
      .from("schedule_days")
      .select("id, match_date, stadium_id, note")
      .order("match_date", { ascending: true }),
    penpen
      .from("scheduled_games")
      .select(
        "id, schedule_day_id, display_order, start_time, end_time, away_team_id, home_team_id, game_type, league_id",
      )
      .order("display_order", { ascending: true }),
    penpen.from("schedule_day_rest_teams").select("schedule_day_id, team_id"),
    penpen
      .from("teams")
      .select("id, name")
      .order("sort_order", { ascending: true }),
    penpen
      .from("stadiums")
      .select("id, name")
      .order("sort_order", { ascending: true }),
    penpen
      .from("game_results")
      .select("scheduled_game_id, away_score, home_score, is_canceled"),
    penpen.from("schedule_day_results").select("schedule_day_id, note"),
  ]);

  if (daysRes.error) throw daysRes.error;
  if (gamesRes.error) throw gamesRes.error;
  if (restsRes.error) throw restsRes.error;
  if (teamsRes.error) throw teamsRes.error;
  if (stadiumsRes.error) throw stadiumsRes.error;
  if (resultRes.error) throw resultRes.error;
  if (dayResultRes.error) throw dayResultRes.error;

  const teamMap = new Map(
    ((teamsRes.data ?? []) as { id: string; name: string }[]).map((item) => [
      item.id,
      item.name,
    ]),
  );
  const stadiumMap = new Map(
    ((stadiumsRes.data ?? []) as { id: string; name: string }[]).map((item) => [
      item.id,
      item.name,
    ]),
  );
  const resultMap = new Map(
    ((resultRes.data ?? []) as GameResultRow[]).map((item) => [
      item.scheduled_game_id,
      item,
    ]),
  );
  const dayResultMap = new Map(
    ((dayResultRes.data ?? []) as DayResultRow[]).map((item) => [
      item.schedule_day_id,
      item.note ?? "",
    ]),
  );

  const restMap = new Map<string, string[]>();
  ((restsRes.data ?? []) as RestRow[]).forEach((row) => {
    const current = restMap.get(row.schedule_day_id) ?? [];
    current.push(row.team_id);
    restMap.set(row.schedule_day_id, current);
  });

  const gamesMap = new Map<string, PenpenGame[]>();
  ((gamesRes.data ?? []) as ScheduledGameRow[]).forEach((row) => {
    const current = gamesMap.get(row.schedule_day_id) ?? [];
    const rowResult = resultMap.get(row.id);

    current.push({
      id: row.id,
      displayOrder: row.display_order,
      startTime: toHm(row.start_time),
      endTime: toHm(row.end_time),
      awayTeamId: row.away_team_id,
      awayTeam: teamMap.get(row.away_team_id) ?? "-",
      homeTeamId: row.home_team_id,
      homeTeam: teamMap.get(row.home_team_id) ?? "-",
      leagueId: row.league_id,
      gameType: mapGameType(row.game_type),
      awayScore: rowResult?.away_score ?? null,
      homeScore: rowResult?.home_score ?? null,
      isCanceled: rowResult?.is_canceled ?? false,
    });
    gamesMap.set(row.schedule_day_id, current);
  });

  const entries: PenpenScheduleEntry[] = (
    (daysRes.data ?? []) as ScheduleDayRow[]
  ).map((day) => {
    const restIds = restMap.get(day.id) ?? [];
    return {
      id: day.id,
      date: day.match_date,
      stadiumId: day.stadium_id,
      stadium: day.stadium_id ? (stadiumMap.get(day.stadium_id) ?? "") : "",
      note: day.note ?? "",
      resultNote: dayResultMap.get(day.id) ?? "",
      games: (gamesMap.get(day.id) ?? []).sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
      restTeamIds: restIds,
      restTeams: restIds.map((id) => teamMap.get(id) ?? ""),
    };
  });

  return entries;
}

export type TeamStanding = {
  teamId: string;
  name: string;
  g: number;
  w: number;
  l: number;
  d: number;
  pts: number;
  diff: number;
  resultByTeamId: Record<string, number | null>;
};

export function computeStandings(
  entries: PenpenScheduleEntry[],
  teams: PenpenMaster[],
) {
  const rowMap = new Map<string, TeamStanding>();

  teams.forEach((team) => {
    rowMap.set(team.id, {
      teamId: team.id,
      name: team.name,
      g: 0,
      w: 0,
      l: 0,
      d: 0,
      pts: 0,
      diff: 0,
      resultByTeamId: {},
    });
  });

  entries.forEach((entry) => {
    entry.games.forEach((game) => {
      if (
        game.gameType !== "リーグ戦" ||
        game.isCanceled ||
        game.awayScore === null ||
        game.homeScore === null
      ) {
        return;
      }

      const away = rowMap.get(game.awayTeamId);
      const home = rowMap.get(game.homeTeamId);
      if (!away || !home) {
        return;
      }

      away.g += 1;
      home.g += 1;
      away.diff += game.awayScore - game.homeScore;
      home.diff += game.homeScore - game.awayScore;

      if (game.awayScore > game.homeScore) {
        away.w += 1;
        away.pts += 3;
        home.l += 1;
        away.resultByTeamId[home.teamId] = 1;
        home.resultByTeamId[away.teamId] = 2;
      } else if (game.awayScore < game.homeScore) {
        away.l += 1;
        home.w += 1;
        home.pts += 3;
        away.resultByTeamId[home.teamId] = 2;
        home.resultByTeamId[away.teamId] = 1;
      } else {
        away.d += 1;
        home.d += 1;
        away.pts += 1;
        home.pts += 1;
        away.resultByTeamId[home.teamId] = 3;
        home.resultByTeamId[away.teamId] = 3;
      }
    });
  });

  return [...rowMap.values()].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return a.name.localeCompare(b.name, "ja");
  });
}

export function getPeriodFromDate(
  dateString: string,
): "spring" | "summer" | "autumn" | null {
  if (!dateString) {
    return null;
  }
  const month = Number(dateString.split("-")[1]);
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return null;
}
