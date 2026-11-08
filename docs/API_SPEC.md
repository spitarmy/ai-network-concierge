# AI人脈コンシェルジュ — API仕様書（OpenAPI準拠・正本版）

文書版: v1.0  
基準日: 2026-11-08  
プロトコル: HTTPS REST / JSON API (FastAPI Backend)

---

## 1. 共通規則・認証・認可

### 認証ヘッダー
```http
Authorization: Bearer <supabase_jwt_token>
X-Tenant-Id: <tenant_uuid>
Idempotency-Key: <unique_client_generated_key> (POST / 決済 / ジョブ起動時必須)
```

### 共通エラーレスポンス構造
```json
{
  "error": {
    "code": "CONSENT_REQUIRED",
    "message": "録音またはAI解析を行うには全参加者の明示的な同意が必要です。",
    "details": [
      { "field": "participant_id", "issue": "山田太郎さんの同意ステータスが pending です" }
    ],
    "recovery_action": "POST /api/meetings/{id}/consents で同意を記録してください。"
  }
}
```

---

## 2. 主要エンドポイント一覧

### ① 人物（Persons）
- `GET /api/persons`: 一覧・検索（名前・ふりがな・タグ・所属・対応地域）
- `POST /api/persons`: 新規作成
- `GET /api/persons/{id}`: カルテ詳細（概要、会社/事業、BNI履歴、出典付きfacts、面談履歴）
- `PATCH /api/persons/{id}`: カルテ編集（変更履歴とUndoトークン発行）
- `DELETE /api/persons/{id}`: 削除請求（U09準拠の完全削除/匿名化）
- `POST /api/persons/{id}/merge`: 名寄せ統合（取り消し可能）

#### `GET /api/persons/{id}` レスポンス例
```json
{
  "id": "c1f7a28b-98df-419b-a320-b4f0bcf8d101",
  "display_name": "山田 太郎",
  "phonetic_name": "やまだ たろう",
  "status": "active",
  "category_tags": ["BNI", "パートナー"],
  "organizations": [
    {
      "organization_id": "89b7cf93-9c76-47b1-91a1-949216eb2e73",
      "company_name": "山田工務店 株式会社",
      "title": "代表取締役",
      "is_current": true,
      "started_on": "2018-04-01"
    }
  ],
  "bni_memberships": [
    {
      "chapter_id": "4b6e5891-cb43-41bb-a63e-b9e38d975a22",
      "chapter_name": "京都東チャプター",
      "region_name": "京都リージョン",
      "category": "オフィス内装・リノベーション",
      "status": "active",
      "joined_on": "2024-01-01"
    },
    {
      "chapter_id": "11893c52-7b19-48c2-a0f5-48faee949392",
      "chapter_name": "京都北チャプター",
      "region_name": "京都リージョン",
      "category": "住宅建築",
      "status": "transferred",
      "joined_on": "2021-04-01",
      "left_on": "2023-12-31",
      "transfer_reason": "事業再編に伴う移籍"
    }
  ],
  "facts": [
    {
      "id": "e2292f74-d4b3-4f93-b6d3-2fbe0492cb41",
      "category": "topic",
      "key": "盛り上がった話題",
      "value": "京町家のリノベーション事例と断熱改修の補助金申請",
      "source_type": "meeting_speech",
      "source_id": "a93bc091-6677-4c00-bb65-728b9d883011",
      "verification_status": "verified",
      "confidence": 0.98,
      "visibility": "referral_eligible"
    },
    {
      "id": "f512781b-5339-44be-8067-1723c348f902",
      "category": "promise",
      "key": "次回の約束",
      "value": "補助金申請のパンフレットをPDFで送付する（未完了）",
      "source_type": "meeting_speech",
      "source_id": "a93bc091-6677-4c00-bb65-728b9d883011",
      "verification_status": "reported",
      "confidence": 0.95,
      "visibility": "private"
    }
  ]
}
```

---

### ② 予定・貼り付けパーサー・会議（Meetings）
- `POST /api/meetings/parse-intent`: 貼り付け文字列（URLのみまたは案内文全文）のAI/正規表現解析
- `POST /api/meetings`: 予定確定登録（重複検知・警告付き）
- `GET /api/meetings/{id}`: 会議詳細・収録ステータス・文字起こし
- `POST /api/meetings/{id}/consents`: 参加者ごとの録音・解析同意を記録

#### `POST /api/meetings/parse-intent` リクエスト & レスポンス
```json
// Request
{
  "raw_text": "山田さんと1to1です！\n日時: 2026/11/15 14:00〜15:00\nZoom: https://us02web.zoom.us/j/81234567890?pwd=xxxx"
}

// Response
{
  "extracted": {
    "provider": "zoom",
    "meeting_url": "https://us02web.zoom.us/j/81234567890?pwd=xxxx",
    "meeting_code": "81234567890",
    "suggested_type": "1to1",
    "scheduled_start_at": "2026-11-15T14:00:00+09:00",
    "scheduled_end_at": "2026-11-15T15:00:00+09:00",
    "candidate_participants": [
      {
        "raw_name": "山田",
        "matched_person_id": "c1f7a28b-98df-419b-a320-b4f0bcf8d101",
        "matched_name": "山田 太郎",
        "confidence": 0.92
      }
    ]
  },
  "is_duplicate": false,
  "requires_confirmation": false
}
```

---

### ③ 名刺OCR（Cards）
- `POST /api/cards/upload`: 名刺画像アップロード（両面対応、private storage）
- `POST /api/cards/{id}/ocr`: 原文抽出実行（Web検索補完禁止）
- `GET /api/cards/{id}`: 原画像URLと抽出JSONの対照データ取得

---

### ④ レビューキュー（Review Queue）
- `GET /api/review-queue`: 未特定話者、曖昧なOCR、名寄せ候補、事実矛盾の一覧
- `POST /api/review-queue/{id}/resolve`: ユーザー確認結果の確定反映

---

### ⑤ 相関図・紹介（Graph & Referrals）
- `GET /api/graph`: ノード・エッジ取得（`mode=actual` または `mode=ai_suggested`）
  - クエリパラメータ: `prefecture`, `region_id`, `chapter_id`, `specialty`
- `POST /api/referrals/draft`: 紹介候補の探索と下書き作成（非公開情報除外フィルタ適用）
- `POST /api/referrals/{id}/log-outcome`: 紹介結果・成果記録（未確認の自動確定禁止）

---

### ⑥ AI秘書チャット・音声（AI Concierge）
- `POST /api/ai/chat`: 自然言語質問（例: 「大阪の内装できる人いる？」「山田さんと前回何を話した？」）
  - 出典、確度、人物カルテへのリンクを含む構造化レスポンス
- `POST /api/ai/voice-transcribe`: 音声入力フォールバック（ブラウザSpeechRecognition非対応時）
- `GET /api/costs/current-month`: 当月のリアルタイム原価と予算消化率（80%警告、100%節約モード）
