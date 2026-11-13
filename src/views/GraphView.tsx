import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  X,
  Link as LinkIcon,
  UserCheck,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeftRight,
  ChevronRight,
  Building2,
  Award,
  Network,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { store } from '../services/store';
import { UserAvatar } from '../components/UserAvatar';

interface GraphViewProps {
  onSelectPerson: (personId: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ onSelectPerson }) => {
  const [mode, setMode] = useState<'actual' | 'ai_suggested'>('actual');
  const [showProvisional, setShowProvisional] = useState(false);
  const [focusedPersonId, setFocusedPersonId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllBranches, setShowAllBranches] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 手動関係追加モーダル
  const [isAddRelModalOpen, setIsAddRelModalOpen] = useState(false);
  const [fromPersonId, setFromPersonId] = useState('');
  const [toPersonId, setToPersonId] = useState('');
  const [relType, setRelType] = useState('紹介元 / 紹介先');
  const [evidenceText, setEvidenceText] = useState('');

  const allPersons = store.getPersons();
  const realPersons = allPersons.filter(p => p.status !== 'provisional');
  const provisionalPersons = allPersons.filter(p => p.status === 'provisional');

  const filterRelationships = (targetMode: 'actual' | 'ai_suggested') => {
    const raw = store.getRelationships(targetMode);
    return raw.filter(rel => {
      const fromP = store.getPersonById(rel.from_person_id);
      const toP = store.getPersonById(rel.to_person_id);
      if (!fromP || !toP) return false;
      if (showProvisional) return true;
      // 確認済み実関係で少なくとも一方が本登録(active)の人脈である場合は紹介・協業ルートとして表示
      if (!rel.is_ai_inferred && (fromP.status !== 'provisional' || toP.status !== 'provisional')) {
        return true;
      }
      return fromP.status !== 'provisional' && toP.status !== 'provisional';
    });
  };

  const actualRelationships = useMemo(
    () => filterRelationships('actual'),
    [refreshKey, showProvisional, allPersons.length]
  );
  const aiRelationships = useMemo(
    () => filterRelationships('ai_suggested'),
    [refreshKey, showProvisional, allPersons.length]
  );
  const relationships = mode === 'actual' ? actualRelationships : aiRelationships;

  // 人物ごとの関係エッジ集計（人数が100名以上に増えても重ならないツリー構造データ）
  const personHubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return realPersons
      .filter(p => (focusedPersonId === 'all' ? true : p.id === focusedPersonId))
      .map(mainPerson => {
        const bni = store.getBNIMembershipsForPerson(mainPerson.id)[0];
        const org = store.getOrgMembershipsForPerson(mainPerson.id)[0];
        const connectedRels = relationships.filter(
          r => r.from_person_id === mainPerson.id || r.to_person_id === mainPerson.id
        );

        const items = connectedRels
          .map(rel => {
            const isIncoming = rel.to_person_id === mainPerson.id;
            const partnerId = isIncoming ? rel.from_person_id : rel.to_person_id;
            const partner = store.getPersonById(partnerId);
            if (!partner) return null;
            const partnerBni = store.getBNIMembershipsForPerson(partner.id)[0];
            const partnerOrg = store.getOrgMembershipsForPerson(partner.id)[0];
            const shortBadge = rel.is_ai_inferred
              ? 'AIシナジー推薦'
              : rel.relationship_type.includes('紹介元')
                ? '紹介元'
                : rel.relationship_type.includes('協業') || rel.relationship_type.includes('企画')
                  ? '協業・連携'
                  : '取引・接点';

            return {
              rel,
              partner,
              isIncoming,
              shortBadge,
              partnerSubtitle:
                partnerBni?.chapter_name ||
                partnerOrg?.organization_name ||
                partner.category_tags[0] ||
                '関連人脈',
            };
          })
          .filter(Boolean) as {
          rel: (typeof relationships)[number];
          partner: (typeof allPersons)[number];
          isIncoming: boolean;
          shortBadge: string;
          partnerSubtitle: string;
        }[];

        return {
          person: mainPerson,
          bniChapter: bni?.chapter_name,
          bniCategory: bni?.category,
          companyName: org?.organization_name,
          title: org?.title,
          items,
        };
      })
      .filter(hub => {
        if (!q) return true;
        const selfMatch =
          hub.person.display_name.toLowerCase().includes(q) ||
          (hub.companyName || '').toLowerCase().includes(q) ||
          (hub.bniChapter || '').toLowerCase().includes(q) ||
          (hub.person.notes || '').toLowerCase().includes(q);
        const partnerMatch = hub.items.some(
          it =>
            it.partner.display_name.toLowerCase().includes(q) ||
            it.partnerSubtitle.toLowerCase().includes(q) ||
            it.rel.relationship_type.toLowerCase().includes(q) ||
            it.rel.evidence_text.toLowerCase().includes(q)
        );
        return selfMatch || partnerMatch;
      });
  }, [realPersons, relationships, focusedPersonId, searchQuery]);

  // 結線があるメンバー（ツリー描画対象）と単独メンバー（下部チップ描画対象）を分離
  const connectedHubs = useMemo(() => personHubs.filter(h => h.items.length > 0), [personHubs]);
  const standaloneHubs = useMemo(() => personHubs.filter(h => h.items.length === 0), [personHubs]);

  const visibleConnectedHubs = showAllBranches ? connectedHubs : connectedHubs.slice(0, 10);

  const openAddRelForPerson = (defaultFromId?: string) => {
    const firstId = defaultFromId || realPersons[0]?.id || allPersons[0]?.id || '';
    const secondId = allPersons.find(p => p.id !== firstId)?.id || '';
    setFromPersonId(firstId);
    setToPersonId(secondId);
    setIsAddRelModalOpen(true);
  };

  const handleCreateRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromPersonId || !toPersonId || fromPersonId === toPersonId) {
      alert('異なる2名の人脈を選択してください');
      return;
    }
    store.createRelationship({
      from_person_id: fromPersonId,
      to_person_id: toPersonId,
      relationship_type: relType,
      is_ai_inferred: mode === 'ai_suggested',
      evidence_text:
        evidenceText.trim() ||
        (relType === '紹介元 / 紹介先' ? '直接紹介による繋がり' : '共同プロジェクト・同席面談'),
    });
    setIsAddRelModalOpen(false);
    setEvidenceText('');
    setRefreshKey(k => k + 1);
  };

  const handleDeleteRelationship = (relId: string) => {
    if (confirm('この関係性を削除しますか？')) {
      store.deleteRelationship(relId);
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <div key={refreshKey} className="p-3 sm:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-28 animate-fadeIn">
      {/* 1. ヘッダー & 関係追加ボタン */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
              <Network className="w-5 h-5 text-apple-blue shrink-0" />
              <span>人脈相関図・紹介ツリー</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
              {mode === 'actual'
                ? '人数が何十人・何百人に増えても重ならない「階層マインドマップ形式」で紹介元・協業先を可視化'
                : 'AIが事業強み・紹介ニーズの一致から算出した「相互送客・協業シナジー」を階層表示'}
            </p>
          </div>

          {allPersons.length >= 2 && (
            <button
              type="button"
              onClick={() => openAddRelForPerson()}
              className="shrink-0 min-h-[40px] px-3.5 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>関係を追加</span>
            </button>
          )}
        </div>

        {/* 2. 大型2モード切替セグメント（スマホでも押しやすい44px高） */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/90 border border-apple-border dark:border-apple-darkBorder">
          <button
            type="button"
            onClick={() => setMode('actual')}
            className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'actual'
                ? 'bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 shrink-0 ${mode === 'actual' ? 'text-emerald-500' : 'text-neutral-400'}`} />
            <span>確認済み実関係</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                mode === 'actual'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'bg-neutral-300/60 dark:bg-neutral-700 text-neutral-500'
              }`}
            >
              {actualRelationships.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode('ai_suggested')}
            className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'ai_suggested'
                ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Sparkles className={`w-4 h-4 shrink-0 ${mode === 'ai_suggested' ? 'text-indigo-500' : 'text-neutral-400'}`} />
            <span>AI推薦シナジー</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                mode === 'ai_suggested'
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-bold'
                  : 'bg-neutral-300/60 dark:bg-neutral-700 text-neutral-500'
              }`}
            >
              {aiRelationships.length}
            </span>
          </button>
        </div>

        {/* 3. 検索ボックス & 人物ワンタップ絞り込みチップ（100名超でも一瞬で発見可能） */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前・会社名・チャプター・紹介元で検索..."
              className="w-full min-h-[38px] pl-9 pr-8 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-neutral-400 focus:outline-none focus:border-apple-blue"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setFocusedPersonId('all')}
              className={`shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                focusedPersonId === 'all'
                  ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] border-transparent shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-apple-border dark:border-apple-darkBorder'
              }`}
            >
              全員 ({realPersons.length})
            </button>
            {realPersons.map(p => {
              const count = relationships.filter(r => r.from_person_id === p.id || r.to_person_id === p.id).length;
              const isSelected = focusedPersonId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFocusedPersonId(isSelected ? 'all' : p.id)}
                  className={`shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-apple-blue text-white border-apple-blue shadow-xs'
                      : 'bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] border-apple-border dark:border-apple-darkBorder hover:border-apple-blue/50'
                  }`}
                >
                  <span>{p.display_name}</span>
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. 絶対に重ならない「マインドマップ型・階層ネットワーク図（Dark Canvas）」 */}
      <div className="rounded-3xl bg-neutral-950 border border-neutral-800 p-4 sm:p-6 shadow-inner space-y-5">
        {/* マップ上部ステータスバー */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400 border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${mode === 'actual' ? 'bg-emerald-400' : 'bg-indigo-400'} animate-pulse`} />
            <span className="font-bold text-neutral-200">
              {mode === 'actual' ? '紹介・協業マインドマップ（実関係）' : 'AI事業シナジー・マインドマップ'}
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            結線あり: {connectedHubs.length}名 / 関係エッジ: {relationships.length}件
          </div>
        </div>

        {/* 起点オーナーバッジ（勝賀野 太郎 様） */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-sky-950/40 border border-sky-500/40 w-fit">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 font-bold text-xs">
            起点
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>勝賀野 太郎</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                株式会社ZENNOBATE / だんじりC
              </span>
            </div>
            <div className="text-[10px] text-neutral-400">
              1to1面談・名刺交換ネットワークの中心ハブ（人数が増えても縦に自動拡張されます）
            </div>
          </div>
        </div>

        {/* マインドマップ・ツリー本体（各人物が独立した横レーンを持つため100名でも重なりゼロ） */}
        {visibleConnectedHubs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center space-y-2">
            <div className="text-xs font-semibold text-neutral-300">
              該当する関係エッジがありません
            </div>
            <p className="text-[11px] text-neutral-500">
              検索条件を変更するか、右上の「関係を追加」から紹介元・協業先を結線してください。
            </p>
          </div>
        ) : (
          <div className="relative pl-3 sm:pl-6 border-l-2 border-sky-500/40 space-y-4">
            {visibleConnectedHubs.map(({ person, bniChapter, companyName, items }) => {
              const subtitle = bniChapter
                ? `${bniChapter}${companyName ? ` / ${companyName}` : ''}`
                : companyName || person.category_tags[0] || '本登録メンバー';

              return (
                <div
                  key={`mindmap-${person.id}`}
                  className="relative flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition-all"
                >
                  {/* 左側の水平枝ライン（勝賀野様 → 1to1メンバー） */}
                  <div className="hidden sm:block absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-[2px] bg-sky-500/40" />

                  {/* 第1階層：1to1 本登録メンバーノード */}
                  <div
                    onClick={() => onSelectPerson(person.id)}
                    className="cursor-pointer group lg:w-[250px] shrink-0 p-3 rounded-xl bg-neutral-950 border border-blue-500/50 hover:border-blue-400 transition-all flex items-center justify-between gap-2.5 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={person.display_name} avatarUrl={person.avatar_url} size="md" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                          {person.display_name}
                        </div>
                        <div className="text-[10px] text-sky-300/90 truncate">
                          {subtitle}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-sky-400 shrink-0" />
                  </div>

                  {/* 第2階層：その人物に紐づく紹介元・協業先・AI推薦パートナーの枝リスト */}
                  <div className="flex-1 pl-3 sm:pl-4 lg:pl-0 border-l-2 lg:border-l-0 border-emerald-500/30 space-y-2">
                    {items.map(({ rel, partner, isIncoming, shortBadge, partnerSubtitle }) => (
                      <div
                        key={`branch-${rel.id}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/90"
                      >
                        {/* 結線バッジ（矢印＋関係種別） */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              mode === 'actual'
                                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                                : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-300'
                            }`}
                          >
                            {mode === 'actual' ? (
                              isIncoming ? (
                                <ArrowRight className="w-3 h-3 shrink-0" />
                              ) : (
                                <ArrowLeftRight className="w-3 h-3 shrink-0" />
                              )
                            ) : (
                              <Sparkles className="w-3 h-3 shrink-0" />
                            )}
                            <span>{shortBadge}</span>
                          </span>
                          <span className="hidden sm:inline-block w-4 h-[2px] bg-emerald-500/40" />
                        </div>

                        {/* 相手ノード（紹介元・協業先・AI推薦相手） */}
                        <div
                          onClick={() => onSelectPerson(partner.id)}
                          className="cursor-pointer group flex-1 min-w-0 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/70 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <UserAvatar name={partner.display_name} avatarUrl={partner.avatar_url} size="sm" />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center gap-1.5 flex-wrap">
                                <span>{partner.display_name}</span>
                                {partner.status === 'provisional' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    紹介・言及
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-400 truncate">
                                {partnerSubtitle} — {rel.relationship_type}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {connectedHubs.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllBranches(!showAllBranches)}
                className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 flex items-center justify-center gap-1.5"
              >
                {showAllBranches ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>表示を上位10名に折りたたむ</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>残り {connectedHubs.length - 10} 名のツリーをすべて展開する</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* まだ紹介・協業エッジが結線されていない本登録メンバー（例: 名刺登録のみのメンバー等） */}
        {standaloneHubs.length > 0 && (
          <div className="pt-4 border-t border-neutral-800/90 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>単独登録メンバー（このモードでの紹介・協業エッジ未登録: {standaloneHubs.length}名）</span>
              <span className="text-[10px] text-neutral-500">「＋結線」から紹介元などを紐付け可能</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {standaloneHubs.map(({ person, companyName, bniChapter }) => (
                <div
                  key={`standalone-${person.id}`}
                  className="flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700"
                >
                  <div
                    onClick={() => onSelectPerson(person.id)}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <UserAvatar name={person.display_name} avatarUrl={person.avatar_url} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-white hover:text-sky-400">
                        {person.display_name}
                      </div>
                      {(bniChapter || companyName) && (
                        <div className="text-[9px] text-neutral-400 max-w-[130px] truncate">
                          {bniChapter || companyName}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddRelForPerson(person.id)}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-apple-blue text-[10px] font-semibold text-neutral-300 hover:text-white transition-colors"
                    title="この人物の関係性を追加"
                  >
                    ＋結線
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. 根拠全文が読める「人物別・詳細カード一覧」 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-apple-blue" />
            <span>
              {mode === 'actual'
                ? '人物別の紹介経緯・協業エビデンス詳細'
                : '人物別のAI紹介推薦・シナジー根拠詳細'}
            </span>
          </h2>
          {provisionalPersons.length > 0 && (
            <button
              type="button"
              onClick={() => setShowProvisional(!showProvisional)}
              className="text-xs text-neutral-500 hover:text-apple-blue flex items-center gap-1"
            >
              {showProvisional ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showProvisional ? '仮登録一覧を閉じる' : `会話言及・仮(${provisionalPersons.length}名)`}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personHubs.map(({ person, bniChapter, bniCategory, companyName, title, items }) => (
            <div
              key={person.id}
              className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div
                    onClick={() => onSelectPerson(person.id)}
                    className="cursor-pointer group flex items-center gap-3 min-w-0"
                  >
                    <UserAvatar name={person.display_name} avatarUrl={person.avatar_url} size="lg" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-apple-blue transition-colors">
                          {person.display_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          本登録
                        </span>
                      </div>

                      {companyName && (
                        <div className="text-xs text-neutral-600 dark:text-neutral-300 font-medium flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate">
                            {companyName} {title ? `(${title})` : ''}
                          </span>
                        </div>
                      )}

                      {bniChapter && (
                        <div className="text-[11px] text-apple-blue font-medium flex items-center gap-1 mt-0.5">
                          <Award className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {bniChapter} {bniCategory ? `/ ${bniCategory}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openAddRelForPerson(person.id)}
                      className="min-h-[34px] px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300"
                      title="関係を追加"
                    >
                      ＋結線
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPerson(person.id)}
                      className="min-h-[34px] px-3 py-1 rounded-xl bg-apple-blue/10 hover:bg-apple-blue text-apple-blue hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>カルテ</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-dashed border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 flex items-center justify-between">
                    <span>このモードでの結線はまだありません</span>
                    <button
                      type="button"
                      onClick={() => openAddRelForPerson(person.id)}
                      className="text-apple-blue font-semibold hover:underline"
                    >
                      ＋ 関係性を記録する
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 pl-2 sm:pl-3 border-l-2 border-apple-blue/30 dark:border-apple-blue/40">
                    {items.map(({ rel, partner, isIncoming, partnerSubtitle }) => (
                      <div
                        key={rel.id}
                        className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold leading-snug ${
                              mode === 'actual'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                            }`}
                          >
                            {mode === 'actual' ? (
                              isIncoming ? (
                                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                              )
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{rel.relationship_type}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteRelationship(rel.id)}
                            className="p-1 rounded-lg text-neutral-400 hover:text-red-500 transition-colors shrink-0"
                            title="この関係線を削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div
                          onClick={() => onSelectPerson(partner.id)}
                          className="cursor-pointer group flex items-center justify-between gap-2 pt-0.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar name={partner.display_name} avatarUrl={partner.avatar_url} size="sm" />
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-apple-blue flex items-center gap-1.5 flex-wrap">
                                <span>{partner.display_name}</span>
                                {partner.status === 'provisional' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    紹介・言及
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                {partnerSubtitle}
                              </div>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-apple-blue shrink-0" />
                        </div>

                        <div className="text-[11px] text-neutral-600 dark:text-neutral-400 bg-white/80 dark:bg-neutral-950/60 px-2.5 py-1.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 leading-relaxed">
                          <span className="font-semibold text-neutral-500 dark:text-neutral-300">根拠: </span>
                          {rel.evidence_text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. 会話内で言及された紹介元・協業キーマン一覧（トグルON時のみ表示） */}
      {showProvisional && provisionalPersons.length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder p-4 sm:p-5 space-y-3">
          <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-between">
            <span>会話内で言及された紹介元・関係者（{provisionalPersons.length}名）</span>
            <span className="text-[11px] font-normal text-neutral-500">タップで詳細・本登録へ昇格可能</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {provisionalPersons.map(p => (
              <div
                key={p.id}
                onClick={() => onSelectPerson(p.id)}
                className="cursor-pointer group flex items-center justify-between p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar name={p.display_name} avatarUrl={p.avatar_url} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-apple-blue truncate">
                      {p.display_name}
                    </div>
                    <div className="text-[10px] text-neutral-500 truncate">
                      {p.notes || '面談内で言及'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 手動関係性追加モーダル */}
      {isAddRelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateRelationship}
            className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl border border-apple-border dark:border-apple-darkBorder p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
              <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-apple-blue" />
                <span>人脈同士の関係を記録</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRelModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-500 font-semibold mb-1">人物A（起点・紹介元など） *</label>
                <select
                  value={fromPersonId}
                  onChange={(e) => setFromPersonId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7]"
                >
                  {allPersons.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.display_name} {p.status === 'provisional' ? '(紹介・言及)' : '(本登録)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 font-semibold mb-1">人物B（相手・紹介先など） *</label>
                <select
                  value={toPersonId}
                  onChange={(e) => setToPersonId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7]"
                >
                  {allPersons
                    .filter(p => p.id !== fromPersonId)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} {p.status === 'provisional' ? '(紹介・言及)' : '(本登録)'}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 font-semibold mb-1">関係性の種類 *</label>
                <select
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7]"
                >
                  <option value="紹介元 / 紹介先">紹介元 / 紹介先</option>
                  <option value="共同プロジェクト・協業">共同プロジェクト・協業</option>
                  <option value="同席面談・取引実績">同席面談・取引実績</option>
                  <option value="同チャプター・同所属">同チャプター・同所属</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 font-semibold mb-1">根拠・メモ</label>
                <input
                  type="text"
                  placeholder="例: だんじりチャプターの三島様よりご紹介、同じ案件で連携中など"
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-apple-border dark:border-apple-darkBorder flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddRelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                関係性を記録して結線
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
