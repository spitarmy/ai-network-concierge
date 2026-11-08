import React, { useState } from 'react';
import { X, Calendar, Camera, UserPlus, Mic, AlertCircle, CheckCircle2, Sparkles, Check, Plus } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'paste' | 'voice' | 'card' | 'person'>('paste');

  // 予定貼り付け・入力状態
  const [pasteText, setPasteText] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [transcriptInput, setTranscriptInput] = useState('');
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
  const [selectedTags, setSelectedTags] = useState<string[]>(['一般社団法人stone']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isAddingTagInput, setIsAddingTagInput] = useState(false);

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
      category_tags: selectedTags.length > 0 ? selectedTags : ['一般社団法人stone'],
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
      setSelectedTags(['一般社団法人stone']);
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
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 font-medium transition-all ${
              activeTab === 'voice' ? 'bg-white dark:bg-neutral-700 shadow-sm text-purple-600 dark:text-purple-400 font-bold' : 'text-neutral-500'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>録音から登録</span>
          </button>
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
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                <strong>💡 Zoom前は情報がなくて当然です:</strong> LINEでZoomリンクや日程だけ届いた段階でサクッと登録できます。最初はLINE表示名（ken、たろう等）や空欄でOK。Zoom中に自己紹介や名刺交換をした段階で、1タップで本名カルテへ確定できます。
              </div>

              {/* テキスト貼り付けエリア */}
              <div>
                <textarea
                  value={pasteText}
                  onChange={(e) => handleParse(e.target.value)}
                  placeholder="例: LINEで送られてきたZoomのURLや日時をそのまま貼り付け&#10;https://us02web.zoom.us/j/81234567890?pwd=xxxx"
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                />

                {/* サンプル文面挿入ボタン */}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleParse("https://us02web.zoom.us/j/81234567890?pwd=test123\n11/15 14:00〜")}
                    className="text-[11px] text-apple-blue dark:text-apple-darkBlue hover:underline"
                  >
                    ＋Zoom URLのみ（相手未特定）
                  </button>
                  <span className="text-neutral-300 dark:text-neutral-700">|</span>
                  <button
                    type="button"
                    onClick={() => handleParse("山田太郎さんと次回1to1です！\n日時: 11/15 14:00〜15:00\nZoom: https://us02web.zoom.us/j/81234567890?pwd=test123")}
                    className="text-[11px] text-apple-blue dark:text-apple-darkBlue hover:underline"
                  >
                    ＋名前入りZoom文面例
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
                    <label className="block text-neutral-500 mb-1">
                      相手のお名前（LINE名・仮名でOK / 空欄可）
                    </label>
                    <input
                      type="text"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="例: LINE名「ken」や「たろう」"
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
                  disabled={!participantName.trim() && !pasteText.trim() && !meetingTitle.trim() && !meetingUrl.trim()}
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
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  所属カテゴリー（手動選択・複数可）
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {store.getCategories().map(cat => {
                    const isSelected = selectedTags.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTags(selectedTags.filter(t => t !== cat));
                          } else {
                            setSelectedTags([...selectedTags, cat]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-apple-blue text-white border-apple-blue shadow-sm'
                            : 'bg-neutral-100/80 dark:bg-neutral-800/80 border-apple-border dark:border-apple-darkBorder text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>

                {isAddingTagInput ? (
                  <div className="flex items-center space-x-1 mt-1">
                    <input
                      type="text"
                      placeholder="新カテゴリー名 (例: 幹部)"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      className="flex-1 p-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-apple-blue"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = customTagInput.trim();
                        if (trimmed) {
                          store.addCategory(trimmed);
                          if (!selectedTags.includes(trimmed)) {
                            setSelectedTags([...selectedTags, trimmed]);
                          }
                          setCustomTagInput('');
                          setIsAddingTagInput(false);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-apple-blue text-white text-xs rounded-lg font-medium"
                    >
                      追加
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingTagInput(false)}
                      className="text-xs text-neutral-400 px-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTagInput(true)}
                    className="text-xs text-apple-blue hover:underline flex items-center space-x-0.5 mt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>新カテゴリーを作成して追加</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-sm mt-2"
              >
                人物カルテを作成
              </button>
            </form>
          )}

          {/* 録音・文字起こしから事後AI一括自動登録 */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                <strong>🎙️ 事前入力は不要です（事後全自動）:</strong>
                <p className="mt-1">
                  面談後にZoomの録音や文字起こし、音声メモを渡すだけで、相手の本名・会社名・BNI所属・事業内容・話題・次回約束をAIがすべて自動抽出してカルテを作成します。
                </p>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1 text-xs font-medium">
                  文字起こしテキスト または 面談メモ
                </label>
                <textarea
                  value={transcriptInput}
                  onChange={(e) => setTranscriptInput(e.target.value)}
                  placeholder="Zoomの文字起こしや面談メモを貼り付けてください。下のボタンから自己紹介の実演サンプルを一発挿入できます。"
                  rows={6}
                  className="w-full p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-apple-border dark:border-apple-darkBorder text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTranscriptInput(`高橋: はじめまして！本日は面談のお時間ありがとうございます。株式会社タカハシ看板デザイン 代表取締役の高橋誠治です。
自分: はじめまして、よろしくお願いします！
高橋: 私はBNI京都南チャプターに所属しておりまして、カテゴリーは屋外広告・看板施工です。最近は新規出店される町家カフェやクリニックのLED電飾看板を多く手掛けています。
自分: 素晴らしいですね！どんな方をご紹介すると喜ばれますか？
高橋: これから京都市内で新規開業やリニューアルオープンを控えている飲食店オーナー様がいらっしゃれば是非ご紹介いただきたいです。
自分: わかりました。来週、心当たりのカフェオーナーの佐藤さんに声をかけてみますね。
高橋: 本当にありがとうございます！次回までに当社の施工実績カタログと事例集をお送りしますね。`)}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>＋高橋様の自己紹介・看板業・約束サンプル文面を挿入</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  store.autoRegisterFromPostMeetingTranscript(transcriptInput);
                  setIsSuccess(true);
                  setTimeout(() => {
                    setIsSuccess(false);
                    setTranscriptInput('');
                    onRefresh();
                    onClose();
                  }, 800);
                }}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>AIで面談と相手カルテを一括自動生成</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
