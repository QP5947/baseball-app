-- 選手の年度別打撃成績マテリアライズドビュー
DROP MATERIALIZED VIEW mv_player_yearly_stats;
CREATE MATERIALIZED VIEW mv_player_yearly_stats AS 
 WITH base_stats AS (
         SELECT d.team_id,
            d.player_id,
            EXTRACT(year FROM g.start_datetime) AS season_year,  -- 年度
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
            COALESCE(sum(r.outs), (0)::bigint) AS total_outs,  -- 総アウト数
            COALESCE(sum(b.steal), 0) AS sb,  -- 盗塁
            COALESCE(sum(b.steal_miss), 0) AS cs,  -- 盗塁死
            COALESCE(sum(b.run), 0) AS runs,  -- 得点
            COALESCE(sum(b.df_error), 0) AS errors,  -- エラー
            SUM(CASE WHEN a.real_attendance_no = 1 THEN 1 ELSE 0 END) AS attended_games  -- 出席試合数
           FROM batting_result_details d
             JOIN at_bat_results r ON ((d.at_bat_result_no = r.no))
             JOIN games g ON ((d.team_id)::text = (g.team_id)::text) AND ((d.game_id)::text = (g.id)::text)
             JOIN batting_results b ON ((b.team_id)::text = (d.team_id)::text) AND ((b.game_id)::text = (d.game_id)::text) AND ((b.player_id)::text = (d.player_id)::text)
             LEFT JOIN attendance a ON ((a.team_id)::text = (d.team_id)::text) AND ((a.game_id)::text = (d.game_id)::text) AND ((a.player_id)::text = (d.player_id)::text)
          GROUP BY d.team_id, d.player_id, (EXTRACT(year FROM g.start_datetime))
        )
 SELECT team_id,
    player_id,
    season_year,  -- 年度
    g_count,  -- 試合数
    pa,  -- 打席数
    ab,  -- 打数
    h,  -- 安打数
    d2,  -- 二塁打
    t3,  -- 三塁打
    hr,  -- 本塁打
    tb,  -- 塁打数
    bb_hbp,  -- 四死球
    sf,  -- 犠飛
    sh,  -- 犠打
    so,  -- 三振
    rbi,  -- 打点
    total_outs,  -- 総アウト数
    sb,  -- 盗塁
    cs,  -- 盗塁死
    runs,  -- 得点
    errors,  -- エラー
    round(((h)::numeric / (NULLIF(ab, 0))::numeric), 3) AS avg,  -- 打率
    round((((h + bb_hbp))::numeric / (NULLIF(((ab + bb_hbp) + sf), 0))::numeric), 3) AS obp,  -- 出塁率
    round(((tb)::numeric / (NULLIF(ab, 0))::numeric), 3) AS slg,  -- 長打率
    (round((((h + bb_hbp))::numeric / (NULLIF(((ab + bb_hbp) + sf), 0))::numeric), 3) + round(((tb)::numeric / (NULLIF(ab, 0))::numeric), 3)) AS ops,  -- OPS
    -- 盗塁成功率
    CASE 
        WHEN (sb + cs) > 0 THEN round((sb::numeric / (sb + cs)), 3)
        ELSE 0
    END AS sb_pct,  -- 盗塁成功率
    -- 出席率
    CASE 
        WHEN g_count > 0 THEN round((attended_games::numeric / g_count), 3)
        ELSE 0
    END AS attendance_pct  -- 出席率
   FROM base_stats;