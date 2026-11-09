import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

// Zoom Webhook Secret Token (小文字lと大文字Iの両方に対応)
const PRIMARY_SECRET_TOKEN = '9D2MsR03RK6Srow8lUSAYw';
const ZOOM_WEBHOOK_SECRET_TOKEN =
  process.env.ZOOM_WEBHOOK_SECRET_TOKEN || PRIMARY_SECRET_TOKEN;

// インメモリ一時キュー（フロントエンドが取得するためのバッファ）
declare global {
  // eslint-disable-next-line no-var
  var __ZOOM_WEBHOOK_INBOX__: any[] | undefined;
}

if (!global.__ZOOM_WEBHOOK_INBOX__) {
  global.__ZOOM_WEBHOOK_INBOX__ = [];
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
  // CORS ヘッダー
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, authorization, x-zm-request-timestamp, x-zm-signature');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // GET の場合は直近の受信キューを返す（フロントエンドによる同期用）
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      inbox: global.__ZOOM_WEBHOOK_INBOX__ || [],
      count: (global.__ZOOM_WEBHOOK_INBOX__ || []).length,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : (req.body ? JSON.stringify(req.body) : await getRawBody(req));
    const payload = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(rawBody || '{}');

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
        encryptedToken: hashForValidate
      }));
      return;
    }

    // 2. Zoom イベント受信 (recording.completed / meeting.summary_completed 等)
    const eventType = payload.event;
    const eventObject = payload.payload?.object || {};

    const receivedItem = {
      id: `zoom-event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      received_at: new Date().toISOString(),
      event: eventType,
      meeting_id: eventObject.id || eventObject.meeting_id,
      topic: eventObject.topic || eventObject.meeting_topic || 'ZENNOBATE Meeting Room',
      start_time: eventObject.start_time || new Date().toISOString(),
      duration: eventObject.duration || 0,
      share_url: eventObject.share_url,
      summary_title: eventObject.summary_title,
      summary_overview: eventObject.summary_overview,
      summary_details: eventObject.summary_details,
      next_steps: eventObject.next_steps,
      raw_payload: payload,
    };

    // キューの先頭に追加（最大50件保持）
    global.__ZOOM_WEBHOOK_INBOX__ = [receivedItem, ...(global.__ZOOM_WEBHOOK_INBOX__ || [])].slice(0, 50);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'success',
      message: 'Zoom event processed and queued',
      receivedItem
    }));
  } catch (err: any) {
    console.error('Error processing Zoom webhook:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
}
