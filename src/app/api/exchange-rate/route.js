import { parseRate } from '../../../../public/currency.js';

export async function GET() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/SAR', {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error('Provider unavailable');
    const rate = parseRate(await response.json());
    return Response.json(rate, { headers: { 'Cache-Control': 'public, s-maxage=3600' } });
  } catch {
    return Response.json({ error: 'تعذر تحديث سعر التحويل. يرجى المحاولة لاحقًا.' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }
}
