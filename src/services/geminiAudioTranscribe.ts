// Google Gemini API による音声ファイルの完全自動文字起こし & 面談構造化解析サービス

export interface GeminiAudioAnalysisResult {
  full_transcript: string;
  partner_name: string;
  partner_company: string;
  partner_title: string;
  bni_chapter: string;
  bni_category: string;
  topic: string;
  promise: string;
  thank_you_draft: string;
}

const GEMINI_API_KEY_STORAGE = 'ai_concierge_gemini_api_key';

export const getStoredGeminiApiKey = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
  }
  return '';
};

export const setStoredGeminiApiKey = (key: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
  }
};

/**
 * 音声ファイル（.m4a, .mp3, .wav, .aac, .ogg等）をGemini Flashに送信し、
 * 完全な文字起こしと構造化データ（氏名・会社・話題・約束・お礼文）を一括生成
 */
import { store } from './store';

export async function transcribeAudioWithGemini(
  audioFile: File,
  apiKeyOverride?: string
): Promise<GeminiAudioAnalysisResult> {
  const currentTenant = store.getCurrentTenant();
  if (currentTenant && (currentTenant.is_budget_throttled || currentTenant.current_spend_jpy >= currentTenant.monthly_budget_jpy)) {
    throw new Error(`当月のAI原価上限（¥${currentTenant.monthly_budget_jpy.toLocaleString()}）に到達したため節約モードが発動中です。Zoom自動要約連携（0円）または文字起こしテキスト貼り付け解析（0円）をご利用ください。`);
  }

  const apiKey = (apiKeyOverride || getStoredGeminiApiKey()).trim();

  // 音声ファイルをBase64エンコード
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioFile);
  });

  // MIMEタイプの正規化
  let mimeType = audioFile.type || 'audio/m4a';
  if (audioFile.name.endsWith('.m4a')) mimeType = 'audio/mp4';
  if (audioFile.name.endsWith('.mp3')) mimeType = 'audio/mp3';
  if (audioFile.name.endsWith('.wav')) mimeType = 'audio/wav';
  if (audioFile.name.endsWith('.webm')) mimeType = 'audio/webm';

  const promptText = `
あなたはエグゼクティブ向けビジネス面談・BNI 1to1専門の超高精度AIコンシェルジュです。
録音音声（または文字起こし）から、ビジネスの核となる情報を深く理解し、正確に構造化してください。

【厳格な抽出ルール】
1. 会話口調や全国の方言（関西弁「〜やし・〜やな・〜ねん・〜してはる」、博多/九州弁「〜やけん・〜ばい・〜たい・〜しとる」、広島/中国・四国弁「〜じゃけん・〜じゃろ・〜やき」、名古屋/東海弁「〜だがや・〜だもんで・〜してみえる」、東北/北海道/北陸/沖縄方言「〜だべ・〜っしょ・〜だちゃ・〜わけさ」等）を要約欄（core_business, discussion_topics, target_referrals, promise）にそのまま残すことは厳禁です。必ず100%「標準語の客観的な書き言葉（議事録調・体言止め・ビジネス文書体）」へ変換して記述してください。
2. 「本業・事業内容」と「雑談・単なるアイデアや趣味」を絶対に混同しないでください。
   - 相手が本業として手掛けている実績・サービスのみを「core_business」に書き言葉で記載。
   - 会話中に盛り上がった趣味や共通点、パーソナル情報は「discussion_topics」に書き言葉で記載。
3. 相手が求めている「紹介ターゲット（どんな見込み客や協業先を求めているか）」を具体的に言語化してください。
4. 次回までの「約束・宿題（ToDo）」は、「誰様から誰様へ」「何を」行うかを明確な書き言葉で抽出してください。
5. 会話に登場した第三者（紹介元・紹介予定先など）を特定してください（所属チャプター等が明言されていない場合は推測で断定しないこと）。

必ず以下のキーを持つJSONオブジェクトのみを出力してください（Markdownコードブロックは不要）:
{
  "full_transcript": "この音声の全文字起こしテキスト（タイムスタンプや話者区切りがあれば記載）",
  "partner_name": "面談相手のお名前（フルネーム、判明しない場合は推測されるお名前）",
  "partner_company": "相手の会社名・組織名・屋号（言及がなければ空文字）",
  "partner_title": "相手の役職・肩書（言及がなければ空文字）",
  "bni_chapter": "BNIチャプター名（言及がなければ空文字）",
  "bni_category": "BNIカテゴリー（言及がなければ空文字）",
  "core_business": "相手の本業・主要事業と強み（雑談と厳格に分離）",
  "discussion_topics": "面談で盛り上がった話題・企画アイデア・共通点・エピソード",
  "target_referrals": "相手が求めている紹介先・理想の見込み客・案件",
  "promise": "次回までに双方が約束したこと・具体的な宿題・ToDo（誰が何をいつまでに）",
  "thank_you_draft": "相手にZoom後すぐに送信できる、丁寧で温かいお礼メッセージ（要約と次回ToDoを含む）"
}
`;

  // まずサーバーエンドポイント (/api/ai/chat) のマスターAPIキーで実行
  try {
    const serverRes = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'transcribe_audio',
        apiKey: apiKey || undefined,
        mimeType,
        base64Data,
        promptText,
      }),
    });
    if (serverRes.ok) {
      const serverJson = await serverRes.json();
      if (serverJson.ok && serverJson.result) {
        const parsed = serverJson.result;
        return {
          full_transcript: parsed.full_transcript || '',
          partner_name: parsed.partner_name || '面談相手',
          partner_company: parsed.partner_company || '',
          partner_title: parsed.partner_title || '',
          bni_chapter: parsed.bni_chapter || '',
          bni_category: parsed.bni_category || '',
          topic: parsed.discussion_topics ? `${parsed.core_business ? `【本業】${parsed.core_business} / ` : ''}【話題】${parsed.discussion_topics}` : (parsed.topic || '事業・取り組みに関する意見交換'),
          promise: parsed.promise || '面談内容の整理と次回アクションの確認',
          thank_you_draft: parsed.thank_you_draft || '',
        };
      }
    }
  } catch {
    // サーバー経由失敗時はローカル直接通信へフォールバック
  }

  if (!apiKey) {
    throw new Error('Gemini API通信エラーが発生しました。');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
          {
            text: promptText,
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.2,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Gemini APIエラー (${response.status})`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error?.message) {
        errorMessage = errJson.error.message;
      }
    } catch {
      errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawContent) {
    throw new Error('Geminiから有効な解析テキストが返却されませんでした。');
  }

  try {
    const parsed = JSON.parse(rawContent.trim());
    return {
      full_transcript: parsed.full_transcript || '',
      partner_name: parsed.partner_name || '面談相手',
      partner_company: parsed.partner_company || '',
      partner_title: parsed.partner_title || '',
      bni_chapter: parsed.bni_chapter || '',
      bni_category: parsed.bni_category || '',
      topic: parsed.discussion_topics ? `${parsed.core_business ? `【本業】${parsed.core_business} / ` : ''}【話題】${parsed.discussion_topics}` : (parsed.topic || '事業・取り組みに関する意見交換'),
      promise: parsed.promise || '面談内容の整理と次回アクションの確認',
      thank_you_draft: parsed.thank_you_draft || '',
    };
  } catch (err) {
    throw new Error('Geminiの出力JSONパースに失敗しました: ' + rawContent.slice(0, 100));
  }
}
