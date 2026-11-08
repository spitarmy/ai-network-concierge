# AI人脈コンシェルジュ — デザインシステム仕様書

文書版: v1.0  
基準日: 2026-11-08  
デザイン指針: **Apple風の洗練されたミニマリズム × 控えめな近未来AI（Quiet Luxury & Calm AI）**

---

## 1. デザイン原則

1. **静謐（Calm & Quiet）**: ド派手なネオン、大仰な3Dグラフィック、チープなキラキラAI演出を排し、高級ステーショナリーや上質な手帳のような佇まいを実現する。
2. **誠実（Honest Microcopy）**: AIが分からないことは「不明」と正直に表現。「AIがすべて解決します」といった過剰な煽り文句は一切使用しない。
3. **人間中心（Human Priority）**: 情報を詰め込みすぎず、相手の人間性、交わした約束、前回の感情・話題が最も自然に目に飛び込む余白設計を行う。
4. **アクセシビリティ & モバイルファースト**: 全ボタンは最小44x44pxのタップターゲットを保証。`prefers-reduced-motion` に完全対応。

---

## 2. カラーパレット（Light & Dark Mode）

### Light Mode（上質な紙とチタンの質感）
- **Background Base**: `#FBFBFD` (Appleライクな極めて微細なウォームグレー)
- **Surface Card**: `#FFFFFF`
- **Border / Divider**: `rgba(0, 0, 0, 0.08)` (1pxの繊細なヘアライン)
- **Text Primary**: `#1D1D1F` (深みのあるインクブラック)
- **Text Secondary**: `#6E6E73` (視認性の高いニュートラルグレー)
- **Text Tertiary**: `#86868B`
- **Accent Primary**: `#0071E3` (信頼感のあるサファイアブルー)
- **Accent Sub**: `#5E5CE6` (控えめなインディゴ)
- **Status Warning / Review**: `#B25E00` (落ち着いたアンバー)
- **Status Success**: `#248A3D` (落ち着いたフォレストグリーン)
- **Status Danger**: `#D70015`

### Dark Mode（深遠なスレートとOLEDブラック）
- **Background Base**: `#000000`
- **Surface Card**: `#1C1C1E` (Apple HIG準拠のセカンダリサーフェス)
- **Surface Elevated**: `#2C2C2E`
- **Border / Divider**: `rgba(255, 255, 255, 0.12)`
- **Text Primary**: `#F5F5F7`
- **Text Secondary**: `#A1A1A6`
- **Text Tertiary**: `#636366`
- **Accent Primary**: `#2997FF`
- **Accent Sub**: `#7D7AFF`
- **Status Warning / Review**: `#FF9F0A`
- **Status Success**: `#30D158`
- **Status Danger**: `#FF453A`

---

## 3. タイポグラフィ

- **欧文フォント**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif`
- **和文フォント**: `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif`
- **階層定義**:
  - `Display / Hero`: 28px (Bold, Line Height: 1.25)
  - `Title 1`: 22px (SemiBold, Line Height: 1.3)
  - `Title 2`: 17px (SemiBold, Line Height: 1.35)
  - `Body Regular`: 15px (Regular, Line Height: 1.5)
  - `Body Medium`: 15px (Medium, Line Height: 1.5)
  - `Caption / Meta`: 12px (Regular, Line Height: 1.4, Tracking: +0.2px)

---

## 4. シャドウ・角丸・レイアウトグリッド

- **角丸（Border Radius）**:
  - カード / コンテナ: `16px` (`rounded-2xl`)
  - ボタン / インプット: `10px` (`rounded-xl`)
  - バッジ / タグ: `6px` (`rounded-md`)
  - モーダルシート: `24px 24px 0 0` (スマホ時)
- **シャドウ（Elevation）**:
  - `elevation-card`: `0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)`
  - `elevation-hover`: `0 8px 24px rgba(0, 0, 0, 0.08)`
  - `elevation-sheet`: `0 -4px 24px rgba(0, 0, 0, 0.12)`

---

## 5. モーション・アニメーション

- **基本イージング**: `cubic-bezier(0.25, 1, 0.5, 1)` (Apple Spring Curve)
- **遷移デュレーション**:
  - マイクロインタラクション（ホバー、タップ）: `150ms`
  - シート・モーダル開閉: `280ms`
  - 画面遷移: `200ms`
- **減速・モーション削減対応**:
  - `@media (prefers-reduced-motion: reduce)` 検知時はすべてのアニメーション時間を `0.01ms` にフォールバック。

---

## 6. マイクロコピー標準ルール

| 場面 | 望ましい表現（○） | 避けるべき表現（×） |
|---|---|---|
| AIによる解析中 | 「会話内容を整理しています」 | 「最先端超知能AIが思考中...」 |
| 情報が見つからない場合 | 「該当する記録は見つかりませんでした」 | 「AIの知識ベースに存在しません」 |
| 未確定の発言 | 「発言者の確証がありません。確認してください」 | 「AIが自信度80%で山田さんと推定しました」 |
| 紹介提案 | 「以下の共通点から紹介が考えられます」 | 「AIが導き出した奇跡の神マッチング！」 |
