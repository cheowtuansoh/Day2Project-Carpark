export type AgencyPartner = 'LTA' | 'URA' | 'HDB' | 'Key Partner Malls';

export type ParkingType = 'Multi-storey' | 'Basement' | 'Surface/Open-air' | 'Automated';

export type AvailabilityStatus = 'plenty' | 'moderate' | 'limited' | 'full';

export interface EVChargerInfo {
  hasEV: boolean;
  totalChargers: number;
  availableChargers: number;
  chargerTypes: Array<{
    type: 'CCS2 (DC Fast 50-120kW)' | 'Type 2 (AC 22kW)' | 'CHAdeMO (DC 50kW)';
    available: number;
    total: number;
    pricePerKWh?: string;
  }>;
  operator?: string;
}

export interface Carpark {
  id: string;
  name: string;
  code: string;
  address: string;
  region: 'Central / Orchard' | 'CBD / Marina' | 'North' | 'East' | 'West' | 'North-East';
  partner: AgencyPartner;
  partnerIcon?: string;
  type: ParkingType;
  heightLimit?: number; // in meters
  sheltered: boolean;
  
  // Real-time capacity
  totalLots: number;
  availableLots: number;
  motorcycleLots?: { total: number; available: number };
  
  // EV info
  ev: EVChargerInfo;
  
  // Demand & Alerts
  isHighDemand: boolean;
  demandAlertMsg?: string;
  lastUpdated: string;
  
  // Pricing
  pricingWeekday: string;
  pricingWeekend: string;
  gracePeriodMinutes: number;
  
  // Distance / coordinates
  distanceKm?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface FlashAlert {
  id: string;
  carparkId: string;
  carparkName: string;
  region: string;
  message: string;
  severity: 'urgent' | 'warning' | 'info';
  timestamp: string;
}

export interface LocationItem {
  name: string;
  address?: string;
  region?: string;
  lat: number;
  lng: number;
}

export interface DriverTrip {
  originName: string;
  originCoords: { lat: number; lng: number };
  destinationName: string;
  destinationCoords: { lat: number; lng: number };
}

export interface CarparkRecommendation extends Carpark {
  rank: number;
  recommendationTag: string;
  recommendationReason: string;
  driveDistanceKm: number;
  driveEtaMinutes: number;
  walkDistanceMeters: number;
  walkEtaMinutes: number;
  availabilityScore: number;
  lotPercentage: number;
}
