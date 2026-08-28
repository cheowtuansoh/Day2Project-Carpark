import type { Request, Response } from 'express';
import { fetchLTADataMallCarparks } from '../../src/server/ltaService';
import { handleCorsAndPreflight } from '../../src/server/corsHelper';

export default async function handler(req: Request, res: Response) {
  if (handleCorsAndPreflight(req, res)) return;

  try {
    const result = await fetchLTADataMallCarparks(req);
    res.status(200).json({
      success: true,
      service: 'LTA DataMall CarParkAvailabilityv2 Serverless Endpoint',
      endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
      isLive: result.isLive,
      count: result.carparks.length,
      ltaRecordsFetched: result.count,
      apiKeySource: result.apiKeySource,
      maskedKey: result.maskedKey,
      timestamp: new Date().toISOString(),
      notice: result.error || 'Live real-time feed connected from LTA DataMall.',
      carparks: result.carparks,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
