import React, { useState } from 'react';
import { X, Mic, Upload, FileText, Sparkles, Smartphone, AlertCircle } from 'lucide-react';
import { store } from '../services/store';

interface MeetingRecordingModalProps {
  isOpen: boolean;
  meetingId: string | null;
  onClose: () => void;
  onSuccess: (meetingId: string) => void;
}

export const MeetingRecordingModal: React.FC<MeetingRecordingModalProps> = ({
  isOpen,
  meetingId,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'demo'>('text');
  const [transcriptText, setTranscriptText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !meetingId) return null;

  const meeting = store.getMeetings().find(m => m.id === meetingId);
  const firstPid = meeting?.participant_ids[0];
  const participant = firstPid ? store.getPersonById(firstPid) : undefined;

  const handleProcess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        store.processMeetingRecordingAndAutoRegister(
          meetingId,
          activeTab === 'text' && transcriptText.trim().length > 0 ? transcriptText : undefined
        );
        setIsProcessing(false);
        onSuccess(meetingId);
        onClose();
      } catch (e: any) {
        setIsProcessing(false);
        alert(e.message || '解析中にエラーが発生しました');
      }
    }, 600);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // 音声ファイル受領時、仮の文字起こしテキストをプレビュー用としてセット
      setTranscriptText(`[音声ファイル: ${file.name} を自動音声認識]`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-apple-card dark:bg-apple-darkCard rounded-3xl border border-apple-border dark:border-apple-darkBorder shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ヘッダー */}
        <div className="p-4 sm:p-5 border-b border-apple-border dark:border-apple-darkBorder flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                面談録音・文字起こしからAI自動解析
              </h2>
              <p className="text-[11px] text-neutral-500">
                {meeting?.title || '面談'}（{participant?.display_name || 'お相手'}）
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* スマホZoom利用時の安心ガイド */}
        <div className="px-5 pt-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2.5">
            <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <span className="font-bold">📱 携帯（スマホ）からZoomを受ける場合:</span>
              <p className="text-neutral-600 dark:text-neutral-300">
                スマホはOSの制限により通話音声が直接録音できないため、Zoom内の<strong>「クラウド録音」</strong>や<strong>「AI Companion」</strong>をご利用いただくか、終了後に<strong>会話メモや要約テキストをここに貼り付ける</strong>のが最も確実です。
              </p>
            </div>
          </div>
        </div>

        {/* タブ選択 */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-1.5 rounded-xl font-medium transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'text'
                  ? 'bg-white dark:bg-neutral-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>文字起こし / メモ貼付</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-1.5 rounded-xl font-medium transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-neutral-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>音声ファイル添付</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-1.5 rounded-xl font-medium transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'demo'
                  ? 'bg-white dark:bg-neutral-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>デモ解析</span>
            </button>
          </div>

          {/* タブ1: テキスト・メモ貼り付け */}
          {activeTab === 'text' && (
            <div className="space-y-2">
              <label className="block text-neutral-500 font-semibold">
                Zoomの文字起こし、または面談メモを貼り付け:
              </label>
              <textarea
                rows={6}
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder={`例:\nはじめまして、株式会社〇〇の〇〇です。京都市内でカフェをやっています。\nどんな人を紹介してほしいですか？などの会話や、\n来週カタログをお送りする約束などを貼り付けます。`}
                className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <div className="flex items-center space-x-1 text-[11px] text-neutral-400">
                <AlertCircle className="w-3 h-3 text-purple-500 shrink-0" />
                <span>雑多なメモや箇条書きでも、AIが相手の会社・事業・話題・約束を正確に抽出します。</span>
              </div>
            </div>
          )}

          {/* タブ2: 音声ファイル添付 */}
          {activeTab === 'file' && (
            <div className="space-y-3">
              <label className="block text-neutral-500 font-semibold">
                録音ファイル（.m4a, .mp3, .wav）を選択:
              </label>
              <div className="border-2 border-dashed border-apple-border dark:border-apple-darkBorder rounded-2xl p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="audio/*,.m4a,.mp3,.wav"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Mic className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {fileName ? fileName : 'ファイルを選択 または ドロップ'}
                </p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  ボイスメモ、ICレコーダー、Zoomクラウド録音の音声ファイルに対応
                </p>
              </div>
            </div>
          )}

          {/* タブ3: デモ解析 */}
          {activeTab === 'demo' && (
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder space-y-2">
              <span className="font-bold text-neutral-800 dark:text-neutral-200">
                ⚡ 1タップ・シミュレーション解析
              </span>
              <p className="text-neutral-500 text-[11px] leading-relaxed">
                テスト用に、面談での自己紹介・会社概要・盛り上がった話題・次回までの約束の会話サンプルを用いて、AIによるカルテ自動生成とお礼文作成を一括シミュレーションします。
              </p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 sm:p-5 border-t border-apple-border dark:border-apple-darkBorder flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium"
          >
            キャンセル
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleProcess}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <span>AI解析中...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI解析・カルテとお礼文を生成</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
