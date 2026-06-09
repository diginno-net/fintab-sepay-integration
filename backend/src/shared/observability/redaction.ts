const SECRET_QUERY_KEYS = new Set(['api_key', 'client_secret', 'access_token', 'token']);

export function redactUrl(input: string): string {
  try {
    const url = new URL(input, 'http://redaction.local');
    for (const key of SECRET_QUERY_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, '[REDACTED]');
      }
    }
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return url.toString();
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return input.replace(/(api_key|client_secret|access_token|token)=([^&\s]+)/gi, '$1=[REDACTED]');
  }
}

export const loggerRedactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.api_key',
  '*.client_secret',
  '*.access_token',
  '*.password'
];
