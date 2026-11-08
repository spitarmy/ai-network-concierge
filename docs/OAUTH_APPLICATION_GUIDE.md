# Zoom & Google Workspace OAuth 認可アプリ申請マニュアル

本マニュアルは、「AI人脈コンシェルジュ」の面談自動取得・Google カレンダー/連絡先連携を本番有効化するための公式申請手順書です。

---

## 1. 概要・申請に必要な公開 URL 一覧

認可申請画面で入力が求められる本番 URL（Vercel デプロイ済み）は以下の通りです：

| 項目名 | 設定値（コピー用） |
|---|---|
| **本番 Web アプリ URL** | `https://ai-network-concierge.vercel.app` |
| **プライバシーポリシー URL** | `https://ai-network-concierge.vercel.app/privacy` |
| **利用規約 URL** | `https://ai-network-concierge.vercel.app/terms` |
| **Zoom リダイレクト URI** | `https://ai-network-concierge.vercel.app/oauth/callback/zoom` |
| **Google リダイレクト URI** | `https://ai-network-concierge.vercel.app/oauth/callback/google` |
| **Zoom Deauthorization URL** | `https://ai-network-concierge.vercel.app/api/zoom/deauthorize` |

---

## 2. Zoom App Marketplace 申請手順

Zoom との連携には「**Server-to-Server OAuth**（個人・自社アカウント用、即時利用可能）」と「**General OAuth App**（他社・第三者アカウントにも配布する場合、審査が必要）」の2種類があります。

まずは**審査不要で直ちに実利用できる Server-to-Server OAuth**（または内部向け OAuth App）の作成を推奨します。

### ステップ 2-1: Zoom App Marketplace へログイン
1. ブラウザで [https://marketplace.zoom.us/](https://marketplace.zoom.us/) を開く。
2. Zoom アカウント（オーナーまたは管理者権限）でサインイン。
3. 画面右上の **Develop** > **Build App** をクリック。

### ステップ 2-2: アプリ種別の選択
- **個人・自社専用で直ちに使う場合（おすすめ）**:
  - **Server-to-Server OAuth** を選択し、**Create** をクリック。
  - アプリ名（App Name）: `AI人脈コンシェルジュ (Production)`
- **外部一般ユーザーへ配布する場合**:
  - **General App** (User-managed OAuth) を選択。

### ステップ 2-3: アプリ基本情報（App Information）の入力
- **App Name**: `AI人脈コンシェルジュ`
- **Short Description**: `BNI 1to1および面談の記憶と人脈カルテを支援するAIコンシェルジュ`
- **Long Description**: `AI人脈コンシェルジュは、Zoomミーティングの予定照会および参加者の同意に基づくクラウド録画の取得を行い、面談カルテの作成や前回の話題・約束事項のリマインドを支援するアプリケーションです。録音データは90日経過後に自動完全消去されます。`
- **Company Name**: （ご自身の会社名または屋号）
- **Developer Name**: （ご自身の氏名）
- **Developer Email**: （ご自身の連絡先メールアドレス）
- **Privacy Policy URL**: `https://ai-network-concierge.vercel.app/privacy`
- **Terms of Use URL**: `https://ai-network-concierge.vercel.app/terms`

### ステップ 2-4: OAuth 認証情報とリダイレクト URL 設定（General App の場合）
- **Redirect URL for OAuth**: `https://ai-network-concierge.vercel.app/oauth/callback/zoom`
- **OAuth allow lists**: `https://ai-network-concierge.vercel.app`

### ステップ 2-5: 必要なスコープ（Scopes）の追加
以下の最小限のスコープ（Least Privilege）を追加します：
1. `meeting:read`（面談予定と会議IDの照会用）
2. `recording:read`（自ホストクラウド録画の取得用）
3. `user:read`（ユーザーアカウントの識別用）

### ステップ 2-6: Client ID & Client Secret の取得
1. **App Credentials** 画面を開く。
2. 表示されている **Client ID**、**Client Secret**（および Server-to-Server の場合は **Account ID**）をコピー。
3. Web アプリの「**設定**」>「**OAuth 2.0 認可アプリ設定**」の Zoom 欄に入力し、「**Zoom設定を保存 & 接続検証**」をクリック。

---

## 3. Google Cloud Console (Google Workspace) 申請手順

Google カレンダーおよび Google 連絡先の読み取り連携手順です。

### ステップ 3-1: Google Cloud Console でプロジェクト作成
1. [https://console.cloud.google.com/](https://console.cloud.google.com/) を開く。
2. 上部プロジェクト選択プルダウンから「**新しいプロジェクト**」をクリック。
3. プロジェクト名: `ai-network-concierge` を入力して作成。

### ステップ 3-2: API の有効化
1. 左メニュー「**APIとサービス**」>「**ライブラリ**」を開く。
2. 以下の API を検索し、それぞれ「**有効にする**」をクリック：
   - **Google Calendar API**
   - **People API**（Google 連絡先）

### ステップ 3-3: OAuth 同意画面（OAuth Consent Screen）の設定
1. 左メニュー「**OAuth 同意画面**」を開く。
2. **User Type（ユーザーの種類）**:
   - Google Workspace 組織内の場合は **内部 (Internal)**（審査不要で即時利用可能）。
   - 個人用 Gmail の場合は **外部 (External)** を選択し、「作成」をクリック。
3. **アプリ情報**:
   - アプリ名: `AI人脈コンシェルジュ`
   - ユーザーサポートメール: ご自身のメールアドレス
   - アプリのホームページ: `https://ai-network-concierge.vercel.app`
   - アプリのプライバシーポリシーリンク: `https://ai-network-concierge.vercel.app/privacy`
   - アプリの利用規約リンク: `https://ai-network-concierge.vercel.app/terms`
   - 承認済みドメイン: `vercel.app`
   - デベロッパーの連絡先情報: ご自身のメールアドレス
4. 「保存して次へ」をクリック。

### ステップ 3-4: スコープ（Scopes）の追加
「**スコープを追加または削除**」をクリックし、以下のスコープを選択：
- `https://www.googleapis.com/auth/calendar.events.readonly`（カレンダーの面談予定取得）
- `https://www.googleapis.com/auth/contacts.readonly`（連絡先名刺データの名寄せ照合）
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

### ステップ 3-5: テストユーザー（Test Users）の登録（外部の場合）
> [!TIP]
> 個人 Gmail の場合、Google の全体一般公開審査を受ける前でも、「テストユーザー」にご自身の Gmail アドレスを追加しておけば、**審査待ちなしで今すぐ本番接続・テストが可能**です！

1. 「テストユーザー」画面で「**＋ADD USERS**」をクリック。
2. ご自身の Google アカウントのメールアドレスを入力して「保存」。

### ステップ 3-6: OAuth 2.0 クライアント ID の作成
1. 左メニュー「**認証情報**」>「**＋認証情報を作成**」>「**OAuth クライアント ID**」をクリック。
2. アプリケーションの種類: **ウェブ アプリケーション** を選択。
3. 名前: `AI人脈コンシェルジュ Web Client`
4. **承認済みの JavaScript 生成元**:
   - `https://ai-network-concierge.vercel.app`
5. **承認済みのリダイレクト URI**:
   - `https://ai-network-concierge.vercel.app/oauth/callback/google`
6. 「作成」をクリック。
7. ポップアップに表示される **クライアント ID** と **クライアント シークレット** をコピー。
8. Web アプリの「**設定**」>「**OAuth 2.0 認可アプリ設定**」の Google 欄に入力し、「**Google設定を保存 & 接続検証**」をクリック。

---

## 4. セキュリティとプライバシー保証の確認

Zoom および Google のアプリ審査・監査において、本サービスは以下の要件をすでに技術的に実装・保証しています：

- **RLS（行レベルセキュリティ）**: テナント ID による他組織データの完全不可視化。
- **録音同意ステートマシン**: 1人でも同意を拒絶した場合は録音完全遮断、撤回時は即座にデータ消去。
- **90日自動消去**: クラウド録音データは90日経過後に物理削除（ピン留め除外）。
- **Google API Limited Use 準拠**: Google ユーザーデータを広告目的で使用せず、AI 基礎モデルのトレーニングにも利用しません。
- **右に忘れられる権利（U09）**: ワンクリックで人物カルテ・全事実・録音・相関図リンクのトランザクション完全消去。
