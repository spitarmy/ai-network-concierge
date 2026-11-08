import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import { store } from '../services/store';

interface ReviewQueueViewProps {
  onRefresh: () => void;
  onSelectPerson: (personId: string) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({ onRefresh, onSelectPerson }) => {
  const [, setRefreshKey] = useState(0);
  const queueItems = store.getReviewQueue();

  const handleResolve = (id: string, action: 'resolve' | 'dismiss') => {
    store.resolveReviewQueueItem(id, action);
    setRefreshKey(prev => prev + 1);
    onRefresh();
  };

  const handleConvertProvisional = (item: any) => {
    // 仮カルテを正式な実人脈に昇格 (PERSON-08)
    const person = store.getPersonById(item.target_id);
    if (person) {
      store.updatePerson(person.id, {
        status: 'active',
        display_name: '中村 浩一（正式登録）',
        category_tags: ['仕事', 'パートナー'],
      });
      store.resolveReviewQueueItem(item.id, 'resolve');
      onRefresh();
      onSelectPerson(person.id);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-24 animate-fadeIn">
      <div>
        <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">確認待ちキュー (Review Queue)</h1>
        <p className="text-xs text-neutral-500">
          確証のない発言者、不鮮明な名刺文字、会話内に登場した未登録人物を保留・確認 (仕様06, 21, 25)
        </p>
      </div>

      <div className="space-y-4">
        {queueItems.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-amber-200 dark:border-amber-900/50 space-y-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-apple-amber dark:text-apple-darkAmber flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">{item.title}</h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium shrink-0">
                {item.queue_type === 'unregistered_person' ? '会話内未登録人物' : 'OCR不鮮明'}
              </span>
            </div>

            {/* アクションボタングループ */}
            <div className="pt-3 border-t border-apple-border dark:border-apple-darkBorder flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-neutral-400 text-[11px]">
                登録日時: {new Date(item.created_at).toLocaleString('ja-JP')}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleResolve(item.id, 'dismiss')}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-500 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  無視・破棄
                </button>

                {item.queue_type === 'unregistered_person' ? (
                  <button
                    onClick={() => handleConvertProvisional(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium hover:opacity-90 transition-opacity flex items-center space-x-1 shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>実人脈として正式登録する</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleResolve(item.id, 'resolve')}
                    className="px-3.5 py-1.5 rounded-xl bg-apple-green text-white font-medium hover:opacity-90 transition-opacity flex items-center space-x-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>確認完了として承認</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {queueItems.length === 0 && (
          <div className="p-12 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 mx-auto text-apple-green" />
            <h3 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
              すべての確認待ちが完了しています
            </h3>
            <p className="text-xs text-neutral-500">
              会話内の曖昧な発言や不鮮明なOCR結果はすべて解決済みです。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
