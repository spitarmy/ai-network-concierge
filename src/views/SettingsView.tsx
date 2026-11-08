import React from 'react';
import {
  Shield, DollarSign, Database,
  CheckCircle2, XCircle
} from 'lucide-react';
import { store } from '../services/store';

interface SettingsViewProps {
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefresh }) => {
  const currentTenant = store.getCurrentTenant();
  const costLedger = store.getCostLedger();
  const auditLogs = store.getAuditLogs();

  const budgetUsagePercent = Math.min(
    100,
    Math.round((currentTenant.current_spend_jpy / currentTenant.monthly_budget_jpy) * 100)
  );

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-24 animate-fadeIn">
      <div>
        <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">設定・原価管理・セキュリティ監査</h1>
        <p className="text-xs text-neutral-500">
          月間AI予算ガードレール、RLSマルチテナント隔離、外部API接続実態 (仕様13, 33, 34)
        </p>
      </div>

      {/* 原価・予算ガードレールカード (仕様33, 34) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            <DollarSign className="w-4 h-4 text-apple-green" />
            <span>月間AI運用原価 & 予算ガードレール（目安: ¥4,980/月）</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            currentTenant.is_budget_throttled
              ? 'bg-amber-100 text-apple-amber'
              : 'bg-apple-green/10 text-apple-green'
          }`}>
            {currentTenant.is_budget_throttled ? '節約モード発動中 (低優先AI停止)' : '通常稼働中'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-300">
            <span>当月消化額: ¥{Math.round(currentTenant.current_spend_jpy).toLocaleString()}</span>
            <span>予算上限: ¥{currentTenant.monthly_budget_jpy.toLocaleString()} ({budgetUsagePercent}%)</span>
          </div>

          {/* プログレスバー */}
          <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                budgetUsagePercent >= 100 ? 'bg-red-500' :
                budgetUsagePercent >= 80 ? 'bg-amber-500' : 'bg-apple-blue'
              }`}
              style={{ width: `${budgetUsagePercent}%` }}
            ></div>
          </div>

          <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-1">
            <span>80%到達で静かな警告、100%到達で高コストAI処理を自動遮断</span>
            <button
              onClick={() => {
                // テスト用に原価を¥2,800追加して節約モードを発動させる
                store.recordAICost('bot_minutes', 'External-Bot', 120, 2800, '外部有償ボット稼働テスト (予算超過シミュレーション)');
                onRefresh();
              }}
              className="text-apple-blue hover:underline text-[11px]"
            >
              ＋原価加算テスト（節約モード検証）
            </button>
          </div>
        </div>

        {/* 原価内訳テーブル */}
        <div className="pt-3 border-t border-apple-border dark:border-apple-darkBorder space-y-2">
          <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">直近のAI消費台帳 (ai_cost_ledger)</h4>
          <div className="divide-y divide-apple-border dark:divide-apple-darkBorder text-xs">
            {costLedger.slice(0, 4).map(c => (
              <div key={c.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium text-neutral-800 dark:text-neutral-200">{c.description}</div>
                  <div className="text-[10px] text-neutral-400">{c.provider} • {new Date(c.created_at).toLocaleString('ja-JP')}</div>
                </div>
                <div className="font-mono font-medium text-neutral-700 dark:text-neutral-300">
                  ¥{c.cost_jpy.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 外部サービス接続の現実性チェック (docs/INTEGRATIONS.md 準拠) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 pb-3 border-b border-apple-border dark:border-apple-darkBorder">
          <Database className="w-4 h-4 text-apple-blue" />
          <span>外部サービス接続の現実性・認可状況（虚偽の連携表示禁止）</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-apple-border dark:border-apple-darkBorder flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-apple-green shrink-0 mt-0.5" />
            <div>
              <strong>Zoom (自ホスト):</strong> クラウド録画Webhook取得可能
              <p className="text-[11px] text-neutral-400 mt-0.5">自ホスト会議のみ自動取得。相手ホストは手動取込またはボット誘導。</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-apple-border dark:border-apple-darkBorder flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-apple-green shrink-0 mt-0.5" />
            <div>
              <strong>Google カレンダー / 連絡先:</strong> OAuth読取対応
              <p className="text-[11px] text-neutral-400 mt-0.5">予定URLハッシュ重複検知機構および一括名寄せドライラン完備。</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-apple-border dark:border-apple-darkBorder flex items-start space-x-2.5">
            <XCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <strong>個人LINE:</strong> 直接API自動取得なし（公式仕様）
              <p className="text-[11px] text-neutral-400 mt-0.5">個人トーク取得APIは存在しないため、アプリへの文章直接貼付で対応。</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-apple-border dark:border-apple-darkBorder flex items-start space-x-2.5">
            <XCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <strong>TimeTree:</strong> 外部API終了済み（2023/12公式終了）
              <p className="text-[11px] text-neutral-400 mt-0.5">TimeTree Connect終了に伴い、直接自動取得は行わず手動登録扱い。</p>
            </div>
          </div>
        </div>
      </div>

      {/* 監査ログ (Audit Log) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          <Shield className="w-4 h-4 text-apple-blue" />
          <span>監査ログ（変更証跡・削除証跡・RLS保護）</span>
        </div>
        <div className="divide-y divide-apple-border dark:divide-apple-darkBorder text-xs">
          {auditLogs.slice(0, 5).map(a => (
            <div key={a.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-mono font-semibold text-apple-blue">{a.action}</span>
                <span className="text-neutral-400 ml-2">({a.resource_type})</span>
              </div>
              <span className="text-[11px] text-neutral-400">{new Date(a.created_at).toLocaleString('ja-JP')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
