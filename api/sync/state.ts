import type { IncomingMessage } from 'http';
import fs from 'fs';

const TMP_STATE_PATH = '/tmp/ai_concierge_cloud_state.json';
const KV_KEY = 'ai_network_concierge:cloud_state:v1';

const SAMPLE_IDS = new Set([
  'p-yamada', 'p-tanaka', 'p-sato', 'p-nakamura-prov', 'p-tenant2-secret',
  'm-yamada-upcoming', 'm-yamada-past1', 'm-yamada-past2', 'm-zoom-89527504054',
  'cs-yamada', 'rq-1', 'ref-1',
]);

declare global {
  // eslint-disable-next-line no-var
  var __AI_CONCIERGE_CLOUD_STATE__: { state: any; deletedIds: string[]; updatedAt: string } | undefined;
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
  await writeToKV(envelope);
}

function getItemTime(item: any): number {
  const ts = item?.updated_at || item?.last_interacted_at || item?.recorded_at || item?.created_at;
  if (!ts) return 0;
  const t = new Date(ts).getTime();
  return isNaN(t) ? 0 : t;
}

function mergeArrayById(serverArr: any[] = [], clientArr: any[] = [], deletedSet: Set<string>): any[] {
  const map = new Map<string, any>();

  const upsert = (item: any) => {
    if (!item || !item.id) return;
    if (deletedSet.has(item.id) || SAMPLE_IDS.has(item.id)) return;
    if (item.person_id === 'p-zoom-participant') return;

    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }

    // 完了済み面談や本登録(active)ステータスは後退させない
    const itemTime = getItemTime(item);
    const existingTime = getItemTime(existing);
    const preferItem =
      (item.status === 'completed' && existing.status !== 'completed') ||
      (item.recording_status === 'completed' && existing.recording_status !== 'completed') ||
      (item.status === 'active' && existing.status === 'provisional') ||
      (item.is_name_verified && !existing.is_name_verified) ||
      itemTime >= existingTime;

    if (preferItem) {
      map.set(item.id, {
        ...existing,
        ...item,
        // 画像URLが片方で退避されていた場合は残っている方を保持
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

function mergeStates(serverState: any | null, clientState: any, deletedSet: Set<string>): any {
  if (!serverState) return clientState;
  if (!clientState) return serverState;

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
    currentTenantId: clientState.currentTenantId || serverState.currentTenantId || 'tenant-001',
  };

  for (const key of collections) {
    if (Array.isArray(serverState[key]) || Array.isArray(clientState[key])) {
      merged[key] = mergeArrayById(serverState[key] || [], clientState[key] || [], deletedSet);
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

  return merged;
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
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'ok',
        hasState: !!envelope.state,
        state: envelope.state,
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
    const clientState = payload.state;
    const clientDeletedIds: string[] = Array.isArray(payload.deletedIds) ? payload.deletedIds : [];

    const mergedDeletedSet = new Set<string>([
      ...(envelope.deletedIds || []),
      ...clientDeletedIds,
    ]);
    const mergedDeletedIds = Array.from(mergedDeletedSet).slice(-500);

    const mergedState = clientState
      ? mergeStates(envelope.state, clientState, mergedDeletedSet)
      : envelope.state;

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
      state: mergedState,
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
