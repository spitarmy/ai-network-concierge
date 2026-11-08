import React, { useState } from 'react';
import { X, Calendar, Camera, UserPlus, Mic, AlertCircle, CheckCircle2 } from 'lucide-react';
import { store } from '../services/store';
import { MeetingType, MeetingProvider } from '../types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'card' | 'person' | 'voice'>('paste');

  // 予定貼り付け・入力状態
  const [pasteText, setPasteText] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [scheduledTime, setScheduledTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [meetingType, setMeetingType] = useState<MeetingType>('1to1');
  const [meetingProvider, setMeetingProvider] = useState<MeetingProvider>('zoom');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 人物追加状態
  const [personName, setPersonName] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [company, setCompany] = useState('');
  const [tag, setTag] = useState<'BNI' | '仕事' | '友人'>('BNI');

  if (!isOpen) return null;

  const handleParse = (text: string) => {
    setPasteText(text);
    if (text.trim().length > 3) {
      const res = store.parseMeetingIntent(text);
      setParsedResult(res);
      if (res?.extracted) {
        if (res.extracted.candidate_participants && res.extracted.candidate_participants[0]?.name) {
          setParticipantName(res.extracted.candidate_participants[0].name);
        }
        if (res.extracted.suggested_type) {
          setMeetingType(res.extracted.suggested_type);
        }
        if (res.extracted.provider) {
          setMeetingProvider(res.extracted.provider as any);
        }
        if (res.extracted.meeting_url) {
          setMeetingUrl(res.extracted.meeting_url);
        }
        if (res.extracted.scheduled_start_at) {
          const d = new Date(res.extracted.scheduled_start_at);
          const pad = (n: number) => String(n).padStart(2, '0');
          setScheduledTime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
        }
      }
    } else {
      setParsedResult(null);
    }
  };

  const handleCreateMeeting = () => {
    const finalParticipant = participantName.trim();
    const finalTitle = meetingTitle.trim() || (finalParticipant ? `${finalParticipant}様と${meetingType === '1to1' ? '1to1' : '打合せ'}` : '面談予定');
    const finalDate = scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString();

    store.createMeeting({
      title: finalTitle,
      participant_name: finalParticipant || undefined,
      meeting_type: meetingType,
      provider: meetingProvider,
      meeting_url: meetingUrl.trim() || undefined,
      scheduled_start_at: finalDate,
      raw_invite_text: pasteText.trim() || undefined,
      host_type: 'self',
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setPasteText('');
      setMeetingTitle('');
      setParticipantName('');
      setMeetingUrl('');
      setParsedResult(null);
      onRefresh();
      onClose();
    }, 800);
  };

  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;

    const newP = store.createPerson({
      display_name: personName,
      phonetic_name: phonetic,
      category_tags: [tag],
    });

    if (company.trim()) {
      store.addOrganizationMembership(newP.id, company, '代表');
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setPersonName('');
      setPhonetic('');
      setCompany('');
      onRefresh();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-apple-card dark:bg-apple-darkCard rounded-3xl border border-apple-border dark:border-apple-darkBorder shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-apple-border dark:border-apple-darkBorder">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">クイック追加</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブバー */}
        <div className="flex border-b border-apple-border dark:border-apple-darkBorder p-1.5 bg-neutral-100/50 dark:bg-neutral-800/40 text-xs">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 font-medium transition-all ${
              activeTab === 'paste' ? 'bg-white dark:bg-neutral-700 shadow-sm text-apple-blue dark:text-apple-darkBlue' : 'text-neutral-500'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>予定を貼る</span>
          </button>
          <button
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 font-medium transition-all ${
              activeTab === 'card' ? 'bg-white dark:bg-neutral-700 shadow-sm text-apple-blue dark:text-apple-darkBlue' : 'text-neutral-500'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>名刺を撮る</span>
          </button>
          <button
            onClick={() => setActiveTab('person')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 font-medium transition-all ${
              activeTab === 'person' ? 'bg-white dark:bg-neutral-700 shadow-sm text-apple-blue dark:text-apple-darkBlue' : 'text-neutral-500'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>人物を追加</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 font-medium transition-all ${
              activeTab === 'voice' ? 'bg-white dark:bg-neutral-700 shadow-sm text-apple-blue dark:text-apple-darkBlue' : 'text-neutral-500'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>音声メモ</span>
          </button>
        </div>

        {/* タブコンテンツ */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isSuccess && (
            <div className="p-3 bg-apple-green/10 dark:bg-apple-darkGreen/20 text-apple-green dark:text-apple-darkGreen rounded-xl text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>正常に登録が完了しました</span>
            </div>
          )}

          {/* 1. 予定貼り付け・直接登録 */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="text-xs text-neutral-500 leading-relaxed">
                LINEやメール等のZoom/Meet案内文を貼り付けると自動抽出されます。もちろん下の入力欄に直接入力して登録することも可能です。
              </div>

              {/* テキスト貼り付けエリア */}
              <div>
                <textarea
                  value={pasteText}
                  onChange={(e) => handleParse(e.target.value)}
                  placeholder="例: 山田さんと1to1です！&#10;日時: 11/15 14:00〜&#10;Zoom: https://us02web.zoom.us/j/81234567890?pwd=xxxx"
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                />

                {/* サンプル文面挿入ボタン */}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleParse("山田太郎さんと次回1to1です！\n日時: 11/15 14:00〜15:00\nZoom: https://us02web.zoom.us/j/81234567890?pwd=test123")}
                    className="text-[11px] text-apple-blue dark:text-apple-darkBlue hover:underline"
                  >
                    ＋山田さんのZoom文面例
                  </button>
                  <span className="text-neutral-300 dark:text-neutral-700">|</span>
                  <button
                    type="button"
                    onClick={() => handleParse("Google Meetでの打合せ\n日時: 11/20 10:00〜\nhttps://meet.google.com/abc-defg-hij")}
                    className="text-[11px] text-apple-blue dark:text-apple-darkBlue hover:underline"
                  >
                    ＋Google Meet文面例
                  </button>
                </div>
              </div>

              {/* 重複検知警告 */}
              {parsedResult?.is_duplicate && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>同一番号の既存会議を検知:</strong> すでに登録済みの予定が存在します。重複登録を防ぐため別会議か確認してください。
                  </div>
                </div>
              )}

              {/* 予定詳細・直接編集フォーム */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder space-y-3">
                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>登録内容</span>
                  {parsedResult && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue dark:text-apple-darkBlue font-medium">
                      テキストから自動抽出完了
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-neutral-500 mb-1">相手のお名前</label>
                    <input
                      type="text"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="例: 山田 太郎"
                      className="w-full p-2 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-500 mb-1">面談種別</label>
                    <select
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue"
                    >
                      <option value="1to1">BNI 1to1面談</option>
                      <option value="business_meeting">商談・打合せ</option>
                      <option value="internal_meeting">社内・チーム</option>
                      <option value="networking">交流会・イベント</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-neutral-500 mb-1">日時</label>
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-500 mb-1">開催ツール</label>
                    <select
                      value={meetingProvider}
                      onChange={(e) => setMeetingProvider(e.target.value as MeetingProvider)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue"
                    >
                      <option value="zoom">Zoom</option>
                      <option value="google_meet">Google Meet</option>
                      <option value="in_person">対面・リアル面談</option>
                      <option value="phone">電話</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1 text-xs">会議URL / 場所</label>
                  <input
                    type="text"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://us02web.zoom.us/j/... または場所"
                    className="w-full p-2 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-xs text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1 text-xs">予定タイトル（任意）</label>
                  <input
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder={participantName ? `${participantName}様と${meetingType === '1to1' ? '1to1面談' : '打合せ'}` : '面談予定'}
                    className="w-full p-2 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-xs text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateMeeting}
                  disabled={!participantName.trim() && !pasteText.trim() && !meetingTitle.trim()}
                  className="w-full py-3 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                >
                  予定を登録する
                </button>
              </div>
            </div>
          )}

          {/* 2. 名刺スキャン */}
          {activeTab === 'card' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">名刺の撮影・アップロード</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  片面または両面の名刺を撮影してください。文字だけを抽出し、原画像と並列で確認できます。
                </p>
              </div>

              <div className="p-4 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    store.simulateCardOCR('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600');
                    setIsSuccess(true);
                    setTimeout(() => {
                      setIsSuccess(false);
                      onRefresh();
                      onClose();
                    }, 1000);
                  }}
                  className="px-4 py-2 bg-apple-blue dark:bg-apple-darkBlue text-white rounded-xl text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  サンプル名刺（鈴木 一郎様）をスキャン模擬実行
                </button>
              </div>
            </div>
          )}

          {/* 3. 人物手動追加 */}
          {activeTab === 'person' && (
            <form onSubmit={handleCreatePerson} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">お名前 *</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="例: 佐藤 花子"
                  className="w-full p-2.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">ふりがな</label>
                <input
                  type="text"
                  value={phonetic}
                  onChange={(e) => setPhonetic(e.target.value)}
                  placeholder="例: さとう はなこ"
                  className="w-full p-2.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">会社名</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="例: 株式会社サンプル"
                  className="w-full p-2.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">区分タグ</label>
                <div className="flex space-x-2">
                  {(['BNI', '仕事', '友人'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        tag === t
                          ? 'bg-apple-blue/10 border-apple-blue text-apple-blue dark:text-apple-darkBlue'
                          : 'border-apple-border dark:border-apple-darkBorder text-neutral-500'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-sm mt-2"
              >
                人物カルテを作成
              </button>
            </form>
          )}

          {/* 4. 音声メモ */}
          {activeTab === 'voice' && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-apple-blue dark:text-apple-darkBlue">
                <Mic className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">対面面談後の音声メモ</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  「山田さんとランチ面談。来月カフェオープンの話で盛り上がった」など話しかけるだけで、事実を出典付きでカルテに記録します。
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  store.addFact({
                    person_id: 'p-yamada',
                    fact_category: 'topic',
                    fact_key: '音声メモによる記録',
                    fact_value: '町家カフェのオープン予定時期が来春に決定',
                    source_type: 'manual_edit',
                    source_evidence: '面談後の音声メモ入力',
                    confidence: 1.0,
                    verification_status: 'verified',
                    visibility: 'referral_eligible',
                    valid_from: new Date().toISOString(),
                  });
                  setIsSuccess(true);
                  setTimeout(() => {
                    setIsSuccess(false);
                    onRefresh();
                    onClose();
                  }, 1000);
                }}
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                テスト音声メモ（町家カフェ来春オープン）を記録
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
