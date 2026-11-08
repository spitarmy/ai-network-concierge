# AI人脈コンシェルジュ — 外部サービス連携・実現可能性台帳

文書版: v1.0  
基準日: 2026-11-08  
正本準拠: `docs/MASTER_SPEC.md` / `docs/OFFICIAL_REFERENCES.md`

---

## 1. 外部連携の実現性分類マトリクス

| サービス名 | 実装可能性分類 | 前提条件・OAuthスコープ・API仕様 | 不可・制限事項とフォールバック |
|---|---|---|---|
| **Zoom（自ホスト）** | **(A) 実装可能** | Zoom Server-to-Server OAuth または User OAuth。<br>スコープ: `recording:read`, Webhook: `recording.completed` | 無料プランではクラウド録画不可（Pro以上必須）。ローカル録音時は音声ファイル手動取込へ誘導。 |
| **Zoom（相手ホスト）** | **(B) 制限あり** | 相手ホストの場合、主催者APIアクセス権限がないため、Zoom API経由の録画直接取得は不可能。 | **【公式制限】** 相手の明示承諾を得た議事録ボット（Recall.ai等）の参加、または面談後の手動メモ/音声ファイル取込に限定。 |
| **Google Meet** | **(B) 制限あり** | Google Workspace (Business Standard以上) での録画/文字起こし成果物生成。<br>Meet REST API `spaces`, `conferenceRecords.transcripts` | 無料GoogleアカウントではAPI文字起こし取得不可。また相手主催の会議では管理者認可外のため直接API取得不可。手動音声取込へフォールバック。 |
| **Google カレンダー** | **(A) 実装可能** | Google Calendar API v3。<br>スコープ: `https://www.googleapis.com/auth/calendar.events.readonly` | 同期周期の遅延や重複作成防止のため、イベントの `id` および `hangoutLink` をハッシュ化して重複検知。 |
| **Gmail** | **(A) 実装可能（厳格運用）** | Gmail API。<br>スコープ: 最小権限 `gmail.readonly`。1to1招待メール・Zoom通知メールのみフィルタ受信。 | 私信の無差別クロールは厳禁。ユーザーが指定したラベルまたは「Zoom」「Meet」等の件名パターンのみを対象。 |
| **Google 連絡先** | **(A) 実装可能** | People API。<br>スコープ: `contacts.readonly` | 既存連絡先の一括取込ドライランと重複名寄せ確認UIを挟む。 |
| **個人LINE** | **(C) 技術的不可** | **公式APIなし**。LINE公式アカウントの個人トーク傍受APIは存在しない。 | **【設計必須】** アプリ内の「予定登録」「名刺登録」画面への**URL/文章手動コピー＆ペースト**を標準導線とする。 |
| **TimeTree** | **(C) 提供終了** | **TimeTree Connect App API は 2023年12月22日をもって終了**。 | **【設計必須】** ユーザーが直接手入力するTimeTreeの自動直接API取得は行わず、手動登録または招待URL貼付とする。 |
| **名刺OCR** | **(A) 実装可能** | Google Cloud Document AI / Cloud Vision / Vision LLM アダプタ。 | 原文にない会社・役職の勝手な補完・創作を厳禁。達筆や不鮮明箇所は `null` として確認待ちへ。 |
| **BNI全国データ** | **(B) 慎重運用** | 各リージョン/チャプターの公開情報（地域・曜日・チャプター名）。 | BNI公式を装わない。非公開の名簿・個人情報を無断スクレイピングしない。ユーザーによる手動追加・修正を担保。 |

---

## 2. 外部API資格情報が未設定時の振る舞い

システムは、API資格情報（Client ID, Secret, API Key等）が設定されていない状態でも、**アプリの利用をブロックしてはならない**。
- 外部連携が未設定の場合: 「接続待ち（未連携）」と表示し、**手動入力・手動ファイルアップロード（モック/インポート）**の導線を前面に出す。
- 画面上に「連携完了」と偽装する行為、およびダミーデータを本物のAPI取得データと偽る行為を禁止する。
