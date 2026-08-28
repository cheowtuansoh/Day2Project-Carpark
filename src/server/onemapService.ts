import dotenv from 'dotenv';
dotenv.config();

export interface OneMapTokenCache {
  token: string;
  expiresAt: number; // Unix timestamp in ms
}

let oneMapTokenCache: OneMapTokenCache | null = null;

/**
 * Mint or retrieve active OneMap Singapore token
 */
export async function getOneMapToken(overrideCredentials?: {
  email?: string;
  password?: string;
}): Promise<{ token: string | null; source: string; error?: string }> {
  // 1. Check direct token in env
  const staticToken = process.env.ONEMAP_TOKEN || process.env.ONEMAP_API_KEY;
  if (staticToken && staticToken.trim() !== '') {
    return { token: staticToken.trim(), source: 'env_token' };
  }

  // 2. Check in-memory cached token
  const now = Date.now();
  if (oneMapTokenCache && oneMapTokenCache.expiresAt > now + 2 * 60 * 60 * 1000) {
    return { token: oneMapTokenCache.token, source: 'cached_token' };
  }

  // 3. Mint new token via OneMap auth endpoint
  const email = overrideCredentials?.email || process.env.ONEMAP_EMAIL || '';
  const password = overrideCredentials?.password || process.env.ONEMAP_PASSWORD || '';

  if (!email || !password) {
    return {
      token: null,
      source: 'none',
      error: 'ONEMAP_EMAIL and ONEMAP_PASSWORD are not configured.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OneMap Token Minting returned HTTP ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as { access_token?: string; expiry_timestamp?: string };
    if (!data.access_token) {
      throw new Error('OneMap Token Mint response missing access_token');
    }

    const expiresAt = data.expiry_timestamp
      ? new Date(data.expiry_timestamp).getTime()
      : now + 3 * 24 * 60 * 60 * 1000;

    oneMapTokenCache = {
      token: data.access_token,
      expiresAt,
    };

    return { token: data.access_token, source: 'minted_live' };
  } catch (err: any) {
    return { token: null, source: 'failed', error: err.message };
  }
}
