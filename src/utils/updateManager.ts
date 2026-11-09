/**
 * PWA & ブラウザキャッシュ更新ユーティリティ
 * ホーム画面追加（スタンドアローン）時でも古いキャッシュを破棄して最新版を即時取得
 */

export const forceReloadApp = async (): Promise<void> => {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }
  } catch (e) {
    console.warn('Cache clear error:', e);
  }

  // クエリパラメータにタイムスタンプを付与してキャッシュを完全回避し強制リロード
  const url = new URL(window.location.href);
  url.searchParams.set('_v', Date.now().toString());
  window.location.replace(url.toString());
};

export const checkIsUpdateAvailable = async (currentBuildTime: string): Promise<boolean> => {
  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data && data.version && data.version !== currentBuildTime) {
      return true;
    }
  } catch {
    // ネットワーク未接続時は何もしない
  }
  return false;
};
