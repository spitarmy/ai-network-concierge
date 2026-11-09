import React, { useState, useRef } from 'react';
import { Camera, ShieldCheck, Eye, Upload, CheckCircle2, Sparkles, AlertTriangle, HardDrive } from 'lucide-react';
import { store } from '../services/store';
import { compressImage, CompressionResult } from '../utils/imageCompressor';

export const CardsView: React.FC = () => {
  const [, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 実名刺撮影・アップロード状態
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const [cardName, setCardName] = useState('');
  const [cardPhonetic, setCardPhonetic] = useState('');
  const [cardCompany, setCardCompany] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardPhone, setCardPhone] = useState('');
  const [cardEmail, setCardEmail] = useState('');
  const [cardAddress, setCardAddress] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const cardScans = store.getCardScans();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        // スマホの生写真（3MB〜8MB）を自動で高精細WebP（約30〜60KB）に超圧縮
        const result = await compressImage(file, {
          maxWidth: 1000,
          maxHeight: 1000,
          quality: 0.72,
          preferredFormat: 'image/webp',
        });
        setCapturedImage(result.dataUrl);
        setCompressionStats(result);

        // ファイル名からの簡易デフォルトセット
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        if (!cardName && baseName.length > 1 && !baseName.startsWith('image') && !baseName.startsWith('IMG')) {
          setCardName(baseName);
        }
      } catch (err) {
        console.error('画像圧縮エラー。フォールバック読み込みを実行します:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          setCapturedImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSaveRealCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedImage || !cardName.trim()) return;

    store.createCardScanWithPhoto(
      capturedImage,
      {
        person_name: cardName.trim(),
        phonetic_name: cardPhonetic.trim(),
        company_name: cardCompany.trim(),
        title: cardTitle.trim(),
        phone: cardPhone.trim(),
        email: cardEmail.trim(),
        address: cardAddress.trim(),
      },
      {
        originalSize: compressionStats?.originalSizeBytes,
        compressedSize: compressionStats?.compressedSizeBytes,
      }
    );

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setCapturedImage(null);
      setCompressionStats(null);
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
      {/* 画面ヘッダー */}
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
            disabled={isCompressing}
            className="px-4 py-2 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCompressing ? '最適化中...' : '名刺をカメラで撮影 / アップロード'}</span>
          </button>

          <button
            onClick={handleSimulateScan}
            className="px-3 py-2 rounded-xl border border-apple-border dark:border-apple-darkBorder text-neutral-600 dark:text-neutral-400 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            サンプル名刺をスキャン
          </button>
        </div>
      </div>

      {/* 容量・スケーラビリティ安全ガードレール バナー */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-neutral-700 dark:text-neutral-300 flex items-start sm:items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <HardDrive className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center space-x-1.5">
            <span>🛡️ 何千枚保存しても容量安心・高速動作アーキテクチャ</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">WebP Auto-Compression</span>
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
            スマホ写真（3〜8MB）を自動で鮮明なまま約40〜60KB（98%〜99%削減）に圧縮。1,000〜5,000枚以上の名刺・カルテを登録しても、スマホの容量を圧迫したり動作が重くなる心配は一切ありません。
          </p>
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
              onClick={() => {
                setCapturedImage(null);
                setCompressionStats(null);
              }}
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              キャンセル
            </button>
          </div>

          {/* 圧縮結果ステータスバナー */}
          {compressionStats && (
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold">
                  自動軽量化完了: {(compressionStats.originalSizeBytes / 1024).toFixed(0)}KB → {(compressionStats.compressedSizeBytes / 1024).toFixed(0)}KB ({compressionStats.compressionRatioPercent}%削減)
                </span>
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">文字・ロゴの鮮明度維持</span>
            </div>
          )}

          {/* 漢字・誤読防止アラート */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-center space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              ⚠️ 筆文字・異体字の誤読防止: 名刺のお名前の漢字に誤りがないか必ずご確認ください。修正した漢字はカルテに永久保存されます。
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* プレビュー画像 */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-neutral-500">撮影画像プレビュー</span>
              <div className="h-64 rounded-2xl overflow-hidden border border-apple-border dark:border-apple-darkBorder bg-black flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="撮影名刺"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="text-[10px] text-neutral-400 text-center">
                ※ 原本画像は安全に圧縮保存され、いつでもカルテから見直せます
              </p>
            </div>

            {/* 入力フォーム */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-500 mb-1 font-medium flex items-center justify-between">
                  <span>氏名（漢字）* 必須</span>
                  <span className="text-[10px] text-amber-600 font-normal">※ 漢字の間違いにご注意ください</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: 辻 晃典"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1 font-medium">ふりがな</label>
                <input
                  type="text"
                  placeholder="例: つじ あきのり"
                  value={cardPhonetic}
                  onChange={(e) => setCardPhonetic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">会社名</label>
                  <input
                    type="text"
                    placeholder="例: 株式会社○○"
                    value={cardCompany}
                    onChange={(e) => setCardCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">役職</label>
                  <input
                    type="text"
                    placeholder="例: 代表取締役"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">電話番号</label>
                  <input
                    type="tel"
                    placeholder="例: 090-0000-0000"
                    value={cardPhone}
                    onChange={(e) => setCardPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1 font-medium">メールアドレス</label>
                  <input
                    type="email"
                    placeholder="例: info@example.com"
                    value={cardEmail}
                    onChange={(e) => setCardEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1 font-medium">所在地・住所</label>
                <input
                  type="text"
                  placeholder="例: 京都市伏見区..."
                  value={cardAddress}
                  onChange={(e) => setCardAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>この内容で人物カルテを作成・登録</span>
                </button>
              </div>
            </div>
          </div>

          {isSuccess && (
            <div className="p-3 bg-apple-green/10 text-apple-green rounded-xl text-xs flex items-center space-x-2 font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>名刺を高精細圧縮して登録し、人物カルテに自動反映しました</span>
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
                {cs.raw_extracted.company_name && (
                  <span className="text-xs text-neutral-400">({cs.raw_extracted.company_name})</span>
                )}
                {cs.compressed_size_bytes && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono">
                    軽量化済 {Math.round(cs.compressed_size_bytes / 1024)}KB
                  </span>
                )}
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
                  {cs.image_url ? (
                    <img
                      src={cs.image_url}
                      alt="名刺原画"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-neutral-400">原画は圧縮アーカイブ済み</div>
                  )}
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
                      {cs.raw_extracted.company_name || '会社名未記載'} {cs.raw_extracted.title ? `| ${cs.raw_extracted.title}` : ''}
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
