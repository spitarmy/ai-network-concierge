import React, { useState } from 'react';
import { X, CheckCircle2, Building2, User, Sparkles, BookOpen } from 'lucide-react';
import { store } from '../services/store';

interface IdentifyParticipantModalProps {
  isOpen: boolean;
  meetingId: string | null;
  onClose: () => void;
  onSuccess: (personId: string) => void;
}

export const IdentifyParticipantModal: React.FC<IdentifyParticipantModalProps> = ({
  isOpen,
  meetingId,
  onClose,
  onSuccess,
}) => {
  const [realName, setRealName] = useState('');
  const [phoneticName, setPhoneticName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState('代表');
  const [bniChapter, setBniChapter] = useState('');
  const [bniCategory, setBniCategory] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !meetingId) return null;

  const meeting = store.getMeetings().find(m => m.id === meetingId);
  const currentPerson = meeting && meeting.participant_ids[0]
    ? store.getPersonById(meeting.participant_ids[0])
    : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!realName.trim()) return;

    const res = store.identifyMeetingParticipant(meetingId, {
      realName: realName.trim(),
      phoneticName: phoneticName.trim() || undefined,
      companyName: companyName.trim() || undefined,
      title: title.trim() || undefined,
      bniChapter: bniChapter.trim() || undefined,
      bniCategory: bniCategory.trim() || undefined,
      serviceDescription: serviceDescription.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setRealName('');
      setPhoneticName('');
      setCompanyName('');
      setBniChapter('');
      setBniCategory('');
      setServiceDescription('');
      setNotes('');
      onSuccess(res.person.id);
      onClose();
    }, 700);
  };

  const handleFillSample = () => {
    setRealName('高橋 誠治');
    setPhoneticName('タカハシ セイジ');
    setCompanyName('株式会社タカハシ看板デザイン');
    setTitle('代表取締役');
    setBniChapter('京都南チャプター');
    setBniCategory('屋外広告・看板施工');
    setServiceDescription('店舗サイン・LED電飾看板・ロゴ企画デザイン');
    setNotes('新規出店予定の飲食店オーナーやクリニック院長を紹介してほしいとのこと。');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-apple-card dark:bg-apple-darkCard rounded-3xl border border-apple-border dark:border-apple-darkBorder shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* モーダルヘッダー */}
        <div className="p-4 sm:p-5 border-b border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-apple-blue/10 dark:bg-apple-darkBlue/20 text-apple-blue dark:text-apple-darkBlue flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Zoom中の相手特定・カルテ昇格
              </h2>
              <p className="text-xs text-neutral-500">
                LINEの仮名から、正式な本名カルテへワンタップで更新します
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

        {/* フォーム内容 */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {isSuccess && (
            <div className="p-3 bg-apple-green/10 text-apple-green rounded-xl text-xs flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>本名カルテ「{realName}」様へ正式登録が完了しました！</span>
            </div>
          )}

          {/* 現在の面談・仮情報 */}
          <div className="p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
            <div>
              <span className="text-neutral-400 block text-[10px]">現在の登録情報（事前LINE）</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                {currentPerson?.display_name || '相手未特定'}
              </span>
              <span className="text-neutral-400 text-[10px] ml-2">
                ({meeting?.title || '面談'})
              </span>
            </div>
            <button
              type="button"
              onClick={handleFillSample}
              className="text-[11px] text-apple-blue dark:text-apple-darkBlue hover:underline shrink-0"
            >
              ＋記入例を自動挿入
            </button>
          </div>

          {/* 基本情報 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-neutral-700 dark:text-neutral-300 font-semibold">
              <User className="w-3.5 h-3.5 text-apple-blue" />
              <span>お名前（必須）</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 mb-1">本名（漢字）*</label>
                <input
                  type="text"
                  required
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="例: 高橋 誠治"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">フリガナ</label>
                <input
                  type="text"
                  value={phoneticName}
                  onChange={(e) => setPhoneticName(e.target.value)}
                  placeholder="例: タカハシ セイジ"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue text-xs"
                />
              </div>
            </div>
          </div>

          {/* 会社 & BNI情報 */}
          <div className="space-y-3 pt-2 border-t border-apple-border dark:border-apple-darkBorder">
            <div className="flex items-center space-x-1.5 text-neutral-700 dark:text-neutral-300 font-semibold">
              <Building2 className="w-3.5 h-3.5 text-apple-blue" />
              <span>会社 & BNIチャプター情報</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 mb-1">会社名 / 屋号</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="例: 株式会社タカハシ看板デザイン"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">役職</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: 代表取締役"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 mb-1">BNIチャプター（任意）</label>
                <input
                  type="text"
                  value={bniChapter}
                  onChange={(e) => setBniChapter(e.target.value)}
                  placeholder="例: 京都東チャプター"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">専門分野 / カテゴリー</label>
                <input
                  type="text"
                  value={bniCategory}
                  onChange={(e) => setBniCategory(e.target.value)}
                  placeholder="例: 看板施工・屋外広告"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue text-xs"
                />
              </div>
            </div>
          </div>

          {/* 事業内容 & メモ */}
          <div className="space-y-3 pt-2 border-t border-apple-border dark:border-apple-darkBorder">
            <div className="flex items-center space-x-1.5 text-neutral-700 dark:text-neutral-300 font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-apple-blue" />
              <span>事業内容・Zoom中のメモ</span>
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">主な事業内容・強み</label>
              <input
                type="text"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="例: 店舗サイン・LED看板・屋外広告の企画から施工まで一貫対応"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue text-xs"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Zoom中の気づき・求める紹介</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="例: 開業予定のカフェオーナーやクリニック院長と繋がりたがっている。"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue text-xs"
              />
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!realName.trim()}
              className="w-full py-3 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              確定して正式カルテへ昇格する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
