# 公式リファレンス・制約チェックの出発点（2026-11-08確認）

ここに示す公開資料は、現時点の実装可能性を理解するための入口。APIスコープ、料金、リリース状況、利用条件は変わる。実際のP5連携前には**公式原典で再検証**する。

1. Google Antigravity Rules — `AGENTS.md`などワークスペースのルール認識: https://antigravity.google/docs/rules/
2. Google Antigravity `/plan` — 設計計画とレビュー: https://antigravity.google/docs/plan/
3. Google Codelabs — Getting Started with Antigravity: https://codelabs.developers.google.com/getting-started-agy-ide
4. Google Meet REST API overview — 会議スペース、記録、文字起こし成果物と前提: https://developers.google.com/workspace/meet/api/guides/overview
5. Google Meet transcripts — 権限ある成果物の取得: https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.transcripts/get
6. Zoom Meetings Webhooks — 録画/文字起こし完了イベントと設定条件: https://godevelopers.zoom.us/docs/api/meetings/events/
7. TimeTree Connect App終了告知 — 2023-12-22で外部連携API終了: https://timetreeapp.com/intl/ja/newsroom/2023-07-23/connectapp-api

### 重要な誤認識の予防

- Antigravityが自然言語のプロンプトを読めても、**同梱ファイルをワークスペースに置かない限り正本は継続参照されない可能性**がある。
- Google Meet APIの「会議成果物取得」は、**誰のMeetリンクでも録音を自動入手できる**という意味ではない。
- Zoomクラウド録画と文字起こしはプラン/権限/設定/成果物の生成に依存する。
- TimeTreeはユーザーが手入力しているため、直接の外部API自動取得は前提にしない。
- 個人LINEのトークを取得する公式Messaging APIは存在しない。LINE公式アカウントへの追加も初期版では不要。
- BNIの全国リージョン/チャプター情報は、情報の利用権限・取得方法を検証し、非公開の個人名簿を無断収集しない。
