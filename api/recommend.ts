import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchLTADataMallCarparks } from '../src/server/ltaService';
import { getOneMapToken } from '../src/server/onemapService';
import { INITIAL_CARPARKS } from '../src/data/carparkData';
import { handleCorsAndPreflight, parseRequestBody } from '../src/server/corsHelper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCorsAndPreflight(req, res)) return;

  try {
    const body = parseRequestBody(req);
    const {
      originName = 'Bishan / Central',
      destinationName = 'ION Orchard',
      originCoords,
      destinationCoords,
      evOnly = false,
      shelteredOnly = false,
    } = body || {};

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

    res.status(200).json({
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
}

