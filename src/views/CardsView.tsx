import React, { useState, useRef } from 'react';
import { Camera, ShieldCheck, Eye, Upload, UserPlus, CheckCircle2 } from 'lucide-react';
import { store } from '../services/store';

export const CardsView: React.FC = () => {
  const [, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 実名刺撮影・アップロード状態
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardPhonetic, setCardPhonetic] = useState('');
  const [cardCompany, setCardCompany] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardPhone, setCardPhone] = useState('');
  const [cardEmail, setCardEmail] = useState('');
  const [cardAddress, setCardAddress] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const cardScans = store.getCardScans();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);

        // ファイル名や自動推測の簡易デフォルトセット
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        if (!cardName && baseName.length > 1 && !baseName.startsWith('image')) {
          setCardName(baseName);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveRealCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedImage || !cardName.trim()) return;

    store.createCardScanWithPhoto(capturedImage, {
      person_name: cardName,
      phonetic_name: cardPhonetic,
      company_name: cardCompany,
      title: cardTitle,
      phone: cardPhone,
      email: cardEmail,
      address: cardAddress,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setCapturedImage(null);
      setCardName('');
      setCardPhonetic('');
      setCardCompany('');
      setCardTitle('');
      setCardPhone('');
      setCardEmail('');
      setCardAddress('');
      setRefreshKey(prev => prev + 1);
    }, 1500);
  };

  const handleSimulateScan = () => {
    store.simulateCardOCR('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-28 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">名刺カメラ・OCR登録</h1>
          <p className="text-xs text-neutral-500">
            スマホのカメラ撮影または画像選択で名刺を取り込み。原画像と対照しながら正確に登録 (仕様08, CARD-01〜06)
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* 実カメラ起動 / ファイル選択ボタン */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center space-x-1.5 shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>名刺をカメラで撮影 / アップロード</span>
          </button>

          <button
            onClick={handleSimulateScan}
            className="px-3 py-2 rounded-xl border border-apple-border dark:border-apple-darkBorder text-neutral-600 dark:text-neutral-400 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            サンプル名刺をスキャン
          </button>
        </div>
      </div>

      {/* 新規名刺の撮影・確認フォーム */}
      {capturedImage && (
        <form onSubmit={handleSaveRealCard} className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-blue/50 dark:border-apple-darkBlue/50 space-y-5 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between border-b border-apple-border dark:border-apple-darkBorder pb-3">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 text-apple-blue" />
              <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">撮影した名刺の確認 & カルテ登録</h2>
            </div>
            <button
              type="button"
              onClick={() => setCapturedImage(null)}
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              破棄して撮り直す
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 撮影画像プレビュー */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-neutral-500">撮影した原画像</span>
              <div className="h-64 rounded-2xl overflow-hidden border border-apple-border dark:border-apple-darkBorder bg-black flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="撮影名刺"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            {/* 入力・抽出項目フォーム */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-medium text-neutral-600 dark:text-neutral-400">氏名 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例: 佐藤 太郎"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-neutral-600 dark:text-neutral-400">ふりがな</label>
                  <input
                    type="text"
                    placeholder="例: さとう たろう"
                    value={cardPhonetic}
                    onChange={(e) => setCardPhonetic(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-medium text-neutral-600 dark:text-neutral-400">会社名</label>
                  <input
                    type="text"
                    placeholder="例: 株式会社サンプル"
                    value={cardCompany}
                    onChange={(e) => setCardCompany(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-neutral-600 dark:text-neutral-400">役職</label>
                  <input
                    type="text"
                    placeholder="例: 代表取締役"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-medium text-neutral-600 dark:text-neutral-400">電話番号</label>
                  <input
                    type="tel"
                    placeholder="例: 090-1234-5678"
                    value={cardPhone}
                    onChange={(e) => setCardPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-neutral-600 dark:text-neutral-400">メールアドレス</label>
                  <input
                    type="email"
                    placeholder="例: sato@example.com"
                    value={cardEmail}
                    onChange={(e) => setCardEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium text-neutral-600 dark:text-neutral-400">住所・所在地</label>
                <input
                  type="text"
                  placeholder="例: 東京都港区六本木..."
                  value={cardAddress}
                  onChange={(e) => setCardAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-1.5 shadow-md mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>名刺を保存して人物カルテを作成</span>
              </button>
            </div>
          </div>

          {isSuccess && (
            <div className="p-3 bg-apple-green/10 text-apple-green rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>名刺を登録し、人物カルテに自動反映しました</span>
            </div>
          )}
        </form>
      )}

      {/* スキャン済みカード一覧 */}
      <div className="space-y-6">
        {cardScans.map((cs: any) => (
          <div
            key={cs.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between pb-3 border-b border-apple-border dark:border-apple-darkBorder">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {cs.raw_extracted.person_name} 様の名刺
                </span>
                <span className="text-xs text-neutral-400">({cs.raw_extracted.company_name})</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                cs.status === 'completed'
                  ? 'bg-apple-green/10 text-apple-green'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {cs.status === 'completed' ? '確認済み・カルテ連携済み' : '要確認項目あり'}
              </span>
            </div>

            {/* 原画とOCR抽出の並列対照エリア */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-medium text-neutral-500">
                  <Eye className="w-3.5 h-3.5" />
                  <span>元スキャン原画</span>
                </div>
                <div className="h-56 rounded-2xl overflow-hidden border border-apple-border dark:border-apple-darkBorder bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <img
                    src={cs.image_url}
                    alt="名刺原画"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-xs font-medium text-neutral-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-apple-green" />
                  <span>忠実OCR抽出（Web検索混入なし）</span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-apple-border dark:border-apple-darkBorder space-y-2.5">
                  <div>
                    <span className="text-neutral-400 block text-[11px]">氏名・ふりがな</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {cs.raw_extracted.person_name} {cs.raw_extracted.phonetic_name ? `(${cs.raw_extracted.phonetic_name})` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[11px]">会社名・役職</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {cs.raw_extracted.company_name} {cs.raw_extracted.title ? `| ${cs.raw_extracted.title}` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[11px]">連絡先</span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {cs.raw_extracted.phone_numbers?.join(' / ') || '電話未設定'} | {cs.raw_extracted.email || 'メール未設定'}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[11px]">住所</span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {cs.raw_extracted.address || '住所未設定'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {cardScans.length === 0 && !capturedImage && (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder space-y-3">
            <Camera className="w-10 h-10 mx-auto text-neutral-400" />
            <h3 className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">名刺の登録がまだありません</h3>
            <p className="text-xs text-neutral-500">
              上部の「名刺をカメラで撮影」ボタンから、実際の名刺を撮影してカルテを作成しましょう。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
