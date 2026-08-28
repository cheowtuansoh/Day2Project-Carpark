import type { Request, Response } from 'express';
import { getOneMapToken } from '../../src/server/onemapService';
import { handleCorsAndPreflight } from '../../src/server/corsHelper';

export default async function handler(req: Request, res: Response) {
  if (handleCorsAndPreflight(req, res)) return;

  try {
    const { searchVal, pageNum = '1' } = req.query;
    if (!searchVal || typeof searchVal !== 'string') {
      return res.status(400).json({ error: 'searchVal query parameter is required' });
    }

    const tokenResult = await getOneMapToken();
    const token = tokenResult.token;

    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
      searchVal
    )}&returnGeom=Y&getAddrDetails=Y&pageNum=${pageNum}`;

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
