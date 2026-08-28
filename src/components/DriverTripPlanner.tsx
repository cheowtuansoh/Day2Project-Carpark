import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  ArrowUpDown, 
  Zap, 
  ShieldCheck, 
  Crosshair, 
  Sparkles, 
  Compass,
  Clock,
  Car,
  Search,
  CheckCircle2,
  Globe2,
  Building2,
  ArrowRight,
  Send,
  SlidersHorizontal
} from 'lucide-react';
import { DriverTrip, LocationItem } from '../types';
import { POPULAR_ORIGINS, POPULAR_DESTINATIONS, DriverPreferences } from '../utils/geoUtils';
import { searchOneMap, reverseGeocodeOneMap, OneMapSearchResult } from '../utils/oneMapApi';

interface DriverTripPlannerProps {
  trip: DriverTrip;
  onTripChange: (newTrip: DriverTrip) => void;
  preferences: DriverPreferences;
  onPreferencesChange: (newPrefs: DriverPreferences) => void;
  onSubmitTrip: () => void;
  isSubmitting: boolean;
  onRefreshAvailability: () => void;
  isRefreshing: boolean;
  lastSubmitInfo?: {
    destination: string;
    origin: string;
    time: string;
    totalAvailableLots?: number;
  } | null;
}

export const DriverTripPlanner: React.FC<DriverTripPlannerProps> = ({
  trip,
  onTripChange,
  preferences,
  onPreferencesChange,
  onSubmitTrip,
  isSubmitting,
  onRefreshAvailability,
  isRefreshing,
  lastSubmitInfo,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  // Live OneMap Search Results
  const [originSearchResults, setOriginSearchResults] = useState<OneMapSearchResult[]>([]);
  const [destSearchResults, setDestSearchResults] = useState<OneMapSearchResult[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  const originDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const destDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Live Search for Origin via OneMap Elastic Search
  const handleOriginInputChange = (value: string) => {
    onTripChange({ ...trip, originName: value });
    setShowOriginSuggestions(true);

    if (originDebounceRef.current) clearTimeout(originDebounceRef.current);
    if (value.trim().length >= 2) {
      setIsSearchingOrigin(true);
      originDebounceRef.current = setTimeout(async () => {
        const results = await searchOneMap(value);
        setOriginSearchResults(results);
        setIsSearchingOrigin(false);
      }, 250);
    } else {
      setOriginSearchResults([]);
      setIsSearchingOrigin(false);
    }
  };

  // Live Search for Destination via OneMap Elastic Search
  const handleDestInputChange = (value: string) => {
    // Try to match popular destination coordinate if matches name
    const match = POPULAR_DESTINATIONS.find(
      (d) => d.name.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(d.name.toLowerCase())
    );

    onTripChange({
      ...trip,
      destinationName: value,
      destinationCoords: match ? { lat: match.lat, lng: match.lng } : trip.destinationCoords,
    });
    setShowDestSuggestions(true);

    if (destDebounceRef.current) clearTimeout(destDebounceRef.current);
    if (value.trim().length >= 2) {
      setIsSearchingDest(true);
      destDebounceRef.current = setTimeout(async () => {
        const results = await searchOneMap(value);
        setDestSearchResults(results);
        setIsSearchingDest(false);
      }, 250);
    } else {
      setDestSearchResults([]);
      setIsSearchingDest(false);
    }
  };

  // Handle swapping origin and destination
  const handleSwapRoute = () => {
    onTripChange({
      originName: trip.destinationName,
      originCoords: trip.destinationCoords,
      destinationName: trip.originName,
      destinationCoords: trip.originCoords,
    });
  };

  // Select origin preset
  const handleSelectOrigin = (loc: LocationItem) => {
    onTripChange({
      ...trip,
      originName: loc.name,
      originCoords: { lat: loc.lat, lng: loc.lng },
    });
    setShowOriginSuggestions(false);
  };

  // Select OneMap geocoded origin result
  const handleSelectOneMapOrigin = (res: OneMapSearchResult) => {
    const lat = parseFloat(res.LATITUDE);
    const lng = parseFloat(res.LONGITUDE);
    const label = res.BUILDING && res.BUILDING !== 'NIL' ? res.BUILDING : res.ADDRESS;

    onTripChange({
      ...trip,
      originName: label,
      originCoords: {
        lat: isNaN(lat) ? 1.3521 : lat,
        lng: isNaN(lng) ? 103.8198 : lng,
      },
    });
    setShowOriginSuggestions(false);
  };

  // Select destination preset
  const handleSelectDestination = (loc: LocationItem) => {
    onTripChange({
      ...trip,
      destinationName: loc.name,
      destinationCoords: { lat: loc.lat, lng: loc.lng },
    });
    setShowDestSuggestions(false);
  };

  // Select OneMap geocoded destination result
  const handleSelectOneMapDestination = (res: OneMapSearchResult) => {
    const lat = parseFloat(res.LATITUDE);
    const lng = parseFloat(res.LONGITUDE);
    const label = res.BUILDING && res.BUILDING !== 'NIL' ? res.BUILDING : res.ADDRESS;

    onTripChange({
      ...trip,
      destinationName: label,
      destinationCoords: {
        lat: isNaN(lat) ? 1.3040 : lat,
        lng: isNaN(lng) ? 103.8318 : lng,
      },
    });
    setShowDestSuggestions(false);
  };

  // Use Browser Geolocation with OneMap Reverse Geocode
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const address = await reverseGeocodeOneMap(lat, lng);

          onTripChange({
            ...trip,
            originName: address ? `GPS: ${address}` : 'Current Location (GPS Active)',
            originCoords: { lat, lng },
          });
          setIsLocating(false);
        },
        (error) => {
          console.warn('Geolocation fallback:', error);
          onTripChange({
            ...trip,
            originName: 'Current Location (Central Hub)',
            originCoords: { lat: 1.3521, lng: 103.8198 },
          });
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      onTripChange({
        ...trip,
        originName: 'Current Location (Central Hub)',
        originCoords: { lat: 1.3521, lng: 103.8198 },
      });
      setIsLocating(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowOriginSuggestions(false);
    setShowDestSuggestions(false);
    onSubmitTrip();
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-700/60 relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
        {/* Header Title with Driver Badge & OneMap API Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Driver Trip & Carpark Finder
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                  Top 3 Available
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700 flex items-center gap-1">
                  <Globe2 className="w-3 h-3 text-teal-400" />
                  OneMap Geocoding + LTA DataMall
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Key in where you are coming from and your destination, then click <strong>Submit</strong> to recommend the top 3 carparks based on real-time availability.
              </p>
            </div>
          </div>

          {/* Quick Realtime Sync action */}
          <button
            id="driver-sync-feed-btn"
            type="button"
            onClick={onRefreshAvailability}
            disabled={isRefreshing}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-xs"
          >
            <Clock className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Checking vacancies...' : 'Live Vacancy Sync'}</span>
          </button>
        </div>

        {/* Main 2-Step Driver Input: Origin & Destination */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* 1. Origin Input */}
          <div className="lg:col-span-5 relative">
            <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                1. Starting From (Origin)
              </span>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="text-[11px] font-semibold text-slate-400 hover:text-emerald-300 inline-flex items-center gap-1 normal-case transition-colors"
              >
                <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin text-emerald-400' : ''}`} />
                {isLocating ? 'Locating via OneMap...' : 'Use Current GPS'}
              </button>
            </label>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                id="origin-input"
                type="text"
                value={trip.originName}
                onChange={(e) => handleOriginInputChange(e.target.value)}
                onFocus={() => setShowOriginSuggestions(true)}
                placeholder="Search any Singapore address or postal code"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/90 text-white placeholder-slate-400 text-sm font-medium border border-slate-700 rounded-2xl focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
              />
            </div>

            {/* Quick Origin Suggestions Dropdown with Live OneMap results */}
            {showOriginSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-30 max-h-64 overflow-y-auto space-y-1">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <span>{originSearchResults.length > 0 ? 'OneMap Search Matches' : 'Popular Starting Points'}</span>
                  <button
                    type="button"
                    onClick={() => setShowOriginSuggestions(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {isSearchingOrigin && (
                  <div className="py-2 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Clock className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Searching OneMap Elastic Search...</span>
                  </div>
                )}

                {/* OneMap Live Geocode Results */}
                {originSearchResults.length > 0 ? (
                  originSearchResults.map((res, i) => (
                    <button
                      key={`${res.ADDRESS}-${i}`}
                      type="button"
                      onClick={() => handleSelectOneMapOrigin(res)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition-colors flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{res.BUILDING && res.BUILDING !== 'NIL' ? res.BUILDING : res.SEARCHVAL}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{res.ADDRESS}</div>
                      </div>
                      {res.POSTAL && res.POSTAL !== 'NIL' && (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-sm flex-shrink-0">
                          S({res.POSTAL})
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  POPULAR_ORIGINS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleSelectOrigin(item)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between"
                    >
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded-sm">
                        {item.region}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Swap Button (Middle) */}
          <div className="lg:col-span-2 flex justify-center py-1 lg:py-0">
            <button
              id="swap-route-btn"
              type="button"
              onClick={handleSwapRoute}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 transition-all shadow-md group"
              title="Swap Origin and Destination"
            >
              <ArrowUpDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          {/* 2. Destination Input */}
          <div className="lg:col-span-5 relative">
            <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                2. Driving To (Destination)
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Target Mall / Landmark / Postal Code
              </span>
            </label>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                <Navigation className="w-4 h-4" />
              </div>
              <input
                id="destination-input"
                type="text"
                value={trip.destinationName}
                onChange={(e) => handleDestInputChange(e.target.value)}
                onFocus={() => setShowDestSuggestions(true)}
                placeholder="e.g. ION Orchard, Raffles Place, VivoCity"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/90 text-white placeholder-slate-400 text-sm font-medium border border-slate-700 rounded-2xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all"
              />
            </div>

            {/* Quick Destination Suggestions Dropdown with Live OneMap search */}
            {showDestSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-30 max-h-64 overflow-y-auto space-y-1">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <span>{destSearchResults.length > 0 ? 'OneMap Search Matches' : 'Popular Destinations in Singapore'}</span>
                  <button
                    type="button"
                    onClick={() => setShowDestSuggestions(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {isSearchingDest && (
                  <div className="py-2 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Searching OneMap Elastic Search...</span>
                  </div>
                )}

                {destSearchResults.length > 0 ? (
                  destSearchResults.map((res, i) => (
                    <button
                      key={`${res.ADDRESS}-${i}`}
                      type="button"
                      onClick={() => handleSelectOneMapDestination(res)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition-colors flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span>{res.BUILDING && res.BUILDING !== 'NIL' ? res.BUILDING : res.SEARCHVAL}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{res.ADDRESS}</div>
                      </div>
                      {res.POSTAL && res.POSTAL !== 'NIL' && (
                        <span className="text-[10px] text-amber-300/80 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded-sm flex-shrink-0">
                          S({res.POSTAL})
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  POPULAR_DESTINATIONS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleSelectDestination(item)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between"
                    >
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-[10px] text-amber-300/80 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded-sm">
                        {item.region}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Destination Chips for Fast 1-Tap Selection */}
        <div className="pt-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 flex-shrink-0 mr-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Quick Destinations:
          </span>
          {POPULAR_DESTINATIONS.slice(0, 6).map((dest) => {
            const isCurrent = trip.destinationName === dest.name;
            return (
              <button
                key={dest.name}
                id={`quick-dest-${dest.name.split(' ')[0].toLowerCase()}`}
                type="button"
                onClick={() => handleSelectDestination(dest)}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                }`}
              >
                {dest.name.split('/')[0].trim()}
              </button>
            );
          })}
        </div>

        {/* Driver Preference Filters & Algorithm Summary */}
        <div className="pt-3 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold text-[11px] mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              Preferences:
            </span>

            {/* EV Charger toggle */}
            <button
              id="driver-toggle-ev"
              type="button"
              onClick={() => onPreferencesChange({ ...preferences, evOnly: !preferences.evOnly })}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium transition-all ${
                preferences.evOnly
                  ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-md'
                  : 'bg-slate-800 text-teal-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>EV Charger Required</span>
            </button>

            {/* Sheltered toggle */}
            <button
              id="driver-toggle-sheltered"
              type="button"
              onClick={() => onPreferencesChange({ ...preferences, shelteredOnly: !preferences.shelteredOnly })}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium transition-all ${
                preferences.shelteredOnly
                  ? 'bg-indigo-500 text-white border-indigo-400 font-bold shadow-md'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sheltered Only</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ranking formula: <strong>Vacant Lots (High Availability)</strong> + OneMap Proximity</span>
          </div>
        </div>

        {/* PRIMARY SUBMIT ACTION BUTTON */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">
                  Ready to calculate best parking options
                </p>
                <p className="text-[11px] text-slate-400">
                  Origin: <span className="text-emerald-300 font-medium">{trip.originName || 'Singapore'}</span> → Destination: <span className="text-amber-300 font-medium">{trip.destinationName || 'Singapore'}</span>
                </p>
              </div>
            </div>

            <button
              id="submit-driver-trip-btn"
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3.5 rounded-xl font-bold text-sm text-slate-950 flex items-center justify-center gap-2.5 shadow-lg transition-all transform active:scale-98 ${
                isSubmitting
                  ? 'bg-emerald-600/70 text-slate-300 cursor-wait'
                  : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/20 hover:shadow-emerald-500/30'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Looking up OneMap & LTA DataMall...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 fill-current" />
                  <span>Submit & Find Top 3 Available Carparks</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Last submit confirmation alert */}
          {lastSubmitInfo && (
            <div className="mt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Top 3 recommendations updated at <strong>{lastSubmitInfo.time}</strong> for destination <strong>{lastSubmitInfo.destination}</strong>.
              </span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
