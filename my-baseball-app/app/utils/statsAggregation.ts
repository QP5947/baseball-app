type StatRow = Record<string, any>;

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundTo = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const yearFromRow = (row?: StatRow | null): number | null => {
  if (!row) {
    return null;
  }
  if (row.season_year !== null && row.season_year !== undefined) {
    return Number(row.season_year);
  }
  if (row.game_date) {
    return new Date(row.game_date).getFullYear();
  }
  if (row.start_datetime) {
    return new Date(row.start_datetime).getFullYear();
  }
  return null;
};

export type BattingAggregate = {
  team_id: string | null;
  player_id: string | null;
  season_year: number | null;
  g_count: number;
  pa: number;
  ab: number;
  h: number;
  d2: number;
  t3: number;
  hr: number;
  tb: number;
  bb_hbp: number;
  sf: number;
  sh: number;
  so: number;
  rbi: number;
  total_outs: number;
  sb: number;
  cs: number;
  runs: number;
  errors: number;
  attendance_pct: number;
  avg: number | null;
  obp: number | null;
  slg: number | null;
  ops: number | null;
  sb_pct: number;
};

export type PitchingAggregate = {
  team_id: string | null;
  player_id: string | null;
  year: number | null;
  games: number;
  appearances: number;
  outs: number;
  ip: number;
  h: number;
  bb: number;
  hbp: number;
  so: number;
  er: number;
  hr: number;
  sv: number;
  hld: number;
  wins: number;
  losses: number;
  whip: number;
  era: number;
  winpct: number;
  k7: number;
};

export const aggregateBattingRows = (
  rows: StatRow[],
  options?: { seasonYear?: number; playerId?: string },
): BattingAggregate => {
  const filtered = rows.filter((row) => {
    if (options?.seasonYear !== undefined) {
      const year = yearFromRow(row);
      if (year !== options.seasonYear) return false;
    }
    if (options?.playerId !== undefined && row.player_id !== options.playerId) {
      return false;
    }
    return true;
  });

  const gameIds = new Set<string>();
  let attendedGames = 0;

  const base = {
    pa: 0,
    ab: 0,
    h: 0,
    d2: 0,
    t3: 0,
    hr: 0,
    tb: 0,
    bb_hbp: 0,
    sf: 0,
    sh: 0,
    so: 0,
    rbi: 0,
    total_outs: 0,
    sb: 0,
    cs: 0,
    runs: 0,
    errors: 0,
  };

  filtered.forEach((row) => {
    if (row.game_id) gameIds.add(String(row.game_id));
    if (toNumber(row.attended_game) > 0) attendedGames += 1;

    base.pa += toNumber(row.pa);
    base.ab += toNumber(row.ab);
    base.h += toNumber(row.h);
    base.d2 += toNumber(row.d2);
    base.t3 += toNumber(row.t3);
    base.hr += toNumber(row.hr);
    base.tb += toNumber(row.tb);
    base.bb_hbp += toNumber(row.bb_hbp);
    base.sf += toNumber(row.sf);
    base.sh += toNumber(row.sh);
    base.so += toNumber(row.so);
    base.rbi += toNumber(row.rbi);
    base.total_outs += toNumber(row.total_outs);
    base.sb += toNumber(row.sb);
    base.cs += toNumber(row.cs);
    base.runs += toNumber(row.runs);
    base.errors += toNumber(row.errors);
  });

  const avg = base.ab > 0 ? roundTo(base.h / base.ab, 3) : null;
  const obpDenominator = base.ab + base.bb_hbp + base.sf;
  const obp =
    obpDenominator > 0
      ? roundTo((base.h + base.bb_hbp) / obpDenominator, 3)
      : null;
  const slg = base.ab > 0 ? roundTo(base.tb / base.ab, 3) : null;
  const ops = obp !== null && slg !== null ? roundTo(obp + slg, 3) : null;

  const gCount = gameIds.size;
  const sbChance = base.sb + base.cs;
  const firstRow = filtered[0];

  return {
    team_id: firstRow?.team_id ?? null,
    player_id: firstRow?.player_id ?? null,
    season_year: options?.seasonYear ?? yearFromRow(firstRow) ?? null,
    g_count: gCount,
    ...base,
    attendance_pct: gCount > 0 ? roundTo(attendedGames / gCount, 3) : 0,
    avg,
    obp,
    slg,
    ops,
    sb_pct: sbChance > 0 ? roundTo(base.sb / sbChance, 3) : 0,
  };
};

export const aggregatePitchingRows = (
  rows: StatRow[],
  options?: { seasonYear?: number; playerId?: string },
): PitchingAggregate => {
  const filtered = rows.filter((row) => {
    if (options?.seasonYear !== undefined) {
      const year = yearFromRow(row);
      if (year !== options.seasonYear) return false;
    }
    if (options?.playerId !== undefined && row.player_id !== options.playerId) {
      return false;
    }
    return true;
  });

  const gameIds = new Set<string>();
  let appearances = 0;

  const outsFromLegacyIp = (ipValue: number): number => {
    if (!Number.isFinite(ipValue) || ipValue <= 0) return 0;
    const whole = Math.floor(ipValue);
    const fraction = ipValue - whole;
    const outs = Math.round(fraction * 10);
    return whole * 3 + Math.max(0, outs);
  };

  const base = {
    outs: 0,
    ip: 0,
    h: 0,
    bb: 0,
    hbp: 0,
    so: 0,
    er: 0,
    hr: 0,
    sv: 0,
    hld: 0,
    wins: 0,
    losses: 0,
  };

  filtered.forEach((row) => {
    if (row.game_id) gameIds.add(String(row.game_id));

    const ip = toNumber(row.ip);
    const rowOutsRaw = row.outs;
    const outs =
      rowOutsRaw !== null && rowOutsRaw !== undefined
        ? toNumber(rowOutsRaw)
        : outsFromLegacyIp(ip);
    if (ip > 0) appearances += 1;

    base.outs += outs;
    base.ip += ip;
    base.h += toNumber(row.h);
    base.bb += toNumber(row.bb);
    base.hbp += toNumber(row.hbp);
    base.so += toNumber(row.so);
    base.er += toNumber(row.er);
    base.hr += toNumber(row.hr);
    base.sv += toNumber(row.sv);
    base.hld += toNumber(row.hld);
    base.wins += toNumber(row.wins);
    base.losses += toNumber(row.losses);
  });

  const winLossTotal = base.wins + base.losses;
  const computedIp = base.outs > 0 ? roundTo(base.outs / 3, 3) : base.ip;
  const firstRow = filtered[0];

  return {
    team_id: firstRow?.team_id ?? null,
    player_id: firstRow?.player_id ?? null,
    year: options?.seasonYear ?? yearFromRow(firstRow) ?? null,
    games: gameIds.size,
    appearances,
    ...base,
    ip: computedIp,
    whip: base.outs > 0 ? roundTo(((base.h + base.bb) * 3) / base.outs, 3) : 0,
    era: base.outs > 0 ? roundTo((base.er * 21) / base.outs, 2) : 999.99,
    winpct: winLossTotal > 0 ? roundTo(base.wins / winLossTotal, 3) : 0,
    k7: base.outs > 0 ? roundTo((base.so * 21) / base.outs, 2) : 0,
  };
};

export const groupBattingByYear = (rows: StatRow[]): BattingAggregate[] => {
  const years = Array.from(
    new Set(
      rows
        .map((row) => yearFromRow(row))
        .filter((year): year is number => year !== null),
    ),
  ).sort((a, b) => b - a);

  return years.map((year) => aggregateBattingRows(rows, { seasonYear: year }));
};

export const groupPitchingByYear = (rows: StatRow[]): PitchingAggregate[] => {
  const years = Array.from(
    new Set(
      rows
        .map((row) => yearFromRow(row))
        .filter((year): year is number => year !== null),
    ),
  ).sort((a, b) => b - a);

  return years.map((year) => aggregatePitchingRows(rows, { seasonYear: year }));
};

type TitleRow = {
  team_id: string | null;
  player_id: string | null;
  season_year: number;
  title_name: string;
};

export const buildYearlyTitlesFromDaily = (
  battingRows: StatRow[],
  pitchingRows: StatRow[],
): TitleRow[] => {
  const battingByPlayerYear = new Map<string, BattingAggregate>();
  const pitchingByPlayerYear = new Map<string, PitchingAggregate>();

  battingRows.forEach((row) => {
    const year = yearFromRow(row);
    if (year === null || !row.player_id) return;

    const key = `${row.player_id}-${year}`;
    const current = battingByPlayerYear.get(key);
    if (!current) {
      battingByPlayerYear.set(
        key,
        aggregateBattingRows([row], {
          seasonYear: year,
          playerId: row.player_id,
        }),
      );
      return;
    }

    battingByPlayerYear.set(
      key,
      aggregateBattingRows(
        [
          ...battingRows.filter(
            (r) => r.player_id === row.player_id && yearFromRow(r) === year,
          ),
        ],
        {
          seasonYear: year,
          playerId: row.player_id,
        },
      ),
    );
  });

  pitchingRows.forEach((row) => {
    const year = yearFromRow(row);
    if (year === null || !row.player_id) return;

    const key = `${row.player_id}-${year}`;
    const current = pitchingByPlayerYear.get(key);
    if (!current) {
      pitchingByPlayerYear.set(
        key,
        aggregatePitchingRows([row], {
          seasonYear: year,
          playerId: row.player_id,
        }),
      );
      return;
    }

    pitchingByPlayerYear.set(
      key,
      aggregatePitchingRows(
        pitchingRows.filter(
          (r) => r.player_id === row.player_id && yearFromRow(r) === year,
        ),
        { seasonYear: year, playerId: row.player_id },
      ),
    );
  });

  const battingList = Array.from(battingByPlayerYear.values());
  const pitchingList = Array.from(pitchingByPlayerYear.values());

  const years = Array.from(
    new Set([
      ...battingList
        .map((row) => row.season_year)
        .filter((year): year is number => year !== null),
      ...pitchingList
        .map((row) => row.year)
        .filter((year): year is number => year !== null),
    ]),
  );

  const result: TitleRow[] = [];

  const addMaxTitles = (
    rows: Array<{
      team_id: string | null;
      player_id: string | null;
      value: number;
    }>,
    titleName: string,
    seasonYear: number,
    positiveOnly = true,
  ) => {
    const candidates = positiveOnly
      ? rows.filter((row) => row.value > 0)
      : rows;
    if (candidates.length === 0) return;
    const max = Math.max(...candidates.map((row) => row.value));
    candidates
      .filter((row) => row.value === max)
      .forEach((row) => {
        result.push({
          team_id: row.team_id,
          player_id: row.player_id,
          season_year: seasonYear,
          title_name: titleName,
        });
      });
  };

  const addMinTitles = (
    rows: Array<{
      team_id: string | null;
      player_id: string | null;
      value: number;
      ip: number;
    }>,
    titleName: string,
    seasonYear: number,
  ) => {
    const candidates = rows.filter((row) => row.ip > 0);
    if (candidates.length === 0) return;
    const min = Math.min(...candidates.map((row) => row.value));
    candidates
      .filter((row) => Math.abs(row.value - min) < 1e-9)
      .forEach((row) => {
        result.push({
          team_id: row.team_id,
          player_id: row.player_id,
          season_year: seasonYear,
          title_name: titleName,
        });
      });
  };

  years.forEach((year) => {
    const battingYearRows = battingList.filter(
      (row) => row.season_year === year,
    );
    const pitchingYearRows = pitchingList.filter((row) => row.year === year);

    addMaxTitles(
      battingYearRows
        .filter((row) => row.ab > 0)
        .map((row) => ({
          team_id: row.team_id,
          player_id: row.player_id,
          value: row.avg ?? -1,
        })),
      "首位打者",
      year,
      false,
    );

    addMaxTitles(
      battingYearRows.map((row) => ({
        team_id: row.team_id,
        player_id: row.player_id,
        value: row.h,
      })),
      "最多安打",
      year,
    );
    addMaxTitles(
      battingYearRows.map((row) => ({
        team_id: row.team_id,
        player_id: row.player_id,
        value: row.hr,
      })),
      "本塁打王",
      year,
    );
    addMaxTitles(
      battingYearRows.map((row) => ({
        team_id: row.team_id,
        player_id: row.player_id,
        value: row.rbi,
      })),
      "打点王",
      year,
    );
    addMaxTitles(
      battingYearRows.map((row) => ({
        team_id: row.team_id,
        player_id: row.player_id,
        value: row.sb,
      })),
      "盗塁王",
      year,
    );

    addMaxTitles(
      pitchingYearRows.map((row) => ({
        team_id: row.team_id,
        player_id: row.player_id,
        value: row.wins,
      })),
      "最多勝",
      year,
    );

    addMinTitles(
      pitchingYearRows.map((row) => ({
        team_id: row.team_id,
        player_id: row.player_id,
        value: row.era,
        ip: row.ip,
      })),
      "最優秀防御率",
      year,
    );

    addMaxTitles(
      pitchingYearRows.map((row) => ({
        team_id: row.team_id,
        player_id: row.player_id,
        value: row.so,
      })),
      "最多奪三振",
      year,
    );
    addMaxTitles(
      pitchingYearRows.map((row) => ({
        team_id: row.team_id,
        player_id: row.player_id,
        value: row.sv,
      })),
      "最多セーブ",
      year,
    );
  });

  return result.sort((a, b) => {
    if (a.season_year !== b.season_year) return b.season_year - a.season_year;
    if ((a.player_id || "") !== (b.player_id || "")) {
      return (a.player_id || "").localeCompare(b.player_id || "");
    }
    return a.title_name.localeCompare(b.title_name);
  });
};
