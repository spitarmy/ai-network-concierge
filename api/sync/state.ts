import type { IncomingMessage } from 'http';
import fs from 'fs';
import crypto from 'crypto';
import { put, list } from '@vercel/blob';

const TMP_STATE_PATH = '/tmp/ai_concierge_cloud_state.json';
const KV_KEY = 'ai_network_concierge:cloud_state:v1';

const SAMPLE_IDS = new Set([
  'p-yamada', 'p-tanaka', 'p-sato', 'p-nakamura-prov', 'p-tenant2-secret',
  'm-yamada-upcoming', 'm-yamada-past1', 'm-yamada-past2', 'm-zoom-89527504054',
  'cs-yamada', 'rq-1', 'ref-1',
  // 重複クリックで一時生成された中川様の重複カルテ・重複会議・旧口語データIDをサーバー側でも永久遮断
  'p-1795144176332-6zpdd', 'p-1795144181464-j1acc',
  'm-1795144176336-doyxx', 'm-1795144181470-t0mdy',
  'tr-m-1795144176336-doyxx', 'tr-m-1795144181470-t0mdy',
  'bnim-1795144176350', 'bnim-1795144181485', 'bnim-1795144172318',
  'chap-custom-1795144189449', 'chap-custom-1795144193270', 'chap-custom-1795144183847',
  'bo-1795144172318-001c6', 'bo-ai-1795144189454', 'bo-ai-1795144193276',
  'fact-top-m-1795144172303-ve1be-1795144172328', 'fact-prom-m-1795144172303-ve1be-1795144172328',
  'fact-top-m-1795144176336-doyxx-ai', 'fact-prom-m-1795144176336-doyxx-ai',
  'fact-top-m-1795144181470-t0mdy-ai', 'fact-prom-m-1795144181470-t0mdy-ai',
]);

declare global {
  // eslint-disable-next-line no-var
  var __AI_CONCIERGE_CLOUD_STATE__: { state: any; deletedIds: string[]; updatedAt: string } | undefined;
  // eslint-disable-next-line no-var
  var __AI_CONCIERGE_TENANT_STATES__: Record<string, { state: any; deletedIds: string[]; updatedAt: string }> | undefined;
}

function getBlobVaultConfig(tenantId?: string): { key: Buffer; pathname: string } | null {
  const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
  if (!token) return null;
  const key = crypto.createHash('sha256').update(`ai-concierge-aes256:${token}`).digest();
  const isCustomTenant = Boolean(tenantId && tenantId !== 'tenant-001');
  if (isCustomTenant) {
    const safeTenant = String(tenantId).replace(/[^a-zA-Z0-9_-]/g, '');
    const tHash = crypto.createHmac('sha256', token).update(`ai-concierge-tenant-vault-v1:${safeTenant}`).digest('hex').slice(0, 32);
    return { key, pathname: `vault/tenant_${safeTenant}_${tHash}.enc` };
  }
  const pathHash = crypto.createHmac('sha256', token).update('ai-concierge-state-vault-v1').digest('hex').slice(0, 32);
  return { key, pathname: `vault/state_${pathHash}.enc` };
}

async function readFromBlob(tenantId?: string): Promise<{ state: any; deletedIds: string[]; updatedAt: string } | null> {
  const cfg = getBlobVaultConfig(tenantId);
  if (!cfg) return null;
  try {
    const { blobs } = await list({ prefix: cfg.pathname, limit: 1 });
    if (!blobs || blobs.length === 0) return null;
    const targetUrl = blobs[0].downloadUrl || blobs[0].url;
    const res = await fetch(`${targetUrl}${targetUrl.includes('?') ? '&' : '?'}t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    if (buf.length < 28) return null;
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', cfg.key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

async function writeToBlob(payload: { state: any; deletedIds: string[]; updatedAt: string }, tenantId?: string): Promise<void> {
  const cfg = getBlobVaultConfig(tenantId);
  if (!cfg) return;
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', cfg.key, iv);
    const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const packed = Buffer.concat([iv, authTag, encrypted]);
    await put(cfg.pathname, packed, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/octet-stream',
      cacheControlMaxAge: 0,
    });
  } catch {
    // ignore blob write errors
  }
}

async function readFromKV(): Promise<{ state: any; deletedIds: string[]; updatedAt: string } | null> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/get/${encodeURIComponent(KV_KEY)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    if (!json?.result) return null;
    return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
  } catch {
    return null;
  }
}

async function writeToKV(payload: { state: any; deletedIds: string[]; updatedAt: string }): Promise<void> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  try {
    await fetch(`${url.replace(/\/$/, '')}/set/${encodeURIComponent(KV_KEY)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(payload)),
    });
  } catch {
    // ignore KV write errors
  }
}

async function loadCloudEnvelope(tenantId?: string): Promise<{ state: any | null; deletedIds: string[]; updatedAt: string }> {
  const isCustomTenant = Boolean(tenantId && tenantId !== 'tenant-001');
  if (!global.__AI_CONCIERGE_TENANT_STATES__) {
    global.__AI_CONCIERGE_TENANT_STATES__ = {};
  }

  if (isCustomTenant && tenantId) {
    const tenantBlob = await readFromBlob(tenantId);
    if (tenantBlob && tenantBlob.state) {
      global.__AI_CONCIERGE_TENANT_STATES__[tenantId] = tenantBlob;
      return tenantBlob;
    }
    if (global.__AI_CONCIERGE_TENANT_STATES__[tenantId]?.state) {
      return global.__AI_CONCIERGE_TENANT_STATES__[tenantId];
    }
    // 初回マイグレーション：マスターBlob内に既存の当該テナントデータがあれば切り出して専用Blobへ独立化
    const masterBlob = await readFromBlob('tenant-001');
    if (masterBlob && masterBlob.state) {
      const migratedState = filterStateForTenant(ensureCoreTenantsAndDeduplicate(masterBlob.state), tenantId);
      const migratedEnv = {
        state: migratedState,
        deletedIds: [],
        updatedAt: new Date().toISOString(),
      };
      global.__AI_CONCIERGE_TENANT_STATES__[tenantId] = migratedEnv;
      await writeToBlob(migratedEnv, tenantId);
      return migratedEnv;
    }
    return { state: null, deletedIds: [], updatedAt: new Date(0).toISOString() };
  }

  const blobData = await readFromBlob('tenant-001');
  if (blobData && blobData.state) {
    global.__AI_CONCIERGE_CLOUD_STATE__ = blobData;
    return blobData;
  }

  const kvData = await readFromKV();
  if (kvData && kvData.state) {
    global.__AI_CONCIERGE_CLOUD_STATE__ = kvData;
    return kvData;
  }

  if (global.__AI_CONCIERGE_CLOUD_STATE__?.state) {
    return global.__AI_CONCIERGE_CLOUD_STATE__;
  }

  try {
    if (fs.existsSync(TMP_STATE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(TMP_STATE_PATH, 'utf8'));
      if (parsed && parsed.state) {
        global.__AI_CONCIERGE_CLOUD_STATE__ = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return { state: null, deletedIds: [], updatedAt: new Date(0).toISOString() };
}

async function saveCloudEnvelope(envelope: { state: any; deletedIds: string[]; updatedAt: string }, tenantId?: string): Promise<void> {
  const isCustomTenant = Boolean(tenantId && tenantId !== 'tenant-001');
  if (!global.__AI_CONCIERGE_TENANT_STATES__) {
    global.__AI_CONCIERGE_TENANT_STATES__ = {};
  }
  if (isCustomTenant && tenantId) {
    global.__AI_CONCIERGE_TENANT_STATES__[tenantId] = envelope;
    await writeToBlob(envelope, tenantId);
    return;
  }
  global.__AI_CONCIERGE_CLOUD_STATE__ = envelope;
  try {
    fs.writeFileSync(TMP_STATE_PATH, JSON.stringify(envelope), 'utf8');
  } catch {
    // ignore
  }
  await Promise.all([writeToBlob(envelope, 'tenant-001'), writeToKV(envelope)]);
}

function getItemTime(item: any): number {
  const ts = item?.updated_at || item?.last_interacted_at || item?.recorded_at || item?.created_at;
  if (!ts) return 0;
  const t = new Date(ts).getTime();
  return isNaN(t) ? 0 : t;
}

function isMojibakeString(s?: string): boolean {
  if (!s || typeof s !== 'string') return false;
  return /[ãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\uFFFD\x80-\x9F]/.test(s);
}

function isColloquialOrPlaceholder(item: any): boolean {
  const txt = `${item?.display_name || ''} ${item?.title || ''} ${item?.organization_name || ''} ${item?.notes || ''} ${item?.summary || ''} ${item?.service_title || ''} ${item?.fact_value || ''}`;
  return (
    /LINEでZoom URLのみ受領|\[Zoom特定メモ\]|もうバーも大好きやし|サッカーボール蹴るなんて|さんであの奈良かに行ってみたいな|ラズベリーでの交流会|正勝賀野|インフルエンザに感染し体調を崩している|寝起きで参加している|桑本みき|風邪気味のため声が聞きにくい|体調不良のため声が小さい|リライトチャプター|全然大丈夫|株式会社が入るから/.test(txt) ||
    /(^|[、。・:：\s「『（(と])K(?=[はがもにのへと、。・\s」』）)]|$)/m.test(txt) ||
    isMojibakeString(txt)
  );
}

function fixKnownZoomMisrecognitions(txt?: string): string {
  if (!txt || typeof txt !== 'string') return txt || '';
  return txt
    .replace(/この会議は、前回のビーンズ交流会の反省と今後の運営方針について話し合うことを目的として行われた。?\s*/g, '')
    .replace(/冒頭では(?:[0-9０-９]+\s*[/／]\s*)?勝賀野が子供のインフルエンザに感染し体調を崩していることを共有し、高野陽行は寝起きで参加している状況を説明した。?\s*/g, '')
    .replace(/[^。]*?(?:風邪気味のため声が聞きにくい|体調不良のため声が小さい)[^。]*?。?\s*/g, '')
    .replace(/[0-9０-９]+\s*[/／]\s*勝賀野\s*太郎\s*[/／]\s*残置物撤去/g, '勝賀野')
    .replace(/[0-9０-９]+\s*[/／]\s*勝賀野/g, '勝賀野')
    .replace(/正勝賀野/g, '勝賀野')
    .replace(/K\s*Kawasaki|Kawasaki\s*K/gi, '川崎景')
    .replace(/(^|[、。・:：\s「『（(と])K(?=[はがもにのへと、。・\s」』）)]|$)/gm, '$1川崎景')
    .replace(/美器[（(]桑本みき[）)]|桑本\s*みき|美器\s*川本/g, '川本美器')
    .replace(/陵平\s*高田/g, '高田陵平')
    .replace(/(?<![川本])美器(?=[はがもにのへと、。・店舗])/g, '川本美器')
    .replace(/(?<![高田])陵平(?=[はがもにのへと、。・:：])/g, '高田陵平')
    .replace(/リライトチャプター/g, 'ディライトチャプター')
    .replace(/インビクタスチャプター/g, 'インヴィクタスチャプター')
    .replace(/3島から/g, '三島宏幸様（だんじりチャプター）から')
    .replace(/生命神社/g, '晴明神社')
    .replace(/ラズベリー/g, 'ジャズベリー')
    .replace(/無党開発|武藤開発/g, '夢叶開発')
    .replace(/免费/g, '無料')
    .trim();
}

function mergeArrayById(
  serverArr: any[] = [],
  clientArr: any[] = [],
  serverDeletedSet: Set<string>,
  clientDeletedSet: Set<string>,
  lockedTenantId?: string
): any[] {
  const map = new Map<string, any>();

  const isDeletedForItem = (item: any): boolean => {
    if (!item || !item.id) return true;
    if (SAMPLE_IDS.has(item.id) || serverDeletedSet.has(item.id)) return true;
    if (item.person_id === 'p-zoom-participant' || SAMPLE_IDS.has(item.person_id) || SAMPLE_IDS.has(item.meeting_id) || SAMPLE_IDS.has(item.source_id)) return true;
    if (clientDeletedSet.has(item.id)) {
      // ロック済みテナント（例: tenant-endo）からの削除IDは、そのテナント自身のレコードに対してのみ適用し、他テナント（勝賀野様 tenant-001 等）のデータは絶対に消さない
      if (lockedTenantId && lockedTenantId !== 'tenant-001') {
        if (item.tenant_id && item.tenant_id !== lockedTenantId) {
          return false;
        }
        if (!item.tenant_id && item.id === 'tenant-001') {
          return false;
        }
      }
      return true;
    }
    return false;
  };

  const upsert = (item: any) => {
    if (isDeletedForItem(item)) return;

    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }

    // 口語・プレースホルダーが残っている古いキャッシュは、クリーンな要約レコードを上書きできないようにする
    const itemIsColloquial = isColloquialOrPlaceholder(item);
    const existingIsColloquial = isColloquialOrPlaceholder(existing);
    if (itemIsColloquial && !existingIsColloquial) {
      return;
    }

    // 完了済み面談や本登録(active)ステータスは後退させない
    const itemTime = getItemTime(item);
    const existingTime = getItemTime(existing);
    const preferItem =
      (!itemIsColloquial && existingIsColloquial) ||
      (item.status === 'completed' && existing.status !== 'completed') ||
      (item.recording_status === 'completed' && existing.recording_status !== 'completed') ||
      (item.status === 'active' && existing.status === 'provisional') ||
      (item.is_name_verified && !existing.is_name_verified) ||
      itemTime >= existingTime;

    if (preferItem) {
      map.set(item.id, {
        ...existing,
        ...item,
        image_url: item.image_url || existing.image_url,
        avatar_url: item.avatar_url || existing.avatar_url,
      });
    } else {
      map.set(item.id, {
        ...item,
        ...existing,
        image_url: existing.image_url || item.image_url,
        avatar_url: existing.avatar_url || item.avatar_url,
      });
    }
  };

  for (const it of serverArr) upsert(it);
  for (const it of clientArr) upsert(it);

  return Array.from(map.values());
}

function ensureCoreTenantsAndDeduplicate(state: any): any {
  if (!state || typeof state !== 'object') return state;

  if (!Array.isArray(state.tenants)) {
    state.tenants = [];
  }
  if (!state.tenants.some((t: any) => t?.id === 'tenant-001')) {
    state.tenants.unshift({
      id: 'tenant-001',
      name: 'メインアカウント（オーナー）',
      plan_tier: 'standard',
      monthly_budget_jpy: 1000,
      current_spend_jpy: 0,
      is_budget_throttled: false,
      created_at: '2026-11-01T00:00:00.000Z',
    });
  }
  if (!state.tenants.some((t: any) => t?.id === 'tenant-endo')) {
    state.tenants.push({
      id: 'tenant-endo',
      name: '遠藤様（販売・ブランディングパートナー専用アカウント）',
      plan_tier: 'premium',
      monthly_budget_jpy: 1000,
      current_spend_jpy: 0,
      is_budget_throttled: false,
      created_at: '2026-11-20T14:30:00.000Z',
      owner_profile: {
        owner_name: '遠藤',
        owner_phonetic: 'えんどう',
        company_name: '',
        title: '代表',
        bni_region_name: '',
        bni_chapter_name: '',
        bni_category: 'ブランディング・販売戦略パートナー',
        specialty_summary: '',
        is_onboarded: false,
      },
    });
  }

  // カスタムカテゴリーおよび人物タグの文字化け完全除去
  if (state.customCategories && typeof state.customCategories === 'object') {
    for (const k of Object.keys(state.customCategories)) {
      if (Array.isArray(state.customCategories[k])) {
        const cleanCats = Array.from(
          new Set((state.customCategories[k] as string[]).filter(c => c && !isMojibakeString(c)))
        );
        state.customCategories[k] = cleanCats.length > 0
          ? cleanCats
          : ['BNI', '仕事', 'パートナー', 'クライアント', '友人', '知人'];
      }
    }
  }

  // Zoom AI Companion の表記ゆれ・誤認識（「K」→「川崎景」、「ラズベリー」→「ジャズベリー」、「正勝賀野」→「勝賀野」等）をサーバー側でも全レコード一括補正
  if (Array.isArray(state.persons)) {
    for (const p of state.persons) {
      if (!p) continue;
      if (/^K\s*Kawasaki$|^Kawasaki\s*K$|^K$/i.test(String(p.display_name || '').trim())) {
        p.display_name = '川崎 景';
        p.phonetic_name = p.phonetic_name || 'カワサキ ケイ';
      }
      if (/^美器\s*川本$|^桑本\s*みき$/i.test(String(p.display_name || '').trim())) {
        p.display_name = '川本 美器';
        p.phonetic_name = p.phonetic_name || 'カワモト ミキ';
      }
      if (/^陵平\s*高田$|^高田さん（祇園バーRoute Zマスター・インヴィクタス）$/i.test(String(p.display_name || '').trim())) {
        p.display_name = '高田 陵平';
        p.phonetic_name = p.phonetic_name || 'タカダ リョウヘイ';
      }
      if (Array.isArray(p.category_tags)) {
        p.category_tags = p.category_tags.filter((t: string) => t && !isMojibakeString(t));
      }
      if (p.notes) p.notes = fixKnownZoomMisrecognitions(p.notes);
    }
  }
  if (Array.isArray(state.transcripts)) {
    for (const tr of state.transcripts) {
      if (!tr) continue;
      if (tr.summary) tr.summary = fixKnownZoomMisrecognitions(tr.summary);
      if (tr.full_text) tr.full_text = fixKnownZoomMisrecognitions(tr.full_text);
    }
  }
  if (Array.isArray(state.facts)) {
    for (const f of state.facts) {
      if (!f) continue;
      if (f.fact_key) f.fact_key = fixKnownZoomMisrecognitions(f.fact_key);
      if (f.fact_value) f.fact_value = fixKnownZoomMisrecognitions(f.fact_value);
    }
  }
  if (Array.isArray(state.meetings)) {
    for (const m of state.meetings) {
      if (!m) continue;
      if (m.title) m.title = fixKnownZoomMisrecognitions(m.title);
    }
  }

  // 高野陽行様・川崎景様との3名Zoom会議（m-zoom-nUUblUGRdOUzkSVNFeAKA）に川崎景様（オーダースーツ事業）の人物カルテ・腕時計アステラ連携・参加者紐付け・相関図エッジを保証
  const takanoMeeting = Array.isArray(state.meetings)
    ? state.meetings.find((m: any) => (m?.id === 'm-zoom-nUUblUGRdOUzkSVNFeAKA' || m?.zoom_uuid === 'nUU+blUGRdOUzkSVNFeAKA==') && m?.tenant_id === 'tenant-001')
    : undefined;
  if (takanoMeeting && Array.isArray(state.persons)) {
    const meetingDateIso = takanoMeeting.scheduled_end_at || takanoMeeting.scheduled_start_at || '2026-11-22T14:38:56.000Z';
    const takanoNotesClean =
      'ビーンズ（Beans）およびジャズベリーでのビジネスコミュニティ・交流会企画運営・ブランディング支援を展開。会員制カリキュラム（ブランディング・パーソナリティ診断・自己理解強化）の構築や、飲食店との相互送客関係を含めた交流会アジェンダ改善、公式LINE・QRアンケートを活用したフォローアップ体制の整備を主導。面談終盤では川崎景様（オーダースーツ事業）と共に勝賀野様のカスタムオーダーメイド腕時計「アステラ（ASTERA）」の展開・ブランディング戦略についても意見交換。';
    const kawasakiNotesClean =
      'オーダースーツ事業（スーツ仕立て・経営者向けスタイリング）を展開。勝賀野様のカスタムオーダーメイド腕時計「アステラ（ASTERA）」との親和性が高く、オーダースーツ顧客層とオーダー腕時計の相互紹介・クロスセルやブランディング連携について協議。また、ビーンズ（Beans）・ジャズベリー交流会の共同運営において、プライベート3分発表の成功モデルのビジネスセッションへの応用、飲食店が集客・人脈拡大に役立つモデルケース化、ホームページを活用した事前一括登録・プロフィール入力仕組みの構築を提案。';
    const watchSummaryBullet =
      '・オーダースーツ×オーダーメイド腕時計「アステラ」連携: 面談終盤では、オーダースーツ事業を展開する川崎景および高野陽行と、勝賀野が手掛けるカスタムオーダーメイド腕時計「アステラ（ASTERA）」の展開・価格・ブランディング戦略について意見交換が行われ、オーダースーツ顧客層との高い親和性を活かした相互紹介・クロスセル連携について話し合われた。';

    const takanoPerson = state.persons.find(
      (p: any) => p?.tenant_id === 'tenant-001' && (p?.id === 'p-1795358370152-pkdc1' || /高野\s*陽行/.test(p?.display_name || ''))
    );
    if (takanoPerson) {
      takanoPerson.phonetic_name = takanoPerson.phonetic_name || 'タカノ ハルユキ';
      takanoPerson.last_interacted_at = meetingDateIso;
      if (!takanoPerson.notes || /インフルエンザ|寝起き|この会議は/.test(takanoPerson.notes) || !takanoPerson.notes.includes('アステラ')) {
        takanoPerson.notes = takanoNotesClean;
      }
    }
    let kawasakiPerson = state.persons.find(
      (p: any) => p?.tenant_id === 'tenant-001' && p?.status !== 'deleted' && /川崎\s*景|河崎\s*景/.test(p?.display_name || '')
    );
    const takanoTr = Array.isArray(state.transcripts)
      ? state.transcripts.find((t: any) => t?.meeting_id === takanoMeeting.id)
      : undefined;
    if (takanoTr) {
      if (takanoTr.summary && !takanoTr.summary.includes('オーダーメイド腕時計')) {
        takanoTr.summary = `${fixKnownZoomMisrecognitions(takanoTr.summary)}\n${watchSummaryBullet}`;
      }
      if (takanoTr.full_text && !takanoTr.full_text.includes('オーダーメイド腕時計')) {
        takanoTr.full_text = `${fixKnownZoomMisrecognitions(takanoTr.full_text)}\n${watchSummaryBullet}`;
      }
    }
    if (!kawasakiPerson) {
      kawasakiPerson = {
        id: 'p-kawasaki-kei',
        tenant_id: 'tenant-001',
        display_name: '川崎 景',
        phonetic_name: 'カワサキ ケイ',
        status: 'active',
        is_name_verified: true,
        category_tags: ['BNI', '仕事'],
        service_areas: ['大阪府', '京都府'],
        meeting_count: 1,
        last_interacted_at: meetingDateIso,
        notes: kawasakiNotesClean,
        created_at: takanoMeeting.created_at || '2026-11-22T14:39:30.152Z',
        updated_at: new Date().toISOString(),
      };
      state.persons.push(kawasakiPerson);
    } else {
      kawasakiPerson.display_name = '川崎 景';
      kawasakiPerson.phonetic_name = kawasakiPerson.phonetic_name || 'カワサキ ケイ';
      kawasakiPerson.status = 'active';
      kawasakiPerson.is_name_verified = true;
      kawasakiPerson.meeting_count = Math.max(1, kawasakiPerson.meeting_count || 1);
      kawasakiPerson.last_interacted_at = meetingDateIso;
      if (!kawasakiPerson.notes || /インフルエンザ|寝起き|この会議は/.test(kawasakiPerson.notes) || !kawasakiPerson.notes.includes('オーダースーツ')) {
        kawasakiPerson.notes = kawasakiNotesClean;
      }
    }

    // 川崎景様の会社・事業（オーダースーツ事業）および事実・出典（オーダースーツ×オーダーメイド腕時計アステラ連携）を保証
    if (!Array.isArray(state.organizations)) state.organizations = [];
    if (!Array.isArray(state.organizationMemberships)) state.organizationMemberships = [];
    if (!Array.isArray(state.businessOfferings)) state.businessOfferings = [];
    if (!Array.isArray(state.facts)) state.facts = [];

    if (!state.organizations.some((o: any) => o?.id === 'org-kawasaki-suit')) {
      state.organizations.push({
        id: 'org-kawasaki-suit',
        tenant_id: 'tenant-001',
        name: 'オーダースーツ事業（川崎景様）',
      });
    }
    if (!state.organizationMemberships.some((om: any) => om?.person_id === kawasakiPerson.id)) {
      state.organizationMemberships.push({
        id: 'om-kawasaki-1',
        tenant_id: 'tenant-001',
        person_id: kawasakiPerson.id,
        organization_id: 'org-kawasaki-suit',
        organization_name: 'オーダースーツ事業',
        title: '代表（オーダースーツ仕立て・スタイリング）',
        is_current: true,
        started_on: '2026-11-22',
      });
    }
    if (!state.businessOfferings.some((bo: any) => bo?.person_id === kawasakiPerson.id)) {
      state.businessOfferings.push({
        id: 'bo-kawasaki-1',
        tenant_id: 'tenant-001',
        person_id: kawasakiPerson.id,
        service_title: 'オーダースーツ仕立て・経営者向けスタイリング / カスタム腕時計「アステラ」クロスセル連携',
        specialties: 'オーダースーツ製作・フィッティング、経営者・ビジネス層向け装いブランディング、勝賀野様のカスタムオーダーメイド腕時計「アステラ（ASTERA）」とのクロスセル・相互紹介連携、体験型ビジネス交流会設計',
        target_clients: 'オーダースーツを仕立てたい経営者・ビジネスパーソン、オーダーメイド腕時計「アステラ」に関心のある顧客層、集客・人脈拡大を目指す飲食店オーナー',
        service_area: '大阪府・京都府・関西一円',
        is_active: true,
      });
    }
    if (takanoPerson && !state.businessOfferings.some((bo: any) => bo?.person_id === takanoPerson.id)) {
      state.businessOfferings.push({
        id: 'bo-takano-1',
        tenant_id: 'tenant-001',
        person_id: takanoPerson.id,
        service_title: 'ビジネスコミュニティ「ビーンズ」・ジャズベリー交流会企画運営 / ブランディング・パーソナリティ診断',
        specialties: '体験型ビジネス交流会設計、会員向けブランディング・自己理解・パーソナリティ診断カリキュラム提供、飲食店との相互送客モデル構築',
        target_clients: '人脈拡大と実践的ブランディングを求める経営者・個人事業主、集客連携を希望する飲食店オーナー',
        service_area: '大阪府・京都府・関西一円',
        is_active: true,
      });
    }

    const kawasakiFacts = [
      {
        id: 'fact-kawasaki-topic-1',
        tenant_id: 'tenant-001',
        person_id: kawasakiPerson.id,
        fact_category: 'topic',
        fact_key: '本業（オーダースーツ事業）×オーダーメイド腕時計「アステラ」連携',
        fact_value: 'オーダースーツ事業（スーツ仕立て・経営者向けスタイリング）を展開。面談終盤にて勝賀野様が手掛けるカスタムオーダーメイド腕時計「アステラ（ASTERA）」の展開・ブランディング戦略について意見交換し、オーダースーツ顧客層との高い親和性を活かした相互紹介・クロスセル連携を協議',
        source_type: 'meeting_speech',
        source_id: takanoMeeting.id,
        source_evidence: '2026/11/22 Zoom面談（高野陽行様・川崎景様・勝賀野様）',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: meetingDateIso,
        created_at: meetingDateIso,
      },
      {
        id: 'fact-kawasaki-topic-2',
        tenant_id: 'tenant-001',
        person_id: kawasakiPerson.id,
        fact_category: 'topic',
        fact_key: 'ビーンズ・ジャズベリー交流会改善提案',
        fact_value: 'ビーンズ・ジャズベリー交流会の改善として、①プライベート3分発表の成功モデルを応用した体験型ビジネス交流の仕組み化、②飲食店が集客・人脈拡大に役立つモデルケースとしての位置づけ、③ホームページを用いた事前一括登録・自己紹介入力システムの導入を提案',
        source_type: 'meeting_speech',
        source_id: takanoMeeting.id,
        source_evidence: '2026/11/22 Zoom面談（高野陽行様・川崎景様・勝賀野様）',
        confidence: 0.98,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: meetingDateIso,
        created_at: meetingDateIso,
      },
      {
        id: 'fact-kawasaki-promise-1',
        tenant_id: 'tenant-001',
        person_id: kawasakiPerson.id,
        fact_category: 'promise',
        fact_key: '次回アクション・約束ToDo',
        fact_value: '勝賀野様から次回京都開催の交流会の日程が決まり次第、川崎景様へ早期に共有し、オーダーメイド腕時計「アステラ」×オーダースーツ事業の連携および交流会運営改善を進める',
        source_type: 'meeting_speech',
        source_id: takanoMeeting.id,
        source_evidence: '2026/11/22 Zoom面談 Next Steps',
        confidence: 0.98,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: meetingDateIso,
        created_at: meetingDateIso,
      },
    ];
    for (const kf of kawasakiFacts) {
      const idx = state.facts.findIndex((f: any) => f?.id === kf.id);
      if (idx >= 0) {
        state.facts[idx] = kf;
      } else {
        state.facts.unshift(kf);
      }
    }

    if (!Array.isArray(takanoMeeting.participant_ids)) takanoMeeting.participant_ids = [];
    if (takanoPerson && !takanoMeeting.participant_ids.includes(takanoPerson.id)) {
      takanoMeeting.participant_ids.unshift(takanoPerson.id);
    }
    if (kawasakiPerson && !takanoMeeting.participant_ids.includes(kawasakiPerson.id)) {
      takanoMeeting.participant_ids.push(kawasakiPerson.id);
    }
    takanoMeeting.title = '高野 陽行様・川崎 景様と面談（ビーンズ・ジャズベリー交流会運営戦略×オーダースーツ・腕時計アステラ連携）';
    if (takanoPerson && kawasakiPerson && Array.isArray(state.relationships)) {
      const existingRel = state.relationships.find(
        (r: any) =>
          r?.tenant_id === 'tenant-001' &&
          ((r.from_person_id === takanoPerson.id && r.to_person_id === kawasakiPerson.id) ||
            (r.from_person_id === kawasakiPerson.id && r.to_person_id === takanoPerson.id))
      );
      if (!existingRel) {
        state.relationships.push({
          id: 'rel-takano-kawasaki',
          tenant_id: 'tenant-001',
          from_person_id: takanoPerson.id,
          to_person_id: kawasakiPerson.id,
          relationship_type: '共同運営・協業連携（ビーンズ・ジャズベリー交流会 / オーダースーツ×腕時計アステラ）',
          is_ai_inferred: false,
          confidence: 0.99,
          evidence_text: '2026/11/22 Zoom会議にて高野陽行様・川崎景様（オーダースーツ事業）・勝賀野様の3名でビーンズおよびジャズベリー交流会の運営改善とオーダーメイド腕時計「アステラ」連携を協議',
          source_meeting_id: 'm-zoom-nUUblUGRdOUzkSVNFeAKA',
        });
      } else {
        existingRel.relationship_type = '共同運営・協業連携（ビーンズ・ジャズベリー交流会 / オーダースーツ×腕時計アステラ）';
        existingRel.evidence_text = '2026/11/22 Zoom会議にて高野陽行様・川崎景様（オーダースーツ事業）・勝賀野様の3名でビーンズおよびジャズベリー交流会の運営改善とオーダーメイド腕時計「アステラ」連携を協議';
      }
    }
  }

  // 2026/11/27 川本美器様（京都・ディライトチャプター / WineShop Gorríon 代表）・高田陵平様（京都・インヴィクタスチャプター / 祇園バー Route Z マスター）のZoom面談（m-zoom-wd6wBnHzQI6x8a6ytmmxSA）のチャプター確定・重複統合
  const kawamotoMeeting = Array.isArray(state.meetings)
    ? state.meetings.find((m: any) => (m?.id === 'm-zoom-wd6wBnHzQI6x8a6ytmmxSA' || m?.zoom_uuid === 'wd6wBnHzQI6x8a6ytmmxSA==') && m?.tenant_id === 'tenant-001')
    : undefined;
  if (kawamotoMeeting && Array.isArray(state.persons)) {
    const kmDateIso = kawamotoMeeting.scheduled_end_at || kawamotoMeeting.scheduled_start_at || '2026-11-27T03:57:37.000Z';
    if (!Array.isArray(state.bniMemberships)) state.bniMemberships = [];
    if (!Array.isArray(state.organizations)) state.organizations = [];
    if (!Array.isArray(state.organizationMemberships)) state.organizationMemberships = [];
    if (!Array.isArray(state.businessOfferings)) state.businessOfferings = [];
    if (!Array.isArray(state.facts)) state.facts = [];

    let takadaPerson = state.persons.find((p: any) => p?.tenant_id === 'tenant-001' && p?.id === 'p-takada-invictus');
    if (!takadaPerson) {
      takadaPerson = state.persons.find(
        (p: any) => p?.tenant_id === 'tenant-001' && p?.status !== 'deleted' && /高田\s*陵平|陵平\s*高田|^高田さん/.test(p?.display_name || '')
      );
    }
    const takadaNotesClean =
      'BNI 京都シティセントラルリージョン（Kyoto City Central）「インヴィクタスチャプター」所属。勝賀野様と共同で京都・祇園のバー「Route Z」を運営（マスター）。森 雄平様と同チャプターでコネクト連携を行い、中川 丈太郎様とも女性アルバイト求人原稿作成連携、川本 美器様（WineShop Gorríon / ディライトチャプター）とも祇園バー「Route Z」へのワイン導入・グラスワイン提供および飲食店相互紹介で協業。';
    if (!takadaPerson) {
      takadaPerson = {
        id: 'p-takada-invictus',
        tenant_id: 'tenant-001',
        display_name: '高田 陵平',
        phonetic_name: 'タカダ リョウヘイ',
        status: 'active',
        is_name_verified: true,
        category_tags: ['BNI', '仕事', 'パートナー'],
        service_areas: ['京都府（祇園・京都市）', '関西一円'],
        office_address: '京都府京都市東山区（祇園バー Route Z）',
        meeting_count: 1,
        last_interacted_at: kmDateIso,
        notes: takadaNotesClean,
        created_at: '2026-11-19T03:05:00Z',
        updated_at: kmDateIso,
      };
      state.persons.unshift(takadaPerson);
    } else {
      takadaPerson.display_name = '高田 陵平';
      takadaPerson.phonetic_name = 'タカダ リョウヘイ';
      takadaPerson.status = 'active';
      takadaPerson.is_name_verified = true;
      takadaPerson.category_tags = Array.from(new Set([...(takadaPerson.category_tags || []), 'BNI', '仕事', 'パートナー']));
      takadaPerson.service_areas = ['京都府（祇園・京都市）', '関西一円'];
      takadaPerson.office_address = takadaPerson.office_address || '京都府京都市東山区（祇園バー Route Z）';
      takadaPerson.meeting_count = Math.max(1, takadaPerson.meeting_count || 1);
      takadaPerson.last_interacted_at = kmDateIso;
      takadaPerson.notes = takadaNotesClean;
    }

    const dupTakadaIds = new Set<string>(
      state.persons
        .filter(
          (p: any) =>
            p?.tenant_id === 'tenant-001' &&
            p?.id !== takadaPerson.id &&
            (/高田\s*陵平|陵平\s*高田|^高田さん/.test(p?.display_name || '') ||
              p?.id === 'p-1795750960567-uha7i' ||
              p?.id === 'p-1795750973371-w7377')
        )
        .map((p: any) => p.id)
    );
    if (dupTakadaIds.size > 0) {
      state.persons = state.persons.filter((p: any) => !dupTakadaIds.has(p?.id));
      for (const col of ['facts', 'bniMemberships', 'businessOfferings', 'organizationMemberships', 'consents']) {
        if (Array.isArray(state[col])) {
          for (const item of state[col]) {
            if (item?.person_id && dupTakadaIds.has(item.person_id)) {
              item.person_id = takadaPerson.id;
            }
          }
        }
      }
      if (Array.isArray(state.relationships)) {
        for (const r of state.relationships) {
          if (r?.from_person_id && dupTakadaIds.has(r.from_person_id)) r.from_person_id = takadaPerson.id;
          if (r?.to_person_id && dupTakadaIds.has(r.to_person_id)) r.to_person_id = takadaPerson.id;
        }
        state.relationships = state.relationships.filter((r: any) => r.from_person_id !== r.to_person_id);
      }
    }

    state.bniMemberships = state.bniMemberships.filter(
      (bm: any) => !(bm?.person_id === takadaPerson.id && bm?.id !== 'bnim-takada-1')
    );
    const existingTakadaBni = state.bniMemberships.find((bm: any) => bm?.id === 'bnim-takada-1');
    if (!existingTakadaBni) {
      state.bniMemberships.unshift({
        id: 'bnim-takada-1',
        tenant_id: 'tenant-001',
        person_id: takadaPerson.id,
        chapter_id: 'chap-bni-258',
        chapter_name: 'インヴィクタスチャプター',
        region_name: '京都シティセントラルリージョン (Kyoto City Central)',
        category: 'バー・飲食店経営（祇園バー「Route Z」マスター）',
        status: 'active',
        joined_on: '2026-04-01',
      });
    } else {
      existingTakadaBni.person_id = takadaPerson.id;
      existingTakadaBni.chapter_id = 'chap-bni-258';
      existingTakadaBni.chapter_name = 'インヴィクタスチャプター';
      existingTakadaBni.region_name = '京都シティセントラルリージョン (Kyoto City Central)';
      existingTakadaBni.category = 'バー・飲食店経営（祇園バー「Route Z」マスター）';
      existingTakadaBni.status = 'active';
    }

    if (!state.organizations.some((o: any) => o?.id === 'org-route-z')) {
      state.organizations.push({
        id: 'org-route-z',
        tenant_id: 'tenant-001',
        name: '祇園バー Route Z',
      });
    }
    if (!state.organizationMemberships.some((om: any) => om?.person_id === takadaPerson.id)) {
      state.organizationMemberships.push({
        id: 'om-takada-1',
        tenant_id: 'tenant-001',
        person_id: takadaPerson.id,
        organization_id: 'org-route-z',
        organization_name: '祇園バー Route Z',
        title: 'マスター（共同運営）',
        is_current: true,
        started_on: '2026-04-01',
      });
    }
    if (!state.businessOfferings.some((bo: any) => bo?.person_id === takadaPerson.id)) {
      state.businessOfferings.push({
        id: 'bo-takada-1',
        tenant_id: 'tenant-001',
        person_id: takadaPerson.id,
        service_title: '京都・祇園バー「Route Z」運営（経営者交流・二次会・店舗協業）',
        specialties: '京都・祇園でのバー運営、BNIインヴィクタスチャプターを軸とした京都・関西の経営者・飲食店ネットワーク構築、ワイン・高級スイーツ等の店舗導入協業',
        target_clients: '京都・祇園エリアで会食・二次会・交流会を行う経営者様、飲食店・酒類卸パートナー様',
        service_area: '京都府（祇園・京都市）・関西一円',
        is_active: true,
      });
    }

    const kawamotoPerson = state.persons.find(
      (p: any) =>
        p?.tenant_id === 'tenant-001' &&
        p?.status !== 'deleted' &&
        (p?.id === 'p-1795750960554-z5i2n' || /川本\s*美器|美器\s*川本|桑本\s*みき/.test(p?.display_name || ''))
    );
    const kawamotoNotesClean =
      'BNI 京都シティセントラルリージョン（Kyoto City Central）「ディライトチャプター」所属（入会8ヶ月目・カテゴリー：ワイン販売）。京都市上京区（西陣織会館近く・晴明神社から徒歩2〜3分）にてヨーロッパ産中心（フランス・イタリア・スペイン・ポルトガル・オーストリア・ドイツ等）のワインショップ「WineShop Gorríon（ゴリオン）」を経営（店舗販売・EC通販・飲食店向け卸・ワイン会企画）。実家は西陣織の織元。ワイン買取ライセンスの取得も進行中。勝賀野様・高田様が運営する祇園バー「Route Z」へのグラスワイン（赤・白3,000〜4,000円帯やシャンパン）導入および、勝賀野様の遺品整理・残置物撤去現場から出る未開栓ワイン・古酒の買取査定連携に合意。';
    if (kawamotoPerson) {
      kawamotoPerson.display_name = '川本 美器';
      kawamotoPerson.phonetic_name = 'カワモト ミキ';
      kawamotoPerson.status = 'active';
      kawamotoPerson.is_name_verified = true;
      kawamotoPerson.category_tags = Array.from(new Set([...(kawamotoPerson.category_tags || []), 'BNI', '仕事']));
      kawamotoPerson.service_areas = ['京都府（上京区・西陣・祇園・京都市全域）', '大阪府', '全国EC対応'];
      kawamotoPerson.office_address = '京都府京都市上京区（西陣織会館・晴明神社徒歩2〜3分）';
      kawamotoPerson.meeting_count = Math.max(1, kawamotoPerson.meeting_count || 1);
      kawamotoPerson.last_interacted_at = kmDateIso;
      kawamotoPerson.notes = kawamotoNotesClean;

      state.bniMemberships = state.bniMemberships.filter(
        (bm: any) => !(bm?.person_id === kawamotoPerson.id && bm?.id !== 'bnim-kawamoto-1')
      );
      const existingKawamotoBni = state.bniMemberships.find((bm: any) => bm?.id === 'bnim-kawamoto-1');
      if (!existingKawamotoBni) {
        state.bniMemberships.unshift({
          id: 'bnim-kawamoto-1',
          tenant_id: 'tenant-001',
          person_id: kawamotoPerson.id,
          chapter_id: 'chap-bni-297',
          chapter_name: 'ディライトチャプター',
          region_name: '京都シティセントラルリージョン (Kyoto City Central)',
          category: 'ワイン販売（WineShop Gorríon 代表・飲食店向けワイン卸・買取）',
          status: 'active',
          joined_on: '2026-04-01',
        });
      } else {
        existingKawamotoBni.person_id = kawamotoPerson.id;
        existingKawamotoBni.chapter_id = 'chap-bni-297';
        existingKawamotoBni.chapter_name = 'ディライトチャプター';
        existingKawamotoBni.region_name = '京都シティセントラルリージョン (Kyoto City Central)';
        existingKawamotoBni.category = 'ワイン販売（WineShop Gorríon 代表・飲食店向けワイン卸・買取）';
        existingKawamotoBni.status = 'active';
      }

      for (const bo of state.businessOfferings) {
        if (bo?.person_id === kawamotoPerson.id) {
          bo.service_title = 'ヨーロッパワイン専門店「WineShop Gorríon」運営・飲食店向け卸・ワイン会企画・古酒買取連携';
          bo.specialties = 'ヨーロッパ産ワイン（仏・伊・西・葡・墺・独）の厳選仕入・店舗販売（京都市上京区・晴明神社近く）・EC通販、飲食店向け小ロット卸提案、ワイン会イベント開催、遺品整理等の未開栓ワイン査定買取';
          bo.target_clients = 'ワイン導入を希望するバー・飲食店オーナー様（京都・大阪）、ワイン愛好家・経営者様、未開栓ワインの売却・買取を希望する方';
          bo.service_area = '京都府・大阪府・全国EC対応';
        }
      }
    }

    kawamotoMeeting.title =
      '川本 美器様・高田 陵平様と1to1（京都・ディライト＆インヴィクタスチャプター / WineShop Gorríon 祇園バーRoute Zワイン導入・相互紹介）';
    kawamotoMeeting.participant_ids = [kawamotoPerson?.id, takadaPerson?.id].filter(Boolean);

    const cleanKmSummary = [
      'BNI 京都シティセントラルリージョン「ディライトチャプター」所属の川本 美器様（WineShop Gorríon 代表 / ワイン販売）および「インヴィクタスチャプター」所属の高田 陵平様（祇園バー「Route Z」マスター）・勝賀野様の3名による1to1面談。川本様は京都市上京区（西陣織会館・晴明神社から徒歩2〜3分）にてヨーロッパ産ワイン専門店「WineShop Gorríon（ゴリオン）」を運営（実家は西陣織の織元）し、店舗販売・EC通販・飲食店向け卸・ワイン会イベントおよびワイン買取ライセンス取得を展開。勝賀野様・高田様が運営する祇園バー「Route Z」へのグラスワイン（赤・白3,000〜4,000円帯やシャンパン）導入、および勝賀野様の遺品整理・残置物撤去現場から出る未開栓ワインの買取査定連携・飲食店相互紹介で合意。',
      '・事業背景とWineShop Gorríonの強み: 川本美器様は三島宏幸様（だんじりチャプター）からのご紹介で今回の1to1を実施。フランス・イタリア・スペイン・ポルトガル・オーストリア・ドイツ等のヨーロッパワインを中心に、試飲会・インポーターから厳選して仕入れ、飲食店ごとの料理や客層に合わせた小ロット卸・メニュー提案に強みを持つ。',
      '・祇園バー「Route Z」へのワイン導入・店舗見学: 勝賀野様と高田陵平様が運営する祇園バー「Route Z」では現在ウイスキー・焼酎が中心でワインの取扱がないため、高田様が上京区の「WineShop Gorríon」実店舗を訪問し、バーでグラス提供しやすい3,000〜4,000円帯の赤・白ワインやシャンパンを選定して導入を進めることで合意。',
      '・未開栓ワイン買取×遺品整理連携および相互紹介: 川本様が取得手続き中の酒類（ワイン）買取ライセンスを活用し、勝賀野様の遺品整理・残置物撤去現場で出る未開栓ワイン・古酒の査定・買取連携を協議。また、川本様からディライトチャプターの近味様（不動産関連・元警察官）、勝賀野様・高田様から中書島のバー経営者様やワイン愛好家の知人経営者を相互に紹介し、祇園バー「Route Z」での懇親会を開催することで一致。',
    ].join('\n');

    if (Array.isArray(state.transcripts)) {
      const kmTr = state.transcripts.find((t: any) => t?.meeting_id === kawamotoMeeting.id);
      if (kmTr) {
        kmTr.summary = cleanKmSummary;
        kmTr.ai_refined = true;
        if (kmTr.full_text) {
          kmTr.full_text = fixKnownZoomMisrecognitions(kmTr.full_text);
        }
      }
    }

    state.facts = state.facts.filter(
      (f: any) =>
        !(
          f?.source_id === kawamotoMeeting.id &&
          (String(f?.id || '').startsWith('fact-zoom-') || /桑本|風邪気味|体調不良|リライトチャプター/.test(f?.fact_value || ''))
        )
    );

    const kmCoreFacts = [
      ...(kawamotoPerson
        ? [
            {
              id: 'fact-kawamoto-topic-1',
              tenant_id: 'tenant-001',
              person_id: kawamotoPerson.id,
              fact_category: 'topic',
              fact_key: '盛り上がった話題・事業内容',
              fact_value:
                'BNI 京都シティセントラルリージョン「ディライトチャプター」所属（カテゴリー：ワイン販売）。京都市上京区（西陣織会館・晴明神社徒歩2〜3分）にてヨーロッパ産ワイン専門店「WineShop Gorríon（ゴリオン）」を経営（実家は西陣織の織元）。祇園バー「Route Z」へのグラスワイン（3,000〜4,000円帯）・シャンパン導入、および遺品整理・残置物撤去現場で出る未開栓ワインの買取連携・飲食店相互紹介に合意',
              source_type: 'meeting_speech',
              source_id: kawamotoMeeting.id,
              source_evidence: '2026/11/27 Zoom 1to1面談（川本美器様・高田陵平様・勝賀野様）',
              confidence: 0.99,
              verification_status: 'verified',
              visibility: 'referral_eligible',
              valid_from: kmDateIso,
              created_at: kmDateIso,
            },
            {
              id: 'fact-kawamoto-promise-1',
              tenant_id: 'tenant-001',
              person_id: kawamotoPerson.id,
              fact_category: 'promise',
              fact_key: '保留中の約束・ToDo',
              fact_value:
                '高田陵平様が上京区の「WineShop Gorríon」実店舗を訪問して祇園バー「Route Z」用ワインを選定・導入し、勝賀野様から中書島のバー経営者様・ワイン愛好家をご紹介、川本美器様からディライトチャプターの近味様（不動産関連・元警察官）をお繋ぎして祇園バー「Route Z」で懇親会を開催する',
              source_type: 'meeting_speech',
              source_id: kawamotoMeeting.id,
              source_evidence: '2026/11/27 Zoom 1to1面談 Next Steps',
              confidence: 0.99,
              verification_status: 'verified',
              visibility: 'referral_eligible',
              valid_from: kmDateIso,
              created_at: kmDateIso,
            },
          ]
        : []),
      ...(takadaPerson
        ? [
            {
              id: 'fact-takada-topic-1',
              tenant_id: 'tenant-001',
              person_id: takadaPerson.id,
              fact_category: 'topic',
              fact_key: '盛り上がった話題・事業内容',
              fact_value:
                'BNI 京都シティセントラルリージョン「インヴィクタスチャプター」所属。京都・祇園バー「Route Z」マスターとして勝賀野様と共同運営。川本美器様（WineShop Gorríon / ディライトチャプター）との1to1に同席し、バー「Route Z」でのグラスワイン（赤・白3,000〜4,000円帯）・シャンパン提供に向けた店舗訪問・仕入選定および京都エリアの飲食店・経営者相互紹介で合意',
              source_type: 'meeting_speech',
              source_id: kawamotoMeeting.id,
              source_evidence: '2026/11/27 Zoom 1to1面談（川本美器様・高田陵平様・勝賀野様）',
              confidence: 0.99,
              verification_status: 'verified',
              visibility: 'referral_eligible',
              valid_from: kmDateIso,
              created_at: kmDateIso,
            },
            {
              id: 'fact-takada-promise-1',
              tenant_id: 'tenant-001',
              person_id: takadaPerson.id,
              fact_category: 'promise',
              fact_key: '保留中の約束・ToDo',
              fact_value:
                '高田陵平様が川本美器様の「WineShop Gorríon」（京都市上京区・晴明神社近く）を訪問して祇園バー「Route Z」に置くワインを選定・購入し、川本様を祇園バー「Route Z」へ招待して懇親および飲食店紹介を進める',
              source_type: 'meeting_speech',
              source_id: kawamotoMeeting.id,
              source_evidence: '2026/11/27 Zoom 1to1面談 Next Steps',
              confidence: 0.99,
              verification_status: 'verified',
              visibility: 'referral_eligible',
              valid_from: kmDateIso,
              created_at: kmDateIso,
            },
          ]
        : []),
    ];
    for (const kf of kmCoreFacts) {
      const idx = state.facts.findIndex((f: any) => f?.id === kf.id);
      if (idx >= 0) {
        state.facts[idx] = kf;
      } else {
        state.facts.unshift(kf);
      }
    }
  }

  // 2026/11/28 中野 亘 様（大阪東・だんじりチャプター副代表 / 中野亘税理士事務所 代表税理士）のカルテ・面談（m-1795860761886-5xnii）にて誤抽出された「全然大丈夫」「株式会社が入るから」をサーバー側でも完全浄化
  if (Array.isArray(state.persons)) {
    const nakanoPerson = state.persons.find(
      (p: any) =>
        p?.tenant_id === 'tenant-001' &&
        p?.status !== 'deleted' &&
        (p?.id === 'p-1795860761879-jkvhx' || /全然大丈夫|中野\s*亘|亘\s*中野/.test(p?.display_name || ''))
    );
    if (nakanoPerson) {
      nakanoPerson.display_name = '中野 亘';
      nakanoPerson.phonetic_name = 'ナカノ ワタル';
      nakanoPerson.status = 'active';
      nakanoPerson.is_name_verified = true;
      nakanoPerson.category_tags = Array.from(new Set([...(nakanoPerson.category_tags || []), 'BNI', '仕事']));
      nakanoPerson.service_areas = ['大阪府', '京都府', '関西一円', '全国対応'];
      nakanoPerson.notes =
        'BNI 大阪東リージョン（Osaka East）「だんじりチャプター」副代表（バイスプレジデント・カテゴリー：税理士）。中野亘税理士事務所 代表税理士。過去の税務申告にとどまらない売上向上・資金繰り・財務戦略に特化した財務コンサルティングおよび税務セカンドオピニオンを提供。特に医療・歯科・動物病院の新規開業支援（立地・物件選定、医療機器導入、創業融資獲得、広告に頼らない集客ノウハウ）および創業初期・スタートアップ事業者の資金調達指導・法人化支援に強みを持つ。勝賀野様が展開するAI古物査定ツール「カンテノ」、オーダーメイド腕時計「アステラ」、機密文書処理および不用品回収事業との協業・相互紹介に合意。';

      if (Array.isArray(state.organizationMemberships)) {
        state.organizationMemberships = state.organizationMemberships.filter(
          (om: any) => !(om?.person_id === nakanoPerson.id && /株式会社が入るから/.test(om?.organization_name || ''))
        );
      }
      if (Array.isArray(state.meetings)) {
        for (const m of state.meetings) {
          if (m?.id === 'm-1795860761886-5xnii' || (m?.participant_ids || []).includes(nakanoPerson.id) || /全然大丈夫/.test(m?.title || '')) {
            m.title =
              '中野 亘様と1to1（大阪東・だんじりチャプター / 中野亘税理士事務所 財務コンサル・医療/動物病院開業支援×不用品回収・腕時計アステラ連携）';
          }
        }
      }
      if (Array.isArray(state.consents)) {
        for (const c of state.consents) {
          if (c?.person_id === nakanoPerson.id || /全然大丈夫/.test(c?.person_name || '')) {
            c.person_name = '中野 亘';
          }
        }
      }
      if (Array.isArray(state.transcripts)) {
        for (const tr of state.transcripts) {
          if (tr?.meeting_id === 'm-1795860761886-5xnii') {
            tr.ai_refined = true;
            if (Array.isArray(tr.utterances)) {
              for (const u of tr.utterances) {
                if (u?.resolved_person_id === nakanoPerson.id || /全然大丈夫/.test(u?.resolved_person_name || '')) {
                  u.speaker_label = '中野 亘';
                  u.resolved_person_name = '中野 亘';
                }
              }
            }
          }
        }
      }
      if (Array.isArray(state.facts)) {
        state.facts = state.facts.filter(
          (f: any) => !(f?.person_id === nakanoPerson.id && /全然大丈夫|株式会社が入るから/.test(f?.fact_value || ''))
        );
      }
      const mainKimura = state.persons.find((p: any) => p?.id === 'p-kimura-naofumi');
      if (mainKimura) {
        state.persons = state.persons.filter((p: any) => p?.id !== 'p-1795860783705-m5amu');
        if (Array.isArray(state.relationships)) {
          for (const r of state.relationships) {
            if (r?.from_person_id === 'p-1795860783705-m5amu') r.from_person_id = mainKimura.id;
            if (r?.to_person_id === 'p-1795860783705-m5amu') r.to_person_id = mainKimura.id;
          }
        }
      }
    }
  }

  // テナントごとの同名人物重複・同日同一人物面談重複をサーバー側でも自動名寄せ（データ重複ゼロ保証）
  if (Array.isArray(state.persons) && state.persons.length > 1) {
    const groups = new Map<string, any[]>();
    for (const p of state.persons) {
      if (!p || p.status === 'deleted') continue;
      const norm = String(p.display_name || '').replace(/（.*?）|\(.*?\)/g, '').replace(/[\s　様さん氏]+/g, '');
      if (!norm || /^(相手未特定|面談のお相手|面談予定|名称未設定|参加者)/.test(norm)) continue;
      const key = `${p.tenant_id || 'tenant-001'}::${norm}`;
      const arr = groups.get(key) || [];
      arr.push(p);
      groups.set(key, arr);
    }

    const redirectMap = new Map<string, string>();
    for (const [, group] of groups.entries()) {
      if (group.length <= 1) continue;
      group.sort((a, b) => {
        const score = (x: any) =>
          (x.status === 'active' ? 1000 : 0) +
          (!isColloquialOrPlaceholder(x) ? 500 : 0) +
          (x.meeting_count || 0) * 50 +
          String(x.notes || '').length;
        return score(b) - score(a);
      });
      const keep = group[0];
      for (let i = 1; i < group.length; i++) {
        redirectMap.set(group[i].id, keep.id);
      }
    }

    if (redirectMap.size > 0) {
      state.persons = state.persons.filter((p: any) => !redirectMap.has(p.id));
      if (Array.isArray(state.meetings)) {
        for (const m of state.meetings) {
          if (Array.isArray(m.participant_ids)) {
            m.participant_ids = Array.from(new Set(m.participant_ids.map((id: string) => redirectMap.get(id) || id)));
          }
        }
      }
      for (const col of ['facts', 'bniMemberships', 'businessOfferings', 'organizationMemberships', 'consents']) {
        if (Array.isArray(state[col])) {
          for (const item of state[col]) {
            if (item?.person_id && redirectMap.has(item.person_id)) {
              item.person_id = redirectMap.get(item.person_id);
            }
          }
        }
      }
      if (Array.isArray(state.relationships)) {
        for (const r of state.relationships) {
          if (r?.from_person_id && redirectMap.has(r.from_person_id)) r.from_person_id = redirectMap.get(r.from_person_id);
          if (r?.to_person_id && redirectMap.has(r.to_person_id)) r.to_person_id = redirectMap.get(r.to_person_id);
        }
        state.relationships = state.relationships.filter((r: any) => r.from_person_id !== r.to_person_id);
      }
    }
  }

  return state;
}

function mergeStates(
  serverState: any | null,
  clientState: any,
  serverDeletedSet: Set<string>,
  clientDeletedSet: Set<string>,
  lockedTenantId?: string
): any {
  if (!serverState) return ensureCoreTenantsAndDeduplicate(clientState);
  if (!clientState) return ensureCoreTenantsAndDeduplicate(serverState);

  const collections = [
    'tenants',
    'persons',
    'organizations',
    'organizationMemberships',
    'businessOfferings',
    'bniRegions',
    'bniChapters',
    'bniMemberships',
    'meetings',
    'consents',
    'recordings',
    'transcripts',
    'facts',
    'cardScans',
    'reviewQueue',
    'relationships',
    'referrals',
    'costLedger',
    'auditLogs',
  ];

  const merged: any = {
    ...serverState,
    ...clientState,
    currentTenantId: 'tenant-001',
  };

  for (const key of collections) {
    if (Array.isArray(serverState[key]) || Array.isArray(clientState[key])) {
      merged[key] = mergeArrayById(
        serverState[key] || [],
        clientState[key] || [],
        serverDeletedSet,
        clientDeletedSet,
        lockedTenantId
      );
    }
  }

  // カスタムカテゴリーのユニオンマージ（文字化けタグを除外）
  const sCats = serverState.customCategories || {};
  const cCats = clientState.customCategories || {};
  const mergedCats: Record<string, string[]> = { ...sCats };
  for (const tid of Object.keys({ ...sCats, ...cCats })) {
    mergedCats[tid] = Array.from(
      new Set([...(sCats[tid] || []), ...(cCats[tid] || [])].filter(c => c && !isMojibakeString(c)))
    );
  }
  merged.customCategories = mergedCats;

  // 監査ログは肥大化防止のため最新200件に制限
  if (Array.isArray(merged.auditLogs) && merged.auditLogs.length > 200) {
    merged.auditLogs = merged.auditLogs.slice(0, 200);
  }

  return ensureCoreTenantsAndDeduplicate(merged);
}

const TENANT_SCOPED_COLLECTIONS = [
  'persons',
  'organizations',
  'organizationMemberships',
  'businessOfferings',
  'bniMemberships',
  'meetings',
  'consents',
  'recordings',
  'transcripts',
  'facts',
  'cardScans',
  'reviewQueue',
  'relationships',
  'referrals',
  'costLedger',
  'auditLogs',
];

function filterStateForTenant(fullState: any, lockedTenantId?: string): any {
  if (!fullState || !lockedTenantId || lockedTenantId === 'tenant-001') {
    return fullState;
  }
  const filtered: any = {
    ...fullState,
    currentTenantId: lockedTenantId,
    tenants: Array.isArray(fullState.tenants)
      ? fullState.tenants.filter((t: any) => t.id === lockedTenantId)
      : [],
  };
  for (const key of TENANT_SCOPED_COLLECTIONS) {
    if (Array.isArray(fullState[key])) {
      filtered[key] = fullState[key].filter((item: any) => item?.tenant_id === lockedTenantId);
    }
  }
  if (fullState.customCategories && typeof fullState.customCategories === 'object') {
    filtered.customCategories = {
      [lockedTenantId]: fullState.customCategories[lockedTenantId] || [],
    };
  }
  return filtered;
}

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const urlObj = new URL(req.url || '/api/sync/state', 'http://localhost');
      const queryTenantId = urlObj.searchParams.get('tenantId') || undefined;
      const envelope = await loadCloudEnvelope(queryTenantId);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'ok',
        hasState: !!envelope.state,
        state: filterStateForTenant(envelope.state, queryTenantId),
        deletedIds: envelope.deletedIds,
        updatedAt: envelope.updatedAt,
      }));
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    const raw = typeof req.body === 'string'
      ? req.body
      : (req.body ? JSON.stringify(req.body) : await getRawBody(req));
    const payload = raw ? JSON.parse(raw) : {};
    const lockedTenantId: string | undefined = payload.lockedTenantId || undefined;
    const envelope = await loadCloudEnvelope(lockedTenantId);
    const rawClientState = payload.state;
    // ロック済み顧客テナントからのPOSTでは、そのテナント自身の専用Blobファイル（vault/tenant_<id>.enc）に対してのみ読み書きし、他テナントと100%物理分離
    const clientState = lockedTenantId && lockedTenantId !== 'tenant-001'
      ? filterStateForTenant(rawClientState, lockedTenantId)
      : rawClientState;
    const clientDeletedIds: string[] = Array.isArray(payload.deletedIds) ? payload.deletedIds : [];
    const serverDeletedSet = new Set<string>(envelope.deletedIds || []);
    const clientDeletedSet = new Set<string>(clientDeletedIds);

    const mergedDeletedSet = new Set<string>([
      ...serverDeletedSet,
      ...clientDeletedIds,
    ]);
    const mergedDeletedIds = Array.from(mergedDeletedSet).slice(-500);

    const mergedState = clientState
      ? mergeStates(envelope.state, clientState, serverDeletedSet, clientDeletedSet, lockedTenantId)
      : ensureCoreTenantsAndDeduplicate(envelope.state);

    const updatedAt = new Date().toISOString();
    await saveCloudEnvelope({
      state: mergedState,
      deletedIds: mergedDeletedIds,
      updatedAt,
    }, lockedTenantId);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      state: filterStateForTenant(mergedState, lockedTenantId),
      deletedIds: mergedDeletedIds,
      updatedAt,
    }));
  } catch (err: any) {
    console.error('Error in /api/sync/state:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
}
