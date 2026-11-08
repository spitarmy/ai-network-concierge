import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Printer, Share2, Sparkles, Shield,
  CheckCircle2, Share2 as ShareIcon, Lock, Clock,
  ExternalLink, ArrowLeft
} from 'lucide-react';

interface PresentationViewProps {
  onBack: () => void;
}

export const PresentationView: React.FC<PresentationViewProps> = ({ onBack }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  const slides = [
    // Slide 1: タイトル
    {
      id: 1,
      badge: 'Product Pitch Deck 2026',
      title: 'AI人脈コンシェルジュ',
      subtitle: '人を忘れず、大事にし続けるための次世代AI専属パートナー',
      tagline: '月30回の1to1を行うビジネスリーダーのための「信頼を資産に変える」AI基盤',
      content: (
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-apple-blue/10 text-apple-blue dark:text-apple-darkBlue text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BNI 1to1 & ビジネス人脈特化型 AI SaaS</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] max-w-2xl leading-tight">
            AI人脈<span className="text-apple-blue">コンシェルジュ</span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl">
            単なる録音アプリでも、名刺管理でもありません。<br />
            会話を出典つきで記憶し、約束を守り、最高の紹介を生み出します。
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500">
            <span className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              ⚡️ Zoom招待文を貼るだけ「3秒予定登録」
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              🤝 2Dインタラクティブ相関図
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              🔒 厳格な同意 & 90日自動消去
            </span>
          </div>
        </div>
      ),
    },

    // Slide 2: 経営者の現実
    {
      id: 2,
      badge: 'The Problem',
      title: '熱心な経営者ほど「脳のメモリ」の限界を迎えている',
      subtitle: '月20〜30回の1to1・商談を重ねると、誰しもが直面する3つの壁',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="p-5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">記憶の希釈化</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              「前どこまで話したっけ？」「相手の本当の強みは何だっけ？」月数十人と会うと、どんなに誠実な人でも前回の話題が曖昧になります。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">約束の抜け漏れ（信用失墜）</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              「あの人を紹介します」「後で資料送ります」という口約束が日々の忙しさで蒸発。悪気がないのに相手の信頼を損ねてしまいます。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">名刺・チャプター情報の散乱</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              名刺は溜まる一方。チャプター移籍や事業のピボットがあっても過去の所属が消え、最新のビジネスオファリングが追えません。
            </p>
          </div>
        </div>
      ),
    },

    // Slide 3: 従来のツールの限界
    {
      id: 3,
      badge: 'Market Comparison',
      title: 'なぜ従来のツールでは解決できなかったのか？',
      subtitle: '名刺アプリ・議事録AI・一般的なCRMには「決定的な隙間」がありました',
      content: (
        <div className="space-y-3 py-2">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder flex items-start space-x-3">
            <div className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 text-[11px] font-semibold shrink-0">
              名刺管理アプリ
            </div>
            <div className="text-xs space-y-1">
              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">会社名と肩書きしか残らない</span>
              <p className="text-neutral-500">「何を話し、誰を求めているか」が記録されず、相手に寄り添った紹介に結びつかない。</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder flex items-start space-x-3">
            <div className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 text-[11px] font-semibold shrink-0">
              自動文字起こしAI
            </div>
            <div className="text-xs space-y-1">
              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">長大なテキストの山になり、誰も読み返さない</span>
              <p className="text-neutral-500">会話が「人物」に紐づいたカルテに集約されないため、次の面談で活かせない。</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder flex items-start space-x-3">
            <div className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 text-[11px] font-semibold shrink-0">
              一般的なSFA / CRM
            </div>
            <div className="text-xs space-y-1">
              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">入力が重すぎて経営者には続かない</span>
              <p className="text-neutral-500">項目が多く現場で破綻する。プライベートな信頼関係やチャプター履歴に対応していない。</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-apple-blue/10 border border-apple-blue/30 flex items-center space-x-3 text-apple-blue dark:text-apple-darkBlue text-xs font-semibold">
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>AI人脈コンシェルジュは「招待文を貼るだけ」「会話から出典つきカルテを自動生成」で完全解決します</span>
          </div>
        </div>
      ),
    },

    // Slide 4: コアコンセプト
    {
      id: 4,
      badge: 'Core Concept',
      title: '「信頼を資産に変える」自律型AIアーキテクチャ',
      subtitle: '予定登録から面談、カルテ更新、紹介推薦までが自動でループする',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-6 text-center">
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-2">
            <div className="w-8 h-8 mx-auto rounded-lg bg-apple-blue/10 text-apple-blue flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h4 className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">3秒予定登録</h4>
            <p className="text-[11px] text-neutral-500">Zoom文章を貼るだけで日時・相手・URL・種別を判定</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-2">
            <div className="w-8 h-8 mx-auto rounded-lg bg-apple-green/10 text-apple-green flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h4 className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">同意付き面談</h4>
            <p className="text-[11px] text-neutral-500">お互いの同意のもと、安心安全な文字起こしを取得</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-2">
            <div className="w-8 h-8 mx-auto rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h4 className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">出典付きカルテ</h4>
            <p className="text-[11px] text-neutral-500">発言エビデンス・約束事項・強みを自動アップデート</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-2">
            <div className="w-8 h-8 mx-auto rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h4 className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">根拠ある紹介推薦</h4>
            <p className="text-[11px] text-neutral-500">相関図と紹介状ドラフトで高成約なGivers Gainを実現</p>
          </div>
        </div>
      ),
    },

    // Slide 5: 機能1 予定登録
    {
      id: 5,
      badge: 'Feature 01',
      title: 'LINE・メールの招待文を丸ごと貼るだけ「3秒予定登録」',
      subtitle: 'URLだけでなく日時・相手名・面談種別をAIが自動抽出。重複登録も防止',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 items-center">
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder font-mono text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
            <div className="text-[10px] font-semibold text-neutral-400">貼り付けるテキスト例（LINEなど）:</div>
            <p className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder">
              「庄司さん、明後日の14時から1to1よろしくお願いします！<br />
              Zoomミーティングに参加する<br />
              https://us02web.zoom.us/j/81234567890?pwd=...<br />
              ミーティングID: 812 3456 7890」
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center space-x-2 text-apple-green font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>AIが自動判定・構造化</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-1">
              <div>📅 <strong>日時:</strong> 明後日 14:00〜15:00</div>
              <div>👤 <strong>相手:</strong> 候補自動判定（カルテ未登録なら仮登録）</div>
              <div>🏷 <strong>種別:</strong> BNI 1to1（ワンタップ切替可能）</div>
              <div>🔗 <strong>Zoomコード:</strong> 重複登録を検知して警告</div>
            </div>
            <p className="text-[11px] text-neutral-500">
              面倒な手入力は一切不要。外出先からでもスマホで1タップで完了します。
            </p>
          </div>
        </div>
      ),
    },

    // Slide 6: 機能2 出典付きカルテ
    {
      id: 6,
      badge: 'Feature 02',
      title: '発言の「出典」を保持する人物カルテ',
      subtitle: 'いつ誰が言った事実なのかを記録。3回目の面談前でも会話が弾む',
      content: (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">カルテに蓄積されるエビデンス（事実）例:</span>
              <span className="text-[10px] text-apple-blue">全件出典付き</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
                <span>📍 「京都・滋賀の古民家再生に特化（補助金申請も対応）」</span>
                <span className="text-[10px] text-neutral-400">2026/10/12 面談録音より確定</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
                <span>🎯 「求めている紹介先: 町家カフェを開業したい個人オーナー」</span>
                <span className="text-[10px] text-neutral-400">本人発言より確定</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
                <span>🤝 「約束: 税理士の田中さんを紹介すると約束済み」</span>
                <span className="text-[10px] text-amber-500 font-semibold">未完了タスクとしてトラッキング</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            AIが架空の事実をでっち上げる（ハルシネーション）のを防ぐため、すべての事実に出典タイムスタンプと確度を付与します。
          </p>
        </div>
      ),
    },

    // Slide 7: 機能3 相関図
    {
      id: 7,
      badge: 'Feature 03',
      title: '2Dインタラクティブ人脈相関図',
      subtitle: '「確認済み実関係」と「AI推薦シナジー」を直感的に切り替え表示',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="p-5 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-3">
            <div className="flex items-center space-x-2 text-apple-green text-xs font-semibold">
              <Shield className="w-4 h-4" />
              <span>確認済み実関係モード</span>
            </div>
            <h4 className="font-bold text-sm">事実に基づいた確実なネットワーク</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              実際に面談や名刺交換を行った相手同士の結線のみを描画。推測の線が混ざらないため、安心して人脈構造を把握できます。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-3">
            <div className="flex items-center space-x-2 text-apple-indigo text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>AI推薦関係モード</span>
            </div>
            <h4 className="font-bold text-sm">ビジネスシナジーの潜在的結線</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              「店舗改装したい飲食店」×「店舗設計デザイン」など、両者の事業オファリングからAIが紹介ニーズの一致（適合度90%+）を自動検出。
            </p>
          </div>
        </div>
      ),
    },

    // Slide 8: 機能4 紹介推薦 & ドラフト
    {
      id: 8,
      badge: 'Feature 04',
      title: '失礼のない紹介推薦 & 紹介状ドラフト自動作成',
      subtitle: '双方の了承を得るための紹介文下書きを作成。プライベート情報は自動除外',
      content: (
        <div className="space-y-3 py-2 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-apple-blue">
              <ShareIcon className="w-4 h-4" />
              <span>AIが作成する紹介状ドラフト例:</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder font-sans text-neutral-700 dark:text-neutral-300 leading-relaxed">
              「田中先生、お世話になっております。先日お話しされていた『店舗展開を検討中の飲食オーナー様』の件で、京都で古民家・店舗リノベーションを専門にされている山田社長（京都東チャプター）をお引き合わせしたくご連絡いたしました。山田社長の実績と対応エリアが合致しておりますので、双方のご都合よろしければ日程調整させていただきます。」
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500">
            <span className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800">✅ 相手の許可確認（両者合意）を必須化</span>
            <span className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800">✅ 家族などの極秘プライベート情報は完全排除</span>
            <span className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800">✅ 成約後の実績トラッキングまで完備</span>
          </div>
        </div>
      ),
    },

    // Slide 9: 機能5 複数事業 & 移籍履歴
    {
      id: 9,
      badge: 'Feature 05',
      title: '複数事業・BNI移籍履歴の永続保持',
      subtitle: '1人が複数の顔を持つ時代。過去のチャプターや役職を上書き消去しません',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-2">
            <h4 className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">1人の人物に複数事業を紐付け</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              「本業の税理士法人」「共同創業の飲食事業」など、事業ごとの得意分野・対応エリア・求めている顧客層を別々に管理できます。
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-2">
            <h4 className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">移籍履歴をタイムライン保持</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              チャプターを移籍したりカテゴリーが変わっても、過去の役職履歴（前チャプター書記兼会計など）を消さずに蓄積します。
            </p>
          </div>
        </div>
      ),
    },

    // Slide 10: セキュリティ
    {
      id: 10,
      badge: 'Security & Trust',
      title: '信頼を守る「4重の安全壁」とコンプライアンス',
      subtitle: 'ビジネス人脈における信用毀損は最大の致命傷。最高水準のプライバシー設計',
      content: (
        <div className="grid grid-cols-2 gap-3 py-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-1">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-apple-blue" />
              <span>① 事前同意の徹底</span>
            </div>
            <p className="text-[11px] text-neutral-500">無断録音・不正ボットを完全排除。拒否・撤回時は直ちに録音を遮断・破棄。</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-1">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>② 音声90日自動消去</span>
            </div>
            <p className="text-[11px] text-neutral-500">録音音声は原則90日で自動破棄。プライバシーを守り端末容量も圧迫しません。</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-1">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-apple-green" />
              <span>③ テナント完全分離 (RLS)</span>
            </div>
            <p className="text-[11px] text-neutral-500">Row Level Securityにより、他アカウントへの情報漏洩をデータベース層で遮断。</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-1">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>④ AI学習への流用ゼロ</span>
            </div>
            <p className="text-[11px] text-neutral-500">入力された面談内容や名刺データがAIの学習データに使われることはありません。</p>
          </div>
        </div>
      ),
    },

    // Slide 11: Before / After
    {
      id: 11,
      badge: 'Before / After',
      title: '月30回1to1を行う経営者 Aさんの1日',
      subtitle: '面談の質が変わり、フォローアップの速度が3倍になる',
      content: (
        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
            <div className="space-y-1 border-r border-apple-border dark:border-apple-darkBorder pr-3">
              <span className="text-[11px] font-bold text-rose-500">従来のやり方 (Before)</span>
              <p className="text-[11px] text-neutral-500">
                面談直前に過去のメモやLINEを必死に検索。結局見つからず「初めまして」のような会話からスタート。
              </p>
            </div>
            <div className="space-y-1 pl-1">
              <span className="text-[11px] font-bold text-apple-green">導入後 (After)</span>
              <p className="text-[11px] text-[#1D1D1F] dark:text-[#F5F5F7]">
                カルテを1タップ。「前回の話題・相手の最新の強み・求める顧客」が1分で頭に入り、即座に深い本題へ。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
            <div className="space-y-1 border-r border-apple-border dark:border-apple-darkBorder pr-3">
              <span className="text-[11px] font-bold text-rose-500">従来のやり方 (Before)</span>
              <p className="text-[11px] text-neutral-500">
                面談中に「〇〇さんを紹介します！」と盛り上がるも、翌日には忘れてしまい約束が未達に。
              </p>
            </div>
            <div className="space-y-1 pl-1">
              <span className="text-[11px] font-bold text-apple-green">導入後 (After)</span>
              <p className="text-[11px] text-[#1D1D1F] dark:text-[#F5F5F7]">
                AIが約束タスクと紹介状ドラフトを自動生成。終了後3分で双方への打診・フォローが完了。
              </p>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 12: ROI
    {
      id: 12,
      badge: 'ROI & Pricing',
      title: '月額4,980円で得られる圧倒的な費用対効果',
      subtitle: '月間7.5時間の時間創出 ＋ 年間1件の紹介成約で投資回収率600%超',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 items-center">
          <div className="p-5 rounded-3xl bg-apple-blue/10 border border-apple-blue/30 text-center space-y-2">
            <span className="text-xs font-semibold text-apple-blue">標準プラン想定月額</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-apple-blue">
              ¥4,980 <span className="text-xs font-normal text-neutral-500">/ 月</span>
            </div>
            <p className="text-[11px] text-neutral-500">月30〜50回の面談解析・相関図・AI専属秘書機能すべて含む</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">⏱ 時間創出の価値: 月額37,500円相当</div>
              <p className="text-[11px] text-neutral-500">1面談15分の準備・メモ整理削減 × 月30回 ＝ 月7.5時間（時給5,000円換算）</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">📈 新規成約の価値: 年間数十万〜数百万円</div>
              <p className="text-[11px] text-neutral-500">約束の抜け漏れがなくなり、年間わずか1件の成約増でも年間利用料を一瞬で回収。</p>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 13: 導入ステップ & FAQ
    {
      id: 13,
      badge: 'Implementation',
      title: 'アプリストア審査待ちゼロ。最短当日から利用開始',
      subtitle: 'iPhone / Android / PC 全対応。ホーム画面に追加するだけ',
      content: (
        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              <span className="text-[10px] text-apple-blue font-bold">STEP 1</span>
              <h5 className="font-semibold text-xs mt-1">URLアクセス</h5>
              <p className="text-[10px] text-neutral-500 mt-0.5">即日アカウント発行</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              <span className="text-[10px] text-apple-blue font-bold">STEP 2</span>
              <h5 className="font-semibold text-xs mt-1">ホーム画面に追加</h5>
              <p className="text-[10px] text-neutral-500 mt-0.5">PWAネイティブ動作</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              <span className="text-[10px] text-apple-blue font-bold">STEP 3</span>
              <h5 className="font-semibold text-xs mt-1">面談登録スタート</h5>
              <p className="text-[10px] text-neutral-500 mt-0.5">名刺撮影・Zoom貼り付け</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder space-y-2">
            <span className="font-bold text-xs">よくあるご質問:</span>
            <div className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400">
              <p><strong>Q: Google Meetや対面の面談でも使えますか？</strong><br />A: はい、対面のスマホ録音やGoogle Meetの招待文にも完全対応しています。</p>
              <p><strong>Q: 相手に怪しまれませんか？</strong><br />A: 「約束を確実に守るための誠実な事前同意」を前提としており、むしろ信頼向上に繋がります。</p>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 14: クロージング
    {
      id: 14,
      badge: 'Get Started',
      title: '信頼されるビジネスリーダーのための第一歩を、いま。',
      subtitle: '人を忘れず、大事にし続けるためのAI専属パートナー',
      content: (
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
          <div className="w-16 h-16 rounded-3xl bg-apple-blue/10 text-apple-blue flex items-center justify-center shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              今すぐ実機デモをご体験ください
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
              実際に名刺スキャンやZoom予定登録をその場でお試しいただけます。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://ai-network-concierge.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-2xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold shadow-md hover:opacity-90 transition-opacity flex items-center space-x-2"
            >
              <span>サービス本番環境を開く</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-[11px] text-neutral-400">
            URL: https://ai-network-concierge.vercel.app
          </p>
        </div>
      ),
    },
  ];

  // キーボード矢印キーでスライド送り
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const url = window.location.origin + '/#/deck';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-apple-bg dark:bg-apple-darkBg text-[#1D1D1F] dark:text-[#F5F5F7] p-3 sm:p-6 flex flex-col justify-between select-none">
      {/* 画面上部コントロールバー (印刷時は非表示) */}
      <div className="print:hidden max-w-5xl mx-auto w-full flex items-center justify-between pb-4 border-b border-apple-border dark:border-apple-darkBorder text-xs">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>アプリへ戻る</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="font-mono text-neutral-500">
            Slide {currentSlide + 1} / {slides.length}
          </span>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-apple-blue transition-colors"
            title="プレゼンURLをコピー"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {copied && (
            <span className="text-[10px] text-apple-green font-semibold animate-fadeIn">
              コピー完了!
            </span>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-apple-blue text-white font-medium hover:opacity-90 transition-opacity shadow-sm"
            title="PDFとして印刷・保存"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF保存 / 印刷</span>
          </button>
        </div>
      </div>

      {/* スライド本体カード */}
      <div className="max-w-4xl mx-auto w-full my-auto py-6">
        <div className="relative rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder p-6 sm:p-12 shadow-xl min-h-[500px] flex flex-col justify-between overflow-hidden">
          {/* 背景装飾 */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-apple-blue/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* スライドヘッダー */}
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] font-semibold">
              <span>{slide.badge}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] mt-3">
              {slide.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              {slide.subtitle}
            </p>
          </div>

          {/* スライドメインコンテンツ */}
          <div className="my-auto">
            {slide.content}
          </div>

          {/* スライドフッター */}
          <div className="pt-4 border-t border-apple-border dark:border-apple-darkBorder flex items-center justify-between text-[11px] text-neutral-400">
            <span>AI人脈コンシェルジュ — 営業提案資料</span>
            <span className="font-mono">{currentSlide + 1} / {slides.length}</span>
          </div>
        </div>
      </div>

      {/* 下部ナビゲーションボタン (印刷時は非表示) */}
      <div className="print:hidden max-w-4xl mx-auto w-full flex items-center justify-between pt-4">
        <button
          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-xs font-semibold text-neutral-700 dark:text-neutral-300 disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>前へ</span>
        </button>

        {/* ドットインジケーター */}
        <div className="flex space-x-1.5 overflow-x-auto max-w-[200px] sm:max-w-none px-2 py-1">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === idx
                  ? 'w-6 bg-apple-blue'
                  : 'w-2 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlide === slides.length - 1}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-all shadow-sm"
        >
          <span>次へ</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 印刷用全スライド一括出力エリア (画面では非表示、印刷時のみ各スライド改ページ) */}
      <div className="hidden print:block space-y-8">
        {slides.map(s => (
          <div
            key={s.id}
            className="p-10 border border-neutral-300 bg-white text-black rounded-2xl"
            style={{ pageBreakAfter: 'always', minHeight: '650px' }}
          >
            <div className="text-xs font-bold text-blue-600 mb-1">{s.badge}</div>
            <h2 className="text-2xl font-bold mb-2">{s.title}</h2>
            <p className="text-sm text-neutral-500 mb-6">{s.subtitle}</p>
            <div>{s.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
