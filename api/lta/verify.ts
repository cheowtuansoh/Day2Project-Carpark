import type { Request, Response } from 'express';
import { extractLTAApiKey, maskApiKey } from '../../src/server/ltaService';
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

    const sanitizedKey = candidateKey.trim().replace(/^['"]|['"]$/g, '');
    const testUrl = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2?$skip=0';

    const resp = await fetch(testUrl, {
      method: 'GET',
      headers: {
        AccountKey: sanitizedKey,
        accept: 'application/json',
      },
    });

    const masked = maskApiKey(sanitizedKey);

    if (resp.status === 200) {
      const data = await resp.json();
      const count = data?.value?.length || 0;
      return res.status(200).json({
        success: true,
        valid: true,
        statusCode: 200,
        message: `AccountKey is valid! Successfully connected to LTA DataMall (retrieved ${count} carparks sample).`,
        count,
        maskedKey: masked,
        sample: data?.value?.[0] || null,
      });
    }

    if (resp.status === 401 || resp.status === 403) {
      return res.status(200).json({
        success: false,
        valid: false,
        statusCode: resp.status,
        message: `LTA DataMall rejected the AccountKey with HTTP ${resp.status} (Unauthorized/Forbidden). Please verify your AccountKey at https://datamall.lta.gov.sg`,
        maskedKey: masked,
      });
    }

    return res.status(200).json({
      success: false,
      valid: false,
      statusCode: resp.status,
      message: `LTA DataMall returned HTTP ${resp.status}: ${resp.statusText || 'Unexpected response'}`,
      maskedKey: masked,
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
