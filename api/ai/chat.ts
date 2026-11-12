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

    const mode: string = (parsed.mode || 'chat').trim();

    if (mode === 'summarize_meeting') {
      const transcriptText: string = (parsed.transcriptText || '').trim().slice(0, 28000);
      const hintName: string = (parsed.participantHint || '').trim();
      const summarizePrompt = `あなたは株式会社ZENNOBATE（代表：勝賀野 太郎様 / 事業：残置物撤去・遺品整理、桂の総合リサイクルショップRoute Z、祇園のバーRoute Z、AI古物査定ツール「カンテノ」、ラファエル提携ライバー事務所、オーダーメイド腕時計アステラ、若手経営者交流会）専属のAI議事録・人脈カルテ要約エンジンです。
以下の1to1面談の文字起こし全文を読み、口語や相槌（「えー」「あ、」「はい」等の話し言葉の断片）を一切そのまま抜き出すのではなく、第三者視点でプロフェッショナルに構造化・要約したJSONのみを出力してください。

【絶対厳守ルール】
1. 議事録の生の発言文（「〜ですね」「えー」「僕はえっと」等）をそのままコピーして貼り付けることは厳禁です。必ず簡潔・明瞭なビジネス日本語で要約してください。
2. 勝賀野 太郎様（4/勝賀野 太郎/残置物撤去・株式会社ゼノベイト・だんじりチャプター所属）自身のプロフィールとお相手のプロフィールを絶対に混同しないでください。主役はお相手（${hintName || '面談相手'}）です。
3. 文字起こしにない事実や、会話中に登場する第三者（紹介者・知人など）の所属チャプター・会社・役職など、文脈上で100%確定していない推測情報を勝手に断定して書かないでください（紹介者などの所属が明言されていない場合は「〇〇様よりご紹介」とのみ記載し、未確定の所属チャプター等を推測で付与することは厳禁です）。
4. 出力は以下のJSON形式のみとしてください:
{
  "realName": "お相手の氏名（姓 名の間に半角スペース）",
  "phoneticName": "フリガナ（分かる場合のみ、不明なら空文字）",
  "companyName": "お相手の会社名・屋号・法人名（複数あれば併記）",
  "title": "役職（代表取締役、代表理事、代表など）",
  "bniRegion": "BNIリージョン名（例：大阪セントラルリージョン）",
  "bniChapter": "BNIチャプター名（例：シャングリラチャプター）",
  "bniCategory": "BNIカテゴリー・専門分野",
  "overview": "面談全体の3〜4文のプロフェッショナルな要約（誰と、どのような事業強み・実績を共有し、どんな協業・紹介に合意したか）",
  "topic": "盛り上がった話題・お相手の本業と強み・実績・紹介してほしいターゲット（箇条書き風または端的な要約文）",
  "promises": [
    "具体的な次回ToDo・約束事項1（誰が誰に何を紹介・連絡・検討するか）",
    "具体的な次回ToDo・約束事項2"
  ],
  "serviceTitle": "お相手の主力サービス名（30文字以内）",
  "targetClients": "お相手が紹介してほしいターゲット層",
  "personalNotes": "年齢・出身・居住地・家族構成・趣味・共通の知人など、次回1to1で役立つパーソナル情報"
}`;

      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
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
                  { text: summarizePrompt },
                  { text: `【面談文字起こし】\n${transcriptText}` },
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
              summary: resultJson,
            }));
            return;
          }
        } else {
          lastError = await geminiRes.text().catch(() => `HTTP ${geminiRes.status}`);
        }
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, gemini_configured: true, error: lastError }));
      return;
    }

    if (mode === 'transcribe_audio') {
      const mimeType: string = parsed.mimeType || 'audio/mp4';
      const base64Data: string = parsed.base64Data || '';
      const promptText: string = parsed.promptText || '';
      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      let lastError = '';
      for (const modelName of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: mimeType, data: base64Data } },
                  { text: promptText },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.2,
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
              result: resultJson,
            }));
            return;
          }
        } else {
          lastError = await geminiRes.text().catch(() => `HTTP ${geminiRes.status}`);
        }
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, gemini_configured: true, error: lastError }));
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

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
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
