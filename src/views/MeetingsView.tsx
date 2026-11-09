import React, { useState } from 'react';
import {
  Calendar, Clock, Shield, AlertTriangle, Pin, PinOff,
  CheckCircle2, XCircle, Play, RotateCcw, Download, ExternalLink,
  MessageSquare, Bot, Edit3, Trash2, X
} from 'lucide-react';
import { store } from '../services/store';
import { Meeting } from '../types';
import { formatMeetingSchedule } from '../utils/date';
import { MeetingRecordingModal } from '../components/MeetingRecordingModal';

interface MeetingsViewProps {
  onOpenQuickAdd?: () => void;
  onOpenIdentify?: (meetingId: string) => void;
  onOpenThankYou?: (meetingId: string) => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  onOpenQuickAdd,
  onOpenIdentify,
  onOpenThankYou,
}) => {
  const [, setRefreshKey] = useState(0);
  const [tabFilter, setTabFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming');

  // 予定編集モーダル状態
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartAt, setEditStartAt] = useState('');
  const [editUrl, setEditUrl] = useState('');

  // 録音・文字起こし解析モーダル状態
  const [recordingMeetingId, setRecordingMeetingId] = useState<string | null>(null);

  const meetings = store.getMeetings();
  const recordings = store.getRecordings();

  const handleOpenEditMeeting = (m: Meeting) => {
    setEditingMeeting(m);
    setEditTitle(m.title);
    const d = new Date(m.scheduled_start_at);
    const pad = (n: number) => String(n).padStart(2, '0');
    setEditStartAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    setEditUrl(m.meeting_url || '');
  };

  const handleSaveMeetingEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting) return;
    store.updateMeeting(editingMeeting.id, {
      title: editTitle,
      scheduled_start_at: new Date(editStartAt).toISOString(),
      meeting_url: editUrl.trim() || undefined,
    });
    setEditingMeeting(null);
    setRefreshKey(k => k + 1);
  };

  const handleDeleteMeeting = (meetingId: string) => {
    if (confirm('この面談予定を削除しますか？')) {
      store.deleteMeeting(meetingId);
      if (editingMeeting?.id === meetingId) {
        setEditingMeeting(null);
      }
      setRefreshKey(k => k + 1);
    }
  };

  const setPresetEditSchedule = (daysOffset: number, hour: number, minute: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    setEditStartAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  const handleUpdateConsent = (consentId: string, status: 'granted' | 'rejected' | 'revoked') => {
    store.updateConsentStatus(consentId, status);
    setRefreshKey(prev => prev + 1);
  };

  const handleTogglePin = (recId: string) => {
    store.togglePinRecording(recId);
    setRefreshKey(prev => prev + 1);
  };

  const handleRunPurge = () => {
    const purged = store.run90DayPurgeJob();
    alert(`90日期限チェックジョブ実行完了: 期限切れの録音 ${purged}件 を自動完全抹消しました。`);
    setRefreshKey(prev => prev + 1);
  };

  const handleDownloadICS = (m: Meeting) => {
    const startDate = new Date(m.scheduled_start_at);
    const endDate = m.scheduled_end_at ? new Date(m.scheduled_end_at) : new Date(startDate.getTime() + 3600 * 1000);
    const formatICS = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AI Network Concierge//JP',
      'BEGIN:VEVENT',
      `SUMMARY:${m.title}`,
      `DESCRIPTION:${m.meeting_url || ''}`,
      `DTSTART:${formatICS(startDate)}`,
      `DTEND:${formatICS(endDate)}`,
      `LOCATION:${m.meeting_url || 'Online'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${m.title}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGoogleCalendarUrl = (m: Meeting) => {
    const startDate = new Date(m.scheduled_start_at);
    const endDate = m.scheduled_end_at ? new Date(m.scheduled_end_at) : new Date(startDate.getTime() + 3600 * 1000);
    const formatICS = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(m.title)}&dates=${formatICS(startDate)}/${formatICS(endDate)}&details=${encodeURIComponent(m.meeting_url || '')}&location=${encodeURIComponent(m.meeting_url || '')}`;
  };

  const upcomingMeetings = meetings.filter(m => formatMeetingSchedule(m.scheduled_start_at).isUpcoming);
  const pastMeetings = meetings.filter(m => formatMeetingSchedule(m.scheduled_start_at).isPast);
  const activeTab = (tabFilter === 'upcoming' && upcomingMeetings.length === 0 && meetings.length > 0)
    ? 'all'
    : tabFilter;
  const displayMeetings = activeTab === 'upcoming'
    ? upcomingMeetings
    : activeTab === 'past'
    ? pastMeetings
    : meetings;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-24 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">予定・会話・同意管理</h1>
          <p className="text-xs text-neutral-500">
            会議単位の同意ステートマシン、音声90日自動破棄、文字起こし (仕様05, 26, MEET-07〜10)
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {onOpenQuickAdd && (
            <button
              onClick={onOpenQuickAdd}
              className="px-3.5 py-1.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center space-x-1.5"
            >
              <span>＋ 予定を登録</span>
            </button>
          )}
          <button
            onClick={handleRunPurge}
            className="px-3.5 py-1.5 rounded-xl border border-apple-border dark:border-apple-darkBorder text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>90日自動破棄ジョブ</span>
          </button>
        </div>
      </div>

      {/* 絞り込みタブ */}
      {meetings.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setTabFilter('upcoming')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'upcoming'
                ? 'bg-apple-blue dark:bg-apple-darkBlue text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>直近・今後の予定 ({upcomingMeetings.length}件)</span>
          </button>
          <button
            onClick={() => setTabFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-apple-blue dark:bg-apple-darkBlue text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <span>すべて ({meetings.length}件)</span>
          </button>
          <button
            onClick={() => setTabFilter('past')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'past'
                ? 'bg-apple-blue dark:bg-apple-darkBlue text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <span>過去・完了した面談 ({pastMeetings.length}件)</span>
          </button>
        </div>
      )}

      <div className="space-y-6">
        {displayMeetings.length === 0 ? (
          <div className="rounded-3xl p-12 bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-apple-blue/10 dark:bg-apple-darkBlue/20 text-apple-blue dark:text-apple-darkBlue flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {tabFilter === 'upcoming' ? '直近・今後の予定はありません' : '該当する面談予定はありません'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                {tabFilter === 'upcoming'
                  ? '「すべて」タブで過去の面談を確認するか、「＋ 予定を登録」から新しい面談日時を登録してください。'
                  : '次回1to1や商談の予定を登録すると、相手カルテとの事前照合や録音同意管理の準備が自動的に行われます。'}
              </p>
            </div>
            {onOpenQuickAdd && (
              <button
                onClick={onOpenQuickAdd}
                className="px-5 py-2.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                ＋ 予定を登録する
              </button>
            )}
          </div>
        ) : (
          displayMeetings.map((m) => {
          const consents = store.getConsentsForMeeting(m.id);
          const recording = recordings.find(r => r.meeting_id === m.id);
          const sched = formatMeetingSchedule(m.scheduled_start_at);

          return (
            <div
              key={m.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm"
            >
              {/* 開催日時バナー（何日何時からか一目でわかる特大表示） */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-apple-blue/10 dark:bg-apple-darkBlue/20 text-apple-blue dark:text-apple-darkBlue flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base sm:text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
                        {sched.fullDateText} {sched.timeText}
                      </span>
                      {sched.relativeBadge && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${sched.badgeColor}`}>
                          {sched.relativeBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5 flex items-center space-x-2">
                      <span className="uppercase font-mono font-bold text-apple-blue dark:text-apple-darkBlue">{m.provider}</span>
                      <span>•</span>
                      <span>{m.meeting_type === '1to1' ? 'BNI 1to1面談' : '商談・オンライン面談'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {m.meeting_url && (
                    <a
                      href={m.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center space-x-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>会議を開く</span>
                    </a>
                  )}
                  <button
                    onClick={() => handleOpenEditMeeting(m)}
                    className="px-3 py-1.5 rounded-xl border border-apple-border dark:border-apple-darkBorder text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors flex items-center space-x-1"
                    title="日時やURLを変更"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>日時を変更</span>
                  </button>
                  <button
                    onClick={() => handleDeleteMeeting(m.id)}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="この予定を削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 会議タイトル & ステータス */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-apple-border dark:border-apple-darkBorder">
                <div className="flex items-center space-x-2.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">{m.title}</h3>
                      {m.recording_status !== 'completed' && (
                        <button
                          onClick={() => setRecordingMeetingId(m.id)}
                          className="px-2.5 py-0.5 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[11px] font-semibold transition-colors flex items-center space-x-1"
                          title="面談後の録音や文字起こし・メモから相手本名・会社・話題・約束をAIが自動解析"
                        >
                          <span>🎙️ 録音・文字起こし解析</span>
                        </button>
                      )}
                      {onOpenIdentify && (
                        <button
                          onClick={() => onOpenIdentify(m.id)}
                          className="px-2 py-0.5 rounded-lg bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue dark:text-apple-darkBlue text-[11px] font-medium transition-colors flex items-center space-x-1"
                          title="手動で本名・所属を確定"
                        >
                          <span>手動入力</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 録音ステータスバッジ */}
                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                    m.recording_status === 'consent_obtained'
                      ? 'bg-apple-green/10 text-apple-green'
                      : m.recording_status === 'refused'
                      ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                      : m.recording_status === 'completed'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  }`}>
                    {m.recording_status === 'consent_obtained' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {m.recording_status === 'refused' && <XCircle className="w-3.5 h-3.5" />}
                    {m.recording_status === 'awaiting_consent' && <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>
                      {m.recording_status === 'consent_obtained' ? '全参加者の同意確認済み (収録可)' :
                       m.recording_status === 'refused' ? '同意拒否あり (録音完全遮断)' :
                       m.recording_status === 'completed' ? '面談完了・解析済み' : '同意確認待ち'}
                    </span>
                  </span>

                  {/* お礼文送信 & ボット派遣 & カレンダー連携ボタン群 */}
                  {m.recording_status === 'completed' && onOpenThankYou && (
                    <button
                      onClick={() => onOpenThankYou(m.id)}
                      className="px-2.5 py-1 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>お礼文・要約</span>
                    </button>
                  )}

                  {m.recording_status !== 'completed' && (
                    <button
                      onClick={() => {
                        alert('【Zoomボット派遣予約完了】\n面談時刻に「AI人脈コンシェルジュ 記録員」が待機室へ自動入室します。ホストが入室を許可すると録音・文字起こしを開始します。');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center space-x-1"
                      title="面談時刻にAIボットを待機室へ自動派遣"
                    >
                      <Bot className="w-3 h-3" />
                      <span>ボット派遣予約</span>
                    </button>
                  )}

                  <a
                    href={getGoogleCalendarUrl(m)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center space-x-1"
                  >
                    <span>Googleカレンダー</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => handleDownloadICS(m)}
                    title="iCalendar形式 (.ics) をダウンロード"
                    className="px-2.5 py-1 rounded-xl border border-apple-border dark:border-apple-darkBorder hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>.ics</span>
                  </button>
                </div>
              </div>

              {/* 同意管理ステートマシン実演エリア */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-apple-border dark:border-apple-darkBorder space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-apple-blue" />
                    <span>参加者ごとの録音同意ステートマシン (MEET-07〜10)</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-normal">流用禁止・会議単位で管理</span>
                </div>

                <div className="space-y-2">
                  {consents.map(c => (
                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder gap-2 text-xs">
                      <div>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{c.person_name}</span>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          状態: <strong className={
                            c.status === 'granted' ? 'text-apple-green' :
                            c.status === 'rejected' ? 'text-red-500' :
                            c.status === 'revoked' ? 'text-red-500' : 'text-amber-500'
                          }>{c.status}</strong> | 取得方法: {c.consent_method}
                        </div>
                      </div>

                      {/* ステータス切替ボタン（実証用） */}
                      <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                        <button
                          onClick={() => handleUpdateConsent(c.id, 'granted')}
                          className="px-2 py-1 rounded bg-apple-green/10 text-apple-green text-[11px] font-medium hover:bg-apple-green/20"
                        >
                          承諾に変更
                        </button>
                        <button
                          onClick={() => handleUpdateConsent(c.id, 'rejected')}
                          className="px-2 py-1 rounded bg-red-100 text-red-600 text-[11px] font-medium hover:bg-red-200"
                        >
                          拒否（遮断）
                        </button>
                        <button
                          onClick={() => handleUpdateConsent(c.id, 'revoked')}
                          className="px-2 py-1 rounded bg-neutral-200 text-neutral-700 text-[11px] font-medium hover:bg-neutral-300"
                        >
                          撤回（抹消）
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 録音保持期間 (90日破棄 & ピン留め) */}
              {recording && (
                <div className="p-3.5 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4 text-apple-blue" />
                    <div>
                      <div className="font-medium text-neutral-800 dark:text-neutral-200">
                        録音ファイル (57分 / 42.5MB)
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        自動破棄予定: {new Date(recording.expires_at).toLocaleDateString('ja-JP')}
                        {recording.is_pinned_permanently && ' (恒久保持中)'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTogglePin(recording.id)}
                    className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center space-x-1 border transition-all ${
                      recording.is_pinned_permanently
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'border-apple-border dark:border-apple-darkBorder text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {recording.is_pinned_permanently ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                    <span>{recording.is_pinned_permanently ? '恒久保持中' : '90日後削除'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
      </div>

      {/* 面談予定・日時変更モーダル */}
      {editingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSaveMeetingEdit} className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl border border-apple-border dark:border-apple-darkBorder p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
              <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-apple-blue" />
                <span>面談日時・予定内容の変更</span>
              </h3>
              <button type="button" onClick={() => setEditingMeeting(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-500 font-semibold mb-1">予定タイトル *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-500 font-semibold flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-apple-blue" />
                    <span>開催日時（何日何時から） *</span>
                  </label>
                  {editStartAt && (
                    <span className="text-[11px] font-bold text-apple-blue dark:text-apple-darkBlue">
                      {formatMeetingSchedule(new Date(editStartAt).toISOString()).fullDateText} {formatMeetingSchedule(new Date(editStartAt).toISOString()).timeText}
                    </span>
                  )}
                </div>

                <input
                  type="datetime-local"
                  required
                  value={editStartAt}
                  onChange={(e) => setEditStartAt(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-apple-blue mb-2"
                />

                {/* クイック選択プリセット */}
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPresetEditSchedule(0, 15, 0)}
                    className="px-2 py-1 rounded-lg text-[10px] bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium"
                  >
                    今日 15:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetEditSchedule(0, 19, 0)}
                    className="px-2 py-1 rounded-lg text-[10px] bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium"
                  >
                    今日 19:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetEditSchedule(1, 10, 0)}
                    className="px-2 py-1 rounded-lg text-[10px] bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue font-bold"
                  >
                    明日 10:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetEditSchedule(1, 14, 0)}
                    className="px-2 py-1 rounded-lg text-[10px] bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue font-bold"
                  >
                    明日 14:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetEditSchedule(1, 21, 30)}
                    className="px-2 py-1 rounded-lg text-[10px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold"
                  >
                    明日 21:30
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetEditSchedule(2, 14, 0)}
                    className="px-2 py-1 rounded-lg text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 font-semibold"
                  >
                    明後日 14:00
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 font-semibold mb-1">Zoom / Google Meet URL</label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://us02web.zoom.us/j/..."
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-apple-blue"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-apple-border dark:border-apple-darkBorder">
              <button
                type="button"
                onClick={() => handleDeleteMeeting(editingMeeting.id)}
                className="px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>この予定を削除</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingMeeting(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-apple-blue text-white text-xs font-semibold shadow-sm hover:opacity-90"
                >
                  変更を保存
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {/* 録音・文字起こし解析モーダル */}
      <MeetingRecordingModal
        isOpen={!!recordingMeetingId}
        meetingId={recordingMeetingId}
        onClose={() => setRecordingMeetingId(null)}
        onSuccess={(mId) => {
          setRefreshKey(k => k + 1);
          if (onOpenThankYou) {
            onOpenThankYou(mId);
          }
        }}
      />
    </div>
  );
};
