import React, { useState } from 'react';
import { Send, Mic, User, FileText, ArrowRight } from 'lucide-react';
import { store } from '../services/store';

interface AIConciergeViewProps {
  onSelectPerson: (personId: string) => void;
}

export const AIConciergeView: React.FC<AIConciergeViewProps> = ({ onSelectPerson }) => {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Array<{
    sender: 'user' | 'ai';
    text: string;
    facts?: any[];
    relatedPersons?: any[];
    confidence?: number;
    hasDefiniteAnswer?: boolean;
  }>>([
    {
      sender: 'ai',
      text: 'こんにちは。AI人脈コンシェルジュです。過去の1to1面談の話題、交わした約束、紹介ニーズ、チャプター所属など、記録された事実に基づいてお答えします。でっちあげや推測は行いません。',
    }
  ]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const handleSend = (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg = { sender: 'user' as const, text: q };
    const result = store.queryAI(q);

    // AI原価をシミュレーション記録 (34, COST-01)
    store.recordAICost('llm_tokens', 'LLM-Chat-Adapter', 450, 0.45, `自然言語検索: 「${q.substring(0, 15)}...」`);

    setMessages(prev => [
      ...prev,
      userMsg,
      {
        sender: 'ai',
        text: result.answer,
        facts: result.facts,
        relatedPersons: result.relatedPersons,
        confidence: result.confidence,
        hasDefiniteAnswer: result.hasDefiniteAnswer,
      }
    ]);

    setInputQuery('');
  };

  const handleVoiceToggle = () => {
    setIsVoiceActive(prev => !prev);
    if (!isVoiceActive) {
      setTimeout(() => {
        setIsVoiceActive(false);
        handleSend('田中さんと前回どんな話題で盛り上がった？');
      }, 1500);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 pb-28 animate-fadeIn flex flex-col h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">AI人脈秘書（自然言語・音声検索）</h1>
        <p className="text-xs text-neutral-500">
          出典セグメント付きの正確な回答。架空の事実を創作せず「不明」を誠実に報告 (仕様12, AI-07〜11)
        </p>
      </div>

      {/* チャット履歴 */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-xl p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-apple-blue dark:bg-apple-darkBlue text-white rounded-br-none shadow-sm'
                  : 'bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-neutral-800 dark:text-neutral-200 rounded-bl-none shadow-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* 出典付き事実の提示 (AI-07) */}
              {m.facts && m.facts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-apple-border dark:border-apple-darkBorder space-y-2 text-xs">
                  <div className="flex items-center space-x-1.5 font-semibold text-neutral-500 text-[11px]">
                    <FileText className="w-3.5 h-3.5" />
                    <span>根拠となる記録・事実 (確度: {Math.round((m.confidence || 0) * 100)}%)</span>
                  </div>
                  {m.facts.map((f, fIdx) => (
                    <div key={fIdx} className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-apple-border dark:border-apple-darkBorder text-[11px] text-neutral-600 dark:text-neutral-300">
                      <strong>{f.fact_key}:</strong> {f.fact_value}
                      {f.source_evidence && (
                        <div className="text-[10px] text-neutral-400 mt-0.5">発話根拠: 「{f.source_evidence}」</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 関連人物カルテへの直リンク (AI-07) */}
              {m.relatedPersons && m.relatedPersons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.relatedPersons.map((p, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => onSelectPerson(p.id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 text-xs font-medium border border-apple-border dark:border-apple-darkBorder"
                    >
                      <User className="w-3.5 h-3.5 text-apple-blue" />
                      <span>{p.display_name}様のカルテを開く</span>
                      <ArrowRight className="w-3 h-3 text-neutral-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 提案プロンプトチップス */}
      <div className="flex space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => handleSend('田中さんと前回何を話した？約束はあった？')}
          className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-neutral-600 dark:text-neutral-300 hover:border-apple-blue/50 whitespace-nowrap shrink-0"
        >
          💡 田中さん（夢叶開発）との話題・約束
        </button>
        <button
          onClick={() => handleSend('不動産やマンション買取に強い人いる？')}
          className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-neutral-600 dark:text-neutral-300 hover:border-apple-blue/50 whitespace-nowrap shrink-0"
        >
          💡 不動産・マンション買取の協業候補
        </button>
        <button
          onClick={() => handleSend('不用品回収や残置物撤去で協業できる人は？')}
          className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-neutral-600 dark:text-neutral-300 hover:border-apple-blue/50 whitespace-nowrap shrink-0"
        >
          💡 不用品回収・残置物撤去の協業先
        </button>
        <button
          onClick={() => handleSend('アメリカの宇宙工学に詳しい人いる？')}
          className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder text-neutral-600 dark:text-neutral-300 hover:border-apple-blue/50 whitespace-nowrap shrink-0"
        >
          💡 該当者なし（不明回答の検証）
        </button>
      </div>

      {/* 入力フォーム */}
      <div className="flex items-center space-x-2 bg-white dark:bg-[#1C1C1E] border border-apple-border dark:border-apple-darkBorder rounded-2xl p-2 shadow-sm">
        <button
          onClick={handleVoiceToggle}
          title="音声入力（クリックでテスト音声入力）"
          className={`p-2.5 rounded-xl transition-colors ${
            isVoiceActive
              ? 'bg-red-500 text-white animate-pulse'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isVoiceActive ? '音声を聞き取っています...' : '人脈について質問してください...'}
          className="flex-1 bg-transparent text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-neutral-400 focus:outline-none"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputQuery.trim()}
          className="p-2.5 rounded-xl bg-apple-blue dark:bg-apple-darkBlue text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
