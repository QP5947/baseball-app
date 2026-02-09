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

-- チーム成績（日別）
CREATE OR REPLACE FUNCTION refresh_team_daily_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_team_daily_stats;
END;
$$ LANGUAGE plpgsql;

-- チーム成績（通算）
CREATE OR REPLACE FUNCTION refresh_team_total_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_team_total_stats;
END;
$$ LANGUAGE plpgsql;

-- 選手成績（通算）
CREATE OR REPLACE FUNCTION refresh_player_total_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_player_total_stats;
END;
$$ LANGUAGE plpgsql;

-- 選手成績（年度別・打撃）
CREATE OR REPLACE FUNCTION refresh_player_yearly_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_player_yearly_stats;
END;
$$ LANGUAGE plpgsql;

-- 選手成績（年度別・投手）
CREATE OR REPLACE FUNCTION refresh_player_yearly_pitching_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_player_yearly_pitching_stats;
END;
$$ LANGUAGE plpgsql;

-- 一括更新
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  PERFORM refresh_player_daily_stats();
  PERFORM refresh_player_daily_pitching_stats();
  PERFORM refresh_team_daily_stats();
  PERFORM refresh_team_total_stats();
  PERFORM refresh_player_total_stats();
  PERFORM refresh_player_yearly_stats();
  PERFORM refresh_player_yearly_pitching_stats();
END;
$$ LANGUAGE plpgsql;