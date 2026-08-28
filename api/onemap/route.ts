import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOneMapToken } from '../../src/server/onemapService';
import { handleCorsAndPreflight } from '../../src/server/corsHelper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCorsAndPreflight(req, res)) return;

  try {
    const { start, end, routeType = 'drive' } = req.query;
    if (!start || !end || typeof start !== 'string' || typeof end !== 'string') {
      return res.status(400).json({ error: 'start and end lat,lng coordinates required' });
    }

    const tokenResult = await getOneMapToken();
    const token = tokenResult.token;

    const url = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}&routeType=${encodeURIComponent(routeType as string)}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
