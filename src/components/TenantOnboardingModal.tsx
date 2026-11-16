import React, { useState, useMemo } from 'react';
import { Sparkles, Building2, UserCheck, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { store } from '../services/store';
import { OFFICIAL_BNI_REGIONS, OFFICIAL_BNI_CHAPTERS } from '../data/bniJapanOfficialData';

interface TenantOnboardingModalProps {
  isOpen: boolean;
  isNewSignup?: boolean;
  onComplete: (tenantId: string) => void;
  onClose?: () => void;
}

export const TenantOnboardingModal: React.FC<TenantOnboardingModalProps> = ({
  isOpen,
  isNewSignup = false,
  onComplete,
  onClose,
}) => {
  const existingProfile = store.getCurrentOwnerProfile();
  const [ownerName, setOwnerName] = useState(
    existingProfile.is_onboarded ? existingProfile.owner_name : ''
  );
  const [companyName, setCompanyName] = useState(
    existingProfile.is_onboarded ? existingProfile.company_name : ''
  );
  const [title, setTitle] = useState(existingProfile.title || '代表取締役');
  const [selectedRegionId, setSelectedRegionId] = useState('reg-osaka-e');
  const [selectedChapterName, setSelectedChapterName] = useState(
    existingProfile.bni_chapter_name || ''
  );
  const [bniCategory, setBniCategory] = useState(existingProfile.bni_category || '');
  const [specialtySummary, setSpecialtySummary] = useState(
    existingProfile.specialty_summary || ''
  );
  const [planTier, setPlanTier] = useState<'standard' | 'premium'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chaptersInRegion = useMemo(() => {
    if (!selectedRegionId || selectedRegionId === 'NONE') return [];
    return OFFICIAL_BNI_CHAPTERS.filter(c => c.region_id === selectedRegionId);
  }, [selectedRegionId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) return;
    setIsSubmitting(true);

    try {
      let targetTenantId = store.getTenantId();
      if (isNewSignup || targetTenantId === 'tenant-001') {
        const priceLabel = planTier === 'premium' ? '5,980' : '4,980';
        const newTenant = store.createTenant(
          `${companyName.trim() ? `${companyName.trim()} ` : ''}${ownerName.trim()}様 (¥${priceLabel}/月)`,
          planTier,
          1000
        );
        targetTenantId = newTenant.id;
        store.setTenantLockedMode(targetTenantId);
        store.setTenantId(targetTenantId);
      }

      const regionObj = OFFICIAL_BNI_REGIONS.find(r => r.id === selectedRegionId);
      store.updateTenantOwnerProfile({
        owner_name: ownerName.trim(),
        company_name: companyName.trim() || `${ownerName.trim()}事務所`,
        title: title.trim() || '代表',
        bni_region_name: selectedRegionId !== 'NONE' ? (regionObj?.region_name || '') : '',
        bni_chapter_name: selectedRegionId !== 'NONE' ? selectedChapterName : '',
        bni_category: bniCategory.trim(),
        specialty_summary: specialtySummary.trim() || bniCategory.trim(),
        is_onboarded: true,
      });

      await store.pushStateToCloud().catch(() => {});
      onComplete(targetTenantId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl border border-apple-border dark:border-apple-darkBorder p-6 sm:p-8 space-y-5 shadow-2xl my-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-apple-blue/10 border border-apple-blue/20 flex items-center justify-center text-apple-blue shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                専用クラウド環境・RLS完全分離
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] mt-1">
                {isNewSignup
                  ? '新規会員アカウント作成（初期オーナー登録）'
                  : 'あなた専用のAI人脈コンシェルジュ初期設定'}
              </h2>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-neutral-400 hover:text-neutral-600 px-2 py-1"
            >
              閉じる
            </button>
          )}
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed">
          ここでご登録いただいた<strong>あなたの氏名・会社名・BNIチャプター</strong>が、人脈相関図の中心ハブ・1to1文字起こしの話者識別・お礼LINE文の自動署名に反映されます。他の会員からあなたのデータは一切見えません。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                お名前（フルネーム） *
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="例: 山田 太郎"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                役職
              </label>
              <input
                type="text"
                placeholder="例: 代表取締役 / 代表"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              会社名・屋号・事務所名 *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="例: 株式会社〇〇 / 〇〇事務所"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7]"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-apple-border dark:border-apple-darkBorder space-y-3">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
              <Award className="w-4 h-4 text-apple-blue" />
              <span>BNI所属設定（全国53リージョン・401チャプター対応）</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">所属リージョン</label>
                <select
                  value={selectedRegionId}
                  onChange={e => {
                    setSelectedRegionId(e.target.value);
                    const firstChap = OFFICIAL_BNI_CHAPTERS.find(c => c.region_id === e.target.value);
                    setSelectedChapterName(firstChap?.chapter_name || '');
                  }}
                  aria-label="所属リージョン"
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder"
                >
                  <option value="NONE">BNI未所属（一般経営者モード）</option>
                  {OFFICIAL_BNI_REGIONS.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.prefecture} — {r.region_name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRegionId !== 'NONE' && (
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">所属チャプター</label>
                  <select
                    value={selectedChapterName}
                    onChange={e => setSelectedChapterName(e.target.value)}
                    aria-label="所属チャプター"
                    className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder"
                  >
                    <option value="">チャプターを選択</option>
                    {chaptersInRegion.map(c => (
                      <option key={c.id} value={c.chapter_name}>
                        {c.chapter_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">
                専門カテゴリー・自社の強み（AI紹介マッチングに使用）
              </label>
              <input
                type="text"
                placeholder="例: 不動産売買・買取再販 / 司法書士・相続コンサルティング"
                value={bniCategory}
                onChange={e => {
                  setBniCategory(e.target.value);
                  if (!specialtySummary) setSpecialtySummary(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder"
              />
            </div>
          </div>

          {isNewSignup && (
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                ご利用プラン（1人あたり月間AI原価ガード ¥1,000込）
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPlanTier('standard')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    planTier === 'standard'
                      ? 'border-apple-blue bg-blue-50/70 dark:bg-blue-950/30'
                      : 'border-apple-border dark:border-apple-darkBorder'
                  }`}
                >
                  <div className="font-bold text-sm">スタンダード</div>
                  <div className="text-apple-blue font-extrabold text-sm mt-0.5">月額 ¥4,980</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">1to1要約・名刺OCR・相関図</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPlanTier('premium')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    planTier === 'premium'
                      ? 'border-apple-blue bg-blue-50/70 dark:bg-blue-950/30'
                      : 'border-apple-border dark:border-apple-darkBorder'
                  }`}
                >
                  <div className="font-bold text-sm">プレミアム</div>
                  <div className="text-apple-blue font-extrabold text-sm mt-0.5">月額 ¥5,980</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Zoom自動連携・AI秘書フル機能</div>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-neutral-500 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              あなた専用のデータ領域（テナント分離RLS）が構成され、他会員と人脈が混ざることはありません。
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-apple-blue text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? '専用環境を構築中...' : 'この内容で専用AIコンシェルジュを開始する'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
