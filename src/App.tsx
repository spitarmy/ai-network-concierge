import React, { useState, useEffect, useCallback } from 'react';
import { Navigation, ViewType } from './components/Navigation';
import { Header } from './components/Header';
import { QuickAddModal } from './components/QuickAddModal';
import { IdentifyParticipantModal } from './components/IdentifyParticipantModal';
import { ThankYouFollowUpModal } from './components/ThankYouFollowUpModal';
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
import { checkIsUpdateAvailable, forceReloadApp } from './utils/updateManager';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [identifyingMeetingId, setIdentifyingMeetingId] = useState<string | null>(null);
  const [thankYouMeetingId, setThankYouMeetingId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [, setRefreshKey] = useState(0);

  const runCloudAndZoomSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await store.syncAllWithCloud();
      if (res.updated) {
        setRefreshKey(k => k + 1);
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

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

    // 旧キャッシュの誤表記や重複予定を自動統合
    if (store.reconcileLegacyAndDuplicateData()) {
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

  // PWA自動更新チェッカー & PC/スマホ・Zoom全自動クラウド同期エンジン
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        if (typeof __BUILD_TIMESTAMP__ !== 'undefined') {
          const isNewer = await checkIsUpdateAvailable(__BUILD_TIMESTAMP__);
          if (isNewer) {
            setUpdateAvailable(true);
            return;
          }
        }

        const response = await fetch('/?_v=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) return;
        const html = await response.text();
        const scriptMatch = html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/);
        if (scriptMatch) {
          const currentScript = document.querySelector('script[src*="/assets/index-"]')?.getAttribute('src');
          if (currentScript && scriptMatch[0] !== currentScript) {
            setUpdateAvailable(true);
          }
        }
      } catch {
        // オフライン時は無視
      }
    };

    checkForUpdates();
    runCloudAndZoomSync();

    const updateInterval = setInterval(checkForUpdates, 30000);
    const syncInterval = setInterval(runCloudAndZoomSync, 12000); // 12秒ごとにPC・スマホ・Zoom自動同期

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
        runCloudAndZoomSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(updateInterval);
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [runCloudAndZoomSync]);

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
    store.pushStateToCloud().then(updated => {
      if (updated) setRefreshKey(prev => prev + 1);
    });
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
          updateAvailable={updateAvailable}
          isSyncing={isSyncing}
          onManualSync={runCloudAndZoomSync}
        />

        {/* 新バージョン配信バナー（PWA・ホーム画面利用時用） */}
        {updateAvailable && (
          <div className="bg-gradient-to-r from-apple-blue to-indigo-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between shadow-md z-20 shrink-0 animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-2 min-w-0 mr-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping shrink-0" />
              <span className="truncate">最新版が届いています（PC/スマホ自動同期・Zoom全自動要約・夢叶開発カルテ反映）</span>
            </div>
            <button
              onClick={() => forceReloadApp()}
              className="px-3 py-1 bg-white text-apple-blue rounded-full text-xs font-bold hover:bg-neutral-100 active:scale-95 transition-all shadow shrink-0"
            >
              今すぐ更新
            </button>
          </div>
        )}

        {/* 画面ビュー切り替え */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'home' && (
            <HomeView
              isSimpleMode={isSimpleMode}
              onSelectPerson={handleSelectPerson}
              onNavigate={(v) => setCurrentView(v)}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onOpenIdentify={(mId) => setIdentifyingMeetingId(mId)}
              onOpenThankYou={(mId) => setThankYouMeetingId(mId)}
            />
          )}

          {currentView === 'persons' && (
            <PersonsView
              selectedPersonId={selectedPersonId}
              onClosePersonDetail={() => setSelectedPersonId(undefined)}
              onRefresh={handleRefresh}
              onOpenThankYou={(mId) => setThankYouMeetingId(mId)}
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
            <MeetingsView
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onOpenIdentify={(mId) => setIdentifyingMeetingId(mId)}
              onOpenThankYou={(mId) => setThankYouMeetingId(mId)}
              onSelectPerson={handleSelectPerson}
              onManualSync={runCloudAndZoomSync}
              isSyncing={isSyncing}
            />
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

      {/* Zoom中相手特定・カルテ昇格モーダルシート */}
      <IdentifyParticipantModal
        isOpen={!!identifyingMeetingId}
        meetingId={identifyingMeetingId}
        onClose={() => setIdentifyingMeetingId(null)}
        onSuccess={(personId) => {
          handleRefresh();
          handleSelectPerson(personId);
        }}
      />

      {/* お礼文＆相互要約手動送信モーダルシート */}
      <ThankYouFollowUpModal
        isOpen={!!thankYouMeetingId}
        meetingId={thankYouMeetingId}
        onClose={() => setThankYouMeetingId(null)}
      />
    </div>
  );
};
