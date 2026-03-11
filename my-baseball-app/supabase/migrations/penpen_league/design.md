# penpen_league DB設計

## 1. スキーマ分割方針

- 既存機能（`public`）と分離するため、`penpen` スキーマを新設。
- `app/(cutomize)/penpen_league` で使うデータのみ `penpen` に集約。

## 2. テーブル一覧

### マスタ

- `penpen.leagues`
  - 大会マスタ（リーグ戦、トーナメント種別など）
  - 主な項目: `name`, `is_enabled`, `sort_order`

- `penpen.teams`
  - チームマスタ
  - 主な項目: `name`, `is_enabled`, `sort_order`

- `penpen.stadiums`
  - 球場マスタ
  - 主な項目: `name`, `address`, `google_map_url`, `note`, `is_enabled`, `sort_order`

### 管理画面入力

- `penpen.schedule_days`
  - 1日単位の日程ヘッダ
  - 主な項目: `match_date`, `stadium_id`, `note`

- `penpen.scheduled_games`
  - 試合日程の明細（第1試合/第2試合…）
  - 主な項目: `schedule_day_id`, `display_order`, `is_rest`, `start_time`, `end_time`, `away_team_id`, `home_team_id`, `game_type`, `league_id`
  - `is_rest = true` の行を「休みチーム」として扱う（`away_team_id` に休みチームを保持）

- `penpen.game_results`
  - 試合単位の結果（スコア・中止）
  - 主な項目: `scheduled_game_id`, `away_score`, `home_score`, `is_canceled`

- `penpen.schedule_day_results`
  - 日単位の結果備考
  - 主な項目: `schedule_day_id`, `note`, `is_finalized`

- `penpen.tournaments`
  - トーナメント管理（大会 + 画像）
  - 主な項目: `league_id`, `image_path`, `image_file_name`, `sort_order`

- `penpen.rule_blocks`
  - 大会規定管理（タイトル+本文ブロック）

- `penpen.settings`
  - システム管理（サイトタイトル/サブタイトル/ヘッダー画像/管理パスワードハッシュ）

## 3. 画面との対応

- `admin/leagues` → `penpen.leagues`
- `admin/teams` → `penpen.teams`
- `admin/grounds` → `penpen.stadiums`
- `admin/schedule` → `penpen.schedule_days`, `penpen.scheduled_games`（休みチーム含む）
- `admin/results`, `admin/components/OneDayResultForm` → `penpen.game_results`, `penpen.schedule_day_results`
- `admin/tournaments` → `penpen.tournaments` (+ `penpen.leagues` 参照)
- `admin/rules` → `penpen.rule_blocks`
- `admin/system` → `penpen.settings`

## 4. 表示用ビュー

- `penpen.v_schedule_day_overview`
  - 日程一覧向け（球場名、休みチーム配列、試合数）

- `penpen.v_schedule_games`
  - ホーム/日程/結果表示向け
  - 試合、チーム名、スコア、中止、準備当番/片付け当番フラグを1ビューで取得

## 5. セキュリティ

- 全テーブルで RLS 有効
- `select`: `anon`, `authenticated`
- `insert/update/delete`: `authenticated`

## 6. 補足

- `settings.admin_password_hash` は平文ではなくハッシュを保存する前提。
- 画像は `image_path` / `header_image_url` に保存先を持たせ、実ファイルは Supabase Storage を想定。
