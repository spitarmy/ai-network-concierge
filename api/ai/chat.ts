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
      const rawTranscriptText: string = (parsed.transcriptText || '').trim();
      // タイムスタンプ行や単独の相槌（「はい」「ええ」等）を圧縮し、4万文字超の1時間面談でも3〜5秒で高速・高精度に要約できるようにする
      const compactLines: string[] = [];
      let lastSpeaker = '';
      for (const rawLine of rawTranscriptText.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        if (/^\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(\s*-->.*)?$/.test(line) || /^WEBVTT$/i.test(line)) continue;
        if (/^(はい|ええ|ああ|うん|なるほど|そうですね|そうなんですね|はいはい|ううん|へえ|おお)[。！!？?]*$/.test(line)) continue;
        if (line.length <= 20 && !/[。、！？!?ですますでした]$/.test(line) && (line.includes('/') || /^[一-龯ぁ-んァ-ヶーA-Za-z\s]{2,12}$/.test(line))) {
          lastSpeaker = line.replace(/^[0-9０-９]+\s*[/／]\s*/, '').replace(/\s*[/／].*$/, '').trim();
          continue;
        }
        compactLines.push(lastSpeaker ? `${lastSpeaker}: ${line}` : line);
      }
      const joinedCompact = compactLines.join('\n');
      const transcriptText = joinedCompact.length > 60000
        ? `${joinedCompact.slice(0, 25000)}\n...(中略)...\n${joinedCompact.slice(Math.floor(joinedCompact.length / 2) - 10000, Math.floor(joinedCompact.length / 2) + 10000)}\n...(中略)...\n${joinedCompact.slice(-15000)}`
        : joinedCompact;
      const hintName: string = (parsed.participantHint || '').trim();
      const summarizePrompt = `あなたは株式会社ZENNOBATE（代表：勝賀野 太郎様 / 事業：残置物撤去・遺品整理、桂の総合リサイクルショップRoute Z、祇園のバーRoute Z、AI古物査定ツール「カンテノ」、ラファエル提携ライバー事務所、オーダーメイド腕時計アステラ、若手経営者交流会）専属の最高精度AI議事録・人脈カルテ・相関図要約エンジンです。
以下の1to1面談の文字起こし全文を精読し、口語や相槌（「えー」「あ、」「はい」等の話し言葉の断片）を一切そのまま抜き出すのではなく、第三者視点でプロフェッショナルに構造化・要約したJSONのみを出力してください。

【絶対厳守ルール】
1. 議事録の生の発言文や全国の方言・口語表現をそのままコピーして貼り付けることは厳禁です。
   - 関西弁（〜やし、〜やな、〜やね、〜やから、〜やけど、〜ねん、〜はる、〜してはる、〜もろて、〜ちゃう、〜あかん、〜ほんま、〜めっちゃ、〜なんぼ 等）
   - 博多・九州方言（〜やけん、〜だけん、〜ばい、〜たい、〜っちゃ、〜とよ、〜ばってん、〜しよる、〜しとる、〜くさ 等）
   - 広島・中国・四国方言（〜じゃけん、〜じゃけえ、〜じゃろ、〜しんさい、〜やき、〜じゃが、〜なんよ 等）
   - 名古屋・東海・三河方言（〜だがや、〜だもんで、〜やもんで、〜じゃんね、〜だら、〜してみえる、〜やっとる 等）
   - 東北・北海道・北陸・沖縄方言（〜だべ、〜っしょ、〜だちゃ、〜やちゃ、〜ながや、〜まっし、〜だすけ、〜わけさ 等）
   これらの全国方言・話し言葉・相槌・疑問符「？」は1文字たりとも残さず、100%「標準語の客観的な書き言葉（議事録調・体言止め・ビジネス文書体）」へ翻訳・構造化してください。
2. 勝賀野 太郎様（4/勝賀野 太郎/残置物撤去・株式会社ゼノベイト・だんじりチャプター所属）自身のプロフィールとお相手のプロフィールを絶対に混同しないでください。主役はお相手（${hintName || '面談相手'}）です。敬称はすべて「〜様」に統一してください。
3. お相手の具体的なサービス内容・料金体系・強み・顧客比率・実績数値・所属コミュニティ・紹介してほしいターゲット層・双方で合意した具体的な紹介対象者名（フルネームや特徴）を漏れなく正確に構造化してください。
4. BNIチャプター名は公式表記（例：「Magicalチャプター」「インヴィクタスチャプター」「ナインダーツチャプター」「シャングリラチャプター」「だんじりチャプター」「Beyondチャプター」「Forwardチャプター」「REvoチャプター」「Soulfulチャプター」）で記載してください。
5. 文字起こしにない事実や、会話中に登場する第三者（紹介者・知人など）の所属チャプター・会社・役職など、文脈上で確定していない推測情報を勝手に断定して書かないでください。
6. 出力は以下のJSON形式のみとしてください:
{
  "realName": "お相手の氏名（姓 名の間に半角スペース）",
  "phoneticName": "フリガナ（分かる場合のみカタカナ、不明なら空文字）",
  "companyName": "お相手の会社名・屋号・法人名（複数あれば併記、不明なら空文字）",
  "title": "役職（代表取締役、代表理事、代表など）",
  "bniRegion": "BNIリージョン名（例：京都シティセントラルリージョン）",
  "bniChapter": "BNIチャプター名（例：Magicalチャプター）",
  "bniCategory": "BNIカテゴリー・専門分野（例：求人広告代理店（採用応募対応代行・求人原稿作成・添削支援））",
  "overview": "面談全体の3〜5文のプロフェッショナルな書き言葉要約（お相手の所属・専門分野、具体的なサービス強み・料金・実績、勝賀野様の事業とのシナジー、合意した次回アクションを網羅）",
  "topic": "お相手の本業・独自サービス強み・実績・料金体系・紹介してほしいターゲット層の構造化要約（必ず書き言葉・体言止めまたは簡潔な議事録調で記述）",
  "promises": [
    "具体的な次回ToDo・約束事項1（誰様から誰様へ、誰・何を紹介・送付・セッティングするか、書き言葉で明記）",
    "具体的な次回ToDo・約束事項2"
  ],
  "serviceTitle": "お相手の主力サービス名（40文字以内・体言止め）",
  "specialties": "具体的な取扱商品・提供サービス・強み・実績の詳細（書き言葉）",
  "targetClients": "お相手が紹介してほしいターゲット層（体言止め）",
  "personalNotes": "出身・居住地・家族構成・ペット・趣味・所属団体（守成クラブ等）・共通の知人など、次回1to1で役立つパーソナル情報（書き言葉）",
  "relationships": [
    {
      "personName": "面談内で言及された紹介元・紹介予定先・協業キーパーソンの氏名（例：杉本 愛）",
      "subtitle": "その人物の専門分野・所属・特徴（例：就労継続支援B型・福祉連携）",
      "relationshipType": "お相手とその人物の関係・紹介種別（例：紹介予定（就労継続支援B型・福祉ネットワーク））",
      "evidence": "面談内での具体的な言及・合意内容（書き言葉1文）"
    }
  ]
}`;

      const enforceWrittenStyle = (val?: string): string => {
        if (!val || typeof val !== 'string') return '';
        return val
          .replace(/ですね(?=[。、\n]|$)/g, '')
          .replace(/ますね(?=[。、\n]|$)/g, 'ます')
          .replace(/ましたね(?=[。、\n]|$)/g, 'ました')
          .replace(/なんですけども?(?=[。、\n]|$)/g, '')
          .replace(/なんですけれども?(?=[。、\n]|$)/g, '')
          .replace(/(?:やし|やな|やね|やから|やけど|やけん|だけん|じゃけん|じゃけえ|じゃろ|だもんで|やもんで|だべ|っしょ|だちゃ|やちゃ|ばい|たい|っちゃ|とよ|なんよ)(?=[。、\n]|$)/g, '')
          .replace(/してはる|しはる/g, 'している')
          .replace(/してみえる/g, 'している')
          .replace(/しとる|やっとる|しよる/g, 'している')
          .replace(/かなと思います/g, '方針')
          .replace(/じゃないですか/g, '')
          .replace(/[？?]/g, '')
          .trim();
      };

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
            resultJson.overview = enforceWrittenStyle(resultJson.overview);
            resultJson.topic = enforceWrittenStyle(resultJson.topic);
            resultJson.serviceTitle = enforceWrittenStyle(resultJson.serviceTitle);
            resultJson.specialties = enforceWrittenStyle(resultJson.specialties);
            resultJson.targetClients = enforceWrittenStyle(resultJson.targetClients);
            resultJson.personalNotes = enforceWrittenStyle(resultJson.personalNotes);
            if (Array.isArray(resultJson.promises)) {
              resultJson.promises = resultJson.promises.map((p: string) => enforceWrittenStyle(p)).filter(Boolean);
            }
            if (Array.isArray(resultJson.relationships)) {
              resultJson.relationships = resultJson.relationships
                .map((r: any) => ({
                  personName: enforceWrittenStyle(r?.personName),
                  subtitle: enforceWrittenStyle(r?.subtitle),
                  relationshipType: enforceWrittenStyle(r?.relationshipType),
                  evidence: enforceWrittenStyle(r?.evidence),
                }))
                .filter((r: any) => r.personName && r.personName.length >= 2 && !/勝賀野|ゼノベイト|ZENNOBATE/i.test(r.personName));
            }
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

    if (mode === 'card_ocr') {
      const mimeType: string = parsed.mimeType || 'image/webp';
      const base64Data: string = parsed.base64Data || '';
      const cardOcrPrompt = `あなたは高精度な日本語名刺OCR専用エンジンです。
添付された名刺画像に印字されている文字のみを正確に読み取り、以下のJSON形式のみで出力してください。

【絶対厳守ルール（AGENTS.md準拠）】
1. 名刺画像に実際に印字されている文字のみを読み取ってください。Web検索結果や推測を混ぜて架空の会社名・役職・氏名・住所を生成することは厳禁です。
2. 記載がない項目は必ず空文字 "" にしてください。
3. 氏名（person_name）は姓と名の間に半角スペースを入れてください。筆文字や旧字体・異体字がある場合は画像通りに正確に読み取ってください。
4. 電話番号が複数ある場合は携帯電話番号または代表番号を優先して記載してください。

{
  "person_name": "氏名（例：岩根 義行）",
  "phonetic_name": "ふりがな（ローマ字表記やふりがな印字がある場合、または確実な読みをひらがなで記載）",
  "company_name": "会社名・法人名・屋号（複数の法人記載があれば併記）",
  "title": "役職・肩書",
  "phone": "電話番号",
  "email": "メールアドレス",
  "address": "所在地・住所（郵便番号除く、または含む）",
  "website": "WebサイトURL（記載がある場合のみ）",
  "business_summary": "名刺裏面や表面に記載されている事業内容・資格・強み（記載がある場合のみ）",
  "confidence": 0.98
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
                parts: [
                  { inline_data: { mime_type: mimeType, data: base64Data } },
                  { text: cardOcrPrompt },
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
              card: resultJson,
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
以下の【登録済み人脈カルテ・面談要約・確定Factsデータ】を根拠（RAG）として、勝賀野様からの質問への回答、およびカルテ・BNIチャプター所属の登録・修正指示の実行を行ってください。

【絶対厳守ルール】
1. 提供されたデータに存在しない人物・事実・スキル・経験を勝手に推測・創作（ハルシネーション）しないでください。
2. 該当する人物や事実がデータ内に一切存在しない質問（例：宇宙工学、量子超越性など無関係な分野）には、必ず「登録されたカルテ・面談記録に該当データが存在しないため『不明』です」と誠実に回答し、has_definite_answer を false にしてください。
3. 勝賀野様から「〇〇さんを△△リージョンの□□チャプターに登録しなおして」「〇〇さんの会社名を△△に変更して」などの【登録・変更・修正指示】があった場合は、必ず actions 配列に実行コマンドを出力してください（フロントエンド側で即座に実データベースへ書き込まれます）。
4. 出力は必ず以下のJSON形式のみとしてください:
{
  "answer": "勝賀野様への分かりやすい回答または登録完了報告テキスト（箇条書き活用）",
  "matched_person_ids": ["該当する人物IDの配列"],
  "cited_fact_ids": ["根拠となったFactのID配列"],
  "actions": [
    {
      "type": "set_bni_chapter | update_company | update_notes",
      "person_id": "対象人物ID",
      "person_name": "対象人物名",
      "chapter_name": "チャプター名（set_bni_chapter時）",
      "region_name": "リージョン名（set_bni_chapter時）",
      "category": "専門カテゴリー（set_bni_chapter時）",
      "company_name": "会社名（update_company時）",
      "notes_append": "追記メモ（update_notes時）"
    }
  ],
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
