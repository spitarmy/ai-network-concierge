import React, { useState } from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';
import { store } from '../services/store';

interface BNIViewProps {
  onSelectPerson: (personId: string) => void;
  onRefresh?: () => void;
}

export const BNIView: React.FC<BNIViewProps> = ({ onSelectPerson }) => {
  const regions = store.getBNIRegions();
  const chapters = store.getBNIChapters();

  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('京都府');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('reg-kyoto');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('chap-kyoto-e');

  const prefectures = Array.from(new Set(regions.map(r => r.prefecture)));
  const filteredRegions = regions.filter(r => r.prefecture === selectedPrefecture);
  const filteredChapters = chapters.filter(c => c.region_id === selectedRegionId);
  const currentChapter = chapters.find(c => c.id === selectedChapterId);

  // 当該チャプターのメンバー（現役 & 移籍）
  const allMemberships = store.getPersons().flatMap(p => {
    return store.getBNIMembershipsForPerson(p.id).map(m => ({ person: p, membership: m }));
  });
  const chapterMembers = allMemberships.filter(item => item.membership.chapter_id === selectedChapterId);

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-24 animate-fadeIn">
      <div>
        <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">BNI全国マスター・チャプター検索</h1>
        <p className="text-xs text-neutral-500">
          都道府県・リージョン・チャプターの複数軸で面談済みメンバーを把握 (仕様11, U04)
        </p>
      </div>

      {/* 都道府県・リージョン選択 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block mb-1 font-medium text-neutral-500">1. 都道府県</label>
          <select
            value={selectedPrefecture}
            onChange={(e) => {
              setSelectedPrefecture(e.target.value);
              const nextReg = regions.find(r => r.prefecture === e.target.value);
              if (nextReg) {
                setSelectedRegionId(nextReg.id);
                const nextChap = chapters.find(c => c.region_id === nextReg.id);
                if (nextChap) setSelectedChapterId(nextChap.id);
              }
            }}
            className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder"
          >
            {prefectures.map(pref => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium text-neutral-500">2. リージョン</label>
          <select
            value={selectedRegionId}
            onChange={(e) => {
              setSelectedRegionId(e.target.value);
              const nextChap = chapters.find(c => c.region_id === e.target.value);
              if (nextChap) setSelectedChapterId(nextChap.id);
            }}
            className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder"
          >
            {filteredRegions.map(reg => (
              <option key={reg.id} value={reg.id}>{reg.region_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium text-neutral-500">3. チャプター</label>
          <select
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder"
          >
            {filteredChapters.map(chap => (
              <option key={chap.id} value={chap.id}>{chap.chapter_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* チャプター詳細 & メンバー一覧 */}
      {currentChapter && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-apple-blue" />
                <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{currentChapter.chapter_name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-apple-green/10 text-apple-green flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>公式検証済み</span>
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                定例会: 毎週 {currentChapter.meeting_day} {currentChapter.meeting_time} | 登録面談済みメンバー: {chapterMembers.length}名
              </p>
            </div>
          </div>

          {/* メンバーリスト */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              このチャプターの登録メンバー ({chapterMembers.length}名)
            </h3>

            {chapterMembers.map(({ person, membership }) => (
              <div
                key={membership.id}
                onClick={() => onSelectPerson(person.id)}
                className="cursor-pointer p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder hover:border-apple-blue/50 transition-all flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3.5">
                  <img
                    src={person.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">{person.display_name}</span>
                      <span className="text-neutral-400 text-[11px]">{person.phonetic_name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        membership.status === 'active' ? 'bg-apple-blue/10 text-apple-blue' : 'bg-neutral-200 text-neutral-500'
                      }`}>
                        {membership.status === 'active' ? '現所属' : '移籍済み'}
                      </span>
                    </div>
                    <p className="text-neutral-500 text-[11px] mt-0.5">
                      カテゴリー: <strong>{membership.category}</strong> {membership.role_history ? `(${membership.role_history})` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-neutral-400">
                  <div>面談回数: {person.meeting_count}回</div>
                  <div className="text-apple-blue font-medium mt-0.5">カルテ表示 →</div>
                </div>
              </div>
            ))}

            {chapterMembers.length === 0 && (
              <div className="text-center py-8 text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-apple-border dark:border-apple-darkBorder">
                このチャプターにはまだ面談済みのメンバーが登録されていません。
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
