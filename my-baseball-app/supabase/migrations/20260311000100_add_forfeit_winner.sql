-- game_results に不戦勝/不戦敗フラグを追加
alter table penpen.game_results
  add column if not exists forfeit_winner text
    check (forfeit_winner in ('away', 'home'));
