import React, { useState, useEffect } from 'react';
import { X, Mic, Upload, FileText, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';
import { store } from '../services/store';
import {
  transcribeAudioWithGemini,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
} from '../services/geminiAudioTranscribe';

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
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [fileName, setFileName] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGeminiApiKey(getStoredGeminiApiKey());
    }
  }, [isOpen]);

  if (!isOpen || !meetingId) return null;

  const meeting = store.getMeetings().find(m => m.id === meetingId);
  const firstPid = meeting?.participant_ids[0];
  const participant = firstPid ? store.getPersonById(firstPid) : undefined;

  const handleProcess = async () => {
    if (activeTab === 'file') {
      if (!selectedFile) {
        alert('録音音声ファイル（.m4a, .mp3, .wav等）を選択してください。');
        return;
      }
      if (!geminiApiKey.trim()) {
        alert('音声ファイルを完全自動で文字起こしするにはGemini APIキーが必要です。\nGoogle AI Studioで無料発行したキーを入力してください。');
        return;
      }

      setIsProcessing(true);
      setStatusMessage('音声ファイルをGemini AIに送信中...（音声の長さにより10〜30秒かかります）');

      try {
        setStoredGeminiApiKey(geminiApiKey);
        const result = await transcribeAudioWithGemini(selectedFile, geminiApiKey);
        setStatusMessage('文字起こし完了！カルテとお礼状を自動作成中...');

        store.applyGeminiAudioResult(meetingId, result);
        setIsProcessing(false);
        onSuccess(meetingId);
        onClose();
      } catch (e: any) {
        setIsProcessing(false);
        setStatusMessage('');
        alert('音声の自動文字起こしに失敗しました:\n' + (e.message || String(e)));
      }
      return;
    }

    // テキスト・メモ入力タブの場合
    if (activeTab === 'text') {
      if (!transcriptText.trim()) {
        alert('面談のメモや文字起こしテキストを入力してください。');
        return;
      }

      setIsProcessing(true);
      setStatusMessage('メモ・文字起こしをAI解析中...');

      setTimeout(() => {
        try {
          store.processMeetingRecordingAndAutoRegister(meetingId, transcriptText.trim());
          setIsProcessing(false);
          onSuccess(meetingId);
          onClose();
        } catch (e: any) {
          setIsProcessing(false);
          setStatusMessage('');
          alert(e.message || '解析中にエラーが発生しました');
        }
      }, 500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
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
                面談録音からAI自動文字起こし & 要約
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

        {/* タブ選択 */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-apple-border dark:border-apple-darkBorder">
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
              <span>音声ファイル自動文字起こし（本命）</span>
            </button>
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
          </div>

          {/* タブ1: 音声ファイル添付 & Gemini AI文字起こし */}
          {activeTab === 'file' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-300 font-semibold mb-1">
                  録音音声ファイル（iPhoneボイスメモ / Zoom録音 / .m4a / .mp3等）:
                </label>
                <div className="border-2 border-dashed border-purple-300 dark:border-purple-800/80 rounded-2xl p-4 text-center hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors cursor-pointer relative bg-purple-50/20 dark:bg-purple-950/10">
                  <input
                    type="file"
                    accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.mp4"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Mic className="w-7 h-7 text-purple-600 dark:text-purple-400 mx-auto mb-1.5" />
                  <p className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] text-xs">
                    {fileName ? `選択済み: ${fileName}` : 'タップして録音音声ファイルを選択'}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    iPhoneのファイルApp、ボイスメモ、Zoom音声に対応
                  </p>
                </div>
              </div>

              {/* Gemini API設定カード */}
              <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 rounded-2xl border border-purple-200/80 dark:border-purple-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-950 dark:text-purple-200 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Gemini 音声AI文字起こし連携</span>
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-0.5"
                  >
                    <span>無料でキーを取得</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  音声を丸ごとAIが聴き取り、一言一句文字起こしした上で、相手の事業・話題・次回約束・お礼状をすべて自動生成します。
                </p>
                <div className="space-y-1">
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => {
                      setGeminiApiKey(e.target.value);
                      setStoredGeminiApiKey(e.target.value);
                    }}
                    placeholder="Gemini APIキーを入力 (AIzaSy...)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-850 border border-purple-300 dark:border-purple-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                  <p className="text-[10px] text-neutral-400">
                    ※Google AI Studioのアカウント（無料）があれば、毎分15回まで完全無料で利用できます。キーは端末内に安全に保存されます。
                  </p>
                </div>
              </div>

              {isProcessing && (
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-2xl border border-purple-300 dark:border-purple-700 text-xs text-purple-900 dark:text-purple-200 flex items-center space-x-2 animate-pulse">
                  <Sparkles className="w-4 h-4 shrink-0 text-purple-600" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* タブ2: テキスト・メモ貼り付け */}
          {activeTab === 'text' && (
            <div className="space-y-2">
              <label className="block text-neutral-500 font-semibold">
                Zoom文字起こし、または面談メモを貼り付け:
              </label>
              <textarea
                rows={6}
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder={`【例】\n木村さんと面談を実施。\n一般社団法人stoneの今後の活動方針について意見交換。\n次回までにイベントの企画概要をまとめて共有する約束をした。`}
                className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-apple-border dark:border-apple-darkBorder text-[#1D1D1F] dark:text-[#F5F5F7] font-sans text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <div className="flex items-center space-x-1 text-[11px] text-neutral-400">
                <AlertCircle className="w-3 h-3 text-purple-500 shrink-0" />
                <span>雑多なメモや箇条書きでも、AIが相手の会社・事業・話題・約束を正確に抽出します。</span>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 sm:p-5 border-t border-apple-border dark:border-apple-darkBorder flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium"
          >
            キャンセル
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleProcess}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <span>AI文字起こし＆解析中...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI自動文字起こし＆カルテ生成を開始</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
