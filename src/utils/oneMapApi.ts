import { getLTAHeaders } from './ltaApi';

/**
 * Client service to interact with the backend OneMap Singapore API proxy
 */

export interface OneMapSearchResult {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string;
  Y: string;
  LATITUDE: string;
  LONGITUDE: string;
}

export interface OneMapRouteSummary {
  total_time: number;
  total_distance: number;
  start_point: string;
  end_point: string;
}

/**
 * Search Singapore addresses and landmarks using OneMap Elastic Search
 */
export async function searchOneMap(query: string): Promise<OneMapSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const response = await fetch(`/api/onemap/search?searchVal=${encodeURIComponent(query.trim())}`);
    if (response.ok) {
      const data = await response.json();
      return data.results || [];
    }
  } catch (err) {
    console.warn('OneMap search request failed:', err);
  }
  return [];
}

/**
 * Reverse geocode coordinates to get Singapore address/building
 */
export async function reverseGeocodeOneMap(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(`/api/onemap/revgeocode?location=${lat},${lng}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.geocodeInfo) && data.geocodeInfo.length > 0) {
        const first = data.geocodeInfo[0];
        const building = first.BUILDINGNAME || first.buildingname || '';
        const road = first.ROAD || first.road || '';
        const block = first.BLOCK || first.block || '';
        const parts = [building, block && `Blk ${block}`, road].filter(Boolean);
        return parts.join(', ') || 'Singapore';
      }
    }
  } catch (err) {
    console.warn('OneMap reverse geocode request failed:', err);
  }
  return null;
}

/**
 * Fetch top 3 carpark recommendations from combined OneMap + LTA DataMall backend API
 */
export async function fetchTop3CarparksRecommendation(params: {
  originName: string;
  destinationName: string;
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  evOnly?: boolean;
  shelteredOnly?: boolean;
}): Promise<any | null> {
  const endpoints = ['/api/carparks/recommend', '/api/recommend'];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getLTAHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.recommendations) {
          return data;
        }
      }
    } catch (err) {
      console.warn(`Recommendation API call to ${endpoint} failed:`, err);
    }
  }
  return null;
}

/**
 * Get route ETA and distance from OneMap Routing Service
 */
export async function getOneMapRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  routeType: 'drive' | 'walk' | 'cycle' | 'pt' = 'drive'
): Promise<{ timeMinutes: number; distanceKm: number; source: string } | null> {
  try {
    const response = await fetch(
      `/api/onemap/route?start=${startLat},${startLng}&end=${endLat},${endLng}&routeType=${routeType}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.route_summary) {
        const timeMin = Math.round(data.route_summary.total_time / 60);
        const distKm = parseFloat((data.route_summary.total_distance / 1000).toFixed(1));
        return {
          timeMinutes: Math.max(1, timeMin),
          distanceKm: distKm,
          source: data.source,
        };
      }
      if (data.estimated_minutes) {
        return {
          timeMinutes: data.estimated_minutes,
          distanceKm: data.estimated_km,
          source: data.source,
        };
      }
    }
  } catch (err) {
    console.warn('OneMap route calculation request failed:', err);
  }
  return null;
}

