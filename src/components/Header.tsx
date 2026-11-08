import React from 'react';
import { Search, Moon, Sun, AlertTriangle, Layers, LayoutDashboard } from 'lucide-react';
import { Tenant } from '../types';

interface HeaderProps {
  currentTenant: Tenant;
  tenants: Tenant[];
  onSelectTenant: (tenantId: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isSimpleMode: boolean;
  onToggleSimpleMode: () => void;
  onSearchClick: () => void;
  reviewCount: number;
  onReviewClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTenant,
  tenants,
  onSelectTenant,
  isDarkMode,
  onToggleDarkMode,
  isSimpleMode,
  onToggleSimpleMode,
  onSearchClick,
  reviewCount,
  onReviewClick,
}) => {
  const budgetRatio = currentTenant.current_spend_jpy / currentTenant.monthly_budget_jpy;
  const isBudgetWarning = budgetRatio >= 0.8;

  return (
    <header className="sticky top-0 z-30 apple-glass border-b border-apple-border dark:border-apple-darkBorder h-14 flex items-center justify-between px-4 sm:px-6">
      {/* 検索トリガー (Cmd+K 風) */}
      <div className="flex items-center space-x-3 flex-1 max-w-md">
        <button
          onClick={onSearchClick}
          className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/80 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xs sm:text-sm transition-all"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="truncate">名前、話題、会社、チャプターを検索...</span>
          <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-neutral-700 rounded border border-neutral-300 dark:border-neutral-600 text-neutral-500">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* 右側アクション群 */}
      <div className="flex items-center space-x-2 sm:space-x-3 ml-2">
        {/* テナント切替（RLS隔離検証用） */}
        <select
          value={currentTenant.id}
          onChange={(e) => onSelectTenant(e.target.value)}
          aria-label="テナント切り替え"
          className="text-xs bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder rounded-lg px-2 py-1 text-neutral-700 dark:text-neutral-300 focus:outline-none"
        >
          {tenants.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {/* 原価・節約モードインジケータ */}
        <div
          title={`月間AI予算: ¥${currentTenant.current_spend_jpy.toLocaleString()} / ¥${currentTenant.monthly_budget_jpy.toLocaleString()}`}
          className={`hidden lg:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
            isBudgetWarning
              ? 'bg-amber-100 dark:bg-amber-950/50 text-apple-amber dark:text-apple-darkAmber'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}
        >
          {isBudgetWarning && <AlertTriangle className="w-3.5 h-3.5" />}
          <span>
            {currentTenant.is_budget_throttled ? '節約モード' : `原価 ¥${Math.round(currentTenant.current_spend_jpy)}`}
          </span>
        </div>

        {/* レビューキュー通知 */}
        {reviewCount > 0 && (
          <button
            onClick={onReviewClick}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-apple-amber/10 dark:bg-apple-darkAmber/20 text-apple-amber dark:text-apple-darkAmber text-xs font-semibold hover:opacity-80 transition-opacity"
            title={`${reviewCount}件の確認待ちがあります`}
          >
            <span className="w-2 h-2 rounded-full bg-apple-amber dark:bg-apple-darkAmber animate-pulse"></span>
            <span>確認待ち {reviewCount}</span>
          </button>
        )}

        {/* シンプル / ダッシュボード切替 */}
        <button
          onClick={onToggleSimpleMode}
          title={isSimpleMode ? 'ダッシュボードモードへ切替' : 'シンプルモードへ切替'}
          className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {isSimpleMode ? <LayoutDashboard className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
        </button>

        {/* ライト / ダーク切替 */}
        <button
          onClick={onToggleDarkMode}
          title={isDarkMode ? 'ライトモードへ' : 'ダークモードへ'}
          className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
