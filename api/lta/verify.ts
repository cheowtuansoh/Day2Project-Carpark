import type { Request, Response } from 'express';
import { extractLTAApiKey, maskApiKey, verifyLTAAccountKey } from '../../src/server/ltaService';
import { handleCorsAndPreflight, parseRequestBody } from '../../src/server/corsHelper';

export default async function handler(req: Request, res: Response) {
  if (handleCorsAndPreflight(req, res)) return;

  try {
    const body = parseRequestBody(req);
    const candidateKey =
      body?.apiKey ||
      req.query?.apiKey ||
      req.query?.key ||
      extractLTAApiKey(req).key;

    if (!candidateKey || typeof candidateKey !== 'string' || candidateKey.trim().length === 0) {
      return res.status(200).json({
        success: false,
        valid: false,
        statusCode: 400,
        message: 'No AccountKey provided or detected in environment/request.',
        keySource: 'none',
        maskedKey: null,
      });
    }

    const testResult = await verifyLTAAccountKey(candidateKey);
    return res.status(testResult.valid ? 200 : 400).json({
      success: testResult.valid,
      service: 'LTA DataMall Key Verification Endpoint',
      maskedKey: maskApiKey(candidateKey),
      ...testResult,
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      valid: false,
      statusCode: 500,
      message: `Verification network error: ${err.message}`,
    });
  }
}
