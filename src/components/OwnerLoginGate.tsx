import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, UserPlus } from 'lucide-react';

export const OWNER_AUTH_STORAGE_KEY = 'ai_concierge_owner_auth_v1';
export const EXPECTED_OWNER_HASH = 'fb17b013db9746510eacc9c52336f7e551478755f25c6f1f023b40ec692c0fc4';

export function isOwnerAuthenticated(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return true;
  return window.localStorage.getItem(OWNER_AUTH_STORAGE_KEY) === EXPECTED_OWNER_HASH;
}

export function logoutOwner(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(OWNER_AUTH_STORAGE_KEY);
  }
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const buf = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return '';
}

interface OwnerLoginGateProps {
  onAuthenticated: () => void;
  onSwitchToPartnerTenant: (tenantId: string) => void;
  onStartNewSignup: () => void;
}

export const OwnerLoginGate: React.FC<OwnerLoginGateProps> = ({
  onAuthenticated,
  onSwitchToPartnerTenant,
  onStartNewSignup,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [showPartnerInput, setShowPartnerInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsChecking(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();
      const combined = `${cleanEmail}::${cleanPass}`;
      const hash = await sha256Hex(combined);
      if (hash === EXPECTED_OWNER_HASH) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(OWNER_AUTH_STORAGE_KEY, EXPECTED_OWNER_HASH);
        }
        onAuthenticated();
      } else {
        setErrorMsg('メールアドレスまたはパスワードが正しくありません。');
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handlePartnerRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = partnerCode.trim();
    if (!raw) return;
    const tid = raw.startsWith('tenant-') ? raw : `tenant-${raw}`;
    onSwitchToPartnerTenant(tid);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-[#F5F5F7] via-blue-50/40 to-indigo-50/50 dark:from-[#000000] dark:via-[#111114] dark:to-[#1C1C1E] flex flex-col items-center justify-center p-4 text-[#1D1D1F] dark:text-[#F5F5F7]">
      <div className="w-full max-w-md bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl rounded-3xl border border-apple-border dark:border-apple-darkBorder shadow-2xl p-6 sm:p-8 space-y-6 animate-fadeIn">
        {/* ロゴ＆ヘッダー */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-apple-blue to-indigo-600 text-white flex items-center justify-center shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue dark:text-apple-darkBlue text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AES-256 暗号化クラウド保護・テナント完全分離</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">
            AI人脈コンシェルジュ
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            人を忘れず、大事にするための1to1・人脈管理プラットフォーム。<br />
            オーナーアカウントへアクセスするにはログインしてください。
          </p>
        </div>

        {/* オーナーログインフォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              メールアドレス
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              パスワード
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                title={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isChecking}
            className="w-full py-3.5 rounded-2xl bg-apple-blue hover:opacity-95 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>{isChecking ? '認証中...' : 'ログインしてコンシェルジュを開く'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* パートナー・会員専用アカウント導線 */}
        <div className="pt-4 border-t border-apple-border dark:border-apple-darkBorder space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPartnerInput(prev => !prev)}
              className="text-apple-blue dark:text-apple-darkBlue font-semibold hover:underline flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>パートナー・会員専用IDをお持ちの方はこちら</span>
            </button>

            <button
              type="button"
              onClick={onStartNewSignup}
              className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>新規アカウント登録</span>
            </button>
          </div>

          {showPartnerInput && (
            <form onSubmit={handlePartnerRedirect} className="flex items-center space-x-2 pt-1 animate-fadeIn">
              <input
                type="text"
                value={partnerCode}
                onChange={e => setPartnerCode(e.target.value)}
                placeholder="専用ID（例: endo または tenant-endo）"
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 font-bold text-xs shrink-0"
              >
                専用ページへ移動
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
