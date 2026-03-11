# penpen_league 用 migration メモ

- 実行対象の migration は `supabase/migrations/penpen_league_init.sql`（トップ階層）です。
- このフォルダは、機能単位で見分けやすくするための整理用です。

## 運用ルール（推奨）

1. 実際に適用するSQLは `supabase/migrations` 直下に追加する
2. ファイル名は `penpen_league_*.sql` の接頭辞を付けて判別しやすくする
3. 仕様メモ・ER図・レビュー記録はこのフォルダに置く

## 今回の初期設計

- スキーマ: `penpen`
- マスタ: `leagues`, `teams`, `stadiums`
- 入力系: `schedule_days`, `scheduled_games`（`is_rest`で休み管理）, `game_results`, `schedule_day_results`
- 補助: `tournaments`, `rule_blocks`, `settings`
- 表示用ビュー: `v_schedule_day_overview`, `v_schedule_games`
