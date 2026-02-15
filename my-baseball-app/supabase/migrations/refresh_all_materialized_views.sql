-- すべてのマテリアライズドビュー更新関数

-- 個人成績（日別・打撃）
CREATE OR REPLACE FUNCTION refresh_player_daily_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_player_daily_stats;
END;
$$ LANGUAGE plpgsql;

-- 個人成績（日別・投手）
CREATE OR REPLACE FUNCTION refresh_player_daily_pitching_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_player_daily_pitching_stats;
END;
$$ LANGUAGE plpgsql;

-- 一括更新
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  PERFORM refresh_player_daily_stats();
  PERFORM refresh_player_daily_pitching_stats();
END;
$$ LANGUAGE plpgsql;