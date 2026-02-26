-- 選手の日別投球成績マテリアライズドビュー
DROP MATERIALIZED VIEW IF EXISTS mv_player_daily_pitching_stats;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_player_daily_pitching_stats AS
WITH base_stats AS (
  SELECT 
    p.team_id,
    p.player_id,
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
    
    -- 投球アウト数（イニング + アウト）
    (COALESCE(p.innings, 0) * 3 + COALESCE(p.outs, 0)) AS outs,
    
    -- 投球イニング（アウト数から換算）
    ((COALESCE(p.innings, 0) * 3 + COALESCE(p.outs, 0))::numeric / 3.0) AS ip,
    
    -- 被安打
    COALESCE(p.hits, 0) AS h,
    
    -- 与四球
    COALESCE(p.walks, 0) AS bb,
    
    -- 与死球
    COALESCE(p.hbp, 0) AS hbp,
    
    -- 奪三振
    COALESCE(p.strikeout, 0) AS so,
    
    -- 失点
    COALESCE(p.runs, 0) AS er,
    
    -- 本塁打
    COALESCE(p.homeruns, 0) AS hr,
    
    -- セーブ
    CASE WHEN p.is_save = true THEN 1 ELSE 0 END AS sv,
    
    -- ホールド
    CASE WHEN p.is_hold = true THEN 1 ELSE 0 END AS hld,
    
    -- 勝利（games.status = 1）
    CASE WHEN g.status = 1 THEN 1 ELSE 0 END AS wins,
    
    -- 敗戦（games.status = 2）
    CASE WHEN g.status = 2 THEN 1 ELSE 0 END AS losses
    
  FROM pitching_results p
  INNER JOIN games g ON p.team_id = g.team_id AND p.game_id = g.id
  INNER JOIN players pl ON pl.team_id = p.team_id AND pl.id = p.player_id
  LEFT JOIN leagues l ON l.id = g.league_id AND l.team_id = g.team_id
  LEFT JOIN grounds gr ON gr.id = g.ground_id AND gr.team_id = g.team_id
  LEFT JOIN vsteams vs ON vs.id = g.vsteam_id AND vs.team_id = g.team_id
  WHERE g.sum_flg = true
    AND g.status NOT IN (0, 6)
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
  outs,
  ip,
  h,
  bb,
  hbp,
  so,
  er,
  hr,
  sv,
  hld,
  wins,
  losses,
  -- 累計値
  SUM(outs) OVER w AS cum_outs,
  SUM(ip) OVER w AS cum_ip,
  SUM(h) OVER w AS cum_h,
  SUM(bb) OVER w AS cum_bb,
  SUM(so) OVER w AS cum_so,
  SUM(er) OVER w AS cum_er,
  -- WHIP計算（被安打＋与四球）÷投球イニング（累計） ※アウト数基準
  CASE 
    WHEN SUM(outs) OVER w > 0 THEN ROUND(((SUM(h) OVER w + SUM(bb) OVER w) * 3.0 / SUM(outs) OVER w), 3)
    ELSE 0
  END AS whip,
  -- 防御率 = 失点 × 7 ÷ 投球イニング（累計） ※アウト数基準
  CASE 
    WHEN SUM(outs) OVER w > 0 THEN ROUND((SUM(er) OVER w * 21.0 / SUM(outs) OVER w), 2)
    ELSE 999.99
  END AS era,
  -- 奪三振率 = 奪三振 × 7 ÷ 投球イニング（累計） ※アウト数基準
  CASE 
    WHEN SUM(outs) OVER w > 0 THEN ROUND((SUM(so) OVER w * 21.0 / SUM(outs) OVER w), 2)
    ELSE 0
  END AS k7
FROM base_stats
WINDOW w AS (PARTITION BY team_id, player_id ORDER BY start_datetime ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
ORDER BY start_datetime DESC, player_id;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_pitching_stats_player 
  ON mv_player_daily_pitching_stats(player_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_pitching_stats_team 
  ON mv_player_daily_pitching_stats(team_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_pitching_stats_team_player 
  ON mv_player_daily_pitching_stats(team_id, player_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_pitching_stats_team_year
  ON mv_player_daily_pitching_stats(team_id, season_year, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_pitching_stats_team_league
  ON mv_player_daily_pitching_stats(team_id, league_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_pitching_stats_team_ground
  ON mv_player_daily_pitching_stats(team_id, ground_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_player_daily_pitching_stats_team_vsteam
  ON mv_player_daily_pitching_stats(team_id, vsteam_id, game_date DESC);

-- マテリアライズドビューを更新する関数
CREATE OR REPLACE FUNCTION refresh_player_daily_pitching_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_player_daily_pitching_stats;
END;
$$ LANGUAGE plpgsql;
