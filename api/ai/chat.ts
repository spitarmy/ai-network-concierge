import type { IncomingMessage } from 'http';

async function getRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'GET') {
    const hasServerKey = Boolean((process.env.GEMINI_API_KEY || '').trim());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, gemini_configured: hasServerKey }));
    return;
  }

  try {
    const raw = typeof req.body === 'string'
      ? req.body
      : (req.body ? JSON.stringify(req.body) : await getRawBody(req));
    const parsed = raw ? JSON.parse(raw) : {};

    const apiKey = ((process.env.GEMINI_API_KEY || '').trim() || (parsed.apiKey || '').trim());
    if (!apiKey) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        ok: false,
        gemini_configured: false,
        reason: 'missing_api_key',
      }));
      return;
    }

    const question: string = (parsed.question || '').trim();
    const contextData = parsed.context || {};

    const systemPrompt = `あなたは株式会社ZENNOBATE（代表：勝賀野 太郎様）専属の「AI人脈コンシェルジュ（AI人脈秘書）」です。
以下の【登録済み人脈カルテ・面談要約・確定Factsデータ】のみを根拠（RAG）として、勝賀野様からの質問に日本語で正確・簡潔・丁寧にお答えください。

【絶対厳守ルール】
1. 提供されたデータに存在しない人物・事実・スキル・経験を絶対に推測・創作（ハルシネーション）しないでください。
2. 該当する人物や事実がデータ内に一切存在しない質問（例：宇宙工学、量子超越性など無関係な分野）には、必ず「登録されたカルテ・面談記録に該当データが存在しないため『不明』です」と誠実に回答し、has_definite_answer を false にしてください。
3. 該当する人物や記録がある場合は、誰とのいつの面談・どのカルテ情報に基づくかを明記し、matched_person_ids と cited_fact_ids に該当IDを入れてください。
4. 出力は必ず以下のJSON形式のみとしてください:
{
  "answer": "勝賀野様への分かりやすい回答テキスト（箇条書き活用）",
  "matched_person_ids": ["該当する人物IDの配列"],
  "cited_fact_ids": ["根拠となったFactのID配列"],
  "confidence": 0.98,
  "has_definite_answer": true
}

【登録済み人脈カルテ・面談要約・確定Factsデータ】
${JSON.stringify(contextData)}`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = '';

    for (const modelName of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                { text: `【勝賀野様の質問】\n${question}` },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (geminiRes.ok) {
        const data: any = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const resultJson = JSON.parse(text.trim());
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            ok: true,
            gemini_configured: true,
            model: modelName,
            ...resultJson,
          }));
          return;
        }
      } else {
        lastError = await geminiRes.text().catch(() => `HTTP ${geminiRes.status}`);
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      ok: false,
      gemini_configured: true,
      error: lastError || 'Gemini API呼び出しに失敗しました',
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err.message || 'Internal Error' }));
  }
}
