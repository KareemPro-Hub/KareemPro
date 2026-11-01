// Login destinations must remain paths on this site, including on the client.
export function safeAuthNext(value, fallback = '/portal') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return fallback;
  try {
    const path = decodeURIComponent(value.split(/[?#]/)[0]);
    if (path.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(path)) return fallback;
    const url = new URL(value, 'https://kareempro.com');
    return url.origin === 'https://kareempro.com' ? value : fallback;
  } catch {
    return fallback;
  }
}
