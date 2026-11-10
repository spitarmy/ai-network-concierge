import type { IncomingMessage } from 'http';
import crypto from 'crypto';
import fs from 'fs';

const ZOOM_WEBHOOK_SECRET_TOKEN =
  process.env.ZOOM_WEBHOOK_SECRET_TOKEN || '';

const TMP_INBOX_PATH = '/tmp/ai_concierge_zoom_inbox.json';

declare global {
  // eslint-disable-next-line no-var
  var __ZOOM_WEBHOOK_INBOX__: any[] | undefined;
}

function loadInbox(): any[] {
  if (global.__ZOOM_WEBHOOK_INBOX__ && global.__ZOOM_WEBHOOK_INBOX__.length > 0) {
    return global.__ZOOM_WEBHOOK_INBOX__;
  }
  try {
    if (fs.existsSync(TMP_INBOX_PATH)) {
      const raw = fs.readFileSync(TMP_INBOX_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        global.__ZOOM_WEBHOOK_INBOX__ = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore /tmp read error
  }
  global.__ZOOM_WEBHOOK_INBOX__ = [];
  return global.__ZOOM_WEBHOOK_INBOX__;
}

function saveInbox(items: any[]): void {
  const trimmed = items.slice(0, 50);
  global.__ZOOM_WEBHOOK_INBOX__ = trimmed;
  try {
    fs.writeFileSync(TMP_INBOX_PATH, JSON.stringify(trimmed), 'utf8');
  } catch {
    // ignore /tmp write error
  }
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

  const transcriptText = utterances.map(u => `${u.speaker}: ${u.text}`).join('\n');
  return {
    transcriptText,
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, authorization, x-zm-request-timestamp, x-zm-signature');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const inbox = loadInbox();

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      inbox,
      count: inbox.length,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  try {
    const rawBody = typeof req.body === 'string'
      ? req.body
      : (req.body ? JSON.stringify(req.body) : await getRawBody(req));
    const payload = typeof req.body === 'object' && req.body !== null
      ? req.body
      : JSON.parse(rawBody || '{}');

    // 1. Zoom CRC チャレンジ (URL Validation)
    if (payload.event === 'endpoint.url_validation') {
      const plainToken = payload.payload?.plainToken;
      if (!plainToken) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing plainToken' }));
        return;
      }

      const hashForValidate = crypto
        .createHmac('sha256', ZOOM_WEBHOOK_SECRET_TOKEN)
        .update(plainToken)
        .digest('hex');

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({
        plainToken,
        encryptedToken: hashForValidate,
      }));
      return;
    }

    // 2. Zoom イベント受信 & 同一セッションUUIDへの統合
    const eventType = payload.event;
    const eventObject = payload.payload?.object || {};
    const downloadToken: string | undefined = payload.download_token;

    const sessionUuid: string =
      eventObject.uuid ||
      eventObject.meeting_uuid ||
      `${eventObject.id || eventObject.meeting_id || 'zoom'}-${eventObject.start_time || eventObject.meeting_start_time || Date.now()}`;

    const meetingId = String(eventObject.id || eventObject.meeting_id || '');
    const topic = eventObject.topic || eventObject.meeting_topic || 'ZENNOBATE Meeting Room';
    const startTime = eventObject.start_time || eventObject.meeting_start_time || new Date().toISOString();
    const endTime = eventObject.end_time || eventObject.meeting_end_time;
    const duration = eventObject.duration || 0;

    // VTT文字起こしファイルが含まれている場合はその場でダウンロード＆解析
    let transcriptText = '';
    let vttSpeakers: string[] = [];
    let utterances: { speaker: string; start_seconds: number; end_seconds: number; text: string }[] = [];

    const recFiles: any[] = Array.isArray(eventObject.recording_files) ? eventObject.recording_files : [];
    const vttFile = recFiles.find(
      f => f.file_type === 'TRANSCRIPT' || f.file_extension === 'VTT' || f.recording_type === 'audio_transcript'
    );

    if (vttFile?.download_url && downloadToken) {
      try {
        const sep = vttFile.download_url.includes('?') ? '&' : '?';
        const vttRes = await fetch(`${vttFile.download_url}${sep}access_token=${encodeURIComponent(downloadToken)}`);
        if (vttRes.ok) {
          const rawVtt = await vttRes.text();
          if (rawVtt.includes('-->')) {
            const parsed = parseVttToTranscript(rawVtt);
            transcriptText = parsed.transcriptText;
            vttSpeakers = parsed.speakers;
            utterances = parsed.utterances;
          }
        }
      } catch (dlErr) {
        console.warn('VTT download warning in webhook:', dlErr);
      }
    }

    const summaryAttendees = extractAttendeesFromSummaryContent(eventObject.summary_content);
    const mergedSpeakers = Array.from(new Set([...summaryAttendees, ...vttSpeakers]));

    // 同一 sessionUuid の既存アイテムがあればマージ（meeting.ended の後に summary_completed / transcript_completed が届くため）
    const existingIdx = inbox.findIndex(it => it.uuid === sessionUuid);
    const prev = existingIdx >= 0 ? inbox[existingIdx] : {};

    const updatedItem = {
      id: prev.id || `zoom-session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      uuid: sessionUuid,
      received_at: new Date().toISOString(),
      event: eventType,
      events_received: Array.from(new Set([...(prev.events_received || []), eventType])),
      meeting_id: meetingId || prev.meeting_id,
      topic: topic || prev.topic,
      start_time: prev.start_time || startTime,
      end_time: endTime || prev.end_time,
      duration: duration || prev.duration || 0,
      share_url: eventObject.share_url || prev.share_url,
      summary_title: eventObject.summary_title || prev.summary_title,
      summary_overview: eventObject.summary_overview || prev.summary_overview,
      summary_details: eventObject.summary_details || prev.summary_details,
      summary_content: eventObject.summary_content || prev.summary_content,
      next_steps: eventObject.next_steps || prev.next_steps,
      attendees: Array.from(new Set([...(prev.attendees || []), ...mergedSpeakers])),
      transcript_text: transcriptText || prev.transcript_text || '',
      utterances: utterances.length > 0 ? utterances : (prev.utterances || []),
    };

    const nextInbox = existingIdx >= 0
      ? [updatedItem, ...inbox.filter((_, idx) => idx !== existingIdx)]
      : [updatedItem, ...inbox];

    saveInbox(nextInbox);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'success',
      message: 'Zoom event processed and merged by session UUID',
      uuid: sessionUuid,
      has_summary: !!updatedItem.summary_overview,
      has_transcript: !!updatedItem.transcript_text,
    }));
  } catch (err: any) {
    console.error('Error processing Zoom webhook:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
}
