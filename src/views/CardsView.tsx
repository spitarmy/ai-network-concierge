import React, { useState } from 'react';
import { Camera, AlertCircle, ShieldCheck, Eye } from 'lucide-react';
import { store } from '../services/store';

export const CardsView: React.FC = () => {
  const [, setRefreshKey] = useState(0);
  const cardScans = store.getPersons().flatMap(() => {
    // スキャンカード全件取得
    return (store as any).state.cardScans;
  });

  const handleSimulateScan = () => {
    store.simulateCardOCR('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-24 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">名刺OCR・原画像対照管理</h1>
          <p className="text-xs text-neutral-500">
            原画像と抽出テキストを並列照合。Web検索結果の勝手な混入を完全遮断 (仕様08, CARD-01〜06)
          </p>
        </div>

        <button
          onClick={handleSimulateScan}
          className="px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center space-x-1.5 shadow-sm self-start sm:self-auto"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>新しい名刺をスキャン (模擬実行)</span>
        </button>
      </div>

      {/* スキャン済みカード一覧 */}
      <div className="space-y-6">
        {cardScans.map((cs: any) => (
          <div
            key={cs.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {cs.raw_extracted.person_name} 様の名刺
                </span>
                <span className="text-xs text-neutral-400">({cs.raw_extracted.company_name})</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                cs.status === 'completed'
                  ? 'bg-apple-green/10 text-apple-green'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {cs.status === 'completed' ? '確認済み' : '要確認項目あり (確認待ちキュー連携)'}
              </span>
            </div>

            {/* 原画とOCR抽出の並列対照エリア (CARD-01〜04) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 原画像 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-medium text-neutral-500">
                  <Eye className="w-3.5 h-3.5" />
                  <span>元スキャン原画</span>
                </div>
                <div className="h-56 rounded-2xl overflow-hidden border border-apple-border dark:border-apple-darkBorder bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <img
                    src={cs.image_url}
                    alt="名刺原画"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* 抽出テキスト（原画に忠実） */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-xs font-medium text-neutral-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-apple-green" />
                  <span>忠実OCR抽出（Web検索混入なし）</span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder space-y-2.5">
                  <div>
                    <span className="text-neutral-400 block text-[11px]">氏名・ふりがな</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {cs.raw_extracted.person_name} ({cs.raw_extracted.phonetic_name})
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[11px]">会社名・役職</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {cs.raw_extracted.company_name} | {cs.raw_extracted.title}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[11px]">連絡先</span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {cs.raw_extracted.phone_numbers?.join(' / ')} | {cs.raw_extracted.email}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[11px]">住所</span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      〒{cs.raw_extracted.postal_code} {cs.raw_extracted.address}
                    </span>
                  </div>

                  {/* 曖昧フィールドのハイライト */}
                  {cs.ambiguous_fields && cs.ambiguous_fields.length > 0 && (
                    <div className="pt-2 border-t border-apple-border dark:border-apple-darkBorder">
                      {cs.ambiguous_fields.map((af: any, idx: number) => (
                        <div key={idx} className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <strong>不鮮明項目 ({af.field_name}):</strong> 「{af.raw_detected_text}」
                            <p className="text-[11px] opacity-80">{af.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
