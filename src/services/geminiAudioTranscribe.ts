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
export async function transcribeAudioWithGemini(
  audioFile: File,
  apiKeyOverride?: string
): Promise<GeminiAudioAnalysisResult> {
  const apiKey = (apiKeyOverride || getStoredGeminiApiKey()).trim();
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。APIキーを入力してください。');
  }

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

  const promptText = `
あなたはプロのビジネス面談・1to1専門のAIコンシェルジュです。
添付された録音音声を一言一句丁寧に文字起こしし、面談相手の自己紹介、事業内容、盛り上がった話題、次回までの宿題・約束事を抽出してください。

必ず以下のキーを持つ有効なJSONオブジェクトとしてのみ出力してください（Markdownコードブロックは不要です）:
{
  "full_transcript": "この音声の全文字起こしテキスト（タイムスタンプや話者区切りがあれば記載）",
  "partner_name": "面談相手のお名前（フルネーム、判明しない場合は会話から推測されるお名前）",
  "partner_company": "相手の会社名・組織名・屋号（言及がなければ空文字）",
  "partner_title": "相手の役職・肩書（言及がなければ空文字）",
  "bni_chapter": "BNIチャプター名（言及がなければ空文字）",
  "bni_category": "BNI専門分野カテゴリー（言及がなければ空文字）",
  "topic": "面談で盛り上がった話題・事業や取り組みの詳しい要約",
  "promise": "次回までに双方が約束したこと・ToDo・フォロー事項・宿題",
  "thank_you_draft": "相手にZoom後すぐに送信できる、丁寧で温かいお礼メッセージ（本日の要約とお互いの宿題を含む）"
}
`;

  // Gemini 1.5 Flash（または2.5 Flash）エンドポイント
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
      topic: parsed.topic || '事業・取り組みに関する意見交換',
      promise: parsed.promise || '面談内容の整理と次回アクションの確認',
      thank_you_draft: parsed.thank_you_draft || '',
    };
  } catch (err) {
    throw new Error('Geminiの出力JSONパースに失敗しました: ' + rawContent.slice(0, 100));
  }
}
