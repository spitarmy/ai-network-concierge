import React, { useState } from 'react';
import {
  Calendar, Clock, Shield, AlertTriangle, Pin, PinOff,
  CheckCircle2, XCircle, Play, RotateCcw, Download, ExternalLink
} from 'lucide-react';
import { store } from '../services/store';
import { Meeting } from '../types';

interface MeetingsViewProps {
  onOpenQuickAdd?: () => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({ onOpenQuickAdd }) => {
  const [, setRefreshKey] = useState(0);
  const meetings = store.getMeetings();
  const recordings = store.getRecordings();

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

      <div className="space-y-6">
        {meetings.length === 0 ? (
          <div className="rounded-3xl p-12 bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-apple-blue/10 dark:bg-apple-darkBlue/20 text-apple-blue dark:text-apple-darkBlue flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">予定はまだ登録されていません</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                次回1to1や商談の予定を登録すると、相手カルテとの事前照合や録音同意管理の準備が自動的に行われます。
              </p>
            </div>
            {onOpenQuickAdd && (
              <button
                onClick={onOpenQuickAdd}
                className="px-5 py-2.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                ＋ 最初の予定を登録する
              </button>
            )}
          </div>
        ) : (
          meetings.map((m) => {
          const consents = store.getConsentsForMeeting(m.id);
          const recording = recordings.find(r => r.meeting_id === m.id);

          return (
            <div
              key={m.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm"
            >
              {/* 会議タイトル & プロバイダ */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-apple-border dark:border-apple-darkBorder">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-apple-blue/10 text-apple-blue flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">{m.title}</h3>
                    <div className="flex items-center space-x-2 text-xs text-neutral-400 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(m.scheduled_start_at).toLocaleString('ja-JP')}</span>
                      <span>•</span>
                      <span className="uppercase font-mono">{m.provider}</span>
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

                  {/* カレンダー連携ボタン群 */}
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
        }))}
      </div>
    </div>
  );
};
