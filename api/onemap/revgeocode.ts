import type { Request, Response } from 'express';
import { getOneMapToken } from '../../src/server/onemapService';
import { handleCorsAndPreflight } from '../../src/server/corsHelper';

export default async function handler(req: Request, res: Response) {
  if (handleCorsAndPreflight(req, res)) return;

  try {
    const { location } = req.query;
    if (!location || typeof location !== 'string') {
      return res.status(400).json({ error: 'location query parameter (lat,lng) is required' });
    }

    const tokenResult = await getOneMapToken();
    const token = tokenResult.token;

    const url = `https://www.onemap.gov.sg/api/public/revgeocodex?location=${encodeURIComponent(
      location
    )}`;

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
