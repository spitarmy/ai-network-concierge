import React from 'react';
import { Calendar, Clock, ArrowRight, Sparkles, AlertCircle, Share2, CheckCircle2 } from 'lucide-react';
import { store } from '../services/store';
import { Person } from '../types';

interface HomeViewProps {
  isSimpleMode: boolean;
  onSelectPerson: (personId: string) => void;
  onNavigate: (view: any) => void;
  onOpenQuickAdd: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  isSimpleMode,
  onSelectPerson,
  onNavigate,
  onOpenQuickAdd,
}) => {
  const persons = store.getPersons();
  const meetings = store.getMeetings();
  const reviewQueue = store.getReviewQueue();
  const referrals = store.getReferrals();

  // 直近の予定（本日または直近の会議）
  const upcomingMeeting = meetings[0];
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
      {upcomingMeeting && upcomingParticipant ? (
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-apple-blue dark:text-apple-darkBlue uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>本日の直近 1to1 面談</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-apple-green/10 text-apple-green dark:text-apple-darkGreen font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>録音同意取得済み</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={upcomingParticipant.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={upcomingParticipant.display_name}
                className="w-14 h-14 rounded-2xl object-cover border border-apple-border dark:border-apple-darkBorder"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {upcomingParticipant.display_name}
                  </h2>
                  <span className="text-xs text-neutral-400 font-normal">
                    {upcomingParticipant.phonetic_name}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {currentChapter ? `${currentChapter.region_name}・${currentChapter.chapter_name}` : '所属登録中'} | 通算{upcomingParticipant.meeting_count}回目の面談
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectPerson(upcomingParticipant.id)}
              className="inline-flex items-center justify-center space-x-1 px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto shadow-sm"
            >
              <span>カルテを開く</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 前回の文脈・約束（U03要件） */}
          <div className="mt-5 pt-4 border-t border-apple-border dark:border-apple-darkBorder grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder">
              <span className="text-neutral-400 font-medium block mb-1">前回盛り上がった話題</span>
              <p className="text-neutral-700 dark:text-neutral-200 line-clamp-2">
                {pastTopic?.fact_value || '前回の記録はありません'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-amber-800 dark:text-amber-400 font-medium block mb-1">保留中の約束・フォロー</span>
              <p className="text-amber-900 dark:text-amber-200 font-medium line-clamp-2">
                {pendingPromise?.fact_value || '保留中の約束はありません'}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl p-8 bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-center space-y-3">
          <Calendar className="w-10 h-10 mx-auto text-neutral-400" />
          <h2 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">直近の予定はありません</h2>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            LINEやメールで届いたZoomのURLや案内文を貼り付けて、面談を登録しましょう。
          </p>
          <button
            onClick={onOpenQuickAdd}
            className="px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            ＋予定を登録する
          </button>
        </section>
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
