-- 年度更新用の関数（引数なしで実行可能にする）
create or replace function auto_rotate_season()
returns void as $$
declare
    current_yr int := extract(year from now());
begin
    -- 前年度のメンバーを新年度(現在)としてコピー
    insert into past_players (team_id, player_id, year,no,name,position,throw_hand,batting_hand,show_flg,sort)
    select 
        team_id, id, 2026,no,name,position,throw_hand,batting_hand,show_flg,sort
    from players
    -- 既にレコードが存在する場合は何もしない（二重登録防止）
    on conflict (team_id, player_id, year) do nothing;
end;
$$ language plpgsql;