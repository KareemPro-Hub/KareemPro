const source = 'https://www.exchangerate-api.com';
let request;

export function toEGP(amount, rate) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 ||
      typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) throw new Error('Invalid amount or rate');
  return Math.round((amount * rate + Number.EPSILON) * 100) / 100;
}

export function parseRate(data, now = Date.now()) {
  const rate = data?.rates?.EGP;
  const updatedAt = data?.time_last_update_unix * 1000;
  if (data?.result !== 'success' || data?.base_code !== 'SAR' ||
      typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 ||
      !Number.isFinite(updatedAt) || updatedAt > now + 300000 || now - updatedAt > 172800000) {
    throw new Error('Invalid or outdated exchange rate');
  }
  return { rate, updatedAt, source };
}

export function getRate() {
  if (!request) request = fetch('/api/exchange-rate', { signal: AbortSignal.timeout(10000) }).then(async response => {
    if (!response.ok) throw new Error('Exchange rate unavailable');
    const data = await response.json();
    if (typeof data.rate !== 'number' || !Number.isFinite(data.rate) || data.rate <= 0 ||
        !Number.isFinite(data.updatedAt) || Date.now() - data.updatedAt > 172800000 ||
        data.updatedAt > Date.now() + 300000) throw new Error('Exchange rate unavailable');
    return data;
  }).catch(error => { request = undefined; throw error; });
  return request;
}

export function egpText(amount, rate) {
  return toEGP(amount, rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function rateDate(updatedAt) {
  return new Intl.DateTimeFormat('ar-EG', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'long', year: 'numeric' }).format(updatedAt);
}
