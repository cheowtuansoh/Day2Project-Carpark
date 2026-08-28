import { Carpark } from '../types';
import { INITIAL_CARPARKS } from '../data/carparkData';

// Interface for raw LTA CarParkAvailabilityv2 item
export interface LTACarParkRaw {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // format "lat lng" or "lat,lng" e.g. "1.2935 103.8572"
  AvailableLots: number | string;
  LotType: string; // "C" for Car, "H" for Heavy, "Y" for Motorcycle
  Agency: string; // "LTA", "HDB", "URA"
}

export interface LTAResponse {
  'odata.metadata'?: string;
  value: LTACarParkRaw[];
}

export interface LTAKeyStatus {
  isConfigured: boolean;
  isValid: boolean | null;
  source: 'env' | 'custom_header' | 'query' | 'none';
  maskedKey: string | null;
  statusCode?: number;
  message?: string;
}

// In-memory cache for LTA DataMall responses
let ltaCache: {
  timestamp: number;
  data: Carpark[];
  isLive: boolean;
  rawCount: number;
} | null = null;

const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache

/**
 * Extract LTA DataMall API Key from any possible environment variable alias or request override
 */
export function extractLTAApiKey(req?: any): { key: string; source: 'env' | 'custom_header' | 'query' | 'none' } {
  // 1. Check custom headers
  if (req?.headers) {
    const headerKey =
      req.headers['x-lta-api-key'] ||
      req.headers['x-account-key'] ||
      req.headers['accountkey'] ||
      req.headers['account-key'] ||
      req.headers['x-api-key'];

    if (headerKey && typeof headerKey === 'string' && headerKey.trim()) {
      return { key: sanitizeApiKey(headerKey), source: 'custom_header' };
    }
  }

  // 2. Check query params or body
  if (req?.query) {
    const qKey = req.query.apiKey || req.query.accountKey || req.query.ltaKey;
    if (qKey && typeof qKey === 'string' && qKey.trim()) {
      return { key: sanitizeApiKey(qKey), source: 'query' };
    }
  }

  if (req?.body) {
    const bKey = req.body.apiKey || req.body.accountKey || req.body.ltaKey;
    if (bKey && typeof bKey === 'string' && bKey.trim()) {
      return { key: sanitizeApiKey(bKey), source: 'query' };
    }
  }

  // 3. Check all known environment variable aliases
  const envKey =
    process.env.LTA_DATAMALL_API_KEY ||
    process.env.LTA_API_KEY ||
    process.env.DATAMALL_API_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    process.env.LTA_KEY ||
    process.env.DATAMALL_KEY ||
    process.env.VITE_LTA_DATAMALL_API_KEY ||
    process.env.VITE_LTA_API_KEY ||
    process.env.VITE_ACCOUNT_KEY ||
    '';

  if (envKey && envKey.trim()) {
    return { key: sanitizeApiKey(envKey), source: 'env' };
  }

  return { key: '', source: 'none' };
}

/**
 * Sanitize API Key removing surrounding quotes, spaces, or escaped chars
 */
export function sanitizeApiKey(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Mask key for safe UI and diagnostic display (e.g. "ab...xyz")
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 6) return '***';
  return `${key.slice(0, 3)}...${key.slice(-3)}`;
}

/**
 * Verify whether an LTA API Key is corresponding and active on LTA DataMall
 */
export async function verifyLTAAccountKey(apiKey: string): Promise<{
  valid: boolean;
  statusCode: number;
  count?: number;
  message: string;
  sample?: any;
}> {
  const cleanKey = sanitizeApiKey(apiKey);
  if (!cleanKey) {
    return {
      valid: false,
      statusCode: 400,
      message: 'No LTA AccountKey provided. Configure LTA_DATAMALL_API_KEY or supply x-lta-api-key header.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2?$top=3',
      {
        headers: {
          'AccountKey': cleanKey,
          'accept': 'application/json',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as LTAResponse;
      const items = data.value || [];
      return {
        valid: true,
        statusCode: response.status,
        count: items.length,
        message: `LTA DataMall connection verified successfully. Returned ${items.length} live records.`,
        sample: items.slice(0, 2),
      };
    } else {
      const errText = await response.text();
      return {
        valid: false,
        statusCode: response.status,
        message: `LTA DataMall rejected key with HTTP ${response.status}: ${errText || response.statusText}. Please verify your AccountKey at https://datamall.lta.gov.sg.`,
      };
    }
  } catch (err: any) {
    return {
      valid: false,
      statusCode: 500,
      message: `Network error reaching LTA DataMall: ${err.message}`,
    };
  }
}

/**
 * Fetch live carparks from LTA DataMall (CarParkAvailabilityv2), supporting multi-page iteration and caching
 */
export async function fetchLTADataMallCarparks(req?: any): Promise<{
  carparks: Carpark[];
  isLive: boolean;
  count: number;
  apiKeySource: string;
  maskedKey: string | null;
  error?: string;
}> {
  const { key: apiKey, source: keySource } = extractLTAApiKey(req);
  const now = Date.now();

  // If using default env key and cache is warm, return cached
  if (keySource === 'env' && ltaCache && now - ltaCache.timestamp < CACHE_TTL_MS) {
    return {
      carparks: ltaCache.data,
      isLive: ltaCache.isLive,
      count: ltaCache.rawCount,
      apiKeySource: 'cached_env',
      maskedKey: maskApiKey(apiKey),
    };
  }

  // If no API key is present, provide enriched baseline data with realistic live fluctuations
  if (!apiKey) {
    const simulated = INITIAL_CARPARKS.map((cp) => {
      const delta = Math.floor(Math.random() * 5) - 2;
      const newAvail = Math.max(0, Math.min(cp.totalLots, cp.availableLots + delta));
      return {
        ...cp,
        availableLots: newAvail,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    });

    if (keySource === 'env') {
      ltaCache = {
        timestamp: now,
        data: simulated,
        isLive: false,
        rawCount: simulated.length,
      };
    }

    return {
      carparks: simulated,
      isLive: false,
      count: simulated.length,
      apiKeySource: 'none',
      maskedKey: null,
      error: 'LTA DataMall API Key is not configured. Returning live baseline data for LTA, HDB, URA & Partner Malls.',
    };
  }

  try {
    // Fetch multiple pages (up to 3 pages = 1500 carparks across Singapore)
    const allRawItems: LTACarParkRaw[] = [];
    const skipSteps = [0, 500, 1000];

    for (const skip of skipSteps) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url =
        skip === 0
          ? 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2'
          : `https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2?$skip=${skip}`;

      const response = await fetch(url, {
        headers: {
          'AccountKey': apiKey,
          'accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (skip === 0) {
          throw new Error(`LTA DataMall API responded with HTTP ${response.status}: ${response.statusText}`);
        }
        break; // Stop further pages if subsequent page fails
      }

      const data = (await response.json()) as LTAResponse;
      const items = data.value || [];
      allRawItems.push(...items);

      if (items.length < 500) {
        break; // Reached last page
      }
    }

    // Filter for Car lots ('C')
    const carItems = allRawItems.filter((item) => !item.LotType || item.LotType.toUpperCase() === 'C');

    // Merge or map with known carparks
    const enrichedList: Carpark[] = [];

    // 1. Enrich known base carparks with real-time lots
    INITIAL_CARPARKS.forEach((baseCp) => {
      const match = carItems.find(
        (lta) =>
          lta.CarParkID.toLowerCase() === baseCp.code.toLowerCase() ||
          lta.CarParkID.toLowerCase() === baseCp.id.toLowerCase() ||
          (lta.Development && baseCp.name.toLowerCase().includes(lta.Development.toLowerCase().split(' ')[0])) ||
          (lta.Development && lta.Development.toLowerCase().includes(baseCp.name.toLowerCase().split(' ')[0]))
      );

      if (match) {
        const liveAvail =
          typeof match.AvailableLots === 'string' ? parseInt(match.AvailableLots, 10) : match.AvailableLots;
        enrichedList.push({
          ...baseCp,
          availableLots: isNaN(liveAvail) ? baseCp.availableLots : liveAvail,
          lastUpdated: 'Live from LTA DataMall',
        });
      } else {
        enrichedList.push(baseCp);
      }
    });

    // 2. Add extra live LTA carparks from the feed
    carItems.slice(0, 50).forEach((ltaItem) => {
      const alreadyExists = enrichedList.some(
        (c) =>
          c.code.toLowerCase() === ltaItem.CarParkID.toLowerCase() ||
          (ltaItem.Development && c.name.toLowerCase() === ltaItem.Development.toLowerCase())
      );

      if (!alreadyExists && ltaItem.Development) {
        let lat = 1.3521;
        let lng = 103.8198;
        if (ltaItem.Location) {
          const parts = ltaItem.Location.trim().split(/[\s,]+/);
          if (parts.length >= 2) {
            const pLat = parseFloat(parts[0]);
            const pLng = parseFloat(parts[1]);
            if (!isNaN(pLat) && !isNaN(pLng)) {
              lat = pLat;
              lng = pLng;
            }
          }
        }

        const avail =
          typeof ltaItem.AvailableLots === 'string' ? parseInt(ltaItem.AvailableLots, 10) : ltaItem.AvailableLots;
        const availableLots = isNaN(avail) ? 20 : avail;
        const totalLots = Math.max(availableLots + 40, 150);

        let partner: Carpark['partner'] = 'LTA';
        if (ltaItem.Agency?.toUpperCase() === 'HDB') partner = 'HDB';
        else if (ltaItem.Agency?.toUpperCase() === 'URA') partner = 'URA';

        let region: Carpark['region'] = 'Central / Orchard';
        const areaUpper = (ltaItem.Area || '').toUpperCase();
        if (areaUpper.includes('MARINA') || areaUpper.includes('CBD') || areaUpper.includes('SUNTEC')) {
          region = 'CBD / Marina';
        } else if (areaUpper.includes('ORCHARD') || areaUpper.includes('BUGIS')) {
          region = 'Central / Orchard';
        } else if (areaUpper.includes('EAST') || areaUpper.includes('TAMPINES') || areaUpper.includes('BEDOK')) {
          region = 'East';
        } else if (areaUpper.includes('WEST') || areaUpper.includes('JURONG')) {
          region = 'West';
        } else if (areaUpper.includes('NORTH-EAST') || areaUpper.includes('PUNGGOL') || areaUpper.includes('SENGKANG')) {
          region = 'North-East';
        } else if (areaUpper.includes('NORTH')) {
          region = 'North';
        }

        const carparkId = `lta-${ltaItem.CarParkID.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        enrichedList.push({
          id: carparkId,
          code: ltaItem.CarParkID,
          name: ltaItem.Development,
          address: `${ltaItem.Development}, Singapore`,
          partner,
          type: 'Multi-storey',
          region,
          coordinates: { lat, lng },
          totalLots,
          availableLots,
          pricingWeekday: '$1.20 - $2.40 / 30 mins',
          pricingWeekend: '$0.65 / 30 mins (Cap $5.00)',
          gracePeriodMinutes: 15,
          sheltered: true,
          ev: {
            hasEV: false,
            availableChargers: 0,
            totalChargers: 0,
            chargerTypes: [],
          },
          isHighDemand: availableLots < 15,
          lastUpdated: 'Live from LTA DataMall',
        });
      }
    });

    // Cache the live result
    if (keySource === 'env') {
      ltaCache = {
        timestamp: now,
        data: enrichedList,
        isLive: true,
        rawCount: allRawItems.length,
      };
    }

    return {
      carparks: enrichedList,
      isLive: true,
      count: allRawItems.length,
      apiKeySource: keySource,
      maskedKey: maskApiKey(apiKey),
    };
  } catch (err: any) {
    console.error('LTA DataMall live fetch failed:', err.message);

    // Provide fallback with baseline
    const fallbackList = INITIAL_CARPARKS;
    return {
      carparks: fallbackList,
      isLive: false,
      count: fallbackList.length,
      apiKeySource: keySource,
      maskedKey: maskApiKey(apiKey),
      error: `Live LTA DataMall API connection failed (${err.message}). Using fallback baseline.`,
    };
  }
}
