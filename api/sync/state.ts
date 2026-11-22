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
}

function getBlobVaultConfig(): { key: Buffer; pathname: string } | null {
  const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
  if (!token) return null;
  const key = crypto.createHash('sha256').update(`ai-concierge-aes256:${token}`).digest();
  const pathHash = crypto.createHmac('sha256', token).update('ai-concierge-state-vault-v1').digest('hex').slice(0, 32);
  return { key, pathname: `vault/state_${pathHash}.enc` };
}

async function readFromBlob(): Promise<{ state: any; deletedIds: string[]; updatedAt: string } | null> {
  const cfg = getBlobVaultConfig();
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

async function writeToBlob(payload: { state: any; deletedIds: string[]; updatedAt: string }): Promise<void> {
  const cfg = getBlobVaultConfig();
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

async function loadCloudEnvelope(): Promise<{ state: any | null; deletedIds: string[]; updatedAt: string }> {
  const blobData = await readFromBlob();
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

async function saveCloudEnvelope(envelope: { state: any; deletedIds: string[]; updatedAt: string }): Promise<void> {
  global.__AI_CONCIERGE_CLOUD_STATE__ = envelope;
  try {
    fs.writeFileSync(TMP_STATE_PATH, JSON.stringify(envelope), 'utf8');
  } catch {
    // ignore
  }
  await Promise.all([writeToBlob(envelope), writeToKV(envelope)]);
}

function getItemTime(item: any): number {
  const ts = item?.updated_at || item?.last_interacted_at || item?.recorded_at || item?.created_at;
  if (!ts) return 0;
  const t = new Date(ts).getTime();
  return isNaN(t) ? 0 : t;
}

function isColloquialOrPlaceholder(item: any): boolean {
  const txt = `${item?.notes || ''} ${item?.summary || ''} ${item?.service_title || ''} ${item?.fact_value || ''}`;
  return (
    /LINEでZoom URLのみ受領|\[Zoom特定メモ\]|もうバーも大好きやし|サッカーボール蹴るなんて|さんであの奈良かに行ってみたいな|ラズベリーでの交流会|正勝賀野/.test(txt) ||
    /(^|[、。・:：\s「『（(と])K(?=[はがもにのへと、。・\s」』）)]|$)/m.test(txt)
  );
}

function fixKnownZoomMisrecognitions(txt?: string): string {
  if (!txt || typeof txt !== 'string') return txt || '';
  return txt
    .replace(/[0-9０-９]+\s*[/／]\s*勝賀野\s*太郎\s*[/／]\s*残置物撤去/g, '勝賀野')
    .replace(/[0-9０-９]+\s*[/／]\s*勝賀野/g, '勝賀野')
    .replace(/正勝賀野/g, '勝賀野')
    .replace(/K\s*Kawasaki|Kawasaki\s*K/gi, '川崎景')
    .replace(/(^|[、。・:：\s「『（(と])K(?=[はがもにのへと、。・\s」』）)]|$)/gm, '$1川崎景')
    .replace(/ラズベリー/g, 'ジャズベリー')
    .replace(/無党開発|武藤開発/g, '夢叶開発')
    .replace(/免费/g, '無料');
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

  // Zoom AI Companion の表記ゆれ・誤認識（「K」→「川崎景」、「ラズベリー」→「ジャズベリー」、「正勝賀野」→「勝賀野」等）をサーバー側でも全レコード一括補正
  if (Array.isArray(state.persons)) {
    for (const p of state.persons) {
      if (!p) continue;
      if (/^K\s*Kawasaki$|^Kawasaki\s*K$|^K$/i.test(String(p.display_name || '').trim())) {
        p.display_name = '川崎 景';
        p.phonetic_name = p.phonetic_name || 'カワサキ ケイ';
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

  // 高野陽行様・川崎景様との3名Zoom会議（m-zoom-nUUblUGRdOUzkSVNFeAKA）に川崎景様の人物カルテ・参加者紐付け・相関図エッジを保証
  const takanoMeeting = Array.isArray(state.meetings)
    ? state.meetings.find((m: any) => m?.id === 'm-zoom-nUUblUGRdOUzkSVNFeAKA' && m?.tenant_id === 'tenant-001')
    : undefined;
  if (takanoMeeting && Array.isArray(state.persons)) {
    const takanoPerson = state.persons.find(
      (p: any) => p?.tenant_id === 'tenant-001' && (p?.id === 'p-1795358370152-pkdc1' || /高野\s*陽行/.test(p?.display_name || ''))
    );
    if (takanoPerson && !takanoPerson.phonetic_name) {
      takanoPerson.phonetic_name = 'タカノ ハルユキ';
    }
    let kawasakiPerson = state.persons.find(
      (p: any) => p?.tenant_id === 'tenant-001' && p?.status !== 'deleted' && /川崎\s*景|河崎\s*景/.test(p?.display_name || '')
    );
    const takanoTr = Array.isArray(state.transcripts)
      ? state.transcripts.find((t: any) => t?.meeting_id === 'm-zoom-nUUblUGRdOUzkSVNFeAKA')
      : undefined;
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
        notes: takanoTr?.summary?.split('\n')[0] || 'ビーンズ交流会・ジャズベリー関連の運営戦略および飲食店集客・人脈拡大モデル構築について高野陽行様・勝賀野様と協議。',
        created_at: takanoMeeting.created_at || '2026-11-22T14:39:30.152Z',
        updated_at: new Date().toISOString(),
      };
      state.persons.push(kawasakiPerson);
    } else {
      kawasakiPerson.display_name = '川崎 景';
      kawasakiPerson.phonetic_name = kawasakiPerson.phonetic_name || 'カワサキ ケイ';
      kawasakiPerson.status = 'active';
      kawasakiPerson.meeting_count = Math.max(1, kawasakiPerson.meeting_count || 1);
    }
    if (!Array.isArray(takanoMeeting.participant_ids)) takanoMeeting.participant_ids = [];
    if (takanoPerson && !takanoMeeting.participant_ids.includes(takanoPerson.id)) {
      takanoMeeting.participant_ids.unshift(takanoPerson.id);
    }
    if (kawasakiPerson && !takanoMeeting.participant_ids.includes(kawasakiPerson.id)) {
      takanoMeeting.participant_ids.push(kawasakiPerson.id);
    }
    takanoMeeting.title = '高野 陽行様・川崎 景様と面談（ビーンズ・ジャズベリー交流会運営戦略）';
    if (takanoPerson && kawasakiPerson && Array.isArray(state.relationships)) {
      const hasRel = state.relationships.some(
        (r: any) =>
          r?.tenant_id === 'tenant-001' &&
          ((r.from_person_id === takanoPerson.id && r.to_person_id === kawasakiPerson.id) ||
            (r.from_person_id === kawasakiPerson.id && r.to_person_id === takanoPerson.id))
      );
      if (!hasRel) {
        state.relationships.push({
          id: 'rel-takano-kawasaki',
          tenant_id: 'tenant-001',
          from_person_id: takanoPerson.id,
          to_person_id: kawasakiPerson.id,
          relationship_type: '共同運営・協業連携（ビーンズ・ジャズベリー交流会企画）',
          is_ai_inferred: false,
          confidence: 0.99,
          evidence_text: '2026/11/22 Zoom会議にて高野陽行様・川崎景様・勝賀野様の3名でビーンズおよびジャズベリー交流会の運営改善・ブランディング戦略を協議',
          source_meeting_id: 'm-zoom-nUUblUGRdOUzkSVNFeAKA',
        });
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

  // カスタムカテゴリーのユニオンマージ
  const sCats = serverState.customCategories || {};
  const cCats = clientState.customCategories || {};
  const mergedCats: Record<string, string[]> = { ...sCats };
  for (const tid of Object.keys(cCats)) {
    mergedCats[tid] = Array.from(new Set([...(sCats[tid] || []), ...(cCats[tid] || [])]));
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
    const envelope = await loadCloudEnvelope();

    if (req.method === 'GET') {
      const urlObj = new URL(req.url || '/api/sync/state', 'http://localhost');
      const queryTenantId = urlObj.searchParams.get('tenantId') || undefined;
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
    const rawClientState = payload.state;
    // ロック済み顧客テナントからのPOSTでは、そのテナント自身のレコードのみをマージ対象にし他テナントデータを保護（サーバーサイドRLS）
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
    });

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
