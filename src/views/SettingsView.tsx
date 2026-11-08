import React, { useState, useRef } from 'react';
import {
  Shield, DollarSign, Database,
  CheckCircle2, XCircle, Download, Upload, RefreshCw, Trash2, FileSpreadsheet,
  Key, Copy, Check, FileText
} from 'lucide-react';
import { store } from '../services/store';

interface SettingsViewProps {
  onRefresh: () => void;
  onNavigate?: (view: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefresh, onNavigate }) => {
  const currentTenant = store.getCurrentTenant();
  const costLedger = store.getCostLedger();
  const auditLogs = store.getAuditLogs();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const oauthConfig = store.getOAuthConfig();
  const [zoomClientId, setZoomClientId] = useState(oauthConfig.zoom.client_id || '');
  const [zoomClientSecret, setZoomClientSecret] = useState(oauthConfig.zoom.client_secret || '');
  const [zoomWebhookSecret, setZoomWebhookSecret] = useState(oauthConfig.zoom.webhook_secret_token || '');
  const [zoomTestResult, setZoomTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [googleClientId, setGoogleClientId] = useState(oauthConfig.google.client_id || '');
  const [googleClientSecret, setGoogleClientSecret] = useState(oauthConfig.google.client_secret || '');
  const [googleTestResult, setGoogleTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [copiedProvider, setCopiedProvider] = useState<string | null>(null);

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
    store.updateZoomConfig({
      client_id: zoomClientId,
      client_secret: zoomClientSecret,
      webhook_secret_token: zoomWebhookSecret,
    });
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
                store.recordAICost('bot_minutes', 'External-Bot', 120, 2800, '外部有償ボット稼働テスト (予算超過シミュレーション)');
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
