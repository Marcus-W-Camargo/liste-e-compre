export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (process.env.VERCEL_ENV !== 'preview') {
    res.statusCode = 404;
    res.end(JSON.stringify({ ok: false }));
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: 'RESEND_API_KEY ausente' }));
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Liste & Compre <onboarding@resend.dev>',
      to: ['listeecompre@gmail.com'],
      subject: '[Liste & Compre] Teste de integração Resend + Vercel',
      text: 'Este é o primeiro teste de envio do formulário de feedback do Liste & Compre. Se esta mensagem chegou, a integração Resend + Vercel está funcionando corretamente.',
    }),
  });

  const data = await response.json().catch(() => ({}));
  res.statusCode = response.ok ? 200 : 502;
  res.end(JSON.stringify({ ok: response.ok, status: response.status, data }));
}
