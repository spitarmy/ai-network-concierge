import React, { useState, useMemo } from 'react';
import { Building2, CheckCircle2, Search, Award, Users, ChevronRight, X, Globe } from 'lucide-react';
import { store } from '../services/store';
import { UserAvatar } from '../components/UserAvatar';

interface BNIViewProps {
  onSelectPerson: (personId: string) => void;
  onRefresh?: () => void;
}

export const BNIView: React.FC<BNIViewProps> = ({ onSelectPerson }) => {
  const regions = store.getBNIRegions();
  const chapters = store.getBNIChapters();

  // デフォルトは大阪府・大阪シティセントラル（シャングリラ）または大阪東（だんじり）
  const defaultRegion =
    regions.find(r => r.id === 'reg-osaka-c') ||
    regions.find(r => r.prefecture === '大阪府') ||
    regions[0];
  const defaultChapter =
    chapters.find(c => c.id === 'chap-osaka-shangrila') ||
    chapters.find(c => c.region_id === defaultRegion?.id) ||
    chapters[0];

  const [selectedPrefecture, setSelectedPrefecture] = useState<string>(defaultRegion?.prefecture || '大阪府');
  const [selectedRegionId, setSelectedRegionId] = useState<string>(defaultRegion?.id || 'reg-osaka-c');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(defaultChapter?.id || 'chap-osaka-shangrila');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const prefectures = useMemo(() => Array.from(new Set(regions.map(r => r.prefecture))), [regions]);
  const filteredRegions = useMemo(
    () => regions.filter(r => r.prefecture === selectedPrefecture),
    [regions, selectedPrefecture]
  );
  const filteredChapters = useMemo(
    () => chapters.filter(c => c.region_id === selectedRegionId),
    [chapters, selectedRegionId]
  );
  const currentChapter = chapters.find(c => c.id === selectedChapterId) || filteredChapters[0];
  const currentRegion = regions.find(r => r.id === currentChapter?.region_id);

  // 全登録メンバーのBNI所属一覧
  const allMemberships = useMemo(() => {
    return store.getPersons().flatMap(p => {
      return store.getBNIMembershipsForPerson(p.id).map(m => ({ person: p, membership: m }));
    });
  }, [regions.length, chapters.length]);

  // メンバーが登録されているチャプターのクイックリスト
  const activeChaptersWithMembers = useMemo(() => {
    const map = new Map<string, { chapterId: string; chapterName: string; regionName: string; count: number }>();
    for (const { membership } of allMemberships) {
      const chap =
        chapters.find(c => c.id === membership.chapter_id) ||
        chapters.find(c => c.chapter_name === membership.chapter_name);
      const cid = chap?.id || membership.chapter_id;
      const existing = map.get(cid);
      if (existing) {
        existing.count += 1;
      } else {
        const reg = chap ? regions.find(r => r.id === chap.region_id) : undefined;
        map.set(cid, {
          chapterId: cid,
          chapterName: chap?.chapter_name || membership.chapter_name,
          regionName: reg?.region_name.replace(/\(.*?\)/g, '').trim() || membership.region_name,
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [allMemberships, chapters, regions]);

  // フリーワード検索結果（チャプター名・リージョン名・都道府県）
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return chapters
      .map(chap => {
        const reg = regions.find(r => r.id === chap.region_id);
        return { chap, reg };
      })
      .filter(({ chap, reg }) => {
        return (
          chap.chapter_name.toLowerCase().includes(q) ||
          (reg?.region_name || '').toLowerCase().includes(q) ||
          (reg?.prefecture || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 24);
  }, [searchQuery, chapters, regions]);

  const handleSelectChapterDirect = (chapId: string) => {
    const chap = chapters.find(c => c.id === chapId);
    if (!chap) return;
    const reg = regions.find(r => r.id === chap.region_id);
    if (reg) {
      setSelectedPrefecture(reg.prefecture);
      setSelectedRegionId(reg.id);
    }
    setSelectedChapterId(chap.id);
    setSearchQuery('');
  };

  const chapterMembers = allMemberships.filter(
    item =>
      item.membership.chapter_id === currentChapter?.id ||
      (currentChapter && item.membership.chapter_name === currentChapter.chapter_name)
  );

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-24 animate-fadeIn">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <Globe className="w-5 h-5 text-apple-blue shrink-0" />
            <span>BNI全国公式マスター・チャプター検索</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            BNI Japan 公式HP準拠：全国 {regions.length} リージョン / {chapters.length} チャプター完全収録
          </p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>bni.jp 公式チャプター同期済み</span>
        </span>
      </div>

      {/* 登録メンバーがいるチャプターへのワンタップ切替バー */}
      {activeChaptersWithMembers.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-2">
          <div className="text-[11px] font-bold text-neutral-500 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-apple-blue" />
            <span>登録人脈が所属しているチャプター（ワンタップ表示）</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeChaptersWithMembers.map(item => {
              const isSelected = currentChapter?.id === item.chapterId;
              return (
                <button
                  key={item.chapterId}
                  type="button"
                  onClick={() => handleSelectChapterDirect(item.chapterId)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-apple-blue text-white border-apple-blue shadow-xs'
                      : 'bg-neutral-50 dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] border-apple-border dark:border-apple-darkBorder hover:border-apple-blue/50'
                  }`}
                >
                  <span>{item.chapterName}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                    ({item.regionName})
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-apple-blue/10 text-apple-blue'
                    }`}
                  >
                    {item.count}名
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 全国401チャプター横断フリーワード検索 */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="全国の公式チャプター名・リージョン名で検索（例: だんじり、シャングリラ、新撰組、京都、神戸...）"
            className="w-full min-h-[42px] pl-10 pr-9 py-2 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-neutral-400 focus:outline-none focus:border-apple-blue"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder shadow-lg space-y-2 max-h-72 overflow-y-auto">
            <div className="text-[11px] font-semibold text-neutral-400 px-1">
              検索結果 ({searchResults.length}件) — タップで選択
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {searchResults.map(({ chap, reg }) => (
                <button
                  key={chap.id}
                  type="button"
                  onClick={() => handleSelectChapterDirect(chap.id)}
                  className="text-left p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent hover:border-apple-border dark:hover:border-apple-darkBorder transition-all flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                      {chap.chapter_name}
                    </div>
                    <div className="text-[10px] text-neutral-500 truncate">
                      {reg?.prefecture} / {reg?.region_name} • {chap.meeting_day} {chap.meeting_time}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 都道府県・リージョン・チャプター 3段階ドリルダウン */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block mb-1 font-semibold text-neutral-500">
            1. 都道府県 ({prefectures.length}都道府県)
          </label>
          <select
            value={selectedPrefecture}
            onChange={e => {
              const pref = e.target.value;
              setSelectedPrefecture(pref);
              const nextReg = regions.find(r => r.prefecture === pref);
              if (nextReg) {
                setSelectedRegionId(nextReg.id);
                const nextChap = chapters.find(c => c.region_id === nextReg.id);
                if (nextChap) setSelectedChapterId(nextChap.id);
              }
            }}
            className="w-full min-h-[42px] p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] font-medium"
          >
            {prefectures.map(pref => {
              const regCount = regions.filter(r => r.prefecture === pref).length;
              return (
                <option key={pref} value={pref}>
                  {pref} ({regCount}リージョン)
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-semibold text-neutral-500">
            2. 公式リージョン ({filteredRegions.length}件)
          </label>
          <select
            value={selectedRegionId}
            onChange={e => {
              const regId = e.target.value;
              setSelectedRegionId(regId);
              const nextChap = chapters.find(c => c.region_id === regId);
              if (nextChap) setSelectedChapterId(nextChap.id);
            }}
            className="w-full min-h-[42px] p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] font-medium"
          >
            {filteredRegions.map(reg => {
              const chapCount = chapters.filter(c => c.region_id === reg.id).length;
              return (
                <option key={reg.id} value={reg.id}>
                  {reg.region_name} ({chapCount}チャプター)
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-semibold text-neutral-500">
            3. 公式チャプター ({filteredChapters.length}件)
          </label>
          <select
            value={currentChapter?.id || selectedChapterId}
            onChange={e => setSelectedChapterId(e.target.value)}
            className="w-full min-h-[42px] p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] font-medium"
          >
            {filteredChapters.map(chap => {
              const mCount = allMemberships.filter(
                m => m.membership.chapter_id === chap.id || m.membership.chapter_name === chap.chapter_name
              ).length;
              return (
                <option key={chap.id} value={chap.id}>
                  {chap.chapter_name} {mCount > 0 ? `（登録: ${mCount}名）` : `（${chap.meeting_day}）`}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 選択中のチャプター詳細 & 登録メンバー一覧 */}
      {currentChapter && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Building2 className="w-5 h-5 text-apple-blue shrink-0" />
                <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {currentChapter.chapter_name}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>BNI Japan 公式チャプター</span>
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1.5">
                所属リージョン: <strong>{currentRegion?.region_name || selectedPrefecture}</strong> ｜ 定例会: 毎週{' '}
                <strong>{currentChapter.meeting_day}</strong> {currentChapter.meeting_time}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              <Users className="w-4 h-4 text-apple-blue" />
              <span>登録メンバー: {chapterMembers.length}名</span>
            </div>
          </div>

          {/* メンバーリスト */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-600 dark:text-neutral-400 px-1">
              {currentChapter.chapter_name} の登録カルテメンバー ({chapterMembers.length}名)
            </h3>

            {chapterMembers.map(({ person, membership }) => {
              const org = store.getOrgMembershipsForPerson(person.id)[0];
              return (
                <div
                  key={membership.id}
                  onClick={() => onSelectPerson(person.id)}
                  className="cursor-pointer p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder hover:border-apple-blue/50 transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <UserAvatar name={person.display_name} avatarUrl={person.avatar_url} size="lg" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {person.display_name}
                        </span>
                        {person.phonetic_name && (
                          <span className="text-neutral-400 text-[11px]">{person.phonetic_name}</span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            membership.status === 'active'
                              ? 'bg-apple-blue/10 text-apple-blue'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                          }`}
                        >
                          {membership.status === 'active' ? '現所属' : '移籍履歴'}
                        </span>
                        {person.status === 'provisional' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            紹介・言及
                          </span>
                        )}
                      </div>
                      {org && (
                        <p className="text-neutral-600 dark:text-neutral-300 text-xs font-medium mt-0.5 truncate">
                          {org.organization_name} {org.title ? `(${org.title})` : ''}
                        </p>
                      )}
                      <p className="text-neutral-500 text-[11px] mt-0.5">
                        専門カテゴリー: <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{membership.category}</strong>{' '}
                        {membership.role_history ? `(${membership.role_history})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-neutral-400 shrink-0">
                    <div>1to1回数: {person.meeting_count}回</div>
                    <div className="text-apple-blue font-semibold mt-1 flex items-center justify-end gap-0.5">
                      <span>カルテ表示</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}

            {chapterMembers.length === 0 && (
              <div className="text-center py-8 px-4 text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-apple-border dark:border-apple-darkBorder space-y-1">
                <div className="font-semibold text-neutral-500 dark:text-neutral-300">
                  「{currentChapter.chapter_name}」にはまだ面談・名刺登録済みのメンバーがいません
                </div>
                <div>
                  1to1面談の文字起こしや人物カルテ編集で「{currentChapter.chapter_name}」を登録すると、ここに自動集計されます。
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
