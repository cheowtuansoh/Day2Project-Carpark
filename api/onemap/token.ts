import type { Request, Response } from 'express';
import { getOneMapToken } from '../../src/server/onemapService';
import { handleCorsAndPreflight } from '../../src/server/corsHelper';

export default async function handler(req: Request, res: Response) {
  if (handleCorsAndPreflight(req, res)) return;

  try {
    const result = await getOneMapToken();
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
