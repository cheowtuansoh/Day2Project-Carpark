import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCorsAndPreflight } from '../src/server/corsHelper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCorsAndPreflight(req, res)) return;

  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    service: 'ParkFinder SG Serverless API',
    endpoints: [
      '/api/carparks/live',
      '/api/carparks/status',
      '/api/carparks/recommend',
      '/api/lta/carparks',
      '/api/lta/status',
      '/api/lta/verify',
      '/api/onemap/token',
      '/api/onemap/search',
      '/api/onemap/route',
      '/api/onemap/revgeocode',
      '/api/health',
    ],
    timestamp: new Date().toISOString(),
  });
}
