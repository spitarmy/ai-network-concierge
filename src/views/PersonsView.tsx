import React, { useState } from 'react';
import {
  Search, Shield, Building, Award, History,
  Trash2, Plus, ArrowLeft, Tag, Edit3, X
} from 'lucide-react';
import { store } from '../services/store';
import { CategoryTag, FactCategory, FactVisibility } from '../types';

interface PersonsViewProps {
  selectedPersonId?: string;
  onClosePersonDetail: () => void;
  onRefresh: () => void;
}

export const PersonsView: React.FC<PersonsViewProps> = ({
  selectedPersonId,
  onClosePersonDetail,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [detailTab, setDetailTab] = useState<'overview' | 'orgs' | 'bni' | 'facts' | 'delete'>('overview');

  // カルテ編集モーダル状態
  const [isEditingPerson, setIsEditingPerson] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhonetic, setEditPhonetic] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editServiceAreas, setEditServiceAreas] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // 移籍モーダル状態
  const [isTransferring, setIsTransferring] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState('');
  const [transferCategory, setTransferCategory] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // 新規オファリング追加モーダル状態
  const [isAddingOffering, setIsAddingOffering] = useState(false);
  const [offeringTitle, setOfferingTitle] = useState('');
  const [offeringSpecialties, setOfferingSpecialties] = useState('');
  const [offeringTargets, setOfferingTargets] = useState('');

  // 新規事実追加モーダル状態
  const [isAddingFact, setIsAddingFact] = useState(false);
  const [factKey, setFactKey] = useState('');
  const [factValue, setFactValue] = useState('');
  const [factCat, setFactCat] = useState<FactCategory>('topic');
  const [factVis, setFactVis] = useState<FactVisibility>('referral_eligible');

  // 削除完了メッセージ
  const [deleteCertificate, setDeleteCertificate] = useState<string | null>(null);

  const persons = store.getPersons();
  const chapters = store.getBNIChapters();

  // フィルタリング
  const filteredPersons = persons.filter(p => {
    const matchQuery =
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phonetic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchTag =
      selectedTag === 'ALL' ||
      (selectedTag === 'PROVISIONAL' ? p.status === 'provisional' : p.category_tags.includes(selectedTag as CategoryTag));

    return matchQuery && matchTag;
  });

  const selectedPerson = selectedPersonId ? store.getPersonById(selectedPersonId) : undefined;
  const memberships = selectedPerson ? store.getBNIMembershipsForPerson(selectedPerson.id) : [];
  const orgMemberships = selectedPerson ? store.getOrgMembershipsForPerson(selectedPerson.id) : [];
  const businessOfferings = selectedPerson ? store.getBusinessOfferingsForPerson(selectedPerson.id) : [];
  const facts = selectedPerson ? store.getFactsForPerson(selectedPerson.id) : [];

  const handleOpenEditModal = () => {
    if (!selectedPerson) return;
    setEditName(selectedPerson.display_name);
    setEditPhonetic(selectedPerson.phonetic_name);
    setEditPhone(selectedPerson.primary_phone || '');
    setEditEmail(selectedPerson.primary_email || '');
    setEditAddress(selectedPerson.office_address || '');
    setEditServiceAreas(selectedPerson.service_areas.join(', '));
    setEditNotes(selectedPerson.notes || '');
    setIsEditingPerson(true);
  };

  const handleSavePersonEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !editName.trim()) return;

    store.updatePerson(selectedPerson.id, {
      display_name: editName,
      phonetic_name: editPhonetic,
      primary_phone: editPhone || undefined,
      primary_email: editEmail || undefined,
      office_address: editAddress || undefined,
      service_areas: editServiceAreas ? editServiceAreas.split(',').map(s => s.trim()).filter(Boolean) : [],
      notes: editNotes,
    });

    setIsEditingPerson(false);
    onRefresh();
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !targetChapterId || !transferCategory) return;

    store.transferBNIChapter(selectedPerson.id, targetChapterId, transferCategory, transferReason);
    setIsTransferring(false);
    setTargetChapterId('');
    setTransferCategory('');
    setTransferReason('');
    onRefresh();
  };

  const handleAddOffering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !offeringTitle.trim()) return;

    const newBo = {
      id: `bo-${Date.now()}`,
      tenant_id: store.getTenantId(),
      person_id: selectedPerson.id,
      service_title: offeringTitle,
      specialties: offeringSpecialties,
      target_clients: offeringTargets,
      service_area: selectedPerson.service_areas[0] || '全国対応',
      is_active: true,
    };
    store.addBusinessOffering(newBo);

    setIsAddingOffering(false);
    setOfferingTitle('');
    setOfferingSpecialties('');
    setOfferingTargets('');
    onRefresh();
  };

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !factKey.trim() || !factValue.trim()) return;

    store.addFact({
      person_id: selectedPerson.id,
      fact_category: factCat,
      fact_key: factKey,
      fact_value: factValue,
      source_type: 'manual_edit',
      confidence: 1.0,
      verification_status: 'verified',
      visibility: factVis,
      valid_from: new Date().toISOString(),
    });

    setIsAddingFact(false);
    setFactKey('');
    setFactValue('');
    onRefresh();
  };

  const handleExecutePurge = () => {
    if (!selectedPerson) return;
    const confirmName = prompt(`この操作は取り消せません。\n削除請求を実行するため、対象人物の名前「${selectedPerson.display_name}」を入力してください:`);
    if (confirmName !== selectedPerson.display_name) {
      alert('名前が一致しなかったため中止しました。');
      return;
    }

    const res = store.deletePersonCompletely(selectedPerson.id);
    setDeleteCertificate(`削除完了証跡: 対象ID=${selectedPerson.id} の全事実(${res.purgedCounts.facts}件)および人間関係(${res.purgedCounts.relationships}件)を完全抹消しました。`);
    setTimeout(() => {
      onClosePersonDetail();
      onRefresh();
    }, 2500);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-28 animate-fadeIn">
      {/* 詳細画面表示時 */}
      {selectedPerson ? (
        <div className="space-y-6">
          <button
            onClick={onClosePersonDetail}
            className="inline-flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>人脈一覧へ戻る</span>
          </button>

          {/* カルテヘッダー */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={selectedPerson.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover border border-apple-border dark:border-apple-darkBorder"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {selectedPerson.display_name}
                  </h1>
                  <span className="text-xs text-neutral-400">
                    {selectedPerson.phonetic_name}
                  </span>
                  {selectedPerson.status === 'provisional' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                      仮カルテ（会話内登場）
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedPerson.category_tags.map(t => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                      #{t}
                    </span>
                  ))}
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-apple-blue/10 text-apple-blue dark:text-apple-darkBlue font-medium">
                    面談計 {selectedPerson.meeting_count}回
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenEditModal}
              className="px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center space-x-1.5 self-start sm:self-auto shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>カルテ情報を編集</span>
            </button>
          </div>

          {/* カルテ編集モーダル */}
          {isEditingPerson && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
              <form onSubmit={handleSavePersonEdit} className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl border border-apple-border dark:border-apple-darkBorder p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
                  <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">人物カルテ情報の編集</h3>
                  <button type="button" onClick={() => setIsEditingPerson(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 font-medium text-neutral-500">お名前 *</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-neutral-500">ふりがな</label>
                    <input
                      type="text"
                      value={editPhonetic}
                      onChange={(e) => setEditPhonetic(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 font-medium text-neutral-500">電話番号</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-neutral-500">メールアドレス</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder"
                    />
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <label className="block font-medium text-neutral-500">事務所・所在地</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder"
                  />
                </div>

                <div className="text-xs space-y-1">
                  <label className="block font-medium text-neutral-500">対応エリア (カンマ区切り)</label>
                  <input
                    type="text"
                    placeholder="例: 京都府, 滋賀県, 大阪府"
                    value={editServiceAreas}
                    onChange={(e) => setEditServiceAreas(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder"
                  />
                </div>

                <div className="text-xs space-y-1">
                  <label className="block font-medium text-neutral-500">人物メモ・人柄</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-apple-border dark:border-apple-darkBorder">
                  <button
                    type="button"
                    onClick={() => setIsEditingPerson(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-apple-blue text-white text-xs font-medium"
                  >
                    変更を保存
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* タブナビゲーション */}
          <div className="flex border-b border-apple-border dark:border-apple-darkBorder space-x-4 text-xs font-medium overflow-x-auto pb-1">
            <button
              onClick={() => setDetailTab('overview')}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${
                detailTab === 'overview' ? 'border-apple-blue text-apple-blue dark:text-apple-darkBlue font-semibold' : 'border-transparent text-neutral-500'
              }`}
            >
              基本情報
            </button>
            <button
              onClick={() => setDetailTab('orgs')}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${
                detailTab === 'orgs' ? 'border-apple-blue text-apple-blue dark:text-apple-darkBlue font-semibold' : 'border-transparent text-neutral-500'
              }`}
            >
              会社・事業 ({orgMemberships.length + businessOfferings.length})
            </button>
            <button
              onClick={() => setDetailTab('bni')}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${
                detailTab === 'bni' ? 'border-apple-blue text-apple-blue dark:text-apple-darkBlue font-semibold' : 'border-transparent text-neutral-500'
              }`}
            >
              BNI所属・移籍履歴 ({memberships.length})
            </button>
            <button
              onClick={() => setDetailTab('facts')}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${
                detailTab === 'facts' ? 'border-apple-blue text-apple-blue dark:text-apple-darkBlue font-semibold' : 'border-transparent text-neutral-500'
              }`}
            >
              事実・出典 ({facts.length})
            </button>
            <button
              onClick={() => setDetailTab('delete')}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap text-red-500 ${
                detailTab === 'delete' ? 'border-red-500 font-semibold' : 'border-transparent text-red-400'
              }`}
            >
              安全な削除請求 (U09)
            </button>
          </div>

          {/* 基本情報タブ */}
          {detailTab === 'overview' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-neutral-400 font-medium block">連絡先情報</span>
                  <p className="mt-1 text-neutral-800 dark:text-neutral-200">
                    電話: {selectedPerson.primary_phone || '未登録'}<br />
                    メール: {selectedPerson.primary_email || '未登録'}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 font-medium block">事務所・拠点</span>
                  <p className="mt-1 text-neutral-800 dark:text-neutral-200">
                    {selectedPerson.office_address || '未登録'}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 font-medium block">対応可能エリア</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPerson.service_areas.length > 0 ? (
                      selectedPerson.service_areas.map(a => (
                        <span key={a} className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-500">未設定</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-400 font-medium block">面談記録</span>
                  <p className="mt-1 text-neutral-800 dark:text-neutral-200">
                    最終面談日: {selectedPerson.last_interacted_at ? new Date(selectedPerson.last_interacted_at).toLocaleDateString('ja-JP') : 'なし'}
                  </p>
                </div>
              </div>

              {selectedPerson.notes && (
                <div className="pt-4 border-t border-apple-border dark:border-apple-darkBorder">
                  <span className="text-neutral-400 font-medium block mb-1">人物メモ</span>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-2xl">
                    {selectedPerson.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 会社・事業タブ */}
          {detailTab === 'orgs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">1人の人物が複数の会社・事業を持つことができます (仕様23)</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const comp = prompt('会社名を入力してください:');
                      const title = prompt('役職を入力してください:');
                      if (comp && title) {
                        store.addOrganizationMembership(selectedPerson.id, comp, title);
                        onRefresh();
                      }
                    }}
                    className="px-3 py-1 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>会社を追加</span>
                  </button>
                  <button
                    onClick={() => setIsAddingOffering(true)}
                    className="px-3 py-1 rounded-xl border border-apple-border dark:border-apple-darkBorder text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>事業を追加</span>
                  </button>
                </div>
              </div>

              {/* 事業オファリング追加フォーム */}
              {isAddingOffering && (
                <form onSubmit={handleAddOffering} className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-3 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span>新規事業・提供サービスの登録</span>
                    <button type="button" onClick={() => setIsAddingOffering(false)}>✕</button>
                  </div>
                  <div>
                    <label className="block mb-1 text-neutral-500">サービス・事業名 *</label>
                    <input
                      type="text"
                      required
                      placeholder="例: 古民家カフェ改装・店舗リノベ"
                      value={offeringTitle}
                      onChange={(e) => setOfferingTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-neutral-500">強み・専門分野</label>
                    <input
                      type="text"
                      placeholder="例: 耐震基準適合証明、補助金申請サポート"
                      value={offeringSpecialties}
                      onChange={(e) => setOfferingSpecialties(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-neutral-500">求めたい顧客・紹介ニーズ</label>
                    <input
                      type="text"
                      placeholder="例: 京都でカフェを出店したいオーナー"
                      value={offeringTargets}
                      onChange={(e) => setOfferingTargets(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button type="button" onClick={() => setIsAddingOffering(false)} className="px-3 py-1.5 rounded-lg border">キャンセル</button>
                    <button type="submit" className="px-3.5 py-1.5 rounded-lg bg-apple-blue text-white font-medium">登録</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orgMemberships.map(m => (
                  <div key={m.id} className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-apple-blue" />
                        <h3 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">{m.organization_name}</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-apple-green/10 text-apple-green font-medium text-[10px]">現在所属</span>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-300">役職: {m.title}</p>
                    <p className="text-neutral-400 text-[11px]">開始日: {m.started_on || '不明'}</p>
                  </div>
                ))}
              </div>

              {businessOfferings.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">事業オファリング・提供サービス ({businessOfferings.length}件)</h4>
                  <div className="space-y-2">
                    {businessOfferings.map(bo => (
                      <div key={bo.id} className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-apple-border dark:border-apple-darkBorder text-xs space-y-1">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200">{bo.service_title}</div>
                        <p className="text-neutral-600 dark:text-neutral-400"><strong className="text-neutral-500">強み・専門:</strong> {bo.specialties}</p>
                        <p className="text-neutral-600 dark:text-neutral-400"><strong className="text-neutral-500">紹介ニーズ:</strong> {bo.target_clients}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BNI所属タブ */}
          {detailTab === 'bni' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">移籍・退会履歴を上書きせず時系列で完全保持します (仕様ID 11, PERSON-03)</span>
                <button
                  onClick={() => setIsTransferring(true)}
                  className="px-3 py-1 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium flex items-center space-x-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>チャプター移籍を記録</span>
                </button>
              </div>

              {isTransferring && (
                <form onSubmit={handleExecuteTransfer} className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-3 text-xs">
                  <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">新規チャプターへの移籍登録</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-neutral-500">移籍先チャプター *</label>
                      <select
                        required
                        value={targetChapterId}
                        onChange={(e) => setTargetChapterId(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder text-xs"
                      >
                        <option value="">選択してください</option>
                        {chapters.map(c => (
                          <option key={c.id} value={c.id}>{c.chapter_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-neutral-500">専門分野カテゴリー *</label>
                      <input
                        type="text"
                        required
                        placeholder="例: 店舗リノベーション"
                        value={transferCategory}
                        onChange={(e) => setTransferCategory(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-neutral-500">移籍理由・経緯</label>
                    <input
                      type="text"
                      placeholder="例: 事業特化に伴う移籍"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder text-xs"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsTransferring(false)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-xs"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-apple-blue text-white text-xs font-medium"
                    >
                      移籍を確定保存
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {memberships.map((m) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                      m.status === 'active'
                        ? 'bg-white dark:bg-[#1C1C1E] border-apple-blue/50 dark:border-apple-darkBlue/50 shadow-sm'
                        : 'bg-neutral-50 dark:bg-neutral-900/40 border-apple-border dark:border-apple-darkBorder opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Award className={`w-4 h-4 ${m.status === 'active' ? 'text-apple-blue' : 'text-neutral-400'}`} />
                        <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {m.chapter_name} ({m.region_name})
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        m.status === 'active' ? 'bg-apple-green/10 text-apple-green' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                      }`}>
                        {m.status === 'active' ? '現在所属' : '過去所属（移籍済み）'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-neutral-600 dark:text-neutral-400">
                      <div><strong className="text-neutral-400">カテゴリー:</strong> {m.category}</div>
                      <div><strong className="text-neutral-400">期間:</strong> {m.joined_on} 〜 {m.left_on || '現在'}</div>
                    </div>

                    {m.transfer_reason && (
                      <div className="p-2 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-neutral-500 text-[11px]">
                        移籍理由: {m.transfer_reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 事実・出典タブ */}
          {detailTab === 'facts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">
                  すべての事実に「出典」「確度」「公開範囲」を保持 (仕様04, 22, PERSON-09)
                </span>
                <button
                  onClick={() => setIsAddingFact(true)}
                  className="px-3 py-1 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>事実を記録</span>
                </button>
              </div>

              {isAddingFact && (
                <form onSubmit={handleAddFact} className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder space-y-3 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span>新規事実・話題・約束の記録</span>
                    <button type="button" onClick={() => setIsAddingFact(false)}>✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-neutral-500">分類</label>
                      <select
                        value={factCat}
                        onChange={(e) => setFactCat(e.target.value as FactCategory)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder"
                      >
                        <option value="topic">話題 (topic)</option>
                        <option value="promise">約束・フォロー (promise)</option>
                        <option value="request">紹介ニーズ (request)</option>
                        <option value="preference">好み・プライベート (preference)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-neutral-500">公開範囲</label>
                      <select
                        value={factVis}
                        onChange={(e) => setFactVis(e.target.value as FactVisibility)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder"
                      >
                        <option value="referral_eligible">紹介下書きに引用可能</option>
                        <option value="private">極秘・内部のみ (紹介に含めない)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-neutral-500">項目名 *</label>
                    <input
                      type="text"
                      required
                      placeholder="例: 次回までの約束、店舗拡大の予定"
                      value={factKey}
                      onChange={(e) => setFactKey(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-neutral-500">内容 *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="例: 来週水曜までに資料を送付する"
                      value={factValue}
                      onChange={(e) => setFactValue(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-700 border border-apple-border dark:border-apple-darkBorder"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button type="button" onClick={() => setIsAddingFact(false)} className="px-3 py-1.5 rounded-lg border">キャンセル</button>
                    <button type="submit" className="px-3.5 py-1.5 rounded-lg bg-apple-blue text-white font-medium">記録保存</button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {facts.map(f => (
                  <div key={f.id} className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{f.fact_key}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          f.visibility === 'referral_eligible'
                            ? 'bg-apple-blue/10 text-apple-blue dark:text-apple-darkBlue'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                        }`}>
                          {f.visibility === 'referral_eligible' ? '紹介引用可' : '非公開・内部のみ'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500">
                          確度 {Math.round(f.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                      {f.fact_value}
                    </p>

                    {f.source_evidence && (
                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder text-[11px] text-neutral-500 italic">
                        出典発話: 「{f.source_evidence}」
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 削除請求タブ */}
          {detailTab === 'delete' && (
            <div className="p-6 rounded-3xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-4 text-xs">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>本人からの完全削除請求（Right to be forgotten - U09）</span>
              </div>
              <p className="text-red-800 dark:text-red-300 leading-relaxed">
                本人の請求に基づき、人物カルテ・録音音声・文字起こし・抽出事実・相関図の全リンクを不可逆的に完全抹消します。
              </p>

              {deleteCertificate ? (
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 font-mono text-xs">
                  {deleteCertificate}
                </div>
              ) : (
                <button
                  onClick={handleExecutePurge}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>この人物のデータを完全削除（U09実演）</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 人物一覧リスト画面 */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">人物カルテ一覧</h1>
              <p className="text-xs text-neutral-500">一人ひとりの事業・話題・人間関係を出典付きで管理</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="名前、ふりがな、メモを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-xs text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
              />
            </div>

            <div className="flex space-x-1.5 overflow-x-auto pb-1 text-xs">
              {['ALL', 'BNI', '仕事', '友人', 'PROVISIONAL'].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(t)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                    selectedTag === t
                      ? 'bg-apple-blue dark:bg-apple-darkBlue text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                  }`}
                >
                  {t === 'ALL' ? '全員' : t === 'PROVISIONAL' ? '仮カルテ' : t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPersons.map(p => {
              const pMemberships = store.getBNIMembershipsForPerson(p.id);
              const activeChapter = pMemberships.find(m => m.status === 'active');
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    (store as any).selectedPersonId = p.id;
                    onRefresh();
                  }}
                  className="cursor-pointer p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder hover:border-apple-blue/50 transition-all flex items-start space-x-3.5 group shadow-sm"
                >
                  <img
                    src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] truncate group-hover:text-apple-blue transition-colors">
                        {p.display_name}
                      </h3>
                      {p.status === 'provisional' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-500 shrink-0">
                          仮登録
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">{p.phonetic_name}</p>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">
                      {activeChapter ? `${activeChapter.chapter_name} (${activeChapter.category})` : '所属設定なし'}
                    </p>
                    <div className="flex items-center space-x-2 mt-2 text-[10px] text-neutral-400">
                      <span className="flex items-center space-x-0.5">
                        <Tag className="w-3 h-3" />
                        <span>{p.category_tags.join(', ')}</span>
                      </span>
                      <span>•</span>
                      <span>面談 {p.meeting_count}回</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPersons.length === 0 && (
            <div className="text-center py-12 text-xs text-neutral-400">
              該当する人物が見つかりませんでした。
            </div>
          )}
        </div>
      )}
    </div>
  );
};
