import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { INITIAL_CARPARKS } from './src/data/carparkData';
import {
  fetchLTADataMallCarparks,
  verifyLTAAccountKey,
  extractLTAApiKey,
  maskApiKey,
} from './src/server/ltaService';
import { getOneMapToken } from './src/server/onemapService';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ---------------- LTA DATAMALL API ROUTES ----------------

// 1. Live Carpark Availability Feed from LTA DataMall (CarParkAvailabilityv2)
app.get(['/api/carparks/live', '/api/carparks'], async (req: Request, res: Response) => {
  try {
    const result = await fetchLTADataMallCarparks(req);
    res.json({
      success: true,
      source: result.isLive ? 'lta_datamall_live_v2' : 'lta_datamall_baseline',
      endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
      isLiveApi: result.isLive,
      timestamp: new Date().toISOString(),
      count: result.carparks.length,
      ltaRecordsProcessed: result.count,
      apiKeySource: result.apiKeySource,
      maskedKey: result.maskedKey,
      notice: result.error || 'Live real-time feed connected from LTA DataMall (HDB + LTA + URA + Malls).',
      carparks: result.carparks,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
      carparks: INITIAL_CARPARKS,
    });
  }
});

// Alias for explicit LTA endpoint
app.get('/api/lta/carparks', async (req: Request, res: Response) => {
  try {
    const result = await fetchLTADataMallCarparks(req);
    res.json({
      success: true,
      service: 'LTA DataMall CarParkAvailabilityv2 Endpoint',
      isLiveApi: result.isLive,
      timestamp: new Date().toISOString(),
      count: result.carparks.length,
      ltaRecordsProcessed: result.count,
      apiKeySource: result.apiKeySource,
      maskedKey: result.maskedKey,
      notice: result.error || 'Live feed connected from LTA DataMall.',
      carparks: result.carparks,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// 2. LTA DataMall Connection Status & Key Diagnostics
app.get('/api/carparks/status', (req: Request, res: Response) => {
  const { key, source } = extractLTAApiKey(req);
  res.json({
    service: 'LTA DataMall CarParkAvailabilityv2 Connector',
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
});

app.get('/api/lta/status', (req: Request, res: Response) => {
  const { key, source } = extractLTAApiKey(req);
  res.json({
    service: 'LTA DataMall Status Connector',
    isApiKeyConfigured: Boolean(key),
    keySource: source,
    maskedKey: maskApiKey(key),
    supportedAgencies: ['LTA', 'HDB', 'URA', 'Key Partner Malls'],
  });
});

// 3. Verify & Test LTA DataMall API Key
app.all('/api/lta/verify', async (req: Request, res: Response) => {
  try {
    const { key, source } = extractLTAApiKey(req);
    const keyToTest = req.body?.apiKey || req.query?.apiKey || key;

    if (!keyToTest) {
      return res.status(400).json({
        success: false,
        valid: false,
        source: 'none',
        message: 'No LTA DataMall AccountKey was found. Set LTA_DATAMALL_API_KEY or send apiKey in request body/header.',
      });
    }

    const testResult = await verifyLTAAccountKey(keyToTest);
    res.status(testResult.valid ? 200 : 400).json({
      success: testResult.valid,
      service: 'LTA DataMall Key Verification Endpoint',
      keySource: source,
      maskedKey: maskApiKey(keyToTest),
      ...testResult,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- ONEMAP SINGAPORE API ROUTES ----------------

// 1. Mint a Token
app.post('/api/onemap/token', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    const result = await getOneMapToken({ email, password });
    if (!result.token) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to mint OneMap token',
        notice: 'Provide {"email": "...", "password": "..."} or configure ONEMAP_EMAIL & ONEMAP_PASSWORD.',
      });
    }

    res.json({
      success: true,
      service: 'OneMap GovTech API Authentication',
      endpoint: 'https://www.onemap.gov.sg/api/auth/post/getToken',
      tokenSource: result.source,
      message: 'OneMap API token active (valid for ~3 days / 72 hours)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get OneMap Token Status
app.get('/api/onemap/token', async (req: Request, res: Response) => {
  const tokenResult = await getOneMapToken();
  res.json({
    service: 'OneMap Singapore Authentication Status',
    hasActiveToken: Boolean(tokenResult.token),
    source: tokenResult.source,
    isEmailConfigured: Boolean(process.env.ONEMAP_EMAIL),
  });
});

// 3. Geocode / Search: https://www.onemap.gov.sg/api/common/elastic/search
app.get('/api/onemap/search', async (req: Request, res: Response) => {
  const searchVal = (req.query.searchVal || req.query.q || req.query.query || '').toString().trim();
  const pageNum = req.query.pageNum ? parseInt(req.query.pageNum.toString(), 10) : 1;
  const returnGeom = req.query.returnGeom?.toString() || 'Y';
  const getAddrDetails = req.query.getAddrDetails?.toString() || 'Y';

  if (!searchVal) {
    return res.status(400).json({ success: false, error: 'searchVal query parameter is required' });
  }

  try {
    const tokenResult = await getOneMapToken();
    if (tokenResult.token) {
      const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
        searchVal
      )}&returnGeom=${returnGeom}&getAddrDetails=${getAddrDetails}&pageNum=${pageNum}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return res.json({
          success: true,
          source: 'onemap_live_elastic_search',
          endpoint: 'https://www.onemap.gov.sg/api/common/elastic/search',
          query: searchVal,
          found: data.found || (data.results ? data.results.length : 0),
          totalNumPages: data.totalNumPages || 1,
          pageNum,
          results: data.results || [],
        });
      }
    }
  } catch (err: any) {
    console.warn('OneMap Elastic Search query fallback:', err.message);
  }

  const queryLower = searchVal.toLowerCase();
  const localMatches = INITIAL_CARPARKS.filter(
    (cp) =>
      cp.name.toLowerCase().includes(queryLower) ||
      cp.address.toLowerCase().includes(queryLower) ||
      cp.region.toLowerCase().includes(queryLower)
  ).map((cp) => ({
    SEARCHVAL: cp.name,
    BLK_NO: '',
    ROAD_NAME: cp.address,
    BUILDING: cp.name,
    ADDRESS: cp.address,
    POSTAL: 'NIL',
    X: 'NIL',
    Y: 'NIL',
    LATITUDE: cp.coordinates.lat.toString(),
    LONGITUDE: cp.coordinates.lng.toString(),
  }));

  res.json({
    success: true,
    source: 'onemap_fallback_local',
    query: searchVal,
    found: localMatches.length,
    totalNumPages: 1,
    pageNum,
    results: localMatches,
  });
});

// 4. Reverse Geocode
app.get('/api/onemap/revgeocode', async (req: Request, res: Response) => {
  let location = (req.query.location || '').toString().trim();
  if (!location && req.query.lat && req.query.lng) {
    location = `${req.query.lat},${req.query.lng}`;
  }

  const buffer = req.query.buffer?.toString() || '40';
  const addressType = req.query.addressType?.toString() || 'All';

  if (!location) {
    return res.status(400).json({ success: false, error: 'location (lat,lng) query parameter is required' });
  }

  try {
    const tokenResult = await getOneMapToken();
    if (tokenResult.token) {
      const url = `https://www.onemap.gov.sg/api/public/revgeocode?location=${encodeURIComponent(
        location
      )}&buffer=${buffer}&addressType=${addressType}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return res.json({
          success: true,
          source: 'onemap_live_revgeocode',
          endpoint: 'https://www.onemap.gov.sg/api/public/revgeocode',
          location,
          geocodeInfo: data.GeocodeInfo || data.geocodeInfo || data,
        });
      }
    }
  } catch (err: any) {
    console.warn('OneMap Reverse Geocode fallback:', err.message);
  }

  const [latStr, lngStr] = location.split(',');
  res.json({
    success: true,
    source: 'onemap_fallback_revgeocode',
    location,
    geocodeInfo: [
      {
        BUILDINGNAME: 'Current GPS Location',
        BLOCK: '',
        ROAD: 'Singapore',
        POSTALCODE: '',
        LATITUDE: latStr || '1.3521',
        LONGITUDE: lngStr || '103.8198',
      },
    ],
  });
});

// 5. Routing Service
app.get('/api/onemap/route', async (req: Request, res: Response) => {
  let start = (req.query.start || '').toString().trim();
  let end = (req.query.end || '').toString().trim();
  const routeType = (req.query.routeType || 'drive').toString().toLowerCase();

  if (!start && req.query.startLat && req.query.startLng) {
    start = `${req.query.startLat},${req.query.startLng}`;
  }
  if (!end && req.query.endLat && req.query.endLng) {
    end = `${req.query.endLat},${req.query.endLng}`;
  }

  if (!start || !end) {
    return res.status(400).json({ success: false, error: 'start and end coordinates (lat,lng) are required' });
  }

  try {
    const tokenResult = await getOneMapToken();
    if (tokenResult.token) {
      const url = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${encodeURIComponent(
        start
      )}&end=${encodeURIComponent(end)}&routeType=${encodeURIComponent(routeType)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return res.json({
          success: true,
          source: 'onemap_live_routing',
          endpoint: 'https://www.onemap.gov.sg/api/public/routingsvc/route',
          start,
          end,
          routeType,
          route: data,
        });
      }
    }
  } catch (err: any) {
    console.warn('OneMap Routing fallback:', err.message);
  }

  const [sLat, sLng] = start.split(',').map(Number);
  const [eLat, eLng] = end.split(',').map(Number);

  let distKm = 3.5;
  if (!isNaN(sLat) && !isNaN(sLng) && !isNaN(eLat) && !isNaN(eLng)) {
    const R = 6371;
    const dLat = ((eLat - sLat) * Math.PI) / 180;
    const dLng = ((eLng - sLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((sLat * Math.PI) / 180) *
        Math.cos((eLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distKm = R * c * 1.35;
  }

  const speedKmH = routeType === 'walk' ? 4.8 : routeType === 'cycle' ? 15 : 42;
  const timeMinutes = Math.max(1, Math.round((distKm / speedKmH) * 60));

  res.json({
    success: true,
    source: 'onemap_fallback_calc',
    start,
    end,
    routeType,
    route_summary: {
      total_time: timeMinutes * 60,
      total_distance: Math.round(distKm * 1000),
      start_point: start,
      end_point: end,
    },
    estimated_minutes: timeMinutes,
    estimated_km: parseFloat(distKm.toFixed(1)),
  });
});

// 6. OneMap Full Status & Diagnostics
app.get('/api/onemap/status', async (req: Request, res: Response) => {
  const tokenResult = await getOneMapToken();
  res.json({
    service: 'OneMap GovTech API Suite',
    status: tokenResult.token ? 'connected' : 'ready_for_credentials',
    hasActiveToken: Boolean(tokenResult.token),
    supportedRouteTypes: ['drive', 'walk', 'cycle', 'pt'],
  });
});

// 7. Combined OneMap + LTA DataMall Recommendations Endpoint
app.post('/api/carparks/recommend', async (req: Request, res: Response) => {
  try {
    const {
      originName = 'Bishan / Central',
      destinationName = 'ION Orchard',
      originCoords,
      destinationCoords,
      evOnly = false,
      shelteredOnly = false,
    } = req.body || {};

    let oLat = originCoords?.lat;
    let oLng = originCoords?.lng;
    let dLat = destinationCoords?.lat;
    let dLng = destinationCoords?.lng;

    const resolveCoords = async (name: string, fallbackLat: number, fallbackLng: number) => {
      try {
        const tokenResult = await getOneMapToken();
        if (tokenResult.token) {
          const searchUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
            name
          )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
          const resp = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${tokenResult.token}` },
          });
          if (resp.ok) {
            const json = await resp.json();
            if (json.results && json.results.length > 0) {
              const first = json.results[0];
              const pLat = parseFloat(first.LATITUDE);
              const pLng = parseFloat(first.LONGITUDE);
              if (!isNaN(pLat) && !isNaN(pLng)) {
                return { lat: pLat, lng: pLng, resolvedName: first.BUILDING || first.ADDRESS };
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('OneMap resolveCoords fallback:', err.message);
      }

      const match = INITIAL_CARPARKS.find(
        (c) =>
          c.name.toLowerCase().includes(name.toLowerCase()) ||
          c.address.toLowerCase().includes(name.toLowerCase())
      );
      if (match) {
        return { lat: match.coordinates.lat, lng: match.coordinates.lng, resolvedName: match.name };
      }

      return { lat: fallbackLat, lng: fallbackLng, resolvedName: name };
    };

    let resolvedOriginName = originName;
    if (!oLat || !oLng) {
      const resolved = await resolveCoords(originName, 1.3508, 103.8485);
      oLat = resolved.lat;
      oLng = resolved.lng;
      resolvedOriginName = resolved.resolvedName;
    }

    let resolvedDestName = destinationName;
    if (!dLat || !dLng) {
      const resolved = await resolveCoords(destinationName, 1.304, 103.8318);
      dLat = resolved.lat;
      dLng = resolved.lng;
      resolvedDestName = resolved.resolvedName;
    }

    const ltaResult = await fetchLTADataMallCarparks(req);
    const carparksPool = ltaResult.carparks;

    let eligible = carparksPool.filter((cp) => {
      if (evOnly && (!cp.ev.hasEV || cp.ev.availableChargers === 0)) return false;
      if (shelteredOnly && !cp.sheltered) return false;
      return true;
    });

    if (eligible.length === 0) eligible = carparksPool;

    const getHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const scored = eligible.map((cp) => {
      const distFromOriginKm = getHaversine(oLat, oLng, cp.coordinates.lat, cp.coordinates.lng) * 1.35;
      const distToDestKm = getHaversine(cp.coordinates.lat, cp.coordinates.lng, dLat, dLng);
      const walkDistanceMeters = Math.round(distToDestKm * 1000);
      const walkEtaMinutes = Math.max(1, Math.ceil(walkDistanceMeters / 80));
      const driveEtaMinutes = Math.max(3, Math.round(distFromOriginKm * 2.2 + 2));

      const lotPct = cp.totalLots > 0 ? Math.round((cp.availableLots / cp.totalLots) * 100) : 0;

      const proximityScore = Math.max(0, 600 - walkDistanceMeters * 0.28);
      const lotsScore = cp.availableLots * 1.6;
      const pctScore = lotPct * 3.5;
      const evBonus = evOnly && cp.ev.availableChargers > 0 ? cp.ev.availableChargers * 30 : 0;
      const penalty = (cp.isHighDemand ? 200 : 0) + (cp.availableLots < 15 ? 400 : 0);

      const totalScore = lotsScore + pctScore + proximityScore + evBonus - penalty;

      return {
        ...cp,
        driveDistanceKm: parseFloat(distFromOriginKm.toFixed(1)),
        driveEtaMinutes,
        walkDistanceMeters,
        walkEtaMinutes,
        lotPercentage: lotPct,
        availabilityScore: totalScore,
      };
    });

    scored.sort((a, b) => b.availabilityScore - a.availabilityScore);

    const top3 = scored.slice(0, 3).map((item, index) => {
      let tag = '#1 Best Choice';
      let reason = '';

      if (index === 0) {
        tag = 'Highest Availability';
        reason = `${item.availableLots} lots available (${item.lotPercentage}% free capacity). Shortest wait time and easiest parking entry.`;
        if (item.ev.hasEV && item.ev.availableChargers > 0) {
          reason += ` Includes ${item.ev.availableChargers} EV fast charging bays.`;
        }
      } else if (index === 1) {
        tag = 'Closest Walk Alternative';
        reason = `Within ~${item.walkEtaMinutes} min walk (${item.walkDistanceMeters}m) to ${resolvedDestName} with ${item.availableLots} spaces ready.`;
      } else {
        tag = 'Budget / Secondary Choice';
        reason = `Steady availability of ${item.availableLots} lots with smooth entrance flow (${item.driveEtaMinutes} mins drive from origin).`;
      }

      return {
        ...item,
        rank: index + 1,
        recommendationTag: tag,
        recommendationReason: reason,
      };
    });

    res.json({
      success: true,
      service: 'OneMap GovTech + LTA DataMall Recommendation Engine',
      origin: {
        name: resolvedOriginName,
        coords: { lat: oLat, lng: oLng },
      },
      destination: {
        name: resolvedDestName,
        coords: { lat: dLat, lng: dLng },
      },
      isLtaLive: ltaResult.isLive,
      apiKeySource: ltaResult.apiKeySource,
      maskedKey: ltaResult.maskedKey,
      recommendationsCount: top3.length,
      recommendations: top3,
      allAvailableCarparksCount: carparksPool.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Recommendation API error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ---------------- VITE & STATIC SERVING ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ParkFinder backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
