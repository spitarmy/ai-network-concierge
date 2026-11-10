import type { IncomingMessage } from 'http';
import fs from 'fs';

const TMP_INBOX_PATH = '/tmp/ai_concierge_zoom_inbox.json';
const TMP_CACHE_PATH = '/tmp/ai_concierge_zoom_sessions_cache.json';

declare global {
  // eslint-disable-next-line no-var
  var __ZOOM_WEBHOOK_INBOX__: any[] | undefined;
  // eslint-disable-next-line no-var
  var __ZOOM_SESSIONS_CACHE__: Record<string, any> | undefined;
  // eslint-disable-next-line no-var
  var __ZOOM_OAUTH_TOKEN__: { token: string; expiresAt: number } | undefined;
}

function healZoomCredentials(creds: { accountId?: string; clientId?: string; clientSecret?: string }) {
  const clean = (v?: string) => (v && !v.startsWith('***') ? v.trim() : '');
  // サーバーのSecret Manager環境変数を最優先し、未設定時のみクライアント入力値を使用
  const accountId = (process.env.ZOOM_ACCOUNT_ID || '').trim() || clean(creds.accountId);
  const clientId = (process.env.ZOOM_CLIENT_ID || '').trim() || clean(creds.clientId);
  const clientSecret = (process.env.ZOOM_CLIENT_SECRET || '').trim() || clean(creds.clientSecret);

  return { accountId, clientId, clientSecret };
}

function loadSessionCache(): Record<string, any> {
  if (global.__ZOOM_SESSIONS_CACHE__) return global.__ZOOM_SESSIONS_CACHE__;
  try {
    if (fs.existsSync(TMP_CACHE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(TMP_CACHE_PATH, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        global.__ZOOM_SESSIONS_CACHE__ = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  global.__ZOOM_SESSIONS_CACHE__ = {};
  return global.__ZOOM_SESSIONS_CACHE__;
}

function saveSessionCache(cache: Record<string, any>): void {
  global.__ZOOM_SESSIONS_CACHE__ = cache;
  try {
    fs.writeFileSync(TMP_CACHE_PATH, JSON.stringify(cache), 'utf8');
  } catch {
    // ignore
  }
}

function loadWebhookInbox(): any[] {
  if (global.__ZOOM_WEBHOOK_INBOX__ && global.__ZOOM_WEBHOOK_INBOX__.length > 0) {
    return global.__ZOOM_WEBHOOK_INBOX__;
  }
  try {
    if (fs.existsSync(TMP_INBOX_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(TMP_INBOX_PATH, 'utf8'));
      if (Array.isArray(parsed)) {
        global.__ZOOM_WEBHOOK_INBOX__ = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function parseVttToTranscript(vttText: string): {
  transcriptText: string;
  speakers: string[];
  utterances: { speaker: string; start_seconds: number; end_seconds: number; text: string }[];
} {
  const lines = vttText.replace(/\r\n/g, '\n').split('\n');
  const utterances: { speaker: string; start_seconds: number; end_seconds: number; text: string }[] = [];
  const speakerSet = new Set<string>();

  const toSec = (ts: string): number => {
    const parts = ts.trim().split(':');
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
    }
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
    }
    return 0;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const timeMatch = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})/);
    if (timeMatch) {
      const startSec = Math.round(toSec(timeMatch[1]));
      const endSec = Math.round(toSec(timeMatch[2]));
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim());
        i++;
      }
      const combined = textLines.join(' ');
      const spMatch = combined.match(/^([^:：]{1,40})[:：]\s*(.+)$/);
      const speaker = spMatch ? spMatch[1].trim() : '参加者';
      const text = spMatch ? spMatch[2].trim() : combined;
      if (spMatch) speakerSet.add(speaker);
      if (text) {
        utterances.push({ speaker, start_seconds: startSec, end_seconds: endSec, text });
      }
    } else {
      i++;
    }
  }

  return {
    transcriptText: utterances.map(u => `${u.speaker}: ${u.text}`).join('\n'),
    speakers: Array.from(speakerSet),
    utterances,
  };
}

function extractAttendeesFromSummaryContent(summaryContent?: string): string[] {
  if (!summaryContent) return [];
  const match = summaryContent.match(/\*\*Attendees:\*\*\s*([^\n]+)/i);
  if (!match) return [];
  return match[1]
    .split(',')
    .map(s => s.replace(/\(.*?\)/g, '').trim())
    .filter(Boolean);
}

async function getAccessToken(accountId: string, clientId: string, clientSecret: string): Promise<string | null> {
  if (!accountId || !clientId || !clientSecret) return null;
  if (global.__ZOOM_OAUTH_TOKEN__ && global.__ZOOM_OAUTH_TOKEN__.expiresAt > Date.now() + 60000) {
    return global.__ZOOM_OAUTH_TOKEN__.token;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}` },
    }
  );
  if (!res.ok) return null;
  const data: any = await res.json();
  if (!data.access_token) return null;

  global.__ZOOM_OAUTH_TOKEN__ = {
    token: data.access_token,
    expiresAt: Date.now() + ((data.expires_in || 3500) - 120) * 1000,
  };
  return data.access_token;
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    let bodyCreds: any = {};
    if (req.method === 'POST') {
      const raw = typeof req.body === 'string'
        ? req.body
        : (req.body ? JSON.stringify(req.body) : await getRawBody(req));
      if (raw) {
        try {
          bodyCreds = JSON.parse(raw);
        } catch {
          bodyCreds = {};
        }
      }
    }

    const { accountId, clientId, clientSecret } = healZoomCredentials({
      accountId: bodyCreds.account_id,
      clientId: bodyCreds.client_id,
      clientSecret: bodyCreds.client_secret,
    });

    const sessionMap = new Map<string, any>();
    const cache = loadSessionCache();

    // 1. まずリアルタイムWebhook受信箱を統合（会議終了40秒後に届くAI要約も即反映）
    const inbox = loadWebhookInbox();
    for (const item of inbox) {
      const uuid = item.uuid || item.raw_payload?.payload?.object?.uuid || item.raw_payload?.payload?.object?.meeting_uuid;
      if (!uuid) continue;
      const prev = sessionMap.get(uuid) || {};
      const obj = item.raw_payload?.payload?.object || {};
      const summaryContent = item.summary_content || obj.summary_content;
      const attendees = Array.from(new Set([
        ...(prev.attendees || []),
        ...(item.attendees || []),
        ...extractAttendeesFromSummaryContent(summaryContent),
      ]));

      sessionMap.set(uuid, {
        uuid,
        meeting_id: String(item.meeting_id || obj.id || obj.meeting_id || prev.meeting_id || ''),
        topic: item.topic || obj.topic || obj.meeting_topic || prev.topic || 'Zoom面談',
        start_time: obj.start_time || obj.meeting_start_time || item.start_time || prev.start_time,
        end_time: obj.end_time || obj.meeting_end_time || item.end_time || prev.end_time,
        duration: item.duration || obj.duration || prev.duration || 0,
        share_url: item.share_url || obj.share_url || prev.share_url || '',
        summary_overview: item.summary_overview || obj.summary_overview || prev.summary_overview || '',
        summary_details: item.summary_details || obj.summary_details || prev.summary_details || [],
        next_steps: item.next_steps || obj.next_steps || prev.next_steps || [],
        attendees,
        transcript_text: item.transcript_text || prev.transcript_text || '',
        utterances: (item.utterances && item.utterances.length > 0) ? item.utterances : (prev.utterances || []),
      });
    }

    // 2. Zoom公式 Cloud Recording & AI Summary & Meetings API から直接取得（コールドスタート後も永久不滅）
    let apiConnected = false;
    const scheduledMeetings: any[] = [];
    const accessToken = await getAccessToken(accountId, clientId, clientSecret);

    if (accessToken) {
      apiConnected = true;
      const now = new Date();
      const fromDate = new Date(now.getTime() - 30 * 86400 * 1000).toISOString().split('T')[0];
      const toDate = new Date(now.getTime() + 2 * 86400 * 1000).toISOString().split('T')[0];

      const [recRes, schedRes] = await Promise.all([
        fetch(`https://api.zoom.us/v2/users/me/recordings?from=${fromDate}&to=${toDate}&page_size=30`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => null),
        fetch('https://api.zoom.us/v2/users/me/meetings?type=upcoming&page_size=30', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => null),
      ]);

      if (schedRes && schedRes.ok) {
        const schedData: any = await schedRes.json();
        for (const m of schedData.meetings || []) {
          // 固定パーソナルルーム(type=3)以外の予約日時付き会議を取得
          if (m.start_time && m.type !== 3) {
            scheduledMeetings.push({
              zoom_meeting_id: String(m.id),
              uuid: m.uuid,
              topic: m.topic,
              start_time: m.start_time,
              duration: m.duration || 60,
              join_url: m.join_url,
            });
          }
        }
      }

      if (recRes && recRes.ok) {
        const recData: any = await recRes.json();
        let cacheUpdated = false;

        for (const m of recData.meetings || []) {
          const uuid: string = m.uuid;
          if (!uuid) continue;

          const cached = cache[uuid];
          let summaryOverview = cached?.summary_overview || '';
          let summaryDetails = cached?.summary_details || [];
          let nextSteps = cached?.next_steps || [];
          let summaryAttendees: string[] = cached?.attendees || [];
          let transcriptText = cached?.transcript_text || '';
          let utterances = cached?.utterances || [];

          const doubleEncodedUuid = encodeURIComponent(encodeURIComponent(uuid));

          // AI Companion Summary が未取得なら取得
          if (!summaryOverview) {
            try {
              const sumRes = await fetch(
                `https://api.zoom.us/v2/meetings/${doubleEncodedUuid}/meeting_summary`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              if (sumRes.ok) {
                const sumJson: any = await sumRes.json();
                summaryOverview = sumJson.summary_overview || '';
                summaryDetails = sumJson.summary_details || [];
                nextSteps = sumJson.next_steps || [];
                summaryAttendees = extractAttendeesFromSummaryContent(sumJson.summary_content);
                cacheUpdated = true;
              }
            } catch {
              // summary might not exist for older/non-AI meetings
            }
          }

          // VTT 文字起こしが未取得なら取得
          if (!transcriptText) {
            const vttFile = (m.recording_files || []).find(
              (f: any) => f.file_type === 'TRANSCRIPT' || f.file_extension === 'VTT' || f.recording_type === 'audio_transcript'
            );
            if (vttFile?.download_url) {
              try {
                const sep = vttFile.download_url.includes('?') ? '&' : '?';
                const vttRes = await fetch(`${vttFile.download_url}${sep}access_token=${encodeURIComponent(accessToken)}`);
                if (vttRes.ok) {
                  const rawVtt = await vttRes.text();
                  if (rawVtt.includes('-->')) {
                    const parsed = parseVttToTranscript(rawVtt);
                    transcriptText = parsed.transcriptText;
                    utterances = parsed.utterances;
                    summaryAttendees = Array.from(new Set([...summaryAttendees, ...parsed.speakers]));
                    cacheUpdated = true;
                  }
                }
              } catch {
                // ignore vtt download error
              }
            }
          }

          const prev = sessionMap.get(uuid) || {};
          const mergedSession = {
            uuid,
            meeting_id: String(m.id || prev.meeting_id || ''),
            topic: m.topic || prev.topic || 'Zoom面談',
            start_time: m.start_time || prev.start_time,
            end_time: prev.end_time || '',
            duration: m.duration || prev.duration || 0,
            share_url: m.share_url || prev.share_url || '',
            summary_overview: summaryOverview || prev.summary_overview || '',
            summary_details: summaryDetails.length > 0 ? summaryDetails : (prev.summary_details || []),
            next_steps: nextSteps.length > 0 ? nextSteps : (prev.next_steps || []),
            attendees: Array.from(new Set([...(prev.attendees || []), ...summaryAttendees])),
            transcript_text: transcriptText || prev.transcript_text || '',
            utterances: utterances.length > 0 ? utterances : (prev.utterances || []),
          };

          sessionMap.set(uuid, mergedSession);

          if (cacheUpdated || !cached) {
            cache[uuid] = mergedSession;
            cacheUpdated = true;
          }
        }

        if (cacheUpdated) {
          saveSessionCache(cache);
        }
      }
    }

    const sessions = Array.from(sessionMap.values()).sort(
      (a, b) => new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime()
    );

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      api_connected: apiConnected,
      sessions,
      scheduled_meetings: scheduledMeetings,
      count: sessions.length,
      timestamp: new Date().toISOString(),
    }));
  } catch (err: any) {
    console.error('Error in /api/zoom/sync:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
}
