import React, { useState } from 'react';
import { Sparkles, Info, ShieldCheck, Network, Plus, Trash2, X, Link as LinkIcon, UserCheck, Eye, EyeOff } from 'lucide-react';
import { store } from '../services/store';
import { UserAvatar } from '../components/UserAvatar';

interface GraphViewProps {
  onSelectPerson: (personId: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ onSelectPerson }) => {
  const [mode, setMode] = useState<'actual' | 'ai_suggested'>('actual');
  const [showProvisional, setShowProvisional] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddRelModalOpen, setIsAddRelModalOpen] = useState(false);
  const [fromPersonId, setFromPersonId] = useState('');
  const [toPersonId, setToPersonId] = useState('');
  const [relType, setRelType] = useState('紹介元 / 紹介先');
  const [evidenceText, setEvidenceText] = useState('');

  const allPersons = store.getPersons();
  // 実人脈（確定済み）と会話での仮言及を明確に分離
  const realPersons = allPersons.filter(p => p.status !== 'provisional');
  const provisionalPersons = allPersons.filter(p => p.status === 'provisional');
  // デフォルトでは仮登録・言及者は相関図に混入させない
  const persons = showProvisional ? allPersons : realPersons;

  const rawRelationships = store.getRelationships(mode);
  const relationships = rawRelationships.filter(rel => {
    if (showProvisional) return true;
    const fromP = store.getPersonById(rel.from_person_id);
    const toP = store.getPersonById(rel.to_person_id);
    return fromP?.status !== 'provisional' && toP?.status !== 'provisional';
  });

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
      evidence_text: evidenceText.trim() || (relType === '紹介元 / 紹介先' ? '直接紹介による繋がり' : '共同プロジェクト・同席面談'),
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
    <div key={refreshKey} className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-24 animate-fadeIn">
      {/* ヘッダー & モード切替 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">人脈相関図 (2D Graph)</h1>
          <p className="text-xs text-neutral-500">
            {mode === 'actual'
              ? '「確認済み実関係」のみを描画。推測関係や仮登録は混入しません (仕様09, GRAPH-01)'
              : '「AI紹介推薦」に基づく潜在的な相関関係と根拠を表示 (仕様09, GRAPH-02)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 実人脈のみ / 仮登録表示切替トグル */}
          {provisionalPersons.length > 0 && (
            <button
              type="button"
              onClick={() => setShowProvisional(!showProvisional)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all text-xs flex items-center space-x-1.5 border ${
                showProvisional
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 border-apple-border dark:border-apple-darkBorder text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {showProvisional ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showProvisional ? '仮登録を非表示にする' : `会話言及・仮(${provisionalPersons.length})を表示`}</span>
            </button>
          )}

          {/* 2モード切替ピル */}
          <div className="flex p-1 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs self-start sm:self-auto">
            <button
              onClick={() => setMode('actual')}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center space-x-1.5 ${
                mode === 'actual'
                  ? 'bg-white dark:bg-neutral-700 text-[#1D1D1F] dark:text-[#F5F5F7] shadow-sm font-semibold'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-apple-green" />
              <span>確認済み実関係</span>
            </button>
            <button
              onClick={() => setMode('ai_suggested')}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center space-x-1.5 ${
                mode === 'ai_suggested'
                  ? 'bg-white dark:bg-neutral-700 text-apple-indigo shadow-sm font-semibold'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI推薦関係</span>
            </button>
          </div>

          {/* 手動関係付けボタン */}
          {persons.length >= 2 && (
            <button
              onClick={() => {
                setFromPersonId(persons[0]?.id || '');
                setToPersonId(persons[1]?.id || '');
                setIsAddRelModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-semibold flex items-center space-x-1 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>実関係を記録</span>
            </button>
          )}
        </div>
      </div>

      {/* 2D Canvas相当の相関図カード */}
      <div className="relative w-full min-h-[460px] rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-inner flex flex-col justify-between p-6 select-none">
        {/* 背景の微細なグリッド */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

        {/* 上部ステータス */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-neutral-400">
          <span className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${mode === 'actual' ? 'bg-apple-green' : 'bg-apple-indigo'} animate-pulse`}></span>
            <span>{mode === 'actual' ? '実関係モード（根拠セグメント確定済み）' : 'AI推薦モード（紹介ニーズ合致）'}</span>
            {!showProvisional && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-300">
                実人脈のみ描画中
              </span>
            )}
          </span>
          <span className="text-[11px] font-mono bg-neutral-800/80 px-2.5 py-1 rounded-lg border border-neutral-700">
            描画人脈: {persons.length}名 {provisionalPersons.length > 0 && !showProvisional && `(仮除外: ${provisionalPersons.length}名)`} / 関係エッジ: {relationships.length}件
          </span>
        </div>

        {/* グラフ可視化（実データ動的レンダリング） */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-6">
          {persons.length === 0 ? (
            <div className="text-center p-8 max-w-sm space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-400">
                <Network className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-white">相関関係はまだありません</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                人脈カルテや名刺が登録されると、面談実績やAIによる事業シナジーに基づいた相関図がここに自動マッピングされます。
              </p>
            </div>
          ) : relationships.length === 0 ? (
            /* 関係線が0件の場合: 独立人脈ノードとして整然と表示（勝手な線は引かない） */
            <div className="w-full max-w-3xl space-y-6">
              <div className="p-3.5 rounded-2xl bg-neutral-800/70 border border-neutral-700/80 text-center max-w-md mx-auto space-y-1">
                <div className="text-xs font-semibold text-neutral-200 flex items-center justify-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-apple-green" />
                  <span>独立人脈ノード（相互の接点・関係性は未確認）</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Zoom予定や同一URLがあっても、人物同士が勝手に繋がることはありません。「AさんがBさんを紹介した」などの確証がある場合のみ関係線（エッジ）が描画されます。
                </p>
              </div>

              {/* 独立した人脈ノード一覧 */}
              <div className="flex flex-wrap items-center justify-center gap-6">
                {persons.map((p) => {
                  const bni = store.getBNIMembershipsForPerson(p.id)[0];
                  const org = store.getOrgMembershipsForPerson(p.id)[0];
                  const subtitle = bni?.category || org?.organization_name || (p.category_tags[0] ? p.category_tags[0] : '人脈メンバー');

                  return (
                    <div
                      key={p.id}
                      onClick={() => onSelectPerson(p.id)}
                      className="cursor-pointer group flex flex-col items-center space-y-2 p-3 rounded-2xl bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/60 hover:border-apple-blue/50 transition-all hover:scale-105"
                    >
                      <div className="relative">
                        <UserAvatar name={p.display_name} avatarUrl={p.avatar_url} size="xl" />
                        {p.status === 'provisional' && (
                          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-black shadow-xs">
                            仮
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold text-white group-hover:text-apple-blue transition-colors">
                          {p.display_name}
                        </div>
                        <div className="text-[10px] text-neutral-400 max-w-[120px] truncate mt-0.5">
                          {subtitle}
                        </div>
                        {p.category_tags.length > 0 && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md text-[9px] bg-neutral-700/70 text-neutral-300">
                            {p.category_tags[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 関係性が存在する場合: 実際の結線エッジを描画 */
            <div className="w-full max-w-3xl space-y-6">
              {/* 関係性リスト・結線表示 */}
              <div className="space-y-4">
                {relationships.map((rel) => {
                  const fromP = store.getPersonById(rel.from_person_id);
                  const toP = store.getPersonById(rel.to_person_id);
                  if (!fromP || !toP) return null;

                  return (
                    <div
                      key={rel.id}
                      className="p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                      {/* 発信側人物 */}
                      <div
                        onClick={() => onSelectPerson(fromP.id)}
                        className="cursor-pointer group flex items-center space-x-3"
                      >
                        <UserAvatar name={fromP.display_name} avatarUrl={fromP.avatar_url} size="lg" />
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-apple-blue flex items-center space-x-1">
                            <span>{fromP.display_name}</span>
                            {fromP.status === 'provisional' && (
                              <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500 text-black">仮</span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {fromP.category_tags[0] || '人脈メンバー'}
                          </div>
                        </div>
                      </div>

                      {/* 結線 & 関係性ラベル */}
                      <div className="flex-1 flex flex-col items-center space-y-1 w-full sm:w-auto">
                        <div className="w-full flex items-center space-x-2">
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-emerald-500 to-apple-blue"></div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-xs ${
                            mode === 'actual'
                              ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                              : 'bg-indigo-950/70 border-indigo-700 text-indigo-300'
                          }`}>
                            {rel.relationship_type}
                          </span>
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-apple-blue to-emerald-500"></div>
                        </div>
                        <div className="text-[10px] text-neutral-400 text-center max-w-xs truncate">
                          根拠: {rel.evidence_text}
                        </div>
                      </div>

                      {/* 受信側人物 */}
                      <div
                        onClick={() => onSelectPerson(toP.id)}
                        className="cursor-pointer group flex items-center space-x-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-apple-blue text-right flex items-center justify-end space-x-1">
                            <span>{toP.display_name}</span>
                            {toP.status === 'provisional' && (
                              <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500 text-black">仮</span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 text-right">
                            {toP.category_tags[0] || '人脈メンバー'}
                          </div>
                        </div>
                        <UserAvatar name={toP.display_name} avatarUrl={toP.avatar_url} size="lg" />
                      </div>

                      {/* 削除ボタン */}
                      <button
                        onClick={() => handleDeleteRelationship(rel.id)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 transition-colors"
                        title="関係性を削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 関係性に含まれていない他の独立人脈ノード */}
              {persons.some(p => !relationships.some(r => r.from_person_id === p.id || r.to_person_id === p.id)) && (
                <div className="pt-4 border-t border-neutral-800">
                  <div className="text-[11px] text-neutral-400 mb-3 text-center">その他の独立実人脈（接点未確認）:</div>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {persons
                      .filter(p => !relationships.some(r => r.from_person_id === p.id || r.to_person_id === p.id))
                      .map(p => (
                        <div
                          key={p.id}
                          onClick={() => onSelectPerson(p.id)}
                          className="cursor-pointer group flex items-center space-x-2 p-2 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-700/50"
                        >
                          <UserAvatar name={p.display_name} avatarUrl={p.avatar_url} size="sm" />
                          <span className="text-xs text-white group-hover:text-apple-blue">{p.display_name}</span>
                          {p.status === 'provisional' && (
                            <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500 text-black">仮</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 下部キャプション */}
        <div className="relative z-10 text-[11px] text-neutral-400 bg-black/40 backdrop-blur-sm p-3 rounded-2xl border border-neutral-800 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-neutral-400" />
            <span>ノードをタップすると詳細カルテと交わした約束を表示できます</span>
          </span>
          <span className="text-neutral-500 font-mono text-[10px]">2D Interactive Graph</span>
        </div>
      </div>

      {/* 手動関係性追加モーダル */}
      {isAddRelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleCreateRelationship} className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl border border-apple-border dark:border-apple-darkBorder p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
              <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-apple-blue" />
                <span>人脈同士の実関係を記録</span>
              </h3>
              <button type="button" onClick={() => setIsAddRelModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-500 font-semibold mb-1">人物A（起点） *</label>
                <select
                  value={fromPersonId}
                  onChange={(e) => setFromPersonId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7]"
                >
                  {persons.map(p => (
                    <option key={p.id} value={p.id}>{p.display_name} {p.status === 'provisional' ? '(仮登録)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 font-semibold mb-1">人物B（相手） *</label>
                <select
                  value={toPersonId}
                  onChange={(e) => setToPersonId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7]"
                >
                  {persons.filter(p => p.id !== fromPersonId).map(p => (
                    <option key={p.id} value={p.id}>{p.display_name} {p.status === 'provisional' ? '(仮登録)' : ''}</option>
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
                  placeholder="例: 11月9日の面談で紹介された、同じ案件で連携中など"
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
