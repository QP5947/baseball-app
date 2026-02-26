-- 選手の日別打撃成績マテリアライズドビュー
DROP MATERIALIZED VIEW IF EXISTS mv_player_daily_stats;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_player_daily_stats AS
WITH batting_lines AS (
  SELECT 
    d.team_id,
    d.player_id,
    g.id as game_id,
    DATE(g.start_datetime) as game_date,
    g.start_datetime,
    EXTRACT(YEAR FROM g.start_datetime)::integer AS season_year,
    g.league_id,
    l.name AS league_name,
    g.ground_id,
    gr.name AS ground_name,
    g.vsteam_id,
    vs.name AS vsteam_name,
    g.status AS game_status,
    g.sum_flg,
    
    -- 打席数
    COUNT(*) AS pa,
    
    -- 打数（is_at_bat = trueのもの）
    SUM(CASE WHEN r.is_at_bat = true THEN 1 ELSE 0 END) AS ab,
    
    -- 安打数（no = 4, 5, 6, 7）
    SUM(CASE WHEN r.no = ANY(ARRAY[4, 5, 6, 7]) THEN 1 ELSE 0 END) AS h,
    
    -- 二塁打
    SUM(CASE WHEN r.no = 5 THEN 1 ELSE 0 END) AS d2,
    
    -- 三塁打
    SUM(CASE WHEN r.no = 6 THEN 1 ELSE 0 END) AS t3,
    
    -- 本塁打
    SUM(CASE WHEN r.no = 7 THEN 1 ELSE 0 END) AS hr,
    
    -- 塁打数
    COALESCE(SUM(r.bases), 0) AS tb,
    
    -- 四球・死球（no = 2, 3）
    SUM(CASE WHEN r.no = ANY(ARRAY[2, 3]) THEN 1 ELSE 0 END) AS bb_hbp,
    
    -- 犠飛（no = 10）
    SUM(CASE WHEN r.no = 10 THEN 1 ELSE 0 END) AS sf,
    
    -- 犠打（no = 11）
    SUM(CASE WHEN r.no = 11 THEN 1 ELSE 0 END) AS sh,
    
    -- 三振（no = 1）
    SUM(CASE WHEN r.no = 1 THEN 1 ELSE 0 END) AS so,
    
    -- 打点
    SUM(d.rbi) AS rbi,
    
    -- 総アウト数
    COALESCE(SUM(r.outs), 0) AS total_outs
    
  FROM batting_result_details d
  JOIN at_bat_results r ON d.at_bat_result_no = r.no
  JOIN games g ON d.game_id = g.id AND g.team_id = d.team_id
  INNER JOIN players p ON p.team_id = d.team_id AND p.id = d.player_id
  LEFT JOIN leagues l ON l.id = g.league_id AND l.team_id = d.team_id
  LEFT JOIN grounds gr ON gr.id = g.ground_id AND gr.team_id = d.team_id
  LEFT JOIN vsteams vs ON vs.id = g.vsteam_id AND vs.team_id = d.team_id
  WHERE g.sum_flg = true
    AND g.status NOT IN (0, 6)
  GROUP BY 
    d.team_id,
    d.player_id,
    g.id,
    DATE(g.start_datetime),
    g.start_datetime,
    EXTRACT(YEAR FROM g.start_datetime),
    g.league_id,
    l.name,
    g.ground_id,
    gr.name,
    g.vsteam_id,
    vs.name,
    g.status,
    g.sum_flg
),
running_stats AS (
  SELECT
    b.team_id,
    b.player_id,
    b.game_id,
    COALESCE(SUM(b.steal), 0) AS sb,
    COALESCE(SUM(b.steal_miss), 0) AS cs,
    COALESCE(SUM(b.run), 0) AS runs,
    COALESCE(SUM(b.df_error), 0) AS errors
  FROM batting_results b
  GROUP BY b.team_id, b.player_id, b.game_id
),
attendance_stats AS (
  SELECT
    a.team_id,
    a.player_id,
    a.game_id,
    MAX(CASE WHEN a.real_attendance_no = 1 THEN 1 ELSE 0 END) AS attended_game
  FROM attendance a
  GROUP BY a.team_id, a.player_id, a.game_id
),
base_stats AS (
  SELECT
    bl.team_id,
    bl.player_id,
    bl.game_id,
    bl.game_date,
    bl.start_datetime,
    bl.season_year,
    bl.league_id,
    bl.league_name,
    bl.ground_id,
    bl.ground_name,
    bl.vsteam_id,
    bl.vsteam_name,
    bl.game_status,
    bl.sum_flg,
    bl.pa,
    bl.ab,
    bl.h,
    bl.d2,
    bl.t3,
    bl.hr,
    bl.tb,
    bl.bb_hbp,
    bl.sf,
    bl.sh,
    bl.so,
    bl.rbi,
    bl.total_outs,
    COALESCE(rs.sb, 0) AS sb,
    COALESCE(rs.cs, 0) AS cs,
    COALESCE(rs.runs, 0) AS runs,
    COALESCE(rs.errors, 0) AS errors,
    COALESCE(att.attended_game, 0) AS attended_game
  FROM batting_lines bl
  LEFT JOIN running_stats rs
    ON rs.team_id = bl.team_id
   AND rs.player_id = bl.player_id
   AND rs.game_id = bl.game_id
  LEFT JOIN attendance_stats att
    ON att.team_id = bl.team_id
   AND att.player_id = bl.player_id
   AND att.game_id = bl.game_id
)
SELECT 
  team_id,
  player_id,
  game_id,
  game_date,
  start_datetime,
  season_year,
  league_id,
  league_name,
  ground_id,
  ground_name,
  vsteam_id,
  vsteam_name,
  game_status,
  sum_flg,
  pa,
  ab,
  h,
  d2,
  t3,
  hr,
  tb,
  bb_hbp,
  sf,
  sh,
  so,
  rbi,
  total_outs,
  sb,
  cs,
  runs,
  errors,
  attended_game,
  -- 累計値
  SUM(pa) OVER w AS cum_pa,
  SUM(ab) OVER w AS cum_ab,
  SUM(h) OVER w AS cum_h,
  SUM(tb) OVER w AS cum_tb,
  SUM(bb_hbp) OVER w AS cum_bb_hbp,
  SUM(sf) OVER w AS cum_sf,
  
  -- 打率（累計）
  ROUND((SUM(h) OVER w)::numeric / NULLIF(SUM(ab) OVER w, 0)::numeric, 3) AS avg,
  
  -- 出塁率（累計）
  ROUND(((SUM(h) OVER w + SUM(bb_hbp) OVER w))::numeric / NULLIF((SUM(ab) OVER w + SUM(bb_hbp) OVER w + SUM(sf) OVER w), 0)::numeric, 3) AS obp,
  
  -- 長打率（累計）
  ROUND((SUM(tb) OVER w)::numeric / NULLIF(SUM(ab) OVER w, 0)::numeric, 3) AS slg,
  
  -- OPS（累計）
  (ROUND(((SUM(h) OVER w + SUM(bb_hbp) OVER w))::numeric / NULLIF((SUM(ab) OVER w + SUM(bb_hbp) OVER w + SUM(sf) OVER w), 0)::numeric, 3) + 
   ROUND((SUM(tb) OVER w)::numeric / NULLIF(SUM(ab) OVER w, 0)::numeric, 3)) AS ops
   
FROM base_stats
WINDOW w AS (PARTITION BY team_id, player_id ORDER BY start_datetime ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
ORDER BY start_datetime DESC, player_id;

-- インデックスを作成してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_stats_player 
  ON mv_player_daily_stats(player_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_stats_team 
  ON mv_player_daily_stats(team_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_stats_team_player 
  ON mv_player_daily_stats(team_id, player_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_stats_team_year
  ON mv_player_daily_stats(team_id, season_year, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_stats_team_league
  ON mv_player_daily_stats(team_id, league_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_stats_team_ground
  ON mv_player_daily_stats(team_id, ground_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_stats_team_vsteam
  ON mv_player_daily_stats(team_id, vsteam_id, game_date DESC);

-- マテリアライズドビューを更新する関数
CREATE OR REPLACE FUNCTION refresh_player_daily_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_player_daily_stats;
END;
$$ LANGUAGE plpgsql;
