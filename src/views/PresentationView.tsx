import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Printer, Share2, Sparkles, Shield,
  CheckCircle2, Share2 as ShareIcon, Lock, Clock,
  ExternalLink, ArrowLeft, Volume2, Users, Handshake,
  TrendingUp, Award, Zap
} from 'lucide-react';

interface PresentationViewProps {
  onBack: () => void;
}

type DeckType = 'client' | 'partner';

export const PresentationView: React.FC<PresentationViewProps> = ({ onBack }) => {
  const [deckType, setDeckType] = useState<DeckType>('client');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  // デッキ切り替え時に先頭スライドへ戻す
  const handleSwitchDeck = (type: DeckType) => {
    setDeckType(type);
    setCurrentSlide(0);
  };

  // ==========================
  // クライアント・営業提案スライド
  // ==========================
  const clientSlides = [
    // Slide 1: タイトル
    {
      badge: 'Product Pitch Deck 2026',
      title: 'AI人脈コンシェルジュ',
      subtitle: '人を忘れず、大事にし続けるための次世代AI専属パートナー',
      content: (
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-apple-blue dark:text-apple-darkBlue text-xs font-semibold border border-apple-blue/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BNI 1to1 & ビジネス人脈特化型 AI SaaS</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] max-w-2xl leading-tight">
            AI人脈<span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">コンシェルジュ</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed">
            単なる録音アプリでも、名刺管理でもありません。<br />
            <strong>会話を高精度に要約し、人脈の潜在的な親和性を発掘</strong>して最高の紹介を生み出します。
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border border-apple-border dark:border-apple-darkBorder shadow-sm">
              ⚡️ 招待文を貼るだけ「3秒予定登録」
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border border-apple-border dark:border-apple-darkBorder shadow-sm">
              🧠 文字起こし要約 × 親和性発掘AI
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border border-apple-border dark:border-apple-darkBorder shadow-sm">
              🔒 厳格な事前同意 & 90日自動消去
            </span>
          </div>
        </div>
      ),
    },

    // Slide 2: 経営者の現実
    {
      badge: 'The Problem',
      title: '熱心な経営者ほど「脳のメモリ」の限界を迎えている',
      subtitle: '月20〜30回の1to1・商談を重ねると、誰しもが直面する3つの壁',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2.5 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base">
              1
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">記憶の希釈化</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              「前どこまで話したっけ？」「相手の本当の強みは何だっけ？」月数十人と会うと、どんなに誠実な人でも前回の話題が曖昧になります。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2.5 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-base">
              2
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">約束の抜け漏れ（信用失墜）</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              「あの人を紹介します」「後で資料送ります」という口約束が日々の忙しさで蒸発。悪気がないのに相手の信頼を損ねてしまいます。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2.5 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
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
      badge: 'Market Comparison',
      title: 'なぜ従来のツールでは解決できなかったのか？',
      subtitle: '名刺アプリ・議事録AI・一般的なCRMには「決定的な隙間」がありました',
      content: (
        <div className="space-y-3 py-2 text-xs">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder flex items-start space-x-3 shadow-sm">
            <div className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-[11px] font-semibold shrink-0">
              名刺管理アプリ
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">会社名と肩書きしか残らない</span>
              <p className="text-neutral-500">「何を話し、誰を求めているか」が記録されず、相手に寄り添った紹介に結びつかない。</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder flex items-start space-x-3 shadow-sm">
            <div className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-[11px] font-semibold shrink-0">
              自動文字起こしAI
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">長大なテキストの山になり、誰も読み返さない</span>
              <p className="text-neutral-500">会話が「人物カルテ」に自動要約・蓄積されないため、次の面談で活かせない。</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder flex items-start space-x-3 shadow-sm">
            <div className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-[11px] font-semibold shrink-0">
              一般的なSFA / CRM
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">入力が重すぎて経営者には続かない</span>
              <p className="text-neutral-500">項目が多すぎて現場で破綻する。プライベートな信頼関係やチャプター履歴に対応していない。</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-apple-blue/30 flex items-center space-x-3 text-apple-blue dark:text-apple-darkBlue font-semibold shadow-sm">
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>AI人脈コンシェルジュは「招待文を貼るだけ」「会話から要約カルテと親和性を自動発掘」で完全解決します</span>
          </div>
        </div>
      ),
    },

    // Slide 4: コアコンセプト
    {
      badge: 'Core Concept',
      title: '「信頼を資産に変える」自律型AIループ',
      subtitle: '予定登録から面談、要約カルテ更新、親和性発掘までが自動でループする',
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 text-center">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2 shadow-sm">
            <div className="w-8 h-8 mx-auto rounded-lg bg-apple-blue/10 text-apple-blue flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h4 className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">3秒予定登録</h4>
            <p className="text-[11px] text-neutral-500">Zoom文章を貼るだけで日時・相手・URL・種別を判定</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2 shadow-sm">
            <div className="w-8 h-8 mx-auto rounded-lg bg-apple-green/10 text-apple-green flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h4 className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">同意付き面談</h4>
            <p className="text-[11px] text-neutral-500">お互いの同意のもと、安心安全な文字起こしを取得</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2 shadow-sm">
            <div className="w-8 h-8 mx-auto rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h4 className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">高精度要約カルテ</h4>
            <p className="text-[11px] text-neutral-500">決定事項・約束タスク・最新オファリングを即時抽出</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2 shadow-sm">
            <div className="w-8 h-8 mx-auto rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h4 className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">潜在親和性発掘</h4>
            <p className="text-[11px] text-neutral-500">人脈全体を横断し、最高のマッチングと紹介状を生成</p>
          </div>
        </div>
      ),
    },

    // Slide 5: 機能1 予定登録
    {
      badge: 'Feature 01',
      title: '招待文を丸ごと貼るだけ「3秒予定登録」',
      subtitle: 'URLだけでなく日時・相手名・面談種別をAIが自動抽出。重複登録も防止',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 items-center">
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder font-mono text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
            <div className="text-[10px] font-semibold text-neutral-400">貼り付けるテキスト例（LINEなど）:</div>
            <p className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
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
            <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder space-y-1.5 shadow-sm">
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

    // Slide 6: 【超重要・新強調スライド】文字起こし要約 × 潜在親和性発掘
    {
      badge: 'Core Superpower',
      title: '文字起こし要約 × 潜在親和性（シナジー）発掘AIエンジン',
      subtitle: '60分の会話を「30秒要約」と「約束タスク」に圧縮し、ネットワーク全体からベストな紹介先を発掘',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 text-xs">
          {/* 左側: 会話要約モック */}
          <div className="p-4 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-apple-green animate-pulse" />
                <span className="font-semibold text-[11px]">1to1面談 音声解析完了 (48分)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-green/20 text-apple-green">高精度文字起こし</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 space-y-1">
                <span className="text-[10px] text-neutral-400 font-semibold">💡 30秒エグゼクティブ要約</span>
                <p className="text-neutral-200">
                  「飲食店経営のA氏。来春オープン予定の2号店で古民家再生・町家風の内装と補助金活用を模索中。」
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 space-y-1">
                <span className="text-[10px] text-amber-400 font-semibold">🤝 約束事項（自動トラッキング）</span>
                <p className="text-neutral-200">
                  ・田中税理士への事業承継の相談打診（期限: 今週金曜まで）
                </p>
              </div>
            </div>
          </div>

          {/* 右側: 潜在親和性マッチング */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-neutral-950 text-white border border-indigo-500/30 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-[11px]">人脈ネットワーク横断 親和性検出</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">親和性 94%</span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-900/20 border border-indigo-500/30 space-y-1.5">
              <div className="text-[10px] text-indigo-300 font-semibold">🎯 自動検出されたシナジー</div>
              <p className="text-[11px] text-neutral-200 leading-relaxed">
                <strong>A氏（カフェ出店希望）</strong> × <strong>山田社長（京町家・耐震リノベ専門店）</strong>
              </p>
              <p className="text-[10px] text-neutral-400">
                『町家再生の施工実績』と『補助金申請サポート』が、A氏の求めるニーズと100%合致。
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-between text-[11px]">
              <span className="text-neutral-300">双方への紹介状ドラフト</span>
              <span className="text-apple-blue font-semibold text-[10px]">ワンタップで送信可能</span>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 7: 機能2 出典付きカルテ
    {
      badge: 'Feature 02',
      title: '発言の「出典」を保持する人物カルテ',
      subtitle: 'いつ誰が言った事実なのかを記録。3回目の面談前でも会話が弾む',
      content: (
        <div className="space-y-4 py-2 text-xs">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">カルテに蓄積されるエビデンス（事実）例:</span>
              <span className="text-[10px] text-apple-blue font-semibold">全件出典・日時付き</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
                <span>📍 「京都・滋賀の古民家再生に特化（補助金申請も対応）」</span>
                <span className="text-[10px] text-neutral-400">2026/10/12 面談録音より確定</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
                <span>🎯 「求めている紹介先: 町家カフェを開業したい個人オーナー」</span>
                <span className="text-[10px] text-neutral-400">本人発言より確定</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
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

    // Slide 8: 機能3 相関図
    {
      badge: 'Feature 03',
      title: '2Dインタラクティブ人脈相関図',
      subtitle: '「確認済み実関係」と「AI推薦シナジー」を直感的に切り替え表示',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="p-5 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-3 shadow-md">
            <div className="flex items-center space-x-2 text-apple-green text-xs font-semibold">
              <Shield className="w-4 h-4" />
              <span>確認済み実関係モード</span>
            </div>
            <h4 className="font-bold text-sm">事実に基づいた確実なネットワーク</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              実際に面談や名刺交換を行った相手同士の結線のみを描画。推測の線が混ざらないため、安心して人脈構造を把握できます。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-3 shadow-md">
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

    // Slide 9: 機能4 紹介推薦 & ドラフト
    {
      badge: 'Feature 04',
      title: '失礼のない紹介推薦 & 紹介状ドラフト自動作成',
      subtitle: '双方の了承を得るための紹介文下書きを作成。プライベート情報は自動除外',
      content: (
        <div className="space-y-3 py-2 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-2 shadow-sm">
            <div className="flex items-center space-x-2 font-semibold text-apple-blue">
              <ShareIcon className="w-4 h-4" />
              <span>AIが作成する紹介状ドラフト例:</span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder font-sans text-neutral-700 dark:text-neutral-300 leading-relaxed">
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

    // Slide 10: セキュリティ
    {
      badge: 'Security & Trust',
      title: '信頼を守る「4重の安全壁」とコンプライアンス',
      subtitle: 'ビジネス人脈における信用毀損は最大の致命傷。最高水準のプライバシー設計',
      content: (
        <div className="grid grid-cols-2 gap-3 py-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-1 shadow-sm">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-apple-blue" />
              <span>① 事前同意の徹底</span>
            </div>
            <p className="text-[11px] text-neutral-500">無断録音・不正ボット排除。拒否・撤回時は直ちに録音を遮断・破棄。</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-1 shadow-sm">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>② 音声90日自動消去</span>
            </div>
            <p className="text-[11px] text-neutral-500">録音音声は原則90日で自動破棄。プライバシーを守り端末容量も圧迫しません。</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-1 shadow-sm">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-apple-green" />
              <span>③ テナント完全分離 (RLS)</span>
            </div>
            <p className="text-[11px] text-neutral-500">Row Level Securityにより、他アカウントへの情報漏洩をデータベース層で遮断。</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-1 shadow-sm">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>④ AI学習への流用ゼロ</span>
            </div>
            <p className="text-[11px] text-neutral-500">入力された面談内容や名刺データがAIの学習データに使われることはありません。</p>
          </div>
        </div>
      ),
    },

    // Slide 11: ROI
    {
      badge: 'ROI & Pricing',
      title: '月額4,980円で得られる圧倒的な費用対効果',
      subtitle: '月間7.5時間の時間創出 ＋ 年間1件の紹介成約で投資回収率600%超',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 items-center">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent border border-apple-blue/30 text-center space-y-2 shadow-sm">
            <span className="text-xs font-semibold text-apple-blue">標準プラン想定月額</span>
            <div className="text-3xl sm:text-5xl font-extrabold text-apple-blue">
              ¥4,980 <span className="text-xs font-normal text-neutral-500">/ 月</span>
            </div>
            <p className="text-[11px] text-neutral-500">月30〜50回の面談解析・相関図・AI専属秘書機能すべて含む</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder shadow-sm">
              <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">⏱ 時間創出の価値: 月額37,500円相当</div>
              <p className="text-[11px] text-neutral-500">1面談15分の準備・メモ整理削減 × 月30回 ＝ 月7.5時間（時給5,000円換算）</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder shadow-sm">
              <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">📈 新規成約の価値: 年間数十万〜数百万円</div>
              <p className="text-[11px] text-neutral-500">約束の抜け漏れがなくなり、年間わずか1件の成約増でも年間利用料を一瞬で回収。</p>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 12: クロージング
    {
      badge: 'Get Started',
      title: '信頼されるビジネスリーダーのための第一歩を、いま。',
      subtitle: '人を忘れず、大事にし続けるためのAI専属パートナー',
      content: (
        <div className="flex flex-col items-center justify-center text-center space-y-5 py-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] dark:text-[#F5F5F7]">
              今すぐ実機デモをご体験ください
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
              実際に名刺スキャンやZoom予定登録をその場でお試しいただけます。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
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
          <p className="text-[11px] text-neutral-400 font-mono">
            https://ai-network-concierge.vercel.app
          </p>
        </div>
      ),
    },
  ];

  // ==========================
  // 協業パートナー・アライアンス提案スライド
  // ==========================
  const partnerSlides = [
    // P-Slide 1: タイトル
    {
      badge: 'Partnership & Alliance 2026',
      title: 'AI人脈コンシェルジュ 協業アライアンス提案',
      subtitle: '信頼資本を最大化する次世代エコシステムの共創',
      content: (
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            <Handshake className="w-3.5 h-3.5" />
            <span>ビジネスパートナー・代理店・コミュニティ主催者様向け</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] max-w-2xl leading-tight">
            顧客の成約成果を倍増させ、<br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">継続ストック収益</span>を共創する
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed">
            貴社の受講生・クライアント・チャプター会員に「AI人脈コンシェルジュ」を提供し、1to1成果の最大化と高還元レベニューシェアを実現します。
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2 text-xs text-neutral-500">
            <span className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder">
              💰 継続レベニューシェア 20%〜30%
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder">
              📈 クライアントの面談成果3倍
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder">
              🤝 共同ウェビナー & 販促支援完備
            </span>
          </div>
        </div>
      ),
    },

    // P-Slide 2: パートナー企業の課題
    {
      badge: 'Partner Challenges',
      title: '研修・コンサル・コミュニティ運営の「3大ボトルネック」',
      subtitle: 'ノウハウを提供しても、現場での実践継続と受講生の成果に限界がある',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 text-xs">
          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">1</div>
            <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">実践継続が定着しない</h4>
            <p className="text-neutral-500 leading-relaxed">
              面談のコツやGivers Gainを教えても、メモの整理や約束の履行が受講生任せになり、成果が長続きしない。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">2</div>
            <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">手動マッチングの限界</h4>
            <p className="text-neutral-500 leading-relaxed">
              主催者自身の頭の中だけで会員同士を引き合わせるため、人数が50人、100人と増えるにつれて紹介機会を見落としてしまう。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">3</div>
            <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">ストック収益の不足</h4>
            <p className="text-neutral-500 leading-relaxed">
              単発の研修受講料やコンサル報酬だけではフロービジネスにとどまり、LTV（顧客生涯価値）が伸び悩む。
            </p>
          </div>
        </div>
      ),
    },

    // P-Slide 3: コアエンジン
    {
      badge: 'Product Engine',
      title: '会話から「紹介成約の親和性」を発掘するAIエンジン',
      subtitle: '単なる文字起こしではなく、会員のニーズと強みを自動マッチングして成果を可視化',
      content: (
        <div className="p-5 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-4 my-auto shadow-md text-xs">
          <div className="grid grid-cols-3 gap-3 text-center border-b border-neutral-800 pb-3">
            <div>
              <div className="font-bold text-apple-green text-sm">① 高精度要約</div>
              <p className="text-[11px] text-neutral-400 mt-1">60分の1to1を30秒の重要決定・約束に即座に凝縮</p>
            </div>
            <div>
              <div className="font-bold text-indigo-400 text-sm">② 潜在親和性検出</div>
              <p className="text-[11px] text-neutral-400 mt-1">会員Aの悩み × 会員Bの得意分野をAIが自動検知</p>
            </div>
            <div>
              <div className="font-bold text-apple-blue text-sm">③ 紹介状ドラフト</div>
              <p className="text-[11px] text-neutral-400 mt-1">断られない打診文を自動生成し成約率を最大化</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-between">
            <span className="text-neutral-300">
              💡 貴社の受講生が使うことで、<strong>「教えたノウハウが勝手に実践され、紹介成果が出る状態」</strong>が実現します。
            </span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold shrink-0 text-[10px]">
              リテンション向上
            </span>
          </div>
        </div>
      ),
    },

    // P-Slide 4: 提携スキーム
    {
      badge: '3 Collaboration Models',
      title: '貴社に合わせて選べる3つの提携スキーム',
      subtitle: '紹介のみの手軽なモデルから、自社プログラムへの同梱・チャプター導入まで',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-3 text-xs">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2 shadow-sm">
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">スキーム ①</span>
            <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">認定リファラル / 代理店</h4>
            <p className="text-neutral-500">
              貴社のクライアントや知人経営者へご紹介。<strong>月額利用料の20%〜30%を永続的にレベニューシェア還元</strong>。
            </p>
            <div className="pt-2 text-[10px] text-apple-blue font-semibold">工数ゼロ・運用はすべて弊社担当</div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2 shadow-sm">
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">スキーム ②</span>
            <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">研修・コンサル同梱</h4>
            <p className="text-neutral-500">
              貴社の営業研修・コミュニティ会費に公式ツールとしてバンドル。特別卸価格で提供し、貴社の粗利を上乗せ。
            </p>
            <div className="pt-2 text-[10px] text-emerald-600 font-semibold">受講生の定着率・成果率が倍増</div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2 shadow-sm">
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">スキーム ③</span>
            <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">チャプター / 団体一括</h4>
            <p className="text-neutral-500">
              BNIチャプターや交流会全体（30〜100名規模）への一括導入。専用テナントでメンバー間の相関図を可視化。
            </p>
            <div className="pt-2 text-[10px] text-purple-600 font-semibold">チャプター内の紹介件数が急増</div>
          </div>
        </div>
      ),
    },

    // P-Slide 5: 収益シミュレーション
    {
      badge: 'Revenue Share',
      title: '継続ストック収益シミュレーション',
      subtitle: '解約率の極めて低い人脈SaaSのため、積み上がるほど強固な月額ストック収益に',
      content: (
        <div className="space-y-4 py-2 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">還元条件例: レベニューシェア 25%</span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                月額4,980円の標準プランにつき、<strong>1アカウントあたり月額 約1,245円</strong> を永続還元
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-600 text-white font-bold shrink-0">毎月自動振込</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-1 shadow-sm">
              <span className="text-[10px] text-neutral-400 font-bold">30アカウント（1チャプター）</span>
              <div className="text-xl font-bold text-emerald-600">¥37,350<span className="text-xs font-normal text-neutral-400">/月</span></div>
              <p className="text-[10px] text-neutral-500">年間 約45万円</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-1 shadow-sm">
              <span className="text-[10px] text-neutral-400 font-bold">100アカウント（受講生規模）</span>
              <div className="text-xl font-bold text-emerald-600">¥124,500<span className="text-xs font-normal text-neutral-400">/月</span></div>
              <p className="text-[10px] text-neutral-500">年間 約150万円</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-1 shadow-sm">
              <span className="text-[10px] text-neutral-400 font-bold">300アカウント（複数組織）</span>
              <div className="text-xl font-bold text-emerald-600">¥373,500<span className="text-xs font-normal text-neutral-400">/月</span></div>
              <p className="text-[10px] text-neutral-500">年間 約450万円</p>
            </div>
          </div>
        </div>
      ),
    },

    // P-Slide 6: パートナー支援体制
    {
      badge: 'Partner Support',
      title: 'パートナー企業様への万全のサポート体制',
      subtitle: '貴社が販売しやすいよう、営業ツール・共催セミナー・導入支援をすべて無償提供',
      content: (
        <div className="grid grid-cols-2 gap-3 py-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-1 shadow-sm">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Award className="w-3.5 h-3.5 text-apple-blue" />
              <span>① パートナー無償アカウント</span>
            </div>
            <p className="text-[11px] text-neutral-500">貴社自身が効果を体感し、自社の人脈管理にフル活用できる本番アカウントを付与。</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-1 shadow-sm">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>② 販促資料・スライド完全提供</span>
            </div>
            <p className="text-[11px] text-neutral-500">提案用スライド（本資料 / PDF）、デモ手順書、案内テンプレートをすべて無償提供。</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-1 shadow-sm">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>③ 共同ウェビナー・勉強会共催</span>
            </div>
            <p className="text-[11px] text-neutral-500">「1to1の成約率を3倍にするAI人脈術」など、集客に直結するセミナーを共催。</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-1 shadow-sm">
            <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
              <span>④ 専任オンボーディング支援</span>
            </div>
            <p className="text-[11px] text-neutral-500">クライアントへの導入時、初期設定や操作のカスタマーサポートは弊社が全面バックアップ。</p>
          </div>
        </div>
      ),
    },

    // P-Slide 7: 提携ステップ & クロージング
    {
      badge: 'Next Steps',
      title: '提携開始までのステップ（最短2週間）',
      subtitle: 'まずは30分のオンラインミーティングにて、最適な協業スキームをご相談ください',
      content: (
        <div className="space-y-5 py-4 text-xs">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              <span className="text-[10px] text-emerald-600 font-bold">STEP 1</span>
              <div className="font-semibold text-xs mt-1">30分ディスカッション</div>
              <p className="text-[10px] text-neutral-400">デモ & スキーム選定</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              <span className="text-[10px] text-emerald-600 font-bold">STEP 2</span>
              <div className="font-semibold text-xs mt-1">アカウント発行</div>
              <p className="text-[10px] text-neutral-400">実機検証 & 資料提供</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              <span className="text-[10px] text-emerald-600 font-bold">STEP 3</span>
              <div className="font-semibold text-xs mt-1">パイロット導入</div>
              <p className="text-[10px] text-neutral-400">限定5〜10社で検証</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              <span className="text-[10px] text-emerald-600 font-bold">STEP 4</span>
              <div className="font-semibold text-xs mt-1">本格展開 & シェア開始</div>
              <p className="text-[10px] text-neutral-400">毎月ストック収益還元</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-transparent border border-emerald-500/30 text-center space-y-2">
            <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              貴社のお客様の成約成果と信頼関係を、共に最大化しませんか？
            </h3>
            <p className="text-[11px] text-neutral-500">
              担当窓口: AI人脈コンシェルジュ アライアンス推進部（URL: https://ai-network-concierge.vercel.app）
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentSlides = deckType === 'client' ? clientSlides : partnerSlides;
  const slide = currentSlides[currentSlide] || currentSlides[0];

  // キーボード矢印キーでスライド送り
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlide(prev => Math.min(currentSlides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlides.length]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5F7] via-[#FBFBFD] to-[#F5F5F7] dark:from-[#0B0B0C] dark:via-[#141416] dark:to-[#0B0B0C] text-[#1D1D1F] dark:text-[#F5F5F7] p-3 sm:p-6 flex flex-col justify-between select-none">
      {/* 画面上部コントロールバー (印刷時は非表示) */}
      <div className="print:hidden max-w-5xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-apple-border dark:border-apple-darkBorder text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>アプリへ戻る</span>
          </button>

          {/* デッキ切り替えピル */}
          <div className="flex p-0.5 rounded-xl bg-neutral-200/80 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
            <button
              onClick={() => handleSwitchDeck('client')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                deckType === 'client'
                  ? 'bg-white dark:bg-neutral-700 text-apple-blue dark:text-apple-darkBlue shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              🏢 営業提案スライド (12枚)
            </button>
            <button
              onClick={() => handleSwitchDeck('partner')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                deckType === 'partner'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              🤝 協業・提携スライド (7枚)
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <span className="font-mono text-neutral-500 font-semibold">
            Slide {currentSlide + 1} / {currentSlides.length}
          </span>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-apple-blue transition-colors shadow-sm"
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
            className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-apple-blue text-white font-medium hover:opacity-90 transition-opacity shadow-sm"
            title="PDFとして印刷・保存"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF保存 / 印刷</span>
          </button>
        </div>
      </div>

      {/* スライド本体カード */}
      <div className="max-w-4xl mx-auto w-full my-auto py-4 sm:py-6">
        <div className="relative rounded-3xl bg-white/90 dark:bg-[#18181A]/90 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-12 shadow-2xl min-h-[520px] flex flex-col justify-between overflow-hidden transition-all">
          {/* 背景の洗練された光のグラデーション */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

          {/* スライドヘッダー */}
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder text-neutral-600 dark:text-neutral-300 text-[11px] font-semibold">
              <span>{slide.badge}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1D1D1F] dark:text-[#F5F5F7] mt-3 tracking-tight">
              {slide.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 leading-relaxed">
              {slide.subtitle}
            </p>
          </div>

          {/* スライドメインコンテンツ */}
          <div className="my-auto py-2">
            {slide.content}
          </div>

          {/* スライドフッター */}
          <div className="pt-3 border-t border-apple-border dark:border-apple-darkBorder flex items-center justify-between text-[11px] text-neutral-400">
            <span>
              AI人脈コンシェルジュ — {deckType === 'client' ? 'クライアント営業提案資料' : '協業・アライアンス提案資料'}
            </span>
            <span className="font-mono font-semibold">{currentSlide + 1} / {currentSlides.length}</span>
          </div>
        </div>
      </div>

      {/* 下部ナビゲーションボタン (印刷時は非表示) */}
      <div className="print:hidden max-w-4xl mx-auto w-full flex items-center justify-between pt-2">
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
          {currentSlides.map((_, idx) => (
            <button
              key={idx}
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
          onClick={() => setCurrentSlide(prev => Math.min(currentSlides.length - 1, prev + 1))}
          disabled={currentSlide === currentSlides.length - 1}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-all shadow-sm"
        >
          <span>次へ</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 印刷用全スライド一括出力エリア (画面では非表示、印刷時のみ各スライド改ページ) */}
      <div className="hidden print:block space-y-8">
        {currentSlides.map((s, idx) => (
          <div
            key={idx}
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
