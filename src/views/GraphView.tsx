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
  const [show2DCanvas, setShow2DCanvas] = useState<boolean>(true);
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

  const actualRelationships = useMemo(() => filterRelationships('actual'), [refreshKey, showProvisional, allPersons.length]);
  const aiRelationships = useMemo(() => filterRelationships('ai_suggested'), [refreshKey, showProvisional, allPersons.length]);
  const relationships = mode === 'actual' ? actualRelationships : aiRelationships;

  // 人物ごとの関係エッジ集計（本登録メンバーを中心ハブとして整理）
  const personHubs = useMemo(() => {
    const targetMains = focusedPersonId === 'all'
      ? realPersons
      : realPersons.filter(p => p.id === focusedPersonId);

    return targetMains.map(mainPerson => {
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
          return {
            rel,
            partner,
            isIncoming,
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
    });
  }, [realPersons, relationships, focusedPersonId]);

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

  // 2D SVG 相関マップ用の座標計算（モバイルでも絶対に重ならない4象限＋個別フォーカスレイアウト）
  const svgGraphData = useMemo(() => {
    const cx = 220;
    const cy = 170;
    const mains = focusedPersonId === 'all'
      ? realPersons.slice(0, 6)
      : realPersons.filter(p => p.id === focusedPersonId);

    // 4象限の固定アンカー座標（全体表示時）と1名フォーカス時の拡大座標
    const quadPositions = [
      { x: 115, y: 105, subSlots: [{ x: 54, y: 36 }, { x: 152, y: 36 }, { x: 48, y: 105 }] },
      { x: 325, y: 105, subSlots: [{ x: 372, y: 36 }, { x: 280, y: 36 }, { x: 390, y: 105 }] },
      { x: 115, y: 235, subSlots: [{ x: 62, y: 304 }, { x: 158, y: 304 }, { x: 48, y: 235 }] },
      { x: 325, y: 235, subSlots: [{ x: 372, y: 304 }, { x: 280, y: 304 }, { x: 390, y: 235 }] },
    ];

    const mainNodes = mains.map((p, idx) => {
      let x = cx;
      let y = cy - 60;
      let subSlots = [
        { x: 90, y: 42 },
        { x: 220, y: 34 },
        { x: 350, y: 42 },
        { x: 360, y: 110 },
      ];

      if (mains.length === 1) {
        x = 220;
        y = 112;
      } else if (idx < quadPositions.length) {
        x = quadPositions[idx].x;
        y = quadPositions[idx].y;
        subSlots = quadPositions[idx].subSlots;
      } else {
        const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / mains.length;
        x = cx + Math.cos(angle) * 115;
        y = cy + Math.sin(angle) * 80;
      }

      const org = store.getOrgMembershipsForPerson(p.id)[0];
      const bni = store.getBNIMembershipsForPerson(p.id)[0];
      return {
        id: p.id,
        name: p.display_name,
        sub: bni?.chapter_name?.replace('チャプター', 'C') || org?.organization_name?.slice(0, 8) || '',
        x,
        y,
        subSlots,
      };
    });

    const nodePosMap = new Map<string, { x: number; y: number; name: string }>();
    mainNodes.forEach(n => nodePosMap.set(n.id, { x: n.x, y: n.y, name: n.name }));

    const subNodes: { id: string; name: string; x: number; y: number; parentX: number; parentY: number; label: string }[] = [];
    const mainPairs: { fromX: number; fromY: number; toX: number; toY: number; label: string }[] = [];
    const slotCountByAnchor = new Map<string, number>();

    relationships.forEach((rel) => {
      const fromPos = nodePosMap.get(rel.from_person_id);
      const toPos = nodePosMap.get(rel.to_person_id);
      if (fromPos && toPos) {
        mainPairs.push({
          fromX: fromPos.x,
          fromY: fromPos.y,
          toX: toPos.x,
          toY: toPos.y,
          label: rel.relationship_type.replace(/AI紹介推薦（|）/g, '').slice(0, 14),
        });
      } else if (fromPos || toPos) {
        const anchorId = fromPos ? rel.from_person_id : rel.to_person_id;
        const partnerId = fromPos ? rel.to_person_id : rel.from_person_id;
        if (focusedPersonId !== 'all' && anchorId !== focusedPersonId) return;
        const anchorNode = mainNodes.find(m => m.id === anchorId);
        const partner = store.getPersonById(partnerId);
        if (!anchorNode || !partner) return;

        const usedIdx = slotCountByAnchor.get(anchorId) || 0;
        slotCountByAnchor.set(anchorId, usedIdx + 1);
        const slot = anchorNode.subSlots[usedIdx % anchorNode.subSlots.length];

        subNodes.push({
          id: partner.id,
          name: partner.display_name.replace(/（.*?）|\(.*?\)/g, ''),
          x: slot.x,
          y: slot.y,
          parentX: anchorNode.x,
          parentY: anchorNode.y,
          label: rel.is_ai_inferred
            ? 'AIシナジー'
            : rel.relationship_type.includes('紹介元')
              ? '紹介元'
              : '協業・取引',
        });
      }
    });

    const ownerX = mains.length === 1 ? 220 : cx;
    const ownerY = mains.length === 1 ? 245 : cy;

    return { cx: ownerX, cy: ownerY, mainNodes, subNodes, mainPairs };
  }, [realPersons, relationships, focusedPersonId]);

  return (
    <div key={refreshKey} className="p-3 sm:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-28 animate-fadeIn">
      {/* 1. ヘッダー & アクションボタン */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
              <Network className="w-5 h-5 text-apple-blue shrink-0" />
              <span>人脈相関図・紹介ルート</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
              {mode === 'actual'
                ? '1to1面談で確認された「紹介元・同チャプター協業・取引関係」を人物別に整理'
                : 'AIが事業強み・紹介ニーズの一致から算出した「相互送客・協業シナジー」を表示'}
            </p>
          </div>

          {allPersons.length >= 2 && (
            <button
              onClick={() => {
                setFromPersonId(realPersons[0]?.id || allPersons[0]?.id || '');
                setToPersonId(realPersons[1]?.id || allPersons[1]?.id || '');
                setIsAddRelModalOpen(true);
              }}
              className="shrink-0 min-h-[40px] px-3.5 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>関係を追加</span>
            </button>
          )}
        </div>

        {/* 2. モバイル最適化・大型セグメント切替タブ（44pxタップ領域） */}
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
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              mode === 'actual'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'bg-neutral-300/60 dark:bg-neutral-700 text-neutral-500'
            }`}>
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
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              mode === 'ai_suggested'
                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-bold'
                : 'bg-neutral-300/60 dark:bg-neutral-700 text-neutral-500'
            }`}>
              {aiRelationships.length}
            </span>
          </button>
        </div>

        {/* 3. 横スクロール可能な人物フォーカスチップ（スマホで1人ずつ絞り込み可能） */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setFocusedPersonId('all')}
              className={`shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                focusedPersonId === 'all'
                  ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] border-transparent shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-apple-border dark:border-apple-darkBorder'
              }`}
            >
              全員表示 ({realPersons.length}名)
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
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShow2DCanvas(!show2DCanvas)}
            className="shrink-0 min-h-[36px] px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-apple-border dark:border-apple-darkBorder"
          >
            {show2DCanvas ? 'マップを隠す' : 'マップを表示'}
          </button>
        </div>
      </div>

      {/* 4. 視覚的 2D ネットワークマップ（スマホでも文字が潰れないレスポンシブSVG） */}
      {show2DCanvas && realPersons.length > 0 && (
        <div className="rounded-3xl bg-neutral-950 border border-neutral-800 p-3 sm:p-5 shadow-inner overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className={`w-2 h-2 rounded-full ${mode === 'actual' ? 'bg-emerald-400' : 'bg-indigo-400'} animate-pulse`} />
              <span>{mode === 'actual' ? '紹介・協業ネットワーク図' : 'AI事業シナジーマップ'}</span>
            </span>
            <span className="text-[10px] text-neutral-400">人物をタップで絞り込み</span>
          </div>

          <div className="w-full">
            <svg
              viewBox="0 0 440 340"
              className="w-full max-w-[680px] mx-auto h-auto select-none"
            >
              <defs>
                <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={mode === 'actual' ? '#10b98133' : '#6366f133'} />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>

              {/* 背景グロー */}
              <circle cx={svgGraphData.cx} cy={svgGraphData.cy} r="120" fill="url(#hubGlow)" />

              {/* 中心（勝賀野様）と各1to1メンバーの1to1結線 */}
              {svgGraphData.mainNodes.map(node => (
                <line
                  key={`line-center-${node.id}`}
                  x1={svgGraphData.cx}
                  y1={svgGraphData.cy}
                  x2={node.x}
                  y2={node.y}
                  stroke="#374151"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              ))}

              {/* AI推薦モード: 本登録メンバー同士のシナジー結線 */}
              {svgGraphData.mainPairs.map((pair, idx) => (
                <g key={`pair-${idx}`}>
                  <line
                    x1={pair.fromX}
                    y1={pair.fromY}
                    x2={pair.toX}
                    y2={pair.toY}
                    stroke={mode === 'actual' ? '#10b981' : '#818cf8'}
                    strokeWidth="2.2"
                  />
                </g>
              ))}

              {/* 紹介元・協業メンバー（サブノード）との結線とノード */}
              {svgGraphData.subNodes.map(sub => (
                <g
                  key={`sub-${sub.id}-${sub.parentX}`}
                  onClick={() => onSelectPerson(sub.id)}
                  className="cursor-pointer"
                >
                  <line
                    x1={sub.parentX}
                    y1={sub.parentY}
                    x2={sub.x}
                    y2={sub.y}
                    stroke="#10b981"
                    strokeWidth="1.8"
                  />
                  <rect
                    x={sub.x - 42}
                    y={sub.y - 13}
                    width="84"
                    height="26"
                    rx="8"
                    fill="#064e3b"
                    stroke="#10b981"
                    strokeWidth="1.2"
                  />
                  <text
                    x={sub.x}
                    y={sub.y - 1}
                    textAnchor="middle"
                    fill="#ecfdf5"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {sub.name.slice(0, 7)}
                  </text>
                  <text
                    x={sub.x}
                    y={sub.y + 8}
                    textAnchor="middle"
                    fill="#6ee7b7"
                    fontSize="7.5"
                  >
                    {sub.label}
                  </text>
                </g>
              ))}

              {/* 中心ハブ: 勝賀野 太郎（オーナー） */}
              <g
                onClick={() => setFocusedPersonId('all')}
                className="cursor-pointer"
              >
                <circle
                  cx={svgGraphData.cx}
                  cy={svgGraphData.cy}
                  r="26"
                  fill="#1e293b"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
                <text
                  x={svgGraphData.cx}
                  y={svgGraphData.cy - 2}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  勝賀野 太郎
                </text>
                <text
                  x={svgGraphData.cx}
                  y={svgGraphData.cy + 9}
                  textAnchor="middle"
                  fill="#93c5fd"
                  fontSize="7.5"
                >
                  だんじりC
                </text>
              </g>

              {/* 本登録メンバー（1to1実施済み）ノード */}
              {svgGraphData.mainNodes.map(node => {
                const isFocused = focusedPersonId === node.id;
                return (
                  <g
                    key={`main-node-${node.id}`}
                    onClick={() => setFocusedPersonId(isFocused ? 'all' : node.id)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={node.x - 48}
                      y={node.y - 18}
                      width="96"
                      height="36"
                      rx="12"
                      fill={isFocused ? '#1d4ed8' : '#18181b'}
                      stroke={isFocused ? '#60a5fa' : '#3b82f6'}
                      strokeWidth={isFocused ? '2.2' : '1.6'}
                    />
                    <text
                      x={node.x}
                      y={node.y - 2}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10.5"
                      fontWeight="bold"
                    >
                      {node.name}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 10}
                      textAnchor="middle"
                      fill="#93c5fd"
                      fontSize="8"
                    >
                      {node.sub}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* 5. スマホでもPCでも見やすい「人物別・相関ツリーカード」 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-apple-blue" />
            <span>
              {mode === 'actual'
                ? '人物別の紹介元・協業ネットワーク'
                : '人物別のAI紹介推薦・事業シナジー'}
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
              {/* カード上部: 本登録メンバーのプロフィールヘッダー */}
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
                          1to1済
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

                  <button
                    type="button"
                    onClick={() => onSelectPerson(person.id)}
                    className="shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-apple-blue hover:text-white text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1 transition-colors"
                  >
                    <span>カルテ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 繋がっている関係性ツリー（モバイルで折り返しても文字が切れない縦ツリー構造） */}
                {items.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-dashed border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 text-center">
                    このモードでの結線はまだありません（右上の「関係を追加」からいつでも結線できます）
                  </div>
                ) : (
                  <div className="space-y-2.5 pl-2 sm:pl-3 border-l-2 border-apple-blue/30 dark:border-apple-blue/40">
                    {items.map(({ rel, partner, isIncoming, partnerSubtitle }) => (
                      <div
                        key={rel.id}
                        className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 space-y-2"
                      >
                        {/* 関係種別バッジ & 削除ボタン */}
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

                        {/* 繋がっている相手人物 */}
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

                        {/* 根拠テキスト（省略せず全文が読めるレイアウト） */}
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
