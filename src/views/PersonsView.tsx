import React, { useState, useRef } from 'react';
import {
  Search, Shield, Building, Award, History,
  Trash2, Plus, ArrowLeft, Tag, Edit3, X, Camera, Check, FolderPlus, Upload, AlertCircle
} from 'lucide-react';
import { store } from '../services/store';
import { CategoryTag, FactCategory, FactVisibility } from '../types';
import { UserAvatar } from '../components/UserAvatar';

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
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>();

  // 顔写真アップロード・変更モーダル状態
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // カテゴリー管理・追加状態
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [quickNewCategoryInput, setQuickNewCategoryInput] = useState('');
  const [isAddingQuickCategory, setIsAddingQuickCategory] = useState(false);

  // カルテ編集モーダル状態
  const [isEditingPerson, setIsEditingPerson] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhonetic, setEditPhonetic] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editServiceAreas, setEditServiceAreas] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategoryTags, setEditCategoryTags] = useState<string[]>([]);

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
  const confirmedCount = persons.filter(p => p.status !== 'provisional').length;
  const provisionalCount = persons.filter(p => p.status === 'provisional').length;
  const chapters = store.getBNIChapters();

  // フィルタリング
  const filteredPersons = persons.filter(p => {
    const matchQuery =
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phonetic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchTag =
      selectedTag === 'ALL'
        ? p.status !== 'provisional'
        : selectedTag === 'PROVISIONAL'
        ? p.status === 'provisional'
        : p.status !== 'provisional' && p.category_tags.includes(selectedTag as CategoryTag);

    return matchQuery && matchTag;
  });

  const activePersonId = selectedPersonId || internalSelectedId;
  const selectedPerson = activePersonId ? store.getPersonById(activePersonId) : undefined;
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
    setEditCategoryTags([...(selectedPerson.category_tags || [])]);
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
      category_tags: editCategoryTags,
    });

    setIsEditingPerson(false);
    onRefresh();
  };

  // カテゴリー割り当てトグル（1タップで追加・解除）
  const handleTogglePersonCategory = (categoryName: string) => {
    if (!selectedPerson) return;
    const current = selectedPerson.category_tags || [];
    let updated: string[];
    if (current.includes(categoryName)) {
      updated = current.filter(c => c !== categoryName);
    } else {
      updated = [...current, categoryName];
    }
    store.updatePersonCategories(selectedPerson.id, updated);
    onRefresh();
  };

  // 新規カテゴリーを作成して現在の人物に即時割り振り
  const handleCreateAndAssignCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickNewCategoryInput.trim();
    if (!trimmed || !selectedPerson) return;
    store.addCategory(trimmed);
    const current = selectedPerson.category_tags || [];
    if (!current.includes(trimmed)) {
      store.updatePersonCategories(selectedPerson.id, [...current, trimmed]);
    }
    setQuickNewCategoryInput('');
    setIsAddingQuickCategory(false);
    onRefresh();
  };

  // グローバルに新規カテゴリー作成（一覧のヘッダーから）
  const handleCreateGlobalCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    store.addCategory(trimmed);
    setNewCategoryName('');
    onRefresh();
  };

  // カテゴリーの削除
  const handleRemoveCategory = (catName: string) => {
    if (confirm(`カテゴリー「${catName}」を削除しますか？`)) {
      store.removeCategory(catName);
      if (selectedTag === catName) {
        setSelectedTag('ALL');
      }
      onRefresh();
    }
  };

  // 顔写真ファイル選択（カメラ / 写真ライブラリ）
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPerson) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        store.updatePersonAvatar(selectedPerson.id, dataUrl);
        setIsAvatarModalOpen(false);
        onRefresh();
      }
    };
    reader.readAsDataURL(file);
  };

  // 顔写真URL登録
  const handleSaveAvatarUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !customAvatarUrl.trim()) return;
    store.updatePersonAvatar(selectedPerson.id, customAvatarUrl.trim());
    setCustomAvatarUrl('');
    setIsAvatarModalOpen(false);
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
            onClick={() => {
              setInternalSelectedId(undefined);
              onClosePersonDetail();
            }}
            className="inline-flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>人脈一覧へ戻る</span>
          </button>

          {/* カルテヘッダー */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                {/* 顔写真（タップで変更・カメラ起動可能） */}
                <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                  <UserAvatar
                    name={selectedPerson.display_name}
                    avatarUrl={selectedPerson.avatar_url}
                    size="xl"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-medium flex-col space-y-0.5">
                    <Camera className="w-4 h-4" />
                    <span>変更</span>
                  </div>
                </div>

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
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-apple-blue/10 text-apple-blue dark:text-apple-darkBlue font-medium">
                      面談計 {selectedPerson.meeting_count}回
                    </span>
                    <button
                      onClick={() => setIsAvatarModalOpen(true)}
                      className="text-[11px] text-neutral-500 hover:text-apple-blue flex items-center space-x-1 px-1.5 py-0.5 rounded transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      <span>顔写真を変更</span>
                    </button>
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

            {/* カテゴリー手動割り振り・作成バー */}
            <div className="pt-3 border-t border-apple-border dark:border-apple-darkBorder flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
              <span className="text-neutral-500 font-medium whitespace-nowrap flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-apple-blue" />
                <span>所属カテゴリー:</span>
              </span>

              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                {store.getCategories().map(cat => {
                  const isAssigned = (selectedPerson.category_tags || []).includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleTogglePersonCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
                        isAssigned
                          ? 'bg-apple-blue text-white shadow-sm'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                      title={isAssigned ? 'クリックして解除' : 'クリックして割り振り'}
                    >
                      {isAssigned ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span>{cat}</span>
                    </button>
                  );
                })}

                {/* 新規カテゴリー追加インラインフォーム */}
                {isAddingQuickCategory ? (
                  <form onSubmit={handleCreateAndAssignCategory} className="flex items-center space-x-1">
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="新カテゴリー名 (例: 幹部)"
                      value={quickNewCategoryInput}
                      onChange={(e) => setQuickNewCategoryInput(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-apple-blue text-xs text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-apple-blue text-white text-xs font-medium hover:opacity-90"
                    >
                      追加
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingQuickCategory(false);
                        setQuickNewCategoryInput('');
                      }}
                      className="px-2 py-1 rounded-lg text-xs text-neutral-400 hover:text-neutral-600"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingQuickCategory(true)}
                    className="px-2.5 py-1 rounded-lg border border-dashed border-apple-border dark:border-apple-darkBorder text-neutral-500 hover:text-apple-blue hover:border-apple-blue text-xs font-medium transition-colors flex items-center space-x-1"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>＋ 新カテゴリー作成</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 顔写真変更モーダル */}
          {isAvatarModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-3xl border border-apple-border dark:border-apple-darkBorder p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
                  <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-apple-blue" />
                    <span>顔写真の変更・登録</span>
                  </h3>
                  <button type="button" onClick={() => setIsAvatarModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col items-center space-y-3">
                  <img
                    src={selectedPerson.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="プレビュー"
                    className="w-24 h-24 rounded-2xl object-cover border border-apple-border dark:border-apple-darkBorder shadow-md"
                  />
                  <span className="text-xs text-neutral-500">{selectedPerson.display_name} 様の顔写真</span>
                </div>

                {/* 隠しファイルインプット */}
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="w-full py-2.5 rounded-xl bg-apple-blue text-white font-medium text-xs hover:opacity-90 flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>端末の写真・カメラから選択</span>
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-apple-border dark:border-apple-darkBorder w-full"></div>
                    <span className="bg-white dark:bg-[#1C1C1E] px-2 text-[10px] text-neutral-400 absolute">または</span>
                  </div>

                  <form onSubmit={handleSaveAvatarUrl} className="space-y-2">
                    <input
                      type="url"
                      placeholder="画像URLを入力 (https://...)"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs"
                    />
                    <button
                      type="submit"
                      disabled={!customAvatarUrl.trim()}
                      className="w-full py-2 rounded-xl bg-neutral-800 dark:bg-neutral-700 text-white font-medium text-xs disabled:opacity-40"
                    >
                      URLで顔写真を更新
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

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

                <div className="text-xs space-y-1.5">
                  <label className="block font-medium text-neutral-500">所属カテゴリー</label>
                  <div className="flex flex-wrap gap-1.5">
                    {store.getCategories().map(cat => {
                      const isChecked = editCategoryTags.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setEditCategoryTags(editCategoryTags.filter(c => c !== cat));
                            } else {
                              setEditCategoryTags([...editCategoryTags, cat]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1 ${
                            isChecked
                              ? 'bg-apple-blue text-white border-apple-blue'
                              : 'bg-neutral-50 dark:bg-neutral-800/60 border-apple-border dark:border-apple-darkBorder text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {isChecked ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{cat}</span>
                        </button>
                      );
                    })}
                  </div>
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
          <div className="flex border-b border-apple-border dark:border-apple-darkBorder space-x-4 text-xs font-medium overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
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
                  {selectedTag === 'PROVISIONAL' && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">会話・1to1の中で名前が出た「仮人脈」です</p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  直接名刺交換や面談を行っていないため、メインの実人脈一覧とは分けて保管しています。後日実際にZoomや面談を行った際は、自動で重複検知され本カルテへ昇格・統合されます。
                </p>
              </div>
            </div>
          )}

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

            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setSelectedTag('ALL')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                  selectedTag === 'ALL'
                    ? 'bg-apple-blue dark:bg-apple-darkBlue text-white shadow-sm'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                }`}
              >
                実人脈（全員） {confirmedCount > 0 && `(${confirmedCount})`}
              </button>

              {store.getCategories().map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedTag(cat)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                    selectedTag === cat
                      ? 'bg-apple-blue dark:bg-apple-darkBlue text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <button
                onClick={() => setSelectedTag('PROVISIONAL')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                  selectedTag === 'PROVISIONAL'
                    ? 'bg-apple-blue dark:bg-apple-darkBlue text-white shadow-sm'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                }`}
              >
                仮人脈・言及 {provisionalCount > 0 && `(${provisionalCount})`}
              </button>

              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-2.5 py-1.5 rounded-xl border border-dashed border-apple-border dark:border-apple-darkBorder text-neutral-500 hover:text-apple-blue hover:border-apple-blue text-xs font-medium transition-colors whitespace-nowrap flex items-center space-x-1"
                title="新しいカテゴリーを作成"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>＋ カテゴリー追加</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPersons.map(p => {
              const pMemberships = store.getBNIMembershipsForPerson(p.id);
              const activeChapter = pMemberships.find(m => m.status === 'active');
              return (
                <div
                  key={p.id}
                  onClick={() => setInternalSelectedId(p.id)}
                  className="cursor-pointer p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder hover:border-apple-blue/50 transition-all flex items-start space-x-3.5 group shadow-sm"
                >
                  <UserAvatar
                    name={p.display_name}
                    avatarUrl={p.avatar_url}
                    size="lg"
                    className="shrink-0"
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
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-3">
              <Building className="w-8 h-8 text-neutral-400 mx-auto" />
              <h3 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                {searchQuery || selectedTag !== 'ALL' ? '該当する人物が見つかりませんでした' : '登録されている人脈はありません'}
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {searchQuery || selectedTag !== 'ALL'
                  ? '検索条件を変更するか、タグを「全員」に切り替えてみてください。'
                  : '名刺の撮影・アップロード、または「＋追加」やCSV取込から新しい人脈カルテを登録しましょう。'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* カテゴリー管理・新規追加モーダル */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl border border-apple-border dark:border-apple-darkBorder p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
              <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-2">
                <FolderPlus className="w-4 h-4 text-apple-blue" />
                <span>人脈カテゴリーの管理・追加</span>
              </h3>
              <button type="button" onClick={() => setShowAddCategoryModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              自社の事業や人脈に合わせて自由にカテゴリーを整理できます（不要なタグは削除可能）。
            </p>

            {/* 登録済みカテゴリー一覧 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                現在の登録カテゴリー ({store.getCategories().length}件)
              </label>
              <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder">
                {store.getCategories().map(cat => (
                  <span
                    key={cat}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-apple-border dark:border-apple-darkBorder shadow-2xs"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-neutral-400 hover:text-red-500 transition-colors p-0.5 rounded"
                      title={`${cat} を削除`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 新規カテゴリー追加フォーム */}
            <form onSubmit={handleCreateGlobalCategory} className="space-y-3 pt-2 border-t border-apple-border dark:border-apple-darkBorder">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  新しいカテゴリーを作成
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    placeholder="例: 一般社団法人stone, 幹部, 提携先 など"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                  />
                  <button
                    type="submit"
                    disabled={!newCategoryName.trim()}
                    className="px-4 py-2 rounded-xl bg-apple-blue text-white text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity whitespace-nowrap shadow-sm"
                  >
                    追加する
                  </button>
                </div>
              </div>
            </form>

            <div className="flex justify-end pt-2 border-t border-apple-border dark:border-apple-darkBorder">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
