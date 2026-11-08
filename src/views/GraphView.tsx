import React, { useState } from 'react';
import { Sparkles, Info, ShieldCheck, Network } from 'lucide-react';
import { store } from '../services/store';

interface GraphViewProps {
  onSelectPerson: (personId: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ onSelectPerson }) => {
  const [mode, setMode] = useState<'actual' | 'ai_suggested'>('actual');

  const persons = store.getPersons();
  const relationships = store.getRelationships(mode);

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-24 animate-fadeIn">
      {/* ヘッダー & モード切替 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">人脈相関図 (2D Graph)</h1>
          <p className="text-xs text-neutral-500">
            {mode === 'actual'
              ? '「確認済み実関係」のみを描画。推測関係は混入しません (仕様09, GRAPH-01)'
              : '「AI紹介推薦」に基づく潜在的な相関関係と根拠を表示 (仕様09, GRAPH-02)'}
          </p>
        </div>

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
      </div>

      {/* 2D Canvas相当の相関図カード */}
      <div className="relative w-full min-h-[460px] rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-inner flex flex-col justify-between p-6 select-none">
        {/* 背景の微細なグリッド */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

        {/* 上部ステータス */}
        <div className="relative z-10 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${mode === 'actual' ? 'bg-apple-green' : 'bg-apple-indigo'} animate-pulse`}></span>
            <span>{mode === 'actual' ? '実関係モード（根拠セグメント確定済み）' : 'AI推薦モード（紹介ニーズ合致）'}</span>
          </span>
          <span className="text-[11px] font-mono">ノード数: {persons.length} / エッジ: {relationships.length}</span>
        </div>

        {/* グラフ可視化（実データ動的レンダリング） */}
        <div className="relative z-10 flex-1 flex items-center justify-center my-6">
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
          ) : persons.length === 1 ? (
            <div className="text-center p-8 max-w-md space-y-4">
              <div
                onClick={() => onSelectPerson(persons[0].id)}
                className="cursor-pointer group inline-flex flex-col items-center space-y-2"
              >
                <div className="w-16 h-16 rounded-2xl p-1 bg-white/10 backdrop-blur-md border border-white/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                  <img
                    src={persons[0].avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt=""
                    className="w-full h-full rounded-xl object-cover"
                  />
                </div>
                <div className="text-xs font-semibold text-white group-hover:text-apple-blue transition-colors">
                  {persons[0].display_name}
                </div>
              </div>
              <p className="text-xs text-neutral-400">
                相関図の描画には2名以上の人脈が必要です。名刺や新しい人脈を追加すると自動的に結線されます。
              </p>
            </div>
          ) : (
            <div className="relative w-full max-w-2xl min-h-[220px] flex items-center justify-around flex-wrap gap-6 p-4">
              {/* SVG 結線エッジ */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line
                  x1="25%"
                  y1="50%"
                  x2="75%"
                  y2="50%"
                  stroke={mode === 'actual' ? '#30D158' : '#7D7AFF'}
                  strokeWidth="2.5"
                  strokeDasharray={mode === 'actual' ? 'none' : '5,5'}
                />
              </svg>

              {/* 登録されている上位ノードを動的表示 */}
              {persons.slice(0, 4).map((p) => {
                const bni = store.getBNIMembershipsForPerson(p.id)[0];
                const org = store.getOrgMembershipsForPerson(p.id)[0];
                const subtitle = bni?.category || org?.organization_name || p.phonetic_name || '人脈メンバー';

                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPerson(p.id)}
                    className="cursor-pointer group flex flex-col items-center space-y-2 z-10"
                  >
                    <div className="w-16 h-16 rounded-2xl p-1 bg-white/10 backdrop-blur-md border border-white/20 group-hover:scale-105 transition-transform flex items-center justify-center shadow-lg">
                      <img
                        src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt=""
                        className="w-full h-full rounded-xl object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold text-white group-hover:text-apple-blue transition-colors">
                        {p.display_name}
                      </div>
                      <div className="text-[10px] text-neutral-400 max-w-[100px] truncate">
                        {subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 中央の関係性ラベル */}
              <div className="z-10 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-neutral-700 text-[10px] text-neutral-300 text-center max-w-[160px] shadow-sm">
                {relationships.length > 0
                  ? relationships[0].evidence_text || relationships[0].relationship_type || (mode === 'actual' ? '面談・名刺交換済み' : 'AI紹介合致')
                  : mode === 'actual' ? '面談・名刺情報から連携中' : 'AI紹介マッチング待機中'}
              </div>
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
    </div>
  );
};
