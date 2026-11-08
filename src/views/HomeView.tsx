import React, { useState } from 'react';
import { Calendar, Clock, ArrowRight, Sparkles, AlertCircle, Share2, CheckCircle2, Mic, MessageSquare, ExternalLink } from 'lucide-react';
import { store } from '../services/store';
import { Person } from '../types';
import { formatMeetingSchedule } from '../utils/date';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeSuccess, setAnalyzeSuccess] = useState<string | null>(null);

  const persons = store.getPersons();
  const meetings = store.getMeetings();
  const reviewQueue = store.getReviewQueue();
  const referrals = store.getReferrals();

  const handleRunAutoTranscript = (meetingId: string) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      store.processMeetingRecordingAndAutoRegister(meetingId);
      setIsAnalyzing(false);
      setAnalyzeSuccess('🎙️ 録音から高橋 誠治様のカルテ・会社・BNI所属・話題・約束をすべて自動生成しました！');
      setTimeout(() => setAnalyzeSuccess(null), 6000);
    }, 900);
  };

  // 直近の予定（本日以降、または直近の会議）
  const upcomingMeeting = meetings.find(m => new Date(m.scheduled_start_at).getTime() >= Date.now() - 3600 * 1000 * 2) || meetings[0];
  const upcomingParticipant: Person | undefined = upcomingMeeting && upcomingMeeting.participant_ids.length > 0
    ? store.getPersonById(upcomingMeeting.participant_ids[0])
    : undefined;

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
                <img
                  src={upcomingParticipant.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={upcomingParticipant.display_name}
                  className="w-14 h-14 rounded-2xl object-cover border border-apple-border dark:border-apple-darkBorder"
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
                    const sched = formatMeetingSchedule(upcomingMeeting.scheduled_start_at);
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

            <div className="flex items-center space-x-2 self-start sm:self-auto">
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

          {/* AI録音事後自動登録バナー（本命のコア体験） */}
          {upcomingMeeting.recording_status !== 'completed' ? (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 border border-purple-200/80 dark:border-purple-800/50 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
                      <span>🎙️ 面談終了後にAIが録音から自動登録</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-normal">
                        推奨・全自動
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                      事前入力は不要です。Zoom終了後に録音から相手の本名・会社名・BNI所属・話題・次回約束をAIがすべて自動登録します。
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => handleRunAutoTranscript(upcomingMeeting.id)}
                    disabled={isAnalyzing}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAnalyzing ? '録音解析・カルテ生成中...' : '録音をAI解析して自動登録（実演）'}</span>
                  </button>
                </div>
              </div>

              {/* 手動入力したい場合の折りたたみリンク */}
              <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-500">
                <span>※事前に分かっている情報があれば手動入力も可能です</span>
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
                    <span>面談の録音解析・カルテ生成完了</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-apple-green/10 text-apple-green font-medium">
                      解析済み
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                    相手のお話要約と相互の約束事がまとまりました。相手にお礼文と相互確認メッセージを手動送信できます。
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
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
                    山田 太郎様 ⇄ 佐藤 由香様
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-indigo/10 text-apple-indigo font-semibold">
                    合致度高
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  山田さんが求めている「町家カフェの店舗看板・ロゴデザイン」に、佐藤さんの実績が完全に合致しています。
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
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">登録済み人脈</span>
              <button
                onClick={() => onNavigate('persons')}
                className="text-[11px] text-apple-blue dark:text-apple-darkBlue hover:underline"
              >
                全員見る ({persons.length}名)
              </button>
            </div>
            <div className="space-y-2">
              {persons.slice(0, 3).map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelectPerson(p.id)}
                  className="cursor-pointer p-2.5 rounded-xl hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt=""
                      className="w-8 h-8 rounded-xl object-cover"
                    />
                    <div>
                      <div className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
                        <span>{p.display_name}</span>
                        {p.status === 'provisional' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-500">仮</span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400">面談 {p.meeting_count}回</span>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400">→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
