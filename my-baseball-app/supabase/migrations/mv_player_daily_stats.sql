-- 選手の日別打撃成績マテリアライズドビュー
DROP MATERIALIZED VIEW IF EXISTS mv_player_daily_stats;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_player_daily_stats AS
WITH base_stats AS (
  SELECT 
    d.team_id,
    d.player_id,
    g.id as game_id,
    DATE(g.start_datetime) as game_date,
    g.start_datetime,
    
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
  JOIN games g ON d.game_id = g.id
  GROUP BY 
    d.team_id,
    d.player_id,
    g.id,
    DATE(g.start_datetime),
    g.start_datetime
)
SELECT 
  team_id,
  player_id,
  game_id,
  game_date,
  start_datetime,
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

-- マテリアライズドビューを更新する関数
CREATE OR REPLACE FUNCTION refresh_player_daily_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_player_daily_stats;
END;
$$ LANGUAGE plpgsql;
