# AI人脈コンシェルジュ (AI Network Concierge)

**人を忘れず、大事にするためのAI人脈コンシェルジュ**  
BNI 1to1を中心とする毎月30〜60時間の面談・交流を、出典付きの人物カルテ・2モード相関図・説明可能な紹介マッチングで支援する高品質PWA。

---

## 1. プロジェクトの特長

- **Apple風ミニマリズム × 控えめな近未来AI**: 情報過多を防ぎ、直近の面談と交わした約束が一瞬で蘇るUI。
- **出典付き事実管理 (Facts Management)**: 本人発言、名刺、公式Web調査を厳格に分離。古い会話による手動編集の巻き戻しを遮断。
- **厳格な同意・セキュリティ**: 会議単位の録音同意ステートマシン、音声の90日自動破棄、RLSによるマルチテナント完全分離。
- **外部APIの現実性遵守**: Zoom自ホストと相手ホストの分岐、TimeTree手動扱い、個人LINE自動取得除外（手動貼付対応）。
- **原価防壁と節約モード**: 月間予算（目安¥4,980）の80%で警告、100%で低優先ジョブ停止の自動フェイルセーフ。

---

## 2. ディレクトリ構成案

```text
├── docs/                      # 設計書・仕様正本（唯一の正本体系）
│   ├── MASTER_SPEC.md         # 確定仕様 01〜34 正本
│   ├── IMPLEMENTATION_PLAN.md # P0〜P6 実装計画書
│   ├── ERD.md                 # データベース設計 & RLS方針
│   ├── API_SPEC.md            # OpenAPI準拠 API仕様書
│   ├── SCREENS.md             # 画面設計・状態遷移マトリクス
│   ├── DESIGN_SYSTEM.md       # Apple風デザインシステム仕様
│   ├── INTEGRATIONS.md        # 外部API実現可能性台帳
│   ├── SECURITY_AND_CONSENT.md# 同意機械・90日破棄・セキュリティ
│   ├── AI_PIPELINES.md        # JSON Schema事実抽出パイプライン
│   ├── COST_MODEL.md          # 変動費計算式・予算ガードレール
│   ├── TEST_PLAN.md           # 受け入れテストマッピング
│   ├── DECISION_LOG.md        # 意思決定台帳
│   ├── ACCEPTANCE_TESTS.md    # 受け入れテスト合格基準一覧
│   ├── OFFICIAL_REFERENCES.md # 公式リファレンス
│   └── PENDING_AND_COSTS.md   # 保留事項・原価メモ
├── frontend/                  # React + Vite + TypeScript + Tailwind (PWA)
├── backend/                   # Python FastAPI + Pydantic + Uvicorn
├── supabase/                  # PostgreSQL マイグレーション・RLSスクリプト
├── AGENTS.md                  # 常設プロジェクトルール
├── .env.example               # 環境変数テンプレート
└── README.md                  # 本ファイル
```

---

## 3. マイルストーン進捗状況

- [x] **P0: 調査・計画・ER・画面・API制約・セキュリティ設計**（完了）
- [ ] **P1: 高品質PWA + テナント基盤 + 人物カルテ**（着手準備完了）
- [ ] **P2: 予定登録（URL/文章貼付） + 名刺OCR + BNIマスター**
- [ ] **P3: 同意機械 + 音声/文字起こし + 出典付き事実抽出**
- [ ] **P4: 2モード相関図 + AI検索 + 説明可能紹介 + 静かな秘書**
- [ ] **P5: 外部API実連携（Zoom/Meet/Calendar/Contacts）**
- [ ] **P6: セキュリティ監査 + 総合QA + 原価検証 + 本番準備**

---

## 4. 開発・実行手順（P1開始以降）

### フロントエンド開発
```bash
cd frontend
npm install
npm run dev
```

### バックエンド開発
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
