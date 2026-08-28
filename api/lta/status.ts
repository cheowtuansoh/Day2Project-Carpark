import type { Request, Response } from 'express';
import { extractLTAApiKey, maskApiKey } from '../../src/server/ltaService';
import { handleCorsAndPreflight } from '../../src/server/corsHelper';

export default async function handler(req: Request, res: Response) {
  if (handleCorsAndPreflight(req, res)) return;

  const { key, source } = extractLTAApiKey(req);
  res.status(200).json({
    service: 'LTA DataMall Status Connector',
    endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
    isApiKeyConfigured: Boolean(key),
    keySource: source,
    maskedKey: maskApiKey(key),
    supportedAgencies: ['LTA', 'HDB', 'URA', 'Key Partner Malls'],
    environmentVariableNames: [
      'LTA_DATAMALL_API_KEY',
      'LTA_API_KEY',
      'DATAMALL_API_KEY',
      'LTA_ACCOUNT_KEY',
      'ACCOUNT_KEY',
    ],
  });
}
