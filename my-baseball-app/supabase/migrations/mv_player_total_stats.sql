-- 選手の通算打撃成績マテリアライズドビュー
DROP MATERIALIZED VIEW IF EXISTS mv_player_total_stats;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_player_total_stats AS
 WITH base_stats AS (
         SELECT d.team_id,
            d.player_id,
            count(DISTINCT d.game_id) AS g_count,  -- 試合数
            count(*) AS pa,  -- 打席数
            sum(
                CASE
                    WHEN (r.is_at_bat = true) THEN 1
                    ELSE 0
                END) AS ab,  -- 打数
            sum(
                CASE
                    WHEN (r.no = ANY (ARRAY[(4)::bigint, (5)::bigint, (6)::bigint, (7)::bigint])) THEN 1
                    ELSE 0
                END) AS h,  -- 安打数
            sum(
                CASE
                    WHEN (r.no = 5) THEN 1
                    ELSE 0
                END) AS d2,  -- 二塁打
            sum(
                CASE
                    WHEN (r.no = 6) THEN 1
                    ELSE 0
                END) AS t3,  -- 三塁打
            sum(
                CASE
                    WHEN (r.no = 7) THEN 1
                    ELSE 0
                END) AS hr,  -- 本塁打
            COALESCE(sum(r.bases), (0)::bigint) AS tb,  -- 塁打数
            sum(
                CASE
                    WHEN (r.no = ANY (ARRAY[(2)::bigint, (3)::bigint])) THEN 1
                    ELSE 0
                END) AS bb_hbp,  -- 四球・死球
            sum(
                CASE
                    WHEN (r.no = 10) THEN 1
                    ELSE 0
                END) AS sf,  -- 犠飛
            sum(
                CASE
                    WHEN (r.no = 11) THEN 1
                    ELSE 0
                END) AS sh,  -- 犠打
            sum(
                CASE
                    WHEN (r.no = 1) THEN 1
                    ELSE 0
                END) AS so,  -- 三振
            sum(d.rbi) AS rbi,  -- 打点
            COALESCE(sum(r.outs), (0)::bigint) AS total_outs  -- 総アウト数
           FROM (batting_result_details d
             JOIN at_bat_results r ON ((d.at_bat_result_no = r.no)))
          GROUP BY d.team_id, d.player_id
        )
 SELECT team_id,
    player_id,
    g_count,  -- 試合数
    pa,  -- 打席数
    ab,  -- 打数
    h,  -- 安打数
    d2,  -- 二塁打
    t3,  -- 三塁打
    hr,  -- 本塁打
    tb,  -- 塁打数
    bb_hbp,  -- 四球・死球
    sf,  -- 犠飛
    sh,  -- 犠打
    so,  -- 三振
    rbi,  -- 打点
    total_outs,  -- 総アウト数
    round(((h)::numeric / (NULLIF(ab, 0))::numeric), 3) AS avg,  -- 打率
    round((((h + bb_hbp))::numeric / (NULLIF(((ab + bb_hbp) + sf), 0))::numeric), 3) AS obp,  -- 出塁率
    round(((tb)::numeric / (NULLIF(ab, 0))::numeric), 3) AS slg,  -- 長打率
    (round((((h + bb_hbp))::numeric / (NULLIF(((ab + bb_hbp) + sf), 0))::numeric), 3) + round(((tb)::numeric / (NULLIF(ab, 0))::numeric), 3)) AS ops  -- OPS
   FROM base_stats;