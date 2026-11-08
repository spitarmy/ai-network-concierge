import React, { useState } from 'react';
import { Shield, FileText, ArrowLeft, Lock, ExternalLink } from 'lucide-react';

interface LegalViewProps {
  initialTab?: 'privacy' | 'terms';
  onBack?: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ initialTab = 'privacy', onBack }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 pb-28 animate-fadeIn">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>前の画面へ戻る</span>
        </button>
      )}

      {/* タブ切り替え */}
      <div className="flex border-b border-apple-border dark:border-apple-darkBorder space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'privacy'
              ? 'border-apple-blue text-apple-blue dark:text-apple-darkBlue font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>プライバシーポリシー (Privacy Policy)</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'terms'
              ? 'border-apple-blue text-apple-blue dark:text-apple-darkBlue font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>利用規約 (Terms of Service)</span>
        </button>
      </div>

      {/* プライバシーポリシー本文 */}
      {activeTab === 'privacy' ? (
        <article className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-8 text-neutral-700 dark:text-neutral-300 text-xs leading-relaxed shadow-sm">
          <header className="border-b border-apple-border dark:border-apple-darkBorder pb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              プライバシーポリシー
            </h1>
            <p className="text-[11px] text-neutral-400 mt-1">
              最終改定日: 2026年11月8日 | バージョン: 1.2
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <span>1. 基本方針および運営者情報</span>
            </h2>
            <p>
              「AI人脈コンシェルジュ」（以下「本サービス」）は、「人を忘れず、大事にするためのAI人脈コンシェルジュ」として、ユーザーおよび面談相手のプライバシーと個人情報の保護を最重要事項として位置付けています。本プライバシーポリシーは、個人情報保護法、GDPR、Zoom App Marketplace Developer Policy、およびGoogle API Services User Data Policyに厳格に準拠して制定されています。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              2. 収集する情報とその取得方法
            </h2>
            <p>本サービスでは、以下の情報を取り扱います：</p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
              <li><strong>連絡先・人物情報:</strong> 氏名、ふりがな、会社名、役職、電話番号、メールアドレス、住所、活動エリア、SNS/Web URL。</li>
              <li><strong>名刺画像データ:</strong> ユーザーが直接撮影またはアップロードした紙名刺の画像およびOCR抽出テキスト。</li>
              <li><strong>面談メタデータ:</strong> 1to1面談の日時、形式（対面 / Zoom / Google Meet）、相手方の氏名、参加予定。</li>
              <li><strong>音声および文字起こしテキスト:</strong> 参加者全員の事前同意を得た面談の録音データおよび発言文字起こし。</li>
              <li><strong>事実メモ（Facts）:</strong> 会話中に出てきた話題、約束事項、紹介ニーズ、趣味嗜好（プライバシー公開範囲を厳格に保持）。</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-apple-blue" />
              <span>3. 録音・文字起こしの同意取得とステートマシン（仕様05, 26）</span>
            </h2>
            <p>
              本サービスは、<strong>参加者の明示的な同意がない録音・文字起こしを固く禁止</strong>しています。
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
              <li>面談参加者全員から「同意（Granted）」が得られない場合、録音処理は自動的に遮断されます。</li>
              <li>参加者のいずれか1名でも拒否（Rejected）した場合、録音ボットや録音機能は起動しません。</li>
              <li>同意は面談中または面談後いつでも「撤回（Revoked）」可能であり、撤回された場合は直ちに関連音声データが完全消去されます。</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              4. データの保存期間と自動破棄（90日保持制限）
            </h2>
            <p>
              面談録音データは、原則として<strong>保存開始から90日が経過した時点で自動的かつ恒久的に完全消去</strong>されます。ユーザーが「恒久ピン留め」を明示的に選択した場合を除き、期限を超過した生音声ファイルをサーバー上に残存させません。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              5. 外部API連携（Zoom / Google Workspace）におけるデータ利用の開示
            </h2>
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder space-y-3">
              <div>
                <strong className="text-neutral-800 dark:text-neutral-200">Zoom APIの利用について:</strong>
                <p className="mt-0.5 text-neutral-600 dark:text-neutral-400">
                  本サービスは、ユーザーが認可したZoom OAuth連携を通じて、自ホスト会議の予定取得（<code>meeting:read</code>）、クラウド録画の取得（<code>recording:read</code>）、およびユーザー情報照会（<code>user:read</code>）を行います。取得したデータは本サービス内の面談カルテ作成目的のみに使用され、第三者に販売または提供されることはありません。
                </p>
              </div>
              <div>
                <strong className="text-neutral-800 dark:text-neutral-200">Google Workspace APIの利用について:</strong>
                <p className="mt-0.5 text-neutral-600 dark:text-neutral-400">
                  本サービスのGoogle APIから受け取った情報の使用および他のアプリへの移行は、制限付き使用の要件を含め、<a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-apple-blue underline inline-flex items-center space-x-0.5"><span>Google API サービスのユーザーデータに関するポリシー</span><ExternalLink className="w-2.5 h-2.5 ml-0.5" /></a>を遵守します。Google カレンダー（<code>calendar.events.readonly</code>）およびGoogle 連絡先（<code>contacts.readonly</code>）の情報は、面談予定の取り込みおよび重複名刺の統合のみに使用され、広告表示やAIモデルの学習には一切利用されません。
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              6. 本人の完全削除請求（忘れられる権利 / U09要件）
            </h2>
            <p>
              登録された人物は、いつでも自身のカルテおよび関連するすべての記録（事実、録音、文字起こし、相関図リンク）の完全消去を求めることができます。アプリ内の「完全削除請求」ボタンを実行することにより、トランザクション処理により関連データが完全抹消され、改ざん不能な削除証跡ログが記録されます。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              7. 安全管理措置 & テナント分離
            </h2>
            <p>
              すべてのデータは行レベルセキュリティ（RLS）によりテナントごとに厳格に完全分離されています。通信はTLS 1.3により暗号化され、他テナントのユーザーが他者の人脈情報や会話記録を閲覧・推測することはシステム上不可能です。
            </p>
          </section>

          <section className="space-y-2 border-t border-apple-border dark:border-apple-darkBorder pt-4">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              8. お問い合わせ窓口
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              個人情報の開示、訂正、利用停止、または本ポリシーに関するご質問は、アプリ管理画面のお問い合わせまたはサポート窓口までご連絡ください。
            </p>
          </section>
        </article>
      ) : (
        /* 利用規約本文 */
        <article className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-8 text-neutral-700 dark:text-neutral-300 text-xs leading-relaxed shadow-sm">
          <header className="border-b border-apple-border dark:border-apple-darkBorder pb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              利用規約 (Terms of Service)
            </h1>
            <p className="text-[11px] text-neutral-400 mt-1">
              最終改定日: 2026年11月8日 | バージョン: 1.0
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              第1条（目的および適用範囲）
            </h2>
            <p>
              本規約は、「AI人脈コンシェルジュ」（以下「本サービス」）の利用条件を定めるものです。利用者は、本規約に同意した上で本サービスを利用するものとします。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              第2条（禁止事項）
            </h2>
            <p>利用者は、以下の行為を行ってはなりません：</p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
              <li>面談参加者の同意を得ない秘密録音、無断録音、または虚偽の同意登録。</li>
              <li>他者の名誉、信用、プライバシー、または知的財産権を侵害する情報の登録。</li>
              <li>他テナントのデータへの不正アクセス、脆弱性を突く攻撃、またはサービス妨害行為。</li>
              <li>法令または公序良俗に反する目的での本サービスの利用。</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              第3条（データの所有権および利用）
            </h2>
            <p>
              利用者が本サービスに登録した人脈カルテ、名刺画像、面談メモ、および生成された事実情報のすべての権利は利用者に帰属します。当社は、サービス提供に必要な範囲を超えてこれらのデータを利用することはなく、AI基盤モデルの事前学習用データとして転用しません。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              第4条（免責事項）
            </h2>
            <p>
              本サービスのAIによる検索要約、紹介推薦文、および文字起こしは補助的な情報提供を目的としており、その完全性・正確性を保証するものではありません。利用者はAIの出力内容を確認した上で自己の責任において活用するものとします。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              第5条（準拠法および裁判管轄）
            </h2>
            <p>
              本規約の解釈および適用は、日本法に準拠するものとし、本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>
        </article>
      )}
    </div>
  );
};
