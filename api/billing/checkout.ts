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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  try {
    const raw = typeof req.body === 'string'
      ? req.body
      : (req.body ? JSON.stringify(req.body) : await getRawBody(req));
    const payload = raw ? JSON.parse(raw) : {};

    const planTier: 'standard' | 'premium' = payload.planTier === 'premium' ? 'premium' : 'standard';
    const priceJpy = planTier === 'premium' ? 5980 : 4980;
    const tenantId = String(payload.tenantId || `tenant-${Date.now().toString(36)}`);
    const customerName = String(payload.ownerName || payload.companyName || '新規会員様').trim();
    const customerEmail = String(payload.email || '').trim();
    const origin = String(payload.origin || 'https://ai-network-concierge.vercel.app').replace(/\/$/, '');

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    // Stripe本番・テストシークレットキーが設定されている場合は公式Stripe Checkout Sessionを発行
    if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
      const params = new URLSearchParams();
      params.append('mode', 'subscription');
      params.append('success_url', `${origin}/?tenant=${encodeURIComponent(tenantId)}&checkout=success`);
      params.append('cancel_url', `${origin}/?tenant=${encodeURIComponent(tenantId)}&checkout=cancel`);
      params.append('client_reference_id', tenantId);
      if (customerEmail) {
        params.append('customer_email', customerEmail);
      }
      params.append('line_items[0][price_data][currency]', 'jpy');
      params.append('line_items[0][price_data][unit_amount]', String(priceJpy));
      params.append('line_items[0][price_data][recurring][interval]', 'month');
      params.append(
        'line_items[0][price_data][product_data][name]',
        `AI人脈コンシェルジュ ${planTier === 'premium' ? 'プレミアムプラン' : 'スタンダードプラン'} (${customerName})`
      );
      params.append(
        'line_items[0][price_data][product_data][description]',
        'BNI 1to1・Zoom自動要約・人脈相関図・AI人脈秘書（月間AI原価ガード ¥1,000込）'
      );
      params.append('line_items[0][quantity]', '1');

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (stripeRes.ok) {
        const session: any = await stripeRes.json();
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          status: 'ok',
          mode: 'stripe_checkout',
          checkoutUrl: session.url,
          sessionId: session.id,
          tenantId,
          priceJpy,
        }));
        return;
      }
    }

    // STRIPE_SECRET_KEY未設定時は、即座に専用テナント環境（14日間トライアル・セルフオンボーディング付）を発行してURLを返却
    const onboardingUrl = `${origin}/?tenant=${encodeURIComponent(tenantId)}&onboarding=1`;
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      mode: 'instant_trial',
      checkoutUrl: onboardingUrl,
      tenantId,
      priceJpy,
      message: '専用テナント環境を即時発行しました（STRIPE_SECRET_KEYを環境変数に設定するとStripeカード決済画面へ自動遷移します）',
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Billing checkout error' }));
  }
}
