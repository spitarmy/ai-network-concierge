import React, { useState, useEffect } from 'react';
import { X, Copy, Check, MessageSquare, Mail, Sparkles } from 'lucide-react';
import { store } from '../services/store';

interface ThankYouFollowUpModalProps {
  isOpen: boolean;
  meetingId: string | null;
  onClose: () => void;
}

export const ThankYouFollowUpModal: React.FC<ThankYouFollowUpModalProps> = ({
  isOpen,
  meetingId,
  onClose,
}) => {
  const [tone, setTone] = useState<'line_casual' | 'business_polite' | 'bni_formal'>('line_casual');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (isOpen && meetingId) {
      const draft = store.generateThankYouDraft(meetingId, tone, selectedPersonId || undefined);
      setMessageText(draft.draft_text);
      setRecipientName(draft.recipient_name);
      setParticipants(draft.all_participants || []);
      if (!selectedPersonId && draft.all_participants && draft.all_participants.length > 0) {
        setSelectedPersonId(draft.all_participants[0].id);
      }
    }
  }, [isOpen, meetingId, tone, selectedPersonId]);

  if (!isOpen || !meetingId) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenLine = () => {
    handleCopy();
    // LINEの共有URL (Web/モバイル共通)
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const handleOpenEmail = () => {
    handleCopy();
    const subject = encodeURIComponent(`本日の面談のお礼と要約（${recipientName}様）`);
    const body = encodeURIComponent(messageText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-apple-card dark:bg-apple-darkCard rounded-3xl border border-apple-border dark:border-apple-darkBorder shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* モーダルヘッダー */}
        <div className="p-4 sm:p-5 border-b border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-apple-blue/10 dark:bg-apple-darkBlue/20 text-apple-blue dark:text-apple-darkBlue flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                お礼文 ＆ 相互要約の作成
              </h2>
              <p className="text-xs text-neutral-500">
                AIが会話と約束を自動要約。確認・微調整してLINE等で手動送信できます
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* 送付相手の個別選択（複数参加者または同一Zoomリンクの場合） */}
          {participants.length > 1 && (
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl border border-apple-border dark:border-apple-darkBorder space-y-2">
              <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
                <span>送付相手を選択（参加者ごとに要約とお礼文が独立して生成されます）:</span>
                <span className="text-[10px] text-apple-blue font-bold">個別要約対応</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {participants.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersonId(p.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      (selectedPersonId === p.id || (!selectedPersonId && participants[0].id === p.id))
                        ? 'bg-apple-blue text-white shadow-xs'
                        : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    {p.name} 様
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 同一リンク・人別要約に関する安心ガイド */}
          <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 flex items-center space-x-2">
            <span className="text-sm">💡</span>
            <span>同一のZoom URLであっても、各参加者・面談ごとに完全に分離してカルテ記録とお礼文の作成が行われます。</span>
          </div>

          {/* 文体セレクター */}
          <div>
            <label className="block text-neutral-500 mb-1.5 font-medium">送信先・文体を選択:</label>
            <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
              <button
                type="button"
                onClick={() => setTone('line_casual')}
                className={`flex-1 py-1.5 rounded-xl font-medium transition-all ${
                  tone === 'line_casual'
                    ? 'bg-white dark:bg-neutral-700 text-apple-blue dark:text-apple-darkBlue shadow-xs font-bold'
                    : 'text-neutral-500'
                }`}
              >
                🤝 カジュアル（LINE向け）
              </button>
              <button
                type="button"
                onClick={() => setTone('bni_formal')}
                className={`flex-1 py-1.5 rounded-xl font-medium transition-all ${
                  tone === 'bni_formal'
                    ? 'bg-white dark:bg-neutral-700 text-apple-blue dark:text-apple-darkBlue shadow-xs font-bold'
                    : 'text-neutral-500'
                }`}
              >
                🏢 BNIフォーマル（1to1向け）
              </button>
              <button
                type="button"
                onClick={() => setTone('business_polite')}
                className={`flex-1 py-1.5 rounded-xl font-medium transition-all ${
                  tone === 'business_polite'
                    ? 'bg-white dark:bg-neutral-700 text-apple-blue dark:text-apple-darkBlue shadow-xs font-bold'
                    : 'text-neutral-500'
                }`}
              >
                👔 ビジネス丁寧（メール向け）
              </button>
            </div>
          </div>

          {/* 文章編集エリア */}
          <div>
            <div className="flex items-center justify-between text-neutral-500 mb-1.5">
              <span className="font-medium">生成された送信メッセージ（編集可能）:</span>
              <span className="text-[11px] text-neutral-400">{messageText.length}文字</span>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={11}
              className="w-full p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-apple-blue/50 font-sans"
            />
          </div>

          {/* コピー完了トースト */}
          {copied && (
            <div className="p-3 bg-apple-green/10 text-apple-green rounded-xl text-xs flex items-center space-x-2 font-medium animate-fadeIn">
              <Check className="w-4 h-4 shrink-0" />
              <span>クリップボードにコピーしました！LINEやチャットにそのまま貼り付けできます。</span>
            </div>
          )}

          {/* 手動送信アクションボタン群 */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="py-3 px-4 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center space-x-1.5"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'コピー完了' : '本文をコピー'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenLine}
              className="py-3 px-4 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>LINEを開く</span>
            </button>

            <button
              type="button"
              onClick={handleOpenEmail}
              className="py-3 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 active:scale-95 border border-apple-border dark:border-apple-darkBorder"
            >
              <Mail className="w-4 h-4" />
              <span>メールで送る</span>
            </button>
          </div>

          <p className="text-center text-[11px] text-neutral-400">
            ※自動送信は行われません。あなたが内容を確認した上で、手動で送信します。
          </p>
        </div>
      </div>
    </div>
  );
};
