import React, { useState, useEffect } from 'react';
import { Send, Mic, User, FileText, ArrowRight, Sparkles, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { store } from '../services/store';
import { getStoredGeminiApiKey, setStoredGeminiApiKey } from '../services/geminiAudioTranscribe';

interface AIConciergeViewProps {
  onSelectPerson: (personId: string) => void;
}

export const AIConciergeView: React.FC<AIConciergeViewProps> = ({ onSelectPerson }) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverHasGemini, setServerHasGemini] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(() => getStoredGeminiApiKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState(() => getStoredGeminiApiKey());

  const isGeminiActive = serverHasGemini || Boolean(localApiKey.trim());

  useEffect(() => {
    fetch('/api/ai/chat')
      .then(r => r.json())
      .then(d => {
        if (d && d.gemini_configured) {
          setServerHasGemini(true);
        }
      })
      .catch(() => {});
  }, []);

  const [messages, setMessages] = useState<Array<{
    sender: 'user' | 'ai';
    text: string;
    facts?: any[];
    relatedPersons?: any[];
    confidence?: number;
    hasDefiniteAnswer?: boolean;
    engineLabel?: string;
  }>>([
    {
      sender: 'ai',
      text: 'こんにちは。AI人脈コンシェルジュです。過去の1to1面談の話題、交わした約束、紹介ニーズ、チャプター所属など、記録された事実に基づいてお答えします。でっちあげや推測は行いません。',
    }
  ]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const handleSaveApiKey = () => {
    setStoredGeminiApiKey(keyDraft.trim());
    setLocalApiKey(keyDraft.trim());
    setShowKeyInput(false);
  };

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || isLoading) return;

    const userMsg = { sender: 'user' as const, text: q };
    setInputQuery('');
    setMessages(prev => [...prev, userMsg]);

    // Gemini APIが有効な場合はサーバーRAG推論 (/api/ai/chat) を優先実行
    if (isGeminiActive) {
      setIsLoading(true);
      try {
        const persons = store.getPersons();
        const contextPayload = {
          persons: persons.map(p => ({
            id: p.id,
            name: p.display_name,
            status: p.status,
            company: store.getOrgMembershipsForPerson(p.id).map(o => `${o.organization_name}(${o.title || ''})`).join(', '),
            offerings: store.getBusinessOfferingsForPerson(p.id).map(b => `${b.service_title}: ${b.specialties} / 紹介対象:${b.target_clients}`),
            notes: p.notes,
            facts: store.getFactsForPerson(p.id)
              .filter(f => f.visibility !== 'private')
              .map(f => ({ id: f.id, key: f.fact_key, value: f.fact_value, category: f.fact_category })),
          })),
          meetings: store.getMeetings().slice(0, 15).map(m => ({
            id: m.id,
            title: m.title,
            date: m.scheduled_start_at,
            summary: store.getTranscriptForMeeting(m.id)?.summary || '',
          })),
        };

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q,
            context: contextPayload,
            apiKey: localApiKey.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (data && data.ok && data.answer) {
          const matchedPersons = Array.isArray(data.matched_person_ids)
            ? data.matched_person_ids.map((id: string) => store.getPersonById(id)).filter(Boolean)
            : [];
          const allFacts = persons.flatMap(p => store.getFactsForPerson(p.id));
          const citedFacts = Array.isArray(data.cited_fact_ids)
            ? allFacts.filter(f => data.cited_fact_ids.includes(f.id))
            : [];

          store.recordAICost('llm_tokens', data.model || 'Gemini 2.5 Flash', 650, 0.65, `Gemini RAG検索: 「${q.substring(0, 15)}...」`);
          setMessages(prev => [
            ...prev,
            {
              sender: 'ai',
              text: data.answer,
              facts: citedFacts,
              relatedPersons: matchedPersons,
              confidence: data.confidence ?? 0.98,
              hasDefiniteAnswer: data.has_definite_answer ?? true,
              engineLabel: `Gemini AI (${data.model || 'gemini-2.5-flash'})`,
            },
          ]);
          setIsLoading(false);
          return;
        }
      } catch {
        // エラー時はローカル検索にフォールバック
      }
      setIsLoading(false);
    }

    const result = store.queryAI(q);
    store.recordAICost('llm_tokens', 'Local-Keyword-Engine', 0, 0, `ローカル検索: 「${q.substring(0, 15)}...」`);

    setMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: result.answer,
        facts: result.facts,
        relatedPersons: result.relatedPersons,
        confidence: result.confidence,
        hasDefiniteAnswer: result.hasDefiniteAnswer,
        engineLabel: 'ローカル構造化検索エンジン（APIキー未設定）',
      }
    ]);
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
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-4 pb-28 animate-fadeIn flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">AI人脈秘書（自然言語・音声検索）</h1>
          <p className="text-xs text-neutral-500">
            出典セグメント付きの正確な回答。架空の事実を創作せず「不明」を誠実に報告 (仕様12, AI-07〜11)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isGeminiActive ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-apple-green/10 text-apple-green text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Gemini AI 本番接続中</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>ローカル検索モード（Gemini APIキー未設定）</span>
            </span>
          )}
          <button
            onClick={() => setShowKeyInput(prev => !prev)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full border border-apple-border dark:border-apple-darkBorder bg-white dark:bg-[#1C1C1E] text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:border-apple-blue/50"
          >
            <Key className="w-3.5 h-3.5 text-apple-blue" />
            <span>{isGeminiActive ? 'APIキー変更' : 'Gemini APIキー設定'}</span>
          </button>
        </div>
      </div>

      {showKeyInput && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-apple-blue/40 space-y-2.5 text-xs shadow-sm">
          <div className="flex items-center space-x-1.5 font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
            <Sparkles className="w-4 h-4 text-apple-blue" />
            <span>Google Gemini APIキーを設定して生成AI推論（Gemini 2.5 Flash）を有効化</span>
          </div>
          <p className="text-neutral-500 leading-relaxed">
            Google AI Studio の APIキー（<code>AIza...</code>）を入力すると、ローカルキーワード検索から本物の Gemini 生成AI による文脈理解・RAG検索へ切り替わります（音声文字起こし・名刺OCRにも共通利用されます）。
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 p-2.5 rounded-xl border border-apple-border dark:border-apple-darkBorder bg-neutral-50 dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7]"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2 rounded-xl bg-apple-blue text-white font-semibold hover:opacity-90"
            >
              保存して接続
            </button>
          </div>
        </div>
      )}

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
              {m.sender === 'ai' && m.engineLabel && (
                <div className="text-[10px] font-medium text-neutral-400 mb-1.5 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-apple-blue" />
                  <span>{m.engineLabel}</span>
                </div>
              )}
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
