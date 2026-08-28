import { Carpark, CarparkRecommendation, DriverTrip, LocationItem } from '../types';

export const POPULAR_ORIGINS: LocationItem[] = [
  { name: 'Bishan / Central', address: 'Bishan Central, Singapore', region: 'Central', lat: 1.3508, lng: 103.8485 },
  { name: 'Tampines Hub / East', address: '1 Tampines Walk, Singapore', region: 'East', lat: 1.3532, lng: 103.9442 },
  { name: 'Jurong Gateway / West', address: 'Jurong East Central, Singapore', region: 'West', lat: 1.3331, lng: 103.7436 },
  { name: 'Woodlands Civic / North', address: 'Woodlands Square, Singapore', region: 'North', lat: 1.4382, lng: 103.7891 },
  { name: 'Punggol Settlement / North-East', address: 'Punggol Central, Singapore', region: 'North-East', lat: 1.4067, lng: 103.9022 },
  { name: 'Bedok Mall / East', address: '311 New Upper Changi Rd, Singapore', region: 'East', lat: 1.3236, lng: 103.9273 },
  { name: 'Ang Mo Kio Hub', address: '53 Ang Mo Kio Ave 3, Singapore', region: 'North-East', lat: 1.3691, lng: 103.8454 },
  { name: 'Toa Payoh Central', address: 'Lor 6 Toa Payoh, Singapore', region: 'Central', lat: 1.3323, lng: 103.8475 },
  { name: 'Changi Airport Terminal 3', address: '65 Airport Blvd, Singapore', region: 'East', lat: 1.3572, lng: 103.9870 },
  { name: 'Queenstown MRT', address: 'Commonwealth Ave, Singapore', region: 'Central', lat: 1.2948, lng: 103.8061 },
];

export const POPULAR_DESTINATIONS: LocationItem[] = [
  { name: 'ION Orchard / Orchard Rd', address: '2 Orchard Turn, Singapore', region: 'Central / Orchard', lat: 1.3040, lng: 103.8318 },
  { name: 'Marina Bay Sands / Bayfront', address: '10 Bayfront Ave, Singapore', region: 'CBD / Marina', lat: 1.2834, lng: 103.8607 },
  { name: 'VivoCity / HarbourFront', address: '1 HarbourFront Walk, Singapore', region: 'Central / Orchard', lat: 1.2642, lng: 103.8223 },
  { name: 'Suntec City / Marina Centre', address: '3 Temasek Blvd, Singapore', region: 'CBD / Marina', lat: 1.2935, lng: 103.8572 },
  { name: 'Bugis Junction / Victoria St', address: '200 Victoria St, Singapore', region: 'Central / Orchard', lat: 1.3006, lng: 103.8553 },
  { name: 'Chinatown / Maxwell Food Centre', address: '335 Smith Street, Singapore', region: 'CBD / Marina', lat: 1.2803, lng: 103.8447 },
  { name: 'Jurong Point / Jurong West', address: '1 Jurong West Central 2, Singapore', region: 'West', lat: 1.3404, lng: 103.7063 },
  { name: 'Tampines 1 / Tampines Central', address: '10 Tampines Central 1, Singapore', region: 'East', lat: 1.3532, lng: 103.9442 },
  { name: 'Northpoint City / Yishun Central', address: '930 Yishun Ave 2, Singapore', region: 'North', lat: 1.4294, lng: 103.8358 },
  { name: 'Waterway Point / Punggol', address: '83 Punggol Central, Singapore', region: 'North-East', lat: 1.4067, lng: 103.9022 },
  { name: 'Toa Payoh HDB Hub', address: '480 Lor 6 Toa Payoh, Singapore', region: 'North-East', lat: 1.3323, lng: 103.8475 },
];

/**
 * Calculates straight-line distance in kilometers using Haversine formula
 */
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimated driving distance on Singapore road network (~1.3x straight line factor)
 */
export function estimateDriveDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const straight = calculateHaversineKm(lat1, lon1, lat2, lon2);
  return Number((straight * 1.3).toFixed(1));
}

/**
 * Estimated driving time in minutes
 */
export function estimateDriveEtaMinutes(distanceKm: number): number {
  if (distanceKm <= 0.3) return 2;
  // Singapore city driving average ~25-35 km/h + traffic stops
  return Math.max(3, Math.round(distanceKm * 2.2 + 2));
}

/**
 * Estimated walking distance in meters from carpark to destination
 */
export function estimateWalkDistanceMeters(
  carparkLat: number,
  carparkLon: number,
  destLat: number,
  destLon: number
): number {
  const straightKm = calculateHaversineKm(carparkLat, carparkLon, destLat, destLon);
  return Math.round(straightKm * 1000);
}

/**
 * Estimated walking time in minutes
 */
export function estimateWalkEtaMinutes(distanceMeters: number): number {
  // Average human walking speed ~80 meters / minute
  const mins = Math.ceil(distanceMeters / 80);
  return Math.max(1, mins);
}

export interface DriverPreferences {
  evOnly: boolean;
  shelteredOnly: boolean;
  budgetFriendlyOnly?: boolean;
}

/**
 * Rank and find TOP 3 Recommended Carparks based on AVAILABILITY and destination proximity
 */
export function getTop3RecommendedCarparks(
  allCarparks: Carpark[],
  trip: DriverTrip,
  preferences: DriverPreferences
): CarparkRecommendation[] {
  // 1. Filter based on hard preferences
  let pool = allCarparks.filter((cp) => {
    if (preferences.evOnly && (!cp.ev.hasEV || cp.ev.availableChargers === 0)) {
      return false;
    }
    if (preferences.shelteredOnly && !cp.sheltered) {
      return false;
    }
    if (preferences.budgetFriendlyOnly && (cp.partner === 'Key Partner Malls' && cp.availableLots < 50)) {
      return false;
    }
    return true;
  });

  // If preferences filtered out everything, fallback to original list with soft warning
  if (pool.length === 0) {
    pool = allCarparks;
  }

  // 2. Calculate trip metrics for each carpark
  const scoredCarparks: Array<CarparkRecommendation> = pool.map((cp) => {
    const driveDist = estimateDriveDistanceKm(
      trip.originCoords.lat,
      trip.originCoords.lng,
      cp.coordinates.lat,
      cp.coordinates.lng
    );
    const driveEta = estimateDriveEtaMinutes(driveDist);
    
    const walkDist = estimateWalkDistanceMeters(
      cp.coordinates.lat,
      cp.coordinates.lng,
      trip.destinationCoords.lat,
      trip.destinationCoords.lng
    );
    const walkEta = estimateWalkEtaMinutes(walkDist);

    const lotPct = cp.totalLots > 0 ? Math.round((cp.availableLots / cp.totalLots) * 100) : 0;

    // AVAILABILITY-CENTRIC SCORING FORMULA:
    // 1. Lots available: heavy positive weight
    // 2. Lot % free: positive weight
    // 3. Distance penalty: carparks further than 2km from destination get slight proximity decay, but high availability still wins
    // 4. Congestion penalty: high demand or < 15 lots heavily penalized
    
    // Proximity factor (closer to destination is preferred, but availability dominates)
    const proximityScore = Math.max(0, 500 - walkDist * 0.25);

    // Availability factor (raw available lots + percentage free)
    const rawLotsScore = cp.availableLots * 1.5;
    const pctScore = lotPct * 4;

    // Congestion & EV modifier
    const congestionPenalty = cp.isHighDemand ? 250 : 0;
    const lowLotPenalty = cp.availableLots < 15 ? 400 : 0;
    const evBonus = preferences.evOnly && cp.ev.availableChargers > 0 ? cp.ev.availableChargers * 30 : 0;

    const totalScore = rawLotsScore + pctScore + proximityScore + evBonus - congestionPenalty - lowLotPenalty;

    return {
      ...cp,
      rank: 0,
      recommendationTag: '',
      recommendationReason: '',
      driveDistanceKm: driveDist,
      driveEtaMinutes: driveEta,
      walkDistanceMeters: walkDist,
      walkEtaMinutes: walkEta,
      availabilityScore: totalScore,
      lotPercentage: lotPct,
    };
  });

  // 3. Sort primarily by score (availability & proximity)
  scoredCarparks.sort((a, b) => b.availabilityScore - a.availabilityScore);

  // 4. Take top 3 and assign badges & user-centric recommendation reasons
  const top3 = scoredCarparks.slice(0, 3).map((item, index) => {
    let tag = '#1 Best Choice';
    let reason = '';

    if (index === 0) {
      tag = 'Highest Availability';
      reason = `${item.availableLots} lots available (${item.lotPercentage}% capacity free). Shortest wait time and easiest parking entry.`;
      if (item.ev.hasEV && item.ev.availableChargers > 0) {
        reason += ` Plus ${item.ev.availableChargers} EV fast chargers ready.`;
      }
    } else if (index === 1) {
      tag = 'Recommended Alternative';
      if (item.walkDistanceMeters <= 350) {
        reason = `Very close walking distance (~${item.walkEtaMinutes} min walk) with ${item.availableLots} spaces ready.`;
      } else {
        reason = `Generous parking capacity with ${item.availableLots} spaces available and quick access.`;
      }
    } else {
      tag = 'Backup Option';
      reason = `Reliable fallback with ${item.availableLots} vacant bays (${item.partner}).`;
    }

    return {
      ...item,
      rank: index + 1,
      recommendationTag: tag,
      recommendationReason: reason,
    };
  });

  return top3;
}
