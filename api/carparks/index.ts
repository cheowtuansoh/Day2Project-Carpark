import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchLTADataMallCarparks } from '../../src/server/ltaService';
import { handleCorsAndPreflight } from '../../src/server/corsHelper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCorsAndPreflight(req, res)) return;

  try {
    const result = await fetchLTADataMallCarparks(req);
    res.status(200).json({
      success: true,
      source: result.isLive ? 'lta_datamall_live_v2' : 'lta_datamall_baseline',
      endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
      isLiveApi: result.isLive,
      timestamp: new Date().toISOString(),
      count: result.carparks.length,
      ltaRecordsProcessed: result.count,
      apiKeySource: result.apiKeySource,
      maskedKey: result.maskedKey,
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

