function requiredPublicUrl(name: string, value: string | undefined): string {
  const normalized = value?.trim().replace(/\/+$/, '');
  if (!normalized) {
    throw new Error(`${name} is required. Set it in frontend .env.local and in Vercel environment variables.`);
  }
  return normalized;
}

export const PUBLIC_API_BASE_URL = requiredPublicUrl(
  'NEXT_PUBLIC_API_URL',
  process.env.NEXT_PUBLIC_API_URL,
);

export const PUBLIC_CHATBOT_BASE_URL = requiredPublicUrl(
  'NEXT_PUBLIC_CHATBOT_URL',
  process.env.NEXT_PUBLIC_CHATBOT_URL,
);

export function publicApiWebSocketUrl(path: string): string {
  const base = new URL(PUBLIC_API_BASE_URL);
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  const target = new URL(path.startsWith('/') ? path : `/${path}`, base.origin);
  base.pathname = target.pathname;
  base.search = target.search;
  base.hash = '';
  return base.toString();
}
