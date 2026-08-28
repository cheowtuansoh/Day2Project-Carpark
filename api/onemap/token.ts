import type { Request, Response } from 'express';
import { getOneMapToken } from '../../src/server/onemapService';
import { handleCorsAndPreflight, parseRequestBody } from '../../src/server/corsHelper';

export default async function handler(req: Request, res: Response) {
  if (handleCorsAndPreflight(req, res)) return;

  try {
    const body = parseRequestBody(req);
    const { email, password } = body || {};

    if (req.method === 'POST') {
      const result = await getOneMapToken(email && password ? { email, password } : undefined);
      if (!result.token) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to mint OneMap token',
          notice: 'Provide {"email": "...", "password": "..."} or configure ONEMAP_EMAIL & ONEMAP_PASSWORD.',
        });
      }

      return res.status(200).json({
        success: true,
        service: 'OneMap GovTech API Authentication',
        endpoint: 'https://www.onemap.gov.sg/api/auth/post/getToken',
        tokenSource: result.source,
        message: 'OneMap API token active (valid for ~3 days / 72 hours)',
        token: result.token,
      });
    }

    const tokenResult = await getOneMapToken();
    res.status(200).json({
      service: 'OneMap Singapore Authentication Status',
      hasActiveToken: Boolean(tokenResult.token),
      source: tokenResult.source,
      isEmailConfigured: Boolean(process.env.ONEMAP_EMAIL),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
