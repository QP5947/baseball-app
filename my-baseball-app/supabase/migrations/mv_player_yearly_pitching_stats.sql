-- 選手の年度別投球成績マテリアライズドビュー
DROP MATERIALIZED VIEW IF EXISTS mv_player_yearly_pitching_stats;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_player_yearly_pitching_stats AS
WITH base_stats AS (
  SELECT 
    p.team_id,
    p.player_id,
    EXTRACT(YEAR FROM g.start_datetime)::integer AS year,
    
    -- 投球イニング
    COALESCE(SUM(p.innings), 0) AS ip,
    
    -- 被安打
    COALESCE(SUM(p.hits), 0) AS h,
    
    -- 与四球
    COALESCE(SUM(p.walks), 0) AS bb,
    
    -- 与死球
    COALESCE(SUM(p.hbp), 0) AS hbp,
    
    -- 奪三振
    COALESCE(SUM(p.strikeout), 0) AS so,
    
    -- 失点
    COALESCE(SUM(p.runs), 0) AS er,
    
    -- 本塁打
    COALESCE(SUM(p.homeruns), 0) AS hr,
    
    -- 試合数
    COUNT(DISTINCT g.id) AS games,
    
    -- 登板数（投球を行った試合数）
    COUNT(DISTINCT CASE WHEN p.innings > 0 THEN g.id END) AS appearances,
    
    -- セーブ
    SUM(CASE WHEN p.is_save = true THEN 1 ELSE 0 END) AS sv,
    
    -- ホールド
    SUM(CASE WHEN p.is_hold = true THEN 1 ELSE 0 END) AS hld,
    
    -- 勝利（games.status = 1）
    SUM(CASE WHEN g.status = 1 THEN 1 ELSE 0 END) AS wins,
    
    -- 敗戦（games.status = 2）
    SUM(CASE WHEN g.status = 2 THEN 1 ELSE 0 END) AS losses
    
  FROM pitching_results p
  INNER JOIN games g ON p.team_id = g.team_id AND p.game_id = g.id
  GROUP BY p.team_id, p.player_id, EXTRACT(YEAR FROM g.start_datetime)
)
SELECT
  team_id,
  player_id,
  year,
  ip,
  h,
  bb,
  hbp,
  so,
  er,
  hr,
  games,
  appearances,
  sv,
  hld,
  wins,
  losses,
  -- WHIP計算（被安打＋与四球）÷投球イニング
  CASE 
    WHEN ip > 0 THEN ROUND(((h + bb)::numeric / ip), 3)
    ELSE 0
  END AS whip,
  -- 防御率 = 失点 × 7 ÷ 投球イニング
  CASE 
    WHEN ip > 0 THEN ROUND((er * 7 / ip)::numeric, 2)
    ELSE 0
  END AS era,
  -- 勝率 = 勝利 / (勝利 + 敗北)
  CASE 
    WHEN (wins + losses) > 0 THEN ROUND((wins::numeric / (wins + losses)), 3)
    ELSE 0
  END AS winpct,
  -- 奪三振率 = 奪三振 × 7 ÷ 投球イニング
  CASE 
    WHEN ip > 0 THEN ROUND((so * 7 / ip)::numeric, 2)
    ELSE 0
  END AS k7
FROM base_stats
ORDER BY team_id, player_id, year DESC;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_mv_player_yearly_pitching_stats_team_player 
ON mv_player_yearly_pitching_stats(team_id, player_id);

CREATE INDEX IF NOT EXISTS idx_mv_player_yearly_pitching_stats_year 
ON mv_player_yearly_pitching_stats(year);
