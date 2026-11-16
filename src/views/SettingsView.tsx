import React, { useState, useRef } from 'react';
import {
  Shield, DollarSign, Database,
  CheckCircle2, XCircle, Download, Upload, RefreshCw, Trash2, FileSpreadsheet,
  Key, Copy, Check, FileText, Sparkles, ExternalLink
} from 'lucide-react';
import { store } from '../services/store';
import { Smartphone, RotateCw } from 'lucide-react';
import { forceReloadApp } from '../utils/updateManager';
import { getStoredGeminiApiKey, setStoredGeminiApiKey } from '../services/geminiAudioTranscribe';

interface SettingsViewProps {
  onRefresh: () => void;
  onNavigate?: (view: any) => void;
  onOpenOwnerSetup?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefresh, onNavigate, onOpenOwnerSetup }) => {
  const currentTenant = store.getCurrentTenant();
  const ownerProfile = store.getCurrentOwnerProfile();
  const isLockedTenant = store.isTenantLockedMode();
  const costLedger = store.getCostLedger();
  const auditLogs = store.getAuditLogs();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const oauthConfig = store.getOAuthConfig();
  const [zoomMode, setZoomMode] = useState<'bot' | 'cloud'>('bot');
  const [zoomAccountId, setZoomAccountId] = useState(
    currentTenant.id === 'tenant-001' ? (oauthConfig.zoom.account_id || '') : (ownerProfile.zoom_account_id || '')
  );
  const [zoomClientId, setZoomClientId] = useState(
    currentTenant.id === 'tenant-001' ? (oauthConfig.zoom.client_id || '') : (ownerProfile.zoom_client_id || '')
  );
  const [zoomClientSecret, setZoomClientSecret] = useState(
    currentTenant.id === 'tenant-001' ? (oauthConfig.zoom.client_secret || '') : (ownerProfile.zoom_client_secret || '')
  );
  const [zoomWebhookSecret, setZoomWebhookSecret] = useState(oauthConfig.zoom.webhook_secret_token || '');
  const [zoomTestResult, setZoomTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [googleClientId, setGoogleClientId] = useState(oauthConfig.google.client_id || '');
  const [googleClientSecret, setGoogleClientSecret] = useState(oauthConfig.google.client_secret || '');
  const [googleTestResult, setGoogleTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [geminiApiKey, setGeminiApiKey] = useState(getStoredGeminiApiKey());
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [copiedProvider, setCopiedProvider] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPlan, setNewMemberPlan] = useState<'4980' | '5980'>('4980');
  const [copiedTenantId, setCopiedTenantId] = useState<string | null>(null);
  const [invoiceTenantId, setInvoiceTenantId] = useState<string | null>(null);
  const [invoiceCycle, setInvoiceCycle] = useState<'monthly' | 'half_year' | 'yearly'>('yearly');
  const [invoiceDocType, setInvoiceDocType] = useState<'invoice' | 'receipt'>('invoice');
  const [copiedInvoiceMsg, setCopiedInvoiceMsg] = useState(false);

  const [csvText, setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState<string | null>(null);

  const budgetUsagePercent = Math.min(
    100,
    Math.round((currentTenant.current_spend_jpy / currentTenant.monthly_budget_jpy) * 100)
  );

  const handleCopyURI = (uri: string, provider: string) => {
    navigator.clipboard.writeText(uri);
    setCopiedProvider(provider);
    setTimeout(() => setCopiedProvider(null), 2000);
  };

  const handleSaveZoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTenant.id === 'tenant-001') {
      store.updateZoomConfig({
        account_id: zoomAccountId,
        client_id: zoomClientId,
        client_secret: zoomClientSecret,
        webhook_secret_token: zoomWebhookSecret,
      });
    } else {
      store.updateTenantOwnerProfile({
        zoom_account_id: zoomAccountId.trim(),
        zoom_client_id: zoomClientId.trim(),
        zoom_client_secret: zoomClientSecret.trim(),
      });
      store.pushStateToCloud().catch(() => {});
    }
    const res = store.testOAuthConnection('zoom');
    setZoomTestResult(res);
    onRefresh();
  };

  const handleSaveGoogle = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateGoogleConfig({
      client_id: googleClientId,
      client_secret: googleClientSecret,
    });
    const res = store.testOAuthConnection('google');
    setGoogleTestResult(res);
    onRefresh();
  };

  // バックアップダウンロード
  const handleExportBackup = () => {
    const json = store.exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-network-concierge-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // バックアップインポート
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const ok = store.importBackupJSON(text);
        if (ok) {
          alert('バックアップから正常に復元しました。');
          onRefresh();
        } else {
          alert('不正なJSONバックアップファイルです。');
        }
      };
      reader.readAsText(file);
    }
  };

  // 本番空データに初期化
  const handleResetToProduction = () => {
    if (confirm('【本番開始確認】\nサンプルデータをクリアして、あなた自身の実人脈・面談データでゼロから使い始めますか？\n（必要に応じて後からサンプルに戻すことも可能です）')) {
      store.resetToProductionEmptyState();
      alert('本番用データに切り替えました。人物カルテや予定を登録していきましょう！');
      onRefresh();
    }
  };

  // サンプルデータ復元
  const handleRestoreSample = () => {
    if (confirm('初期サンプルデータ（山田様、田中様、佐藤様など）を復元しますか？')) {
      store.resetToSampleState();
      alert('サンプルデータを復元しました。');
      onRefresh();
    }
  };

  // CSV一括取り込み
  const handleImportCSV = () => {
    if (!csvText.trim()) return;
    const res = store.importCSVContacts(csvText);
    setCsvResult(`取込完了: 新規 ${res.importedCount}件、重複スキップ ${res.duplicateCount}件`);
    setCsvText('');
    onRefresh();
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-28 animate-fadeIn">
      <div>
        <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">設定・データ管理・セキュリティ</h1>
        <p className="text-xs text-neutral-500">
          本番利用データの初期化・バックアップ復元、月間AI予算管理、外部サービス認可 (仕様08, 13, 33, 34)
        </p>
      </div>

      {/* 👤 現在のテナントのオーナープロフィール設定（氏名・会社名・BNIチャプター） */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-apple-border dark:border-apple-darkBorder">
          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            <Sparkles className="w-4 h-4 text-apple-blue" />
            <span>👤 オーナープロフィール設定（相関図の中心ハブ・話者識別・お礼文署名）</span>
          </div>
          {onOpenOwnerSetup && (
            <button
              type="button"
              onClick={onOpenOwnerSetup}
              className="px-3.5 py-1.5 rounded-xl bg-apple-blue text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-xs"
            >
              プロフィール・所属チャプターを変更
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder">
            <span className="text-[11px] text-neutral-400 block">オーナー氏名・役職</span>
            <span className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
              {ownerProfile.owner_name} {ownerProfile.title ? `（${ownerProfile.title}）` : ''}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder">
            <span className="text-[11px] text-neutral-400 block">会社名・屋号</span>
            <span className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
              {ownerProfile.company_name || '未設定'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder">
            <span className="text-[11px] text-neutral-400 block">BNI所属リージョン・チャプター</span>
            <span className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
              {ownerProfile.bni_chapter_name
                ? `${ownerProfile.bni_region_name ? `${ownerProfile.bni_region_name} / ` : ''}${ownerProfile.bni_chapter_name}`
                : 'BNI未設定（一般経営者モード）'}
            </span>
          </div>
        </div>
      </div>

      {/* 本番データ運用 & バックアップカード (リアル利用に必須) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 pb-3 border-b border-apple-border dark:border-apple-darkBorder">
          <Database className="w-4 h-4 text-apple-blue" />
          <span>データ管理・本番利用スタート（バックアップ & 復元）</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* 本番クリーン開始ボタン */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder space-y-2">
            <div className="font-semibold text-neutral-800 dark:text-neutral-200">
              ① 自分の本番データを登録開始する
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              現在入っているサンプルデータをクリアし、あなた自身の実際の人脈・BNI面談を登録できる状態にします。
            </p>
            <button
              onClick={handleResetToProduction}
              className="px-3.5 py-1.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium hover:opacity-90 transition-opacity flex items-center space-x-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>本番データで利用開始（サンプルクリア）</span>
            </button>
          </div>

          {/* サンプルデータ復元ボタン */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder space-y-2">
            <div className="font-semibold text-neutral-800 dark:text-neutral-200">
              ② サンプル動作を確認したい場合
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              いつでも最初のテスト用サンプルデータ（山田様、田中様、相関図、面談記録など）に戻すことができます。
            </p>
            <button
              onClick={handleRestoreSample}
              className="px-3.5 py-1.5 rounded-xl border border-apple-border dark:border-apple-darkBorder text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>サンプルデータを再読み込み</span>
            </button>
          </div>
        </div>

        {/* JSONバックアップと復元 */}
        <div className="pt-3 border-t border-apple-border dark:border-apple-darkBorder flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-neutral-500">
            登録した全人脈・会話記録・事実を安全にファイルへ保存・復元できます
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportBackup}
              className="px-3 py-1.5 rounded-xl border border-apple-border dark:border-apple-darkBorder hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>バックアップをダウンロード (.json)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-apple-border dark:border-apple-darkBorder hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium flex items-center space-x-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>バックアップから復元</span>
            </button>
          </div>
        </div>
      </div>
      {/* 👥 SaaS月額会員（マルチテナント）発行 & 専用URL・Stripe決済管理（オーナー管理者画面のみ表示、顧客ロック時は自身のプラン表示） */}
      {isLockedTenant ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
            <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>🔒 ご契約プラン・専用データ領域保護（RLS分離済み）</span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {currentTenant.plan_tier === 'premium' ? 'プレミアムプラン (¥5,980/月)' : 'スタンダードプラン (¥4,980/月)'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            このアカウント（ID: <code>{currentTenant.id}</code>）はあなた専用のデータ領域としてロック・保護されており、他の会員からあなたの人脈や面談記録が閲覧されることはありません。
          </p>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-apple-border dark:border-apple-darkBorder">
            <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>👥 月額会員アカウント発行・セルフ登録リンク・Stripe決済管理（RLS完全分離）</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const signupUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://ai-network-concierge.vercel.app'}/?signup=1`;
                  navigator.clipboard.writeText(signupUrl);
                  setCopiedTenantId('SELF_SIGNUP');
                  setTimeout(() => setCopiedTenantId(null), 2000);
                }}
                className="px-3 py-1 rounded-xl bg-apple-blue/10 text-apple-blue text-[11px] font-bold hover:bg-apple-blue/20 flex items-center gap-1"
              >
                {copiedTenantId === 'SELF_SIGNUP' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTenantId === 'SELF_SIGNUP' ? 'セルフ登録URLをコピー済' : '新規顧客セルフ登録URL (?signup=1) をコピー'}</span>
              </button>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                登録テナント: {store.getTenants().length}社
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            他のBNIメンバーや経営者様に月額（¥4,980 / ¥5,980）で販売する際、<strong>①「新規顧客セルフ登録URL（<code>/?signup=1</code>）」を送って相手自身に名前・会社名・チャプターを登録してもらう方法</strong>と、<strong>② 下のフォームから専用環境を発行してURLを送る方法</strong>のどちらも使えます。専用URLで開いた顧客画面はロックされ、<strong>勝賀野様の人脈データは一切見えません（サーバーサイドRLS完全分離）</strong>。
          </p>

          {/* 新規会員発行フォーム */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="新規会員名（例: 株式会社岩根工業 岩根義行様 / だんじり 三島様）"
              className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-xs text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
            />
            <select
              value={newMemberPlan}
              onChange={(e) => setNewMemberPlan(e.target.value as '4980' | '5980')}
              aria-label="月額プラン選択"
              className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-xs text-[#1D1D1F] dark:text-[#F5F5F7]"
            >
              <option value="4980">月額 ¥4,980 プラン（原価上限 ¥1,000）</option>
              <option value="5980">月額 ¥5,980 プラン（原価上限 ¥1,000）</option>
            </select>
            <button
              type="button"
              onClick={async () => {
                if (!newMemberName.trim()) return;
                store.createTenant(
                  `${newMemberName.trim()} (¥${Number(newMemberPlan).toLocaleString()}/月)`,
                  newMemberPlan === '5980' ? 'premium' : 'standard',
                  1000
                );
                setNewMemberName('');
                await store.pushStateToCloud().catch(() => {});
                onRefresh();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 shadow-sm"
            >
              ＋ 新規会員アカウントを発行
            </button>
          </div>

          {/* 発行済み会員テナント一覧 */}
          <div className="space-y-2 pt-2">
            {store.getTenants().map((t) => {
              const isActive = t.id === currentTenant.id;
              const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ai-network-concierge.vercel.app';
              const needsOnboarding = t.id !== 'tenant-001' && !t.owner_profile?.is_onboarded;
              const memberUrl = `${origin}/?tenant=${t.id}${needsOnboarding ? '&onboarding=1' : ''}`;
              return (
                <div
                  key={t.id}
                  className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                    isActive
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-apple-blue/50'
                      : 'bg-neutral-50 dark:bg-neutral-900/60 border-apple-border dark:border-apple-darkBorder'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{t.name}</span>
                      {t.id === 'tenant-001' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                          オーナー（勝賀野様）
                        </span>
                      )}
                      {t.owner_profile?.bni_chapter_name && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                          {t.owner_profile.bni_chapter_name}
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-blue text-white font-bold">
                          現在表示中
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      当月AI原価: ¥{t.current_spend_jpy.toFixed(0)} / 上限 ¥{t.monthly_budget_jpy.toLocaleString()} ・ ID: {t.id}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(memberUrl);
                        setCopiedTenantId(t.id);
                        setTimeout(() => setCopiedTenantId(null), 2000);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-apple-border dark:border-apple-darkBorder bg-white dark:bg-neutral-800 text-[11px] font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center space-x-1"
                    >
                      {copiedTenantId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTenantId === t.id ? '専用URLをコピー済' : '会員専用URLをコピー'}</span>
                    </button>

                    {t.id !== 'tenant-001' && (
                      <button
                        type="button"
                        onClick={() => {
                          setInvoiceTenantId(t.id);
                          setInvoiceDocType('invoice');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 flex items-center gap-1 shadow-xs"
                      >
                        <FileText className="w-3 h-3" />
                        <span>請求書・領収書を発行</span>
                      </button>
                    )}

                    {t.id !== 'tenant-001' && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/billing/checkout', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                tenantId: t.id,
                                planTier: t.plan_tier,
                                ownerName: t.owner_profile?.owner_name || t.name,
                                origin,
                              }),
                            });
                            const data = await res.json();
                            if (data.checkoutUrl) {
                              navigator.clipboard.writeText(data.checkoutUrl);
                              setCopiedTenantId(`BILL_${t.id}`);
                              setTimeout(() => setCopiedTenantId(null), 2500);
                            }
                          } catch {
                            // ignore
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-medium hover:opacity-90 flex items-center gap-1"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>{copiedTenantId === `BILL_${t.id}` ? '決済・登録リンクをコピー済' : '決済・初期設定リンクをコピー'}</span>
                      </button>
                    )}

                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => {
                          store.setTenantId(t.id);
                          onRefresh();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-apple-blue text-white text-[11px] font-medium hover:opacity-90"
                      >
                        この会員画面を見る
                      </button>
                    )}

                    {t.id !== 'tenant-001' && (
                      <button
                        type="button"
                        onClick={async () => {
                          store.deleteTenant(t.id);
                          await store.pushStateToCloud().catch(() => {});
                          onRefresh();
                        }}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="会員テナントを削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📄 ワンタップ請求書・領収書（月額 / 半年一括 / 年額一括）自動発行モーダル */}
      {invoiceTenantId && (() => {
        const targetTenant = store.getTenants().find(t => t.id === invoiceTenantId);
        if (!targetTenant) return null;
        const baseMonthly = targetTenant.plan_tier === 'premium' ? 5980 : 4980;
        const months = invoiceCycle === 'yearly' ? 12 : invoiceCycle === 'half_year' ? 6 : 1;
        // 年額一括は1ヶ月分サービス（11ヶ月分価格）にも設定可能、ここでは分かりやすく実月数計算
        const totalAmount = baseMonthly * months;
        const taxExcluded = Math.round(totalAmount / 1.1);
        const taxAmount = totalAmount - taxExcluded;
        const clientTitle = targetTenant.owner_profile?.company_name
          ? `${targetTenant.owner_profile.company_name} ${targetTenant.owner_profile.owner_name || ''} 御中`
          : `${targetTenant.name.replace(/\s*\(¥.*?\).*$/, '')} 御中`;
        const issueDate = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ai-network-concierge.vercel.app';
        const memberUrl = `${origin}/?tenant=${targetTenant.id}&onboarding=1`;
        const cycleLabel =
          invoiceCycle === 'yearly'
            ? '年額一括（12ヶ月分・毎月請求書不要）'
            : invoiceCycle === 'half_year'
            ? '半年一括（6ヶ月分）'
            : '月額（1ヶ月分）';

        const lineBillingText = `${clientTitle.replace(/ 御中$/, ' 様')}\n\nいつも大変お世話になっております！株式会社ZENNOBATEの勝賀野太郎です。\n「AI人脈コンシェルジュ」の専用アカウント環境をご用意いたしました。\n\n■ あなた専用のご利用URL（ブックマーク・ホーム画面追加推奨）\n${memberUrl}\n※初回アクセス時にご氏名・会社名・BNIチャプターを30秒で設定いただけます（データは完全分離・ロックされています）。\n\n■ ご請求内容（${cycleLabel}）\n・プラン: ${targetTenant.plan_tier === 'premium' ? 'プレミアムプラン' : 'スタンダードプラン'}（月額 ¥${baseMonthly.toLocaleString()} × ${months}ヶ月）\n・ご請求金額: ¥${totalAmount.toLocaleString()}（税込）\n・発行元: 株式会社ZENNOBATE 代表取締役 勝賀野 太郎\n\n今後ともどうぞよろしくお願いいたします！`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-3xl border border-apple-border dark:border-apple-darkBorder p-6 sm:p-8 space-y-5 shadow-2xl my-auto">
              <div className="flex items-center justify-between border-b border-apple-border dark:border-apple-darkBorder pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-[#1D1D1F] dark:text-[#F5F5F7]">
                    ワンタップ請求書・領収書発行（株式会社ZENNOBATE）
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInvoiceTenantId(null)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 px-2 py-1"
                >
                  ✕ 閉じる
                </button>
              </div>

              {/* 請求期間・書類種別切り替え */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-500 font-semibold mb-1">
                    お支払いサイクル（年額・半年一括なら毎月の請求書送付が不要！）
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { id: 'yearly', label: '年額一括(12ヶ月)' },
                      { id: 'half_year', label: '半年一括(6ヶ月)' },
                      { id: 'monthly', label: '月額(1ヶ月)' },
                    ] as const).map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setInvoiceCycle(opt.id)}
                        className={`py-2 px-2 rounded-xl font-bold border text-[11px] transition-all ${
                          invoiceCycle === opt.id
                            ? 'bg-apple-blue text-white border-apple-blue'
                            : 'bg-neutral-50 dark:bg-neutral-800 border-apple-border dark:border-apple-darkBorder'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-500 font-semibold mb-1">書類タイトル</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInvoiceDocType('invoice')}
                      className={`py-2 px-3 rounded-xl font-bold border text-xs ${
                        invoiceDocType === 'invoice'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-apple-border dark:border-apple-darkBorder'
                      }`}
                    >
                      御請求書
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceDocType('receipt')}
                      className={`py-2 px-3 rounded-xl font-bold border text-xs ${
                        invoiceDocType === 'receipt'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-apple-border dark:border-apple-darkBorder'
                      }`}
                    >
                      領収書
                    </button>
                  </div>
                </div>
              </div>

              {/* 請求書・領収書プレビュー（そのまま印刷・PDF保存可能） */}
              <div className="p-6 rounded-2xl bg-white text-neutral-900 border-2 border-neutral-200 space-y-4 text-xs shadow-inner">
                <div className="flex justify-between items-start border-b-2 border-neutral-800 pb-3">
                  <div>
                    <div className="text-xl font-extrabold tracking-widest">
                      {invoiceDocType === 'invoice' ? '御 請 求 書' : '領 収 書'}
                    </div>
                    <div className="text-sm font-bold mt-2 underline">{clientTitle}</div>
                  </div>
                  <div className="text-right text-[11px] space-y-0.5">
                    <div>発行日: {issueDate}</div>
                    <div>文書番号: INV-{targetTenant.id.replace('tenant-', '').toUpperCase()}-{months}M</div>
                    <div className="font-bold text-xs pt-1">株式会社ZENNOBATE（ゼノベイト）</div>
                    <div>代表取締役 勝賀野 太郎</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-100 flex items-center justify-between">
                  <span className="font-bold text-sm">
                    {invoiceDocType === 'invoice' ? 'ご請求金額（税込）' : '領収金額（税込）'}
                  </span>
                  <span className="text-xl font-extrabold text-neutral-900">
                    ¥{totalAmount.toLocaleString()} -
                  </span>
                </div>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-300 text-neutral-500">
                      <th className="py-1.5">品目・明細</th>
                      <th className="py-1.5 text-right">単価</th>
                      <th className="py-1.5 text-right">数量</th>
                      <th className="py-1.5 text-right">金額（税込）</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-200">
                      <td className="py-2.5 font-semibold">
                        AI人脈コンシェルジュ クラウド利用料（{targetTenant.plan_tier === 'premium' ? 'プレミアム' : 'スタンダード'}・{cycleLabel}）
                      </td>
                      <td className="py-2.5 text-right">¥{baseMonthly.toLocaleString()}</td>
                      <td className="py-2.5 text-right">{months}ヶ月</td>
                      <td className="py-2.5 text-right font-bold">¥{totalAmount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-end text-[11px] text-neutral-600">
                  <div className="w-48 space-y-1">
                    <div className="flex justify-between">
                      <span>税抜金額 (10%対象):</span>
                      <span>¥{taxExcluded.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>消費税 (10%):</span>
                      <span>¥{taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-neutral-900 border-t border-neutral-300 pt-1">
                      <span>合計金額:</span>
                      <span>¥{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(lineBillingText);
                    setCopiedInvoiceMsg(true);
                    setTimeout(() => setCopiedInvoiceMsg(false), 2500);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                >
                  {copiedInvoiceMsg ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>
                    {copiedInvoiceMsg
                      ? 'LINE送付用メッセージ（専用URL＋請求案内）をコピー済！'
                      : '💬 LINE送付用メッセージ（専用URL＋請求案内）をコピー'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-apple-blue text-white text-xs font-bold hover:opacity-90 flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>📄 この請求書・領収書をPDF保存 / 印刷</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 📱 PWA / ホーム画面アプリの更新・キャッシュ管理 */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 pb-3 border-b border-apple-border dark:border-apple-darkBorder">
          <Smartphone className="w-4 h-4 text-apple-blue" />
          <span>スマホ・ホーム画面（PWA）の最新版更新 & キャッシュ消去</span>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-neutral-500 leading-relaxed">
            iPhoneやAndroidの「ホーム画面に追加」で利用されている場合、端末内に古い画面データが固定キャッシュされることがあります。<br />
            下のボタンを押すと、古いキャッシュを破棄してサーバー上の最新バージョン（個別お礼状・関係性グラフ・議事録の修正）を直ちに反映します。
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => forceReloadApp()}
              className="px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium hover:opacity-90 active:scale-95 transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>最新版に強制再読み込み（キャッシュ破棄）</span>
            </button>

            <span className="text-[11px] text-neutral-400">
              ※もしボタンを押しても画面が変わらない場合は、ホーム画面のアイコンを長押し削除し、Safariから再度「ホーム画面に追加」してください。
            </span>
          </div>
        </div>
      </div>



      {/* 🤖 音声AI文字起こし設定 (Google Gemini API) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 pb-3 border-b border-apple-border dark:border-apple-darkBorder">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>録音音声のAI自動文字起こし連携 (Google Gemini 1.5/2.5 Flash)</span>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-neutral-500 leading-relaxed">
            iPhoneやZoomの録音音声ファイル（.m4a, .mp3等）をアップロードするだけで、AIが音声を丸ごと聴き取り、一言一句文字起こしした上で、相手の事業・話題・約束・お礼状を完全自動生成します。
          </p>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-700 dark:text-neutral-200">Gemini APIキー</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-0.5"
              >
                <span>Google AI Studioで無料キーを取得 →</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-neutral-850 border border-purple-200 dark:border-purple-800 text-xs font-mono"
              />
              <button
                onClick={() => {
                  setStoredGeminiApiKey(geminiApiKey);
                  setApiKeySaved(true);
                  setTimeout(() => setApiKeySaved(false), 2500);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all shrink-0"
              >
                {apiKeySaved ? '✓ 保存完了' : 'キーを保存'}
              </button>
            </div>
            <p className="text-[11px] text-neutral-400">
              ※Google AI Studioのアカウント（無料）があれば、毎分15回まで完全無料で利用できます。キーはお使いの端末内のみに安全に保存されます。
            </p>
          </div>
        </div>
      </div>

      {/* CSV一括インポート機能 (仕様08, CARD-07) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 pb-3 border-b border-apple-border dark:border-apple-darkBorder">
          <FileSpreadsheet className="w-4 h-4 text-apple-blue" />
          <span>既存連絡先・CSV一括インポート (仕様08)</span>
        </div>

        <div className="space-y-2 text-xs">
          <p className="text-neutral-500 leading-relaxed">
            ExcelやGoogle連絡先からエクスポートしたCSVテキストを貼り付けて、一括で人物カルテを作成できます。<br />
            <strong>形式:</strong> <code>氏名, ふりがな, 会社名, 役職, 電話番号, メールアドレス, タグ(BNI/仕事/友人)</code>
          </p>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="山田 花子, やまだ はなこ, 株式会社デザイン, 代表, 090-1111-2222, hanako@example.com, BNI&#10;鈴木 次郎, すずき じろう, 鈴木税理士事務所, 所長, 090-3333-4444, suzuki@example.com, 仕事"
            rows={3}
            className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder font-mono text-xs focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
          />

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setCsvText("高橋 健太, たかはし けんた, 株式会社京都フーズ, 専務, 090-8888-7777, kenta@kyoto-foods.example.jp, BNI\n渡辺 恵美, わたなべ えみ, えみ行政書士事務所, 代表, 080-6666-5555, emi@office-watanabe.example.jp, 仕事")}
              className="text-[11px] text-apple-blue hover:underline"
            >
              ＋テスト用CSVサンプルを挿入
            </button>

            <button
              onClick={handleImportCSV}
              disabled={!csvText.trim()}
              className="px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              CSVから人物を一括取り込み
            </button>
          </div>

          {csvResult && (
            <div className="p-3 bg-apple-green/10 text-apple-green rounded-xl font-medium mt-2">
              {csvResult}
            </div>
          )}
        </div>
      </div>

      {/* 原価・予算ガードレールカード (仕様33, 34) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            <DollarSign className="w-4 h-4 text-apple-green" />
            <span>月間AI原価ストッパー & 収益ガードレール（1ユーザー原価上限: ¥1,000/月 ・ 販売価格: ¥4,980〜¥5,980/月）</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            currentTenant.is_budget_throttled
              ? 'bg-amber-100 text-apple-amber'
              : 'bg-apple-green/10 text-apple-green'
          }`}>
            {currentTenant.is_budget_throttled ? '節約モード発動中 (¥1,000上限到達・0円エンジン稼働)' : '通常稼働中 (粗利保護OK)'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-300">
            <span>当月消化額: ¥{Math.round(currentTenant.current_spend_jpy).toLocaleString()}</span>
            <span>予算上限: ¥{currentTenant.monthly_budget_jpy.toLocaleString()} ({budgetUsagePercent}%)</span>
          </div>

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
            <span>¥800到達で警告、¥1,000到達で自動的に0円ローカル検索・Zoom標準要約へ切替（赤字リスク0%）</span>
            <button
              onClick={() => {
                store.recordAICost('bot_minutes', 'External-Bot', 120, 1000, '原価上限(¥1,000)到達ストッパー検証テスト');
                onRefresh();
              }}
              className="text-apple-blue hover:underline text-[11px]"
            >
              ＋原価加算テスト（節約モード検証）
            </button>
          </div>
        </div>

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

      {/* OAuth 2.0 認可アプリ設定（Zoom App Marketplace & Google Cloud Console） */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-blue/40 dark:border-apple-darkBlue/40 space-y-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            <Key className="w-4 h-4 text-apple-blue" />
            <span>OAuth 2.0 認可アプリ設定（Zoom / Google Workspace 実連携）</span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-medium">
            本番認可対応
          </span>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed">
          Zoom Marketplace または Google Cloud Console で作成した認可アプリの認証情報（Client ID / Client Secret）を設定します。<br />
          申請手順の詳細は <code>docs/OAUTH_APPLICATION_GUIDE.md</code> に記載されています。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Zoom OAuth 設定 */}
          <form onSubmit={handleSaveZoom} className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
                <span>Zoom App 認証設定</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                oauthConfig.zoom.is_connected ? 'bg-apple-green/10 text-apple-green' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
              }`}>
                {oauthConfig.zoom.is_connected ? '● 認可有効' : '○ 未接続'}
              </span>
            </div>

            <div>
              <label className="block mb-1.5 font-medium text-neutral-500">Zoom連携・録音方式（両方対応）:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div
                  onClick={() => setZoomMode('bot')}
                  className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
                    zoomMode === 'bot'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                      : 'bg-white dark:bg-neutral-800 border-apple-border dark:border-apple-darkBorder text-neutral-500'
                  }`}
                >
                  <div className="font-bold flex items-center space-x-1">
                    <span>🤖 パターン1: ボット自動派遣</span>
                  </div>
                  <p className="text-[10px] mt-0.5 text-neutral-500 dark:text-neutral-400 leading-snug">
                    面談時刻にAIボットが待機室へ自動入室。無料Zoomアカウントでも利用可能。
                  </p>
                </div>

                <div
                  onClick={() => setZoomMode('cloud')}
                  className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
                    zoomMode === 'cloud'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                      : 'bg-white dark:bg-neutral-800 border-apple-border dark:border-apple-darkBorder text-neutral-500'
                  }`}
                >
                  <div className="font-bold flex items-center space-x-1">
                    <span>☁️ パターン2: クラウド録音自動連携</span>
                  </div>
                  <p className="text-[10px] mt-0.5 text-neutral-500 dark:text-neutral-400 leading-snug">
                    Zoom画面の「クラウド記録」を押すだけで自動同期。ボット画面入室なし（Zoom Pro以上）。
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-neutral-500">Account ID (Server-to-Server)</label>
              <input
                type="text"
                placeholder="Zoom Marketplaceの Account ID"
                value={zoomAccountId}
                onChange={(e) => setZoomAccountId(e.target.value)}
                className="w-full p-2 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-neutral-500">Client ID</label>
              <input
                type="text"
                placeholder="Zoom Marketplaceの Client ID"
                value={zoomClientId}
                onChange={(e) => setZoomClientId(e.target.value)}
                className="w-full p-2 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-neutral-500">Client Secret</label>
              <input
                type="password"
                placeholder="Zoom Marketplaceの Client Secret"
                value={zoomClientSecret}
                onChange={(e) => setZoomClientSecret(e.target.value)}
                className="w-full p-2 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-neutral-500">Webhook Secret Token (任意)</label>
              <input
                type="password"
                placeholder="録画完了Webhook受信用トークン"
                value={zoomWebhookSecret}
                onChange={(e) => setZoomWebhookSecret(e.target.value)}
                className="w-full p-2 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder font-mono text-[11px]"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-700/60 border border-apple-border dark:border-apple-darkBorder space-y-1">
              <span className="text-[10px] text-neutral-400 block font-medium">Zoom申請用リダイレクトURI:</span>
              <div className="flex items-center justify-between font-mono text-[10px] text-neutral-700 dark:text-neutral-300">
                <span className="truncate">https://ai-network-concierge.vercel.app/oauth/callback/zoom</span>
                <button
                  type="button"
                  onClick={() => handleCopyURI('https://ai-network-concierge.vercel.app/oauth/callback/zoom', 'zoom')}
                  className="ml-2 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-600 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-200 shrink-0 flex items-center space-x-0.5"
                >
                  {copiedProvider === 'zoom' ? <Check className="w-2.5 h-2.5 text-apple-green" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copiedProvider === 'zoom' ? 'コピー済' : 'コピー'}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium hover:opacity-90 transition-opacity"
            >
              Zoom設定を保存 & 接続検証
            </button>

            {zoomTestResult && (
              <div className={`p-2.5 rounded-xl font-medium ${
                zoomTestResult.success ? 'bg-apple-green/10 text-apple-green' : 'bg-red-50 text-red-600 dark:bg-red-950/30'
              }`}>
                {zoomTestResult.message}
              </div>
            )}
          </form>

          {/* Google Workspace OAuth 設定 */}
          <form onSubmit={handleSaveGoogle} className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-1.5">
                <span>Google Cloud 認証設定</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                oauthConfig.google.is_connected ? 'bg-apple-green/10 text-apple-green' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
              }`}>
                {oauthConfig.google.is_connected ? '● 認可有効' : '○ 未接続'}
              </span>
            </div>

            <div>
              <label className="block mb-1 font-medium text-neutral-500">Client ID</label>
              <input
                type="text"
                placeholder="Google Cloud Consoleの Client ID"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                className="w-full p-2 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-neutral-500">Client Secret</label>
              <input
                type="password"
                placeholder="Google Cloud Consoleの Client Secret"
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
                className="w-full p-2 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder font-mono text-[11px]"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-700/60 border border-apple-border dark:border-apple-darkBorder space-y-1">
              <span className="text-[10px] text-neutral-400 block font-medium">Google申請用リダイレクトURI:</span>
              <div className="flex items-center justify-between font-mono text-[10px] text-neutral-700 dark:text-neutral-300">
                <span className="truncate">https://ai-network-concierge.vercel.app/oauth/callback/google</span>
                <button
                  type="button"
                  onClick={() => handleCopyURI('https://ai-network-concierge.vercel.app/oauth/callback/google', 'google')}
                  className="ml-2 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-600 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-200 shrink-0 flex items-center space-x-0.5"
                >
                  {copiedProvider === 'google' ? <Check className="w-2.5 h-2.5 text-apple-green" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copiedProvider === 'google' ? 'コピー済' : 'コピー'}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium hover:opacity-90 transition-opacity"
            >
              Google設定を保存 & 接続検証
            </button>

            {googleTestResult && (
              <div className={`p-2.5 rounded-xl font-medium ${
                googleTestResult.success ? 'bg-apple-green/10 text-apple-green' : 'bg-red-50 text-red-600 dark:bg-red-950/30'
              }`}>
                {googleTestResult.message}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 営業提案資料 & ピッチデック */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-apple-blue/10 via-purple-500/5 to-transparent border border-apple-blue/30 space-y-3 shadow-sm text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
            <Sparkles className="w-4 h-4 text-apple-blue" />
            <span>営業提案資料（商談・BNIメンバー向けピッチデック）</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-blue text-white font-semibold">全14スライド</span>
        </div>

        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          BNIチャプターメンバー、士業、経営者、営業リーダー向けの提案スライドです。キーボード操作によるフルスクリーンプレゼン、URL共有、ワンクリックでの16:9横型A4 PDF出力に対応しています。
        </p>

        <div className="pt-1">
          <button
            onClick={() => onNavigate && onNavigate('deck')}
            className="px-5 py-2.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-semibold hover:opacity-90 flex items-center space-x-2 transition-all shadow-md"
          >
            <span>営業提案スライドを開く（プレゼン / PDF印刷）</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 法的情報 & 審査提出用ポリシーリンク */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-3 shadow-sm text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
          <div className="flex items-center space-x-2 font-semibold text-neutral-700 dark:text-neutral-300">
            <FileText className="w-4 h-4 text-apple-blue" />
            <span>法的開示情報（Zoom / Google 申請審査で必須となる公開ページ）</span>
          </div>
        </div>

        <p className="text-neutral-500 leading-relaxed">
          認可申請時に Zoom Marketplace および Google Cloud に提出する公開プライバシーポリシーおよび利用規約です。
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => onNavigate && onNavigate('privacy')}
            className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-apple-blue" />
            <span>プライバシーポリシーを開く (/privacy)</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('terms')}
            className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-apple-blue" />
            <span>利用規約を開く (/terms)</span>
          </button>
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
