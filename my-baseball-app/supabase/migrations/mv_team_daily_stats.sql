-- チームの日別平均打撃成績マテリアライズドビュー
DROP MATERIALIZED VIEW IF EXISTS mv_team_daily_stats;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_team_daily_stats AS
WITH player_stats AS (
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
),
team_averages AS (
  SELECT
    team_id,
    game_id,
    game_date,
    start_datetime,
    COUNT(DISTINCT player_id) as player_count,
    
    -- 各指標の平均
    ROUND(AVG(pa), 2) as avg_pa,
    ROUND(AVG(ab), 2) as avg_ab,
    ROUND(AVG(h), 2) as avg_h,
    ROUND(AVG(d2), 2) as avg_d2,
    ROUND(AVG(t3), 2) as avg_t3,
    ROUND(AVG(hr), 2) as avg_hr,
    ROUND(AVG(tb), 2) as avg_tb,
    ROUND(AVG(bb_hbp), 2) as avg_bb_hbp,
    ROUND(AVG(sf), 2) as avg_sf,
    ROUND(AVG(sh), 2) as avg_sh,
    ROUND(AVG(so), 2) as avg_so,
    ROUND(AVG(rbi), 2) as avg_rbi,
    ROUND(AVG(total_outs), 2) as avg_total_outs,
    
    -- 合計値（参考用）
    SUM(pa) as total_pa,
    SUM(ab) as total_ab,
    SUM(h) as total_h,
    SUM(tb) as total_tb,
    SUM(bb_hbp) as total_bb_hbp,
    SUM(sf) as total_sf
  FROM player_stats
  GROUP BY team_id, game_id, game_date, start_datetime
)
SELECT 
  team_id,
  game_id,
  game_date,
  start_datetime,
  player_count,
  avg_pa,
  avg_ab,
  avg_h,
  avg_d2,
  avg_t3,
  avg_hr,
  avg_tb,
  avg_bb_hbp,
  avg_sf,
  avg_sh,
  avg_so,
  avg_rbi,
  avg_total_outs,
  total_pa,
  total_ab,
  total_h,
  -- 累計値
  SUM(total_pa) OVER w AS cum_total_pa,
  SUM(total_ab) OVER w AS cum_total_ab,
  SUM(total_h) OVER w AS cum_total_h,
  SUM(total_tb) OVER w AS cum_total_tb,
  SUM(total_bb_hbp) OVER w AS cum_total_bb_hbp,
  SUM(total_sf) OVER w AS cum_total_sf,
  
  -- チーム全体の打率（累計）
  ROUND((SUM(total_h) OVER w)::numeric / NULLIF(SUM(total_ab) OVER w, 0)::numeric, 3) AS team_avg,
  
  -- チーム全体の出塁率（累計）
  ROUND(((SUM(total_h) OVER w + SUM(total_bb_hbp) OVER w))::numeric / NULLIF((SUM(total_ab) OVER w + SUM(total_bb_hbp) OVER w + SUM(total_sf) OVER w), 0)::numeric, 3) AS team_obp,
  
  -- チーム全体の長打率（累計）
  ROUND((SUM(total_tb) OVER w)::numeric / NULLIF(SUM(total_ab) OVER w, 0)::numeric, 3) AS team_slg,
  
  -- チーム全体のOPS（累計）
  (ROUND(((SUM(total_h) OVER w + SUM(total_bb_hbp) OVER w))::numeric / NULLIF((SUM(total_ab) OVER w + SUM(total_bb_hbp) OVER w + SUM(total_sf) OVER w), 0)::numeric, 3) + 
   ROUND((SUM(total_tb) OVER w)::numeric / NULLIF(SUM(total_ab) OVER w, 0)::numeric, 3)) AS team_ops
   
FROM team_averages
WINDOW w AS (PARTITION BY team_id ORDER BY start_datetime ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
ORDER BY start_datetime DESC, team_id;

-- インデックスを作成してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_mv_team_daily_stats_team 
  ON mv_team_daily_stats(team_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_team_daily_stats_game 
  ON mv_team_daily_stats(game_id);

-- マテリアライズドビューを更新する関数
CREATE OR REPLACE FUNCTION refresh_team_daily_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_team_daily_stats;
END;
$$ LANGUAGE plpgsql;
