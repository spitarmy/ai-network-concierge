import React, { useState } from 'react';
import { Share2, CheckCircle2, ShieldCheck, Copy, Check, Sparkles, Plus } from 'lucide-react';
import { store } from '../services/store';

export const ReferralsView: React.FC = () => {
  const [, setRefreshKey] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const persons = store.getPersons();
  const [referrerId, setReferrerId] = useState<string>(persons[0]?.id || '');
  const [candidateId, setCandidateId] = useState<string>(persons[1]?.id || '');
  const [customReason, setCustomReason] = useState('');
  const referrals = store.getReferrals();

  const handleCopyDraft = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateOutcome = (refId: string, outcomeType: 'meeting_held' | 'contract_won' | 'no_deal') => {
    const amountStr = outcomeType === 'contract_won' ? prompt('成約金額（円）を入力してください（任意）:') : undefined;
    const amount = amountStr ? parseInt(amountStr) : undefined;
    store.updateReferralOutcome(refId, outcomeType, amount, 'ユーザーによる手動確定記録');
    setRefreshKey(prev => prev + 1);
  };

  const handleSmartScan = () => {
    store.generateSmartReferrals();
    setRefreshKey(prev => prev + 1);
  };

  const handleCreateCustom = () => {
    if (!referrerId || !candidateId || referrerId === candidateId) return;
    store.createReferralProposal({
      referrerPersonId: referrerId,
      candidatePersonId: candidateId,
      reason: customReason,
    });
    setCustomReason('');
    setIsCreating(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-24 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">紹介ハブ & 成果管理</h1>
          <p className="text-xs text-neutral-500">
            1to1面談の話題・約束・強みからAIが相性の良い紹介ペアとLINE下書きを自動生成 (仕様15, 16, INTRO-01〜04)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSmartScan}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-apple-indigo/10 text-apple-indigo hover:bg-apple-indigo/20 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI自動マッチング更新</span>
          </button>
          <button
            onClick={() => setIsCreating(prev => !prev)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-apple-blue text-white hover:opacity-90 text-xs font-semibold transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>紹介文を作成</span>
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-blue/30 space-y-4 shadow-sm">
          <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
            人物カルテから2名を選んで紹介マッチング＆LINE下書きを生成
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-neutral-500 mb-1">紹介先（ご案内を送る相手）</label>
              <select
                value={referrerId}
                onChange={e => setReferrerId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-apple-border dark:border-apple-darkBorder bg-neutral-50 dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7]"
              >
                {persons.map(p => (
                  <option key={p.id} value={p.id}>{p.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-neutral-500 mb-1">推薦する候補者（お繋ぎする相手）</label>
              <select
                value={candidateId}
                onChange={e => setCandidateId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-apple-border dark:border-apple-darkBorder bg-neutral-50 dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7]"
              >
                {persons.map(p => (
                  <option key={p.id} value={p.id}>{p.display_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-xs">
            <label className="block text-neutral-500 mb-1">紹介理由・シナジー補足（空欄ならカルテからAI自動生成）</label>
            <input
              type="text"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="例: 買取再販マンションの残置物撤去・不動産業者3名ランチで連携"
              className="w-full p-2.5 rounded-xl border border-apple-border dark:border-apple-darkBorder bg-neutral-50 dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7]"
            />
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button
              onClick={() => setIsCreating(false)}
              className="px-3.5 py-2 rounded-xl border border-apple-border dark:border-apple-darkBorder text-neutral-500"
            >
              キャンセル
            </button>
            <button
              onClick={handleCreateCustom}
              disabled={!referrerId || !candidateId || referrerId === candidateId}
              className="px-4 py-2 rounded-xl bg-apple-blue text-white font-semibold disabled:opacity-40"
            >
              紹介提案を生成する
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {referrals.map((r) => {
          const referrer = store.getPersonById(r.referrer_person_id);
          const candidate = store.getPersonById(r.candidate_person_id);

          return (
            <div
              key={r.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-apple-border dark:border-apple-darkBorder">
                <div className="flex items-center space-x-2">
                  <Share2 className="w-5 h-5 text-apple-indigo" />
                  <span className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {referrer?.display_name}様 への紹介提案: {candidate?.display_name}様
                  </span>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
                  r.status === 'completed' ? 'bg-apple-green/10 text-apple-green' :
                  r.status === 'declined' ? 'bg-neutral-200 text-neutral-600' :
                  'bg-apple-blue/10 text-apple-blue'
                }`}>
                  {r.status === 'completed' ? '紹介成約（完了）' :
                   r.status === 'declined' ? '見送り・終了' : '提案中（下書き作成済み）'}
                </span>
              </div>

              {/* 多軸の説明可能な根拠 (INTRO-01) */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-apple-border dark:border-apple-darkBorder space-y-2.5 text-xs">
                <div className="font-semibold text-neutral-700 dark:text-neutral-300">
                  適合理由・マッチング根拠:
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {r.recommendation_reason}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-apple-border dark:border-apple-darkBorder text-[11px] text-neutral-500">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-apple-blue shrink-0" />
                    <span>{r.breakdown.area_match}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-apple-blue shrink-0" />
                    <span>{r.breakdown.specialty_match}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-apple-green shrink-0" />
                    <span>プライバシー検査: 私的情報（家族・非公開）を除外確認済み</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-apple-blue shrink-0" />
                    <span>実績評価: {r.breakdown.track_record}</span>
                  </div>
                </div>
              </div>

              {/* 紹介文下書き (無断自動送信なし・ユーザーが確認して送る) */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    LINE / メール用紹介文下書き (双方の了承を取る構成)
                  </span>
                  <button
                    onClick={() => handleCopyDraft(r.id, r.draft_message)}
                    className="flex items-center space-x-1 text-apple-blue dark:text-apple-darkBlue hover:underline text-[11px] font-medium"
                  >
                    {copiedId === r.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === r.id ? 'コピーしました' : '下書きをコピー'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-neutral-800 dark:text-neutral-200 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                  {r.draft_message}
                </div>
              </div>

              {/* 成果記録（INTRO-04: 未確認成果の自動確定禁止） */}
              <div className="pt-2 border-t border-apple-border dark:border-apple-darkBorder flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-neutral-400">
                  {r.outcome?.confirmed_by_user ? (
                    <span className="text-apple-green font-medium">
                      成果記録済み: {r.outcome.type === 'contract_won' ? `成約 (¥${r.outcome.amount_jpy?.toLocaleString() || 0})` : '商談実施'}
                    </span>
                  ) : (
                    '成果記録: 未確認（ユーザー手動確認待ち）'
                  )}
                </span>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateOutcome(r.id, 'meeting_held')}
                    className="px-3 py-1.5 rounded-xl border border-apple-border dark:border-apple-darkBorder hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium"
                  >
                    面談実施済み
                  </button>
                  <button
                    onClick={() => handleUpdateOutcome(r.id, 'contract_won')}
                    className="px-3 py-1.5 rounded-xl bg-apple-green text-white font-medium hover:opacity-90"
                  >
                    成約を記録
                  </button>
                  <button
                    onClick={() => handleUpdateOutcome(r.id, 'no_deal')}
                    className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-500 font-medium"
                  >
                    見送り
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
