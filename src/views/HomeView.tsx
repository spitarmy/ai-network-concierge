import React, { useState } from 'react';
import { Calendar, Clock, ArrowRight, Sparkles, AlertCircle, Share2, CheckCircle2, Mic, MessageSquare, ExternalLink, Check, RotateCw } from 'lucide-react';
import { store } from '../services/store';
import { Person, Fact } from '../types';
import { formatMeetingSchedule } from '../utils/date';
import { UserAvatar } from '../components/UserAvatar';
import { MeetingRecordingModal } from '../components/MeetingRecordingModal';

interface HomeViewProps {
  isSimpleMode: boolean;
  onSelectPerson: (personId: string) => void;
  onNavigate: (view: any) => void;
  onOpenQuickAdd: () => void;
  onOpenIdentify: (meetingId: string) => void;
  onOpenThankYou: (meetingId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  isSimpleMode,
  onSelectPerson,
  onNavigate,
  onOpenQuickAdd,
  onOpenIdentify,
  onOpenThankYou,
}) => {
  const [analyzeSuccess, setAnalyzeSuccess] = useState<string | null>(null);
  const [recordingMeetingId, setRecordingMeetingId] = useState<string | null>(null);

  const persons = store.getPersons();
  const realPersons = persons.filter(p => p.status !== 'provisional');
  const provisionalPersons = persons.filter(p => p.status === 'provisional');
  const meetings = store.getMeetings();
  const reviewQueue = store.getReviewQueue();
  const referrals = store.getReferrals();
  const allFacts = store.getAllFacts();
  const promiseFacts = allFacts.filter((f: Fact) => f.fact_category === 'promise');
  const [completedPromises, setCompletedPromises] = useState<Record<string, boolean>>({});

  const handleTogglePromise = (factId: string) => {
    setCompletedPromises(prev => ({ ...prev, [factId]: !prev[factId] }));
    store.togglePromiseCompleted(factId);
  };

  const handleCompleteMeeting = (meetingId: string) => {
    store.completeMeeting(meetingId);
    setAnalyzeSuccess('面談を「終了済み」に記録しました');
    setTimeout(() => setAnalyzeSuccess(null), 3500);
  };

  // 直近の予定（未完了の面談を最優先、なければ最新の面談）
  const upcomingMeeting = meetings.find(m => m.status !== 'completed' && new Date(m.scheduled_start_at).getTime() >= Date.now() - 3600 * 1000) || meetings[0];
  const latestCompletedMeeting = meetings
    .filter(m => m.status === 'completed' || m.recording_status === 'completed')
    .sort((a, b) => new Date(b.scheduled_start_at).getTime() - new Date(a.scheduled_start_at).getTime())[0];
  const upcomingParticipant: Person | undefined = upcomingMeeting && upcomingMeeting.participant_ids.length > 0
    ? store.getPersonById(upcomingMeeting.participant_ids[0])
    : undefined;
  const upcomingOrg = upcomingParticipant ? store.getOrgMembershipsForPerson(upcomingParticipant.id)[0] : undefined;

  // 参加者の前回話題・未完了約束を取得
  const participantFacts = upcomingParticipant ? store.getFactsForPerson(upcomingParticipant.id) : [];
  const pastTopic = participantFacts.find(f => f.fact_category === 'topic');
  const pendingPromise = participantFacts.find(f => f.fact_category === 'promise');
  const memberships = upcomingParticipant ? store.getBNIMembershipsForPerson(upcomingParticipant.id) : [];
  const currentChapter = memberships.find(m => m.status === 'active');

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn pb-24">
      {/* 最初の30秒体験: 直近面談ハイライトカード */}
      {upcomingMeeting ? (
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-apple-blue dark:text-apple-darkBlue uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>直近の面談・打合せ</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-apple-green/10 text-apple-green dark:text-apple-darkGreen font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>録音同意確認システム稼働中</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              {upcomingParticipant ? (
                <UserAvatar
                  name={upcomingParticipant.display_name}
                  avatarUrl={upcomingParticipant.avatar_url}
                  size="lg"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-apple-blue/10 dark:bg-apple-darkBlue/20 text-apple-blue dark:text-apple-darkBlue flex items-center justify-center font-bold text-xl border border-apple-border dark:border-apple-darkBorder">
                  <Calendar className="w-7 h-7" />
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {upcomingParticipant ? upcomingParticipant.display_name : upcomingMeeting.title}
                  </h2>
                  {upcomingParticipant?.phonetic_name && (
                    <span className="text-xs text-neutral-400 font-normal">
                      {upcomingParticipant.phonetic_name}
                    </span>
                  )}
                  {upcomingParticipant?.status === 'provisional' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
                      仮登録カルテ
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {(() => {
                    const sched = formatMeetingSchedule(upcomingMeeting.scheduled_start_at, upcomingMeeting.status, upcomingMeeting.recording_status);
                    return (
                      <>
                        <span className="text-xs sm:text-sm font-bold text-apple-blue dark:text-apple-darkBlue bg-apple-blue/10 dark:bg-apple-darkBlue/20 px-2.5 py-0.5 rounded-lg flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{sched.fullDateText} {sched.timeText}</span>
                        </span>
                        {sched.relativeBadge && (
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${sched.badgeColor}`}>
                            {sched.relativeBadge}
                          </span>
                        )}
                      </>
                    );
                  })()}
                  <span className="text-xs uppercase font-mono font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                    {upcomingMeeting.provider}
                  </span>
                  {upcomingOrg && (
                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      • {upcomingOrg.organization_name}{upcomingOrg.title ? `（${upcomingOrg.title}）` : ''}
                    </span>
                  )}
                  {currentChapter && (
                    <span className="text-xs text-neutral-400">
                      • {currentChapter.region_name}・{currentChapter.chapter_name}
                    </span>
                  )}
                  {upcomingParticipant && (
                    <span className="text-xs text-neutral-400">
                      • 通算{upcomingParticipant.meeting_count}回目の面談
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {upcomingMeeting.meeting_url && (
                <a
                  href={upcomingMeeting.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-medium transition-all shadow-sm"
                >
                  <span>会議を開く</span>
                </a>
              )}

              {/* 終了ステータス切替ボタン（開催中になりっぱなしを即座に防ぐ） */}
              {upcomingMeeting.status !== 'completed' && upcomingMeeting.recording_status !== 'completed' ? (
                <button
                  onClick={() => handleCompleteMeeting(upcomingMeeting.id)}
                  className="inline-flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-emerald-50 dark:bg-neutral-800 dark:hover:bg-emerald-950/30 text-neutral-600 hover:text-emerald-600 dark:text-neutral-300 dark:hover:text-emerald-400 text-xs font-medium transition-all shadow-sm border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                  title="面談が終了したらここをタップして終了状態に切り替えます"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>面談を終了済みにする</span>
                </button>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>終了済み</span>
                </span>
              )}

              {upcomingParticipant ? (
                <button
                  onClick={() => onSelectPerson(upcomingParticipant.id)}
                  className="inline-flex items-center justify-center space-x-1 px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow-sm"
                >
                  <span>カルテを開く</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('meetings')}
                  className="inline-flex items-center justify-center space-x-1 px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow-sm"
                >
                  <span>予定一覧を開く</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 録音解析成功トーストメッセージ */}
          {analyzeSuccess && (
            <div className="mt-4 p-3.5 bg-apple-green/10 text-apple-green border border-apple-green/20 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 animate-fadeIn">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{analyzeSuccess}</span>
              </div>
              <button
                onClick={() => onOpenThankYou(upcomingMeeting.id)}
                className="px-3 py-1.5 rounded-xl bg-apple-green text-white text-xs font-semibold hover:opacity-90 transition-opacity self-end sm:self-auto shrink-0 flex items-center space-x-1"
              >
                <MessageSquare className="w-3 h-3" />
                <span>お礼文・要約を確認して送る →</span>
              </button>
            </div>
          )}

          {/* AI録音・文字起こし解析バナー */}
          {upcomingMeeting.recording_status !== 'completed' ? (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 border border-purple-200/80 dark:border-purple-800/50 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
                      <span>🎙️ 面談終了後にAIが文字起こし・メモから自動解析</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                      Zoomの文字起こしや会話メモを貼り付けるだけで、相手のお話要約・約束事・お礼状をAIが自動作成します。
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => setRecordingMeetingId(upcomingMeeting.id)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>面談メモ・文字起こしをAI解析</span>
                  </button>
                </div>
              </div>

              {/* 手動入力したい場合の折りたたみリンク */}
              <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-500">
                <span>※お名前や会社名だけを事前に入力しておくことも可能です</span>
                <button
                  onClick={() => onOpenIdentify(upcomingMeeting.id)}
                  className="text-apple-blue dark:text-apple-darkBlue hover:underline font-medium"
                >
                  手動で本名・会社を入力する →
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
              <div className="flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-apple-green/15 text-apple-green flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-800 dark:text-neutral-100 flex items-center space-x-1.5">
                    <span>面談の解析・お礼文準備完了</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-apple-green/10 text-apple-green font-medium">
                      解析済み
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                    お相手のお話要約とお礼文が生成されました。内容の確認・微調整や、別メモでの再解析が可能です。
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => setRecordingMeetingId(upcomingMeeting.id)}
                  className="px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white/80 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-apple-blue dark:text-blue-300 text-xs font-medium transition-colors flex items-center space-x-1"
                  title="実際の文字起こしやメモを入力してカルテとお礼状を再作成"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>議事録・メモを再解析</span>
                </button>
                <button
                  onClick={() => onOpenThankYou(upcomingMeeting.id)}
                  className="px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>お礼文・相互要約を送る</span>
                </button>
              </div>
            </div>
          )}

          {/* 前回の文脈・約束（U03要件） */}
          <div className="mt-5 pt-4 border-t border-apple-border dark:border-apple-darkBorder grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder">
              <span className="text-neutral-400 font-medium block mb-1">前回盛り上がった話題</span>
              <p className="text-neutral-700 dark:text-neutral-200 line-clamp-2">
                {pastTopic?.fact_value || (upcomingParticipant ? '前回の記録はありません' : '会議終了後にAI文字起こしから話題が自動抽出されます')}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-amber-800 dark:text-amber-400 font-medium block mb-1">保留中の約束・フォロー</span>
              <p className="text-amber-900 dark:text-amber-200 font-medium line-clamp-2">
                {pendingPromise?.fact_value || (upcomingParticipant ? '保留中の約束はありません' : '「〜を紹介する」等の約束事が自動追跡されます')}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl p-8 bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-center space-y-3">
          <Calendar className="w-10 h-10 mx-auto text-neutral-400" />
          <h2 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">直近の予定はありません</h2>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            LINEやメールで届いたZoomのURLや案内文を貼り付けるか、「＋予定を登録する」から面談を登録しましょう。
          </p>
          <button
            onClick={onOpenQuickAdd}
            className="px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            ＋予定を登録する
          </button>
        </section>
      )}

      {/* 今後の予定がある時でも、直近に完了したZoom面談のAI要約・お礼状が埋もれないよう常時表示 */}
      {latestCompletedMeeting && upcomingMeeting && latestCompletedMeeting.id !== upcomingMeeting.id && (() => {
        const cp = latestCompletedMeeting.participant_ids[0]
          ? store.getPersonById(latestCompletedMeeting.participant_ids[0])
          : undefined;
        const cpOrg = cp ? store.getOrgMembershipsForPerson(cp.id)[0] : undefined;
        const tr = store.getTranscriptForMeeting(latestCompletedMeeting.id);
        return (
          <section className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-50/90 to-indigo-50/80 dark:from-blue-950/35 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                {cp && <UserAvatar name={cp.display_name} avatarUrl={cp.avatar_url} size="sm" />}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-apple-green/15 text-apple-green">
                      ✅ 直近完了したZoom面談・AI要約済み
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] mt-1">
                    {cp ? `${cp.display_name} 様` : latestCompletedMeeting.title}
                    {cpOrg ? `（${cpOrg.organization_name}）` : ''}
                  </h3>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                {cp && (
                  <button
                    onClick={() => onSelectPerson(cp.id)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50"
                  >
                    人物カルテ →
                  </button>
                )}
                <button
                  onClick={() => onOpenThankYou(latestCompletedMeeting.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-apple-blue text-white text-xs font-semibold hover:opacity-90 flex items-center space-x-1 shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>お礼文・相互要約を送る</span>
                </button>
              </div>
            </div>
            {tr?.summary && (
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-3">
                {tr.summary}
              </p>
            )}
          </section>
        );
      })()}

      {/* 保留中の約束・ToDo リマインダー (期限管理) */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                面談で決まった約束・次回ToDo（期限管理）
              </h3>
              <p className="text-[11px] text-neutral-500">
                1to1での口約束を忘れずに実行し、信頼を最大化します
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold">
            {promiseFacts.filter((p: Fact) => !completedPromises[p.id]).length} 件未完了
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {promiseFacts.slice(0, 6).map((f: Fact) => {
            const p = store.getPersonById(f.person_id);
            const isDone = completedPromises[f.id] || f.verification_status === 'reported';

            return (
              <div
                key={f.id}
                onClick={() => handleTogglePromise(f.id)}
                className={`p-3 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer select-none ${
                  isDone
                    ? 'bg-neutral-50/50 dark:bg-neutral-900/30 border-neutral-200/50 dark:border-neutral-800 opacity-60'
                    : 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/30 hover:bg-amber-50/60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-semibold ${isDone ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-100'}`}>
                      {f.fact_value}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1 text-[11px] text-neutral-400">
                    <span>相手: {p ? p.display_name : '面談相手'}</span>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">期日: 3日以内推奨</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 登録済み予定一覧カード (直近以外にも予定がある場合) */}
      {meetings.length > 1 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-apple-blue" />
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                面談予定一覧（直近・日時が近い順） ({meetings.length}件)
              </span>
            </div>
            <button
              onClick={() => onNavigate('meetings')}
              className="text-[11px] text-apple-blue dark:text-apple-darkBlue hover:underline font-medium"
            >
              すべての予定を管理 →
            </button>
          </div>
          <div className="space-y-2">
            {meetings.slice(1, 5).map(m => {
              const p = m.participant_ids[0] ? store.getPersonById(m.participant_ids[0]) : undefined;
              const sched = formatMeetingSchedule(m.scheduled_start_at);

              return (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-850/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('meetings')}>
                    <div className="w-9 h-9 rounded-xl bg-apple-blue/10 text-apple-blue flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {m.title}
                        </span>
                        {sched.relativeBadge && (
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${sched.badgeColor}`}>
                            {sched.relativeBadge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center space-x-2">
                        <span className="font-semibold text-apple-blue dark:text-apple-darkBlue">
                          📅 {sched.fullDateText} {sched.timeText}
                        </span>
                        <span>•</span>
                        <span>{p ? p.display_name : '相手未特定'}</span>
                        <span>•</span>
                        <span className="uppercase font-mono text-[10px] text-neutral-400">{m.provider}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                    {m.meeting_url && (
                      <a
                        href={m.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue dark:text-apple-darkBlue text-[11px] font-semibold transition-colors flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>会議を開く</span>
                      </a>
                    )}
                    <button
                      onClick={() => onNavigate('meetings')}
                      className="px-2.5 py-1 rounded-lg border border-apple-border dark:border-apple-darkBorder text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 text-[11px]"
                    >
                      詳細
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 確認待ちの注意喚起バナー */}
      {reviewQueue.length > 0 && (
        <div
          onClick={() => onNavigate('review-queue')}
          className="cursor-pointer p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-apple-amber dark:text-apple-darkAmber shrink-0" />
            <span>
              <strong>確認待ちが {reviewQueue.length} 件あります:</strong> 会話中に登場した人物や曖昧なOCRの確認が必要です。
            </span>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0 text-apple-amber dark:text-apple-darkAmber" />
        </div>
      )}

      {/* シンプルモード時はここまで、ダッシュボードモード時は追加ウィジェットを表示 */}
      {!isSimpleMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 先回りAI提案カード (07, U06) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <Sparkles className="w-4 h-4 text-apple-indigo" />
              <span>控えめな先回り提案（紹介の可能性）</span>
            </div>
            {referrals.length > 0 ? (
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder space-y-2 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-neutral-700 dark:text-neutral-300">
                    木村 尚史 様 ⇄ ZENNOBATE（勝賀野様）
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-indigo/10 text-apple-indigo font-semibold">
                    合致度高
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  木村様の「不用品回収」と、勝賀野様の「残置物撤去・リサイクルショップ」で、現場から出る回収品のリユース循環・相互送客の親和性が極めて高いです。
                </p>
                <button
                  onClick={() => onNavigate('referrals')}
                  className="inline-flex items-center space-x-1 text-apple-blue dark:text-apple-darkBlue hover:underline pt-1 text-[11px] font-medium"
                >
                  <Share2 className="w-3 h-3" />
                  <span>紹介文下書きを確認する</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">現在、新しい紹介候補はありません。</p>
            )}
          </div>

          {/* 最近更新された人物カード */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">実人脈カルテ</span>
              <button
                onClick={() => onNavigate('persons')}
                className="text-[11px] text-apple-blue dark:text-apple-darkBlue hover:underline"
              >
                実人脈を見る ({realPersons.length}名)
              </button>
            </div>
            <div className="space-y-2">
              {realPersons.slice(0, 3).map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelectPerson(p.id)}
                  className="cursor-pointer p-2.5 rounded-xl hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      name={p.display_name}
                      avatarUrl={p.avatar_url}
                      size="sm"
                    />
                    <div>
                      <div className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {p.display_name}
                      </div>
                      <span className="text-[10px] text-neutral-400">面談 {p.meeting_count}回</span>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400">→</span>
                </div>
              ))}
              {provisionalPersons.length > 0 && (
                <div className="pt-1.5 text-[10px] text-neutral-400 text-right">
                  ※ 会話登場の仮登録・言及: {provisionalPersons.length}名
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 面談録音・文字起こし・メモ解析モーダル */}
      <MeetingRecordingModal
        isOpen={!!recordingMeetingId}
        meetingId={recordingMeetingId}
        onClose={() => setRecordingMeetingId(null)}
        onSuccess={(mId) => {
          setAnalyzeSuccess('面談メモから要約とお礼状を生成しました！');
          onOpenThankYou(mId);
        }}
      />
    </div>
  );
};
