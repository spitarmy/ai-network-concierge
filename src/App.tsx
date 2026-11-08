import React, { useState, useEffect } from 'react';
import { Navigation, ViewType } from './components/Navigation';
import { Header } from './components/Header';
import { QuickAddModal } from './components/QuickAddModal';
import { HomeView } from './views/HomeView';
import { PersonsView } from './views/PersonsView';
import { BNIView } from './views/BNIView';
import { GraphView } from './views/GraphView';
import { ReferralsView } from './views/ReferralsView';
import { MeetingsView } from './views/MeetingsView';
import { CardsView } from './views/CardsView';
import { AIConciergeView } from './views/AIConciergeView';
import { ReviewQueueView } from './views/ReviewQueueView';
import { SettingsView } from './views/SettingsView';
import { LegalView } from './views/LegalView';
import { PresentationView } from './views/PresentationView';
import { store } from './services/store';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [, setRefreshKey] = useState(0);

  // 初期ダークモードおよび設定の復元
  useEffect(() => {
    const savedTheme = localStorage.getItem('ai_concierge_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    const savedSimple = localStorage.getItem('ai_concierge_simple_mode');
    if (savedSimple === 'true') {
      setIsSimpleMode(true);
    }

    // 本番移行: ブラウザキャッシュに古いサンプル人物が残っている場合は即時完全パージ
    if (store.getPersons().some(p => ['p-yamada', 'p-tanaka', 'p-sato', 'p-nakamura-prov'].includes(p.id))) {
      store.purgeSamplePersons();
      setRefreshKey(k => k + 1);
    }

    // URLハッシュまたはパスによる法的文書画面（/privacy, /terms）や営業スライド（/deck）への遷移
    const checkPath = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/privacy' || hash === '#/privacy' || hash === '#privacy') {
        setCurrentView('privacy');
      } else if (path === '/terms' || hash === '#/terms' || hash === '#terms') {
        setCurrentView('terms');
      } else if (path === '/deck' || path === '/presentation' || hash === '#/deck' || hash === '#deck' || hash === '#/presentation') {
        setCurrentView('deck');
      }
    };
    checkPath();
    window.addEventListener('hashchange', checkPath);
    return () => window.removeEventListener('hashchange', checkPath);
  }, []);

  // PWA自動更新チェッカー（ホーム画面に追加している端末でも新バージョンを自動反映）
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch('/?_v=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) return;
        const html = await response.text();
        const scriptMatch = html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/);
        if (scriptMatch) {
          const currentScript = document.querySelector('script[src*="/assets/index-"]')?.getAttribute('src');
          if (currentScript && scriptMatch[0] !== currentScript) {
            // 新バージョンがサーバーにデプロイされているのを検知 -> 自動リロードして最新版を適用
            window.location.reload();
          }
        }
      } catch {
        // オフライン時は無視
      }
    };

    // 起動時およびバックグラウンドから復帰した時にチェック
    checkForUpdates();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleToggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('ai_concierge_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('ai_concierge_theme', 'light');
      }
      return next;
    });
  };

  const handleToggleSimpleMode = () => {
    setIsSimpleMode(prev => {
      const next = !prev;
      localStorage.setItem('ai_concierge_simple_mode', String(next));
      return next;
    });
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectPerson = (personId: string) => {
    setSelectedPersonId(personId);
    setCurrentView('persons');
  };

  const handleSelectTenant = (tenantId: string) => {
    store.setTenantId(tenantId);
    setSelectedPersonId(undefined);
    handleRefresh();
  };

  const currentTenant = store.getCurrentTenant();
  const reviewCount = store.getReviewQueue().length;

  if (currentView === 'deck') {
    return <PresentationView onBack={() => setCurrentView('home')} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-apple-bg dark:bg-apple-darkBg text-[#1D1D1F] dark:text-[#F5F5F7]">
      {/* PC サイドバー & スマホ 下部タブバー */}
      <Navigation
        currentView={currentView}
        onSelectView={(view) => {
          setSelectedPersonId(undefined);
          setCurrentView(view);
        }}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        reviewCount={reviewCount}
      />

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* グローバルヘッダー */}
        <Header
          currentTenant={currentTenant}
          tenants={store.getTenants()}
          onSelectTenant={handleSelectTenant}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          isSimpleMode={isSimpleMode}
          onToggleSimpleMode={handleToggleSimpleMode}
          onSearchClick={() => setCurrentView('concierge')}
          reviewCount={reviewCount}
          onReviewClick={() => setCurrentView('review-queue')}
        />

        {/* 画面ビュー切り替え */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'home' && (
            <HomeView
              isSimpleMode={isSimpleMode}
              onSelectPerson={handleSelectPerson}
              onNavigate={(v) => setCurrentView(v)}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            />
          )}

          {currentView === 'persons' && (
            <PersonsView
              selectedPersonId={selectedPersonId}
              onClosePersonDetail={() => setSelectedPersonId(undefined)}
              onRefresh={handleRefresh}
            />
          )}

          {currentView === 'bni' && (
            <BNIView
              onSelectPerson={handleSelectPerson}
              onRefresh={handleRefresh}
            />
          )}

          {currentView === 'cards' && (
            <CardsView />
          )}

          {currentView === 'graph' && (
            <GraphView onSelectPerson={handleSelectPerson} />
          )}

          {currentView === 'referrals' && (
            <ReferralsView />
          )}

          {currentView === 'meetings' && (
            <MeetingsView onOpenQuickAdd={() => setIsQuickAddOpen(true)} />
          )}

          {currentView === 'concierge' && (
            <AIConciergeView onSelectPerson={handleSelectPerson} />
          )}

          {currentView === 'review-queue' && (
            <ReviewQueueView
              onRefresh={handleRefresh}
              onSelectPerson={handleSelectPerson}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              onRefresh={handleRefresh}
              onNavigate={(v) => setCurrentView(v)}
            />
          )}

          {currentView === 'privacy' && (
            <LegalView
              initialTab="privacy"
              onBack={() => setCurrentView('home')}
            />
          )}

          {currentView === 'terms' && (
            <LegalView
              initialTab="terms"
              onBack={() => setCurrentView('home')}
            />
          )}
        </main>
      </div>

      {/* クイック追加モーダルシート */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onRefresh={handleRefresh}
      />
    </div>
  );
};
