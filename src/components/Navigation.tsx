import React from 'react';
import {
  Home, Users, Network, Share2, Calendar,
  Bot, AlertCircle, Settings, Plus, Building2, CreditCard
} from 'lucide-react';

export type ViewType =
  | 'home'
  | 'persons'
  | 'bni'
  | 'graph'
  | 'cards'
  | 'referrals'
  | 'meetings'
  | 'concierge'
  | 'review-queue'
  | 'settings';

interface NavigationProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  onOpenQuickAdd: () => void;
  reviewCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  onOpenQuickAdd,
  reviewCount,
}) => {
  const navItems: { id: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'ホーム', icon: Home },
    { id: 'persons', label: '人物カルテ', icon: Users },
    { id: 'cards', label: '名刺OCR', icon: CreditCard },
    { id: 'bni', label: 'BNIマスター', icon: Building2 },
    { id: 'graph', label: '人脈相関図', icon: Network },
    { id: 'referrals', label: '紹介ハブ', icon: Share2 },
    { id: 'meetings', label: '予定・会話', icon: Calendar },
    { id: 'concierge', label: 'AI秘書', icon: Bot },
    { id: 'review-queue', label: '確認待ち', icon: AlertCircle },
    { id: 'settings', label: '設定・原価', icon: Settings },
  ];

  return (
    <>
      {/* PC サイドバー (デスクトップ) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-apple-border dark:border-apple-darkBorder bg-apple-card dark:bg-apple-darkCard shrink-0 select-none">
        <div className="p-5 border-b border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-apple-blue dark:bg-apple-darkBlue flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              AI
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight text-[#1D1D1F] dark:text-[#F5F5F7]">人脈コンシェルジュ</h1>
              <p className="text-[11px] text-neutral-500">人を忘れず、大事にする</p>
            </div>
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={onOpenQuickAdd}
            className="w-full h-11 px-4 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium text-sm flex items-center justify-center space-x-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>予定・名刺を追加</span>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-neutral-200/60 dark:bg-neutral-800 text-apple-blue dark:text-apple-darkBlue font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-apple-blue dark:text-apple-darkBlue' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'review-queue' && reviewCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-apple-amber dark:bg-apple-darkAmber text-white">
                    {reviewCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-apple-border dark:border-apple-darkBorder text-xs text-neutral-500 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-apple-green dark:bg-apple-darkGreen inline-block"></span>
            <span>RLS保護稼働中</span>
          </span>
          <span className="text-[11px] font-mono">v1.0-pwa</span>
        </div>
      </aside>

      {/* スマホ 下部固定タブバー (5タブ / 44px+ タップ領域) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 apple-glass border-t border-apple-border dark:border-apple-darkBorder flex items-center justify-around px-2 py-1.5 safe-area-bottom">
        <button
          onClick={() => onSelectView('home')}
          className={`flex flex-col items-center justify-center touch-target flex-1 py-1 ${
            currentView === 'home' ? 'text-apple-blue dark:text-apple-darkBlue' : 'text-neutral-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">ホーム</span>
        </button>

        <button
          onClick={() => onSelectView('persons')}
          className={`flex flex-col items-center justify-center touch-target flex-1 py-1 ${
            currentView === 'persons' ? 'text-apple-blue dark:text-apple-darkBlue' : 'text-neutral-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">人物</span>
        </button>

        {/* ＋ボタン（中央タップ） */}
        <button
          onClick={onOpenQuickAdd}
          className="flex flex-col items-center justify-center touch-target px-2"
          aria-label="追加"
        >
          <div className="w-10 h-10 rounded-full bg-apple-blue dark:bg-apple-darkBlue text-white flex items-center justify-center shadow-md active:scale-95 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => onSelectView('graph')}
          className={`flex flex-col items-center justify-center touch-target flex-1 py-1 ${
            currentView === 'graph' ? 'text-apple-blue dark:text-apple-darkBlue' : 'text-neutral-400'
          }`}
        >
          <Network className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">相関図</span>
        </button>

        <button
          onClick={() => onSelectView('concierge')}
          className={`flex flex-col items-center justify-center touch-target flex-1 py-1 ${
            currentView === 'concierge' ? 'text-apple-blue dark:text-apple-darkBlue' : 'text-neutral-400'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">AI秘書</span>
        </button>
      </nav>
    </>
  );
};
