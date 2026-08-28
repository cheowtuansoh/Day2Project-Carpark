import React, { useState, useMemo, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  FlashAlertBanner 
} from './components/FlashAlertBanner';
import { 
  DriverTripPlanner 
} from './components/DriverTripPlanner';
import { 
  TopRecommendations 
} from './components/TopRecommendations';
import { 
  StatsSummary 
} from './components/StatsSummary';
import { 
  SearchAndFilters 
} from './components/SearchAndFilters';
import { 
  CarparkCard 
} from './components/CarparkCard';
import { 
  CarparkDetailsModal 
} from './components/CarparkDetailsModal';
import { 
  PromptReferenceModal 
} from './components/PromptReferenceModal';
import { 
  INITIAL_CARPARKS, 
  INITIAL_FLASH_ALERTS 
} from './data/carparkData';
import { 
  Carpark, 
  FlashAlert, 
  DriverTrip,
  CarparkRecommendation 
} from './types';
import { 
  getTop3RecommendedCarparks, 
  DriverPreferences 
} from './utils/geoUtils';
import { 
  fetchTop3CarparksRecommendation 
} from './utils/oneMapApi';
import {
  fetchLiveCarparksApi
} from './utils/ltaApi';
import { ApiKeyModal } from './components/ApiKeyModal';
import { DisqusSection } from './components/DisqusSection';
import { 
  Car, 
  Search, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  Navigation,
  ShieldCheck,
  Compass,
  Radio,
  Server,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Main Data States
  const [carparks, setCarparks] = useState<Carpark[]>(INITIAL_CARPARKS);
  const [flashAlerts, setFlashAlerts] = useState<FlashAlert[]>(INITIAL_FLASH_ALERTS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  
  // Backend LTA DataMall Connection States
  const [apiSource, setApiSource] = useState<'lta_datamall_live_v2' | 'lta_datamall_baseline'>('lta_datamall_baseline');
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [apiNotice, setApiNotice] = useState<string>('Connecting to LTA DataMall (CarParkAvailabilityv2)...');
  const [ltaCount, setLtaCount] = useState<number>(INITIAL_CARPARKS.length);
  const [oneMapStatus, setOneMapStatus] = useState<{ connected: boolean; message: string }>({
    connected: true,
    message: 'OneMap API Active (Search, RevGeocode, Routing)',
  });

  // User-Centric Driver Trip State (Origin & Destination)
  const [driverTrip, setDriverTrip] = useState<DriverTrip>({
    originName: 'Bishan / Central',
    originCoords: { lat: 1.3508, lng: 103.8485 },
    destinationName: 'ION Orchard / Orchard Rd',
    destinationCoords: { lat: 1.3040, lng: 103.8318 },
  });

  // Driver Preferences
  const [driverPreferences, setDriverPreferences] = useState<DriverPreferences>({
    evOnly: false,
    shelteredOnly: false,
  });

  // Toggle option to expand full directory if driver wants to browse all
  const [showAllCarparks, setShowAllCarparks] = useState(false);

  // Filter & Search States for full list (if opened)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedPartner, setSelectedPartner] = useState('all');
  const [highDemandOnly, setHighDemandOnly] = useState(false);
  const [sortBy, setSortBy] = useState('lots-desc');
  const [viewLayout, setViewLayout] = useState<'grid' | 'compact'>('grid');

  // Favorites & Selection
  const [favorites, setFavorites] = useState<string[]>(['cp-06', 'cp-04']);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedCarparkForDetails, setSelectedCarparkForDetails] = useState<Carpark | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Specs & API Key Modals
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Submit and Backend Top 3 Recommendations State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverRecommendations, setServerRecommendations] = useState<CarparkRecommendation[] | null>(null);
  const [lastSubmitInfo, setLastSubmitInfo] = useState<{
    destination: string;
    origin: string;
    time: string;
    totalAvailableLots?: number;
  } | null>(null);

  // Fetch live carpark availability from backend / serverless LTA DataMall endpoint
  const fetchLiveCarparksFromBackend = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchLiveCarparksApi();
      if (res && res.carparks && Array.isArray(res.carparks) && res.carparks.length > 0) {
        setCarparks(res.carparks);
        setApiSource(res.isLiveApi ? 'lta_datamall_live_v2' : 'lta_datamall_baseline');
        setIsLiveApi(res.isLiveApi);
        setApiNotice(res.notice || 'Connected to LTA DataMall (CarParkAvailabilityv2)');
        setLtaCount(res.count || res.carparks.length);
        setLastSyncTime(new Date());
        return;
      }
    } catch (err) {
      console.warn('Backend API request fallback:', err);
    } finally {
      setIsRefreshing(false);
    }

    // Fallback simulation if backend offline
    setCarparks((prev) =>
      prev.map((cp) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const newAvail = Math.max(0, Math.min(cp.totalLots, cp.availableLots + delta));
        return {
          ...cp,
          availableLots: newAvail,
          lastUpdated: 'Just now',
        };
      })
    );
    setLastSyncTime(new Date());
    setIsRefreshing(false);
  };

  // Handle Driver Click "Submit" to find Top 3 Carparks based on Destination and Availability
  const handleSubmitTrip = async () => {
    setIsSubmitting(true);
    try {
      // 1. Trigger backend recommendation engine (OneMap Geocoding & Routing + LTA DataMall vacancies)
      const res = await fetchTop3CarparksRecommendation({
        originName: driverTrip.originName,
        destinationName: driverTrip.destinationName,
        originCoords: driverTrip.originCoords,
        destinationCoords: driverTrip.destinationCoords,
        evOnly: driverPreferences.evOnly,
        shelteredOnly: driverPreferences.shelteredOnly,
      });

      if (res && res.success && Array.isArray(res.recommendations) && res.recommendations.length > 0) {
        setServerRecommendations(res.recommendations);
        if (res.origin?.coords && res.destination?.coords) {
          setDriverTrip((prev) => ({
            ...prev,
            originCoords: res.origin.coords,
            destinationCoords: res.destination.coords,
            originName: res.origin.name || prev.originName,
            destinationName: res.destination.name || prev.destinationName,
          }));
        }
      } else {
        setServerRecommendations(null);
      }

      // Also refresh live carpark feed
      await fetchLiveCarparksFromBackend();

      setLastSubmitInfo({
        destination: driverTrip.destinationName,
        origin: driverTrip.originName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });

      // Smooth scroll to top 3 recommendations
      setTimeout(() => {
        const element = document.getElementById('top-3-recommendations-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      console.warn('Submit trip recommendation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLiveCarparksFromBackend();
  }, []);

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => 
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  // Open carpark details
  const handleViewDetails = (carpark: Carpark) => {
    setSelectedCarparkForDetails(carpark);
    setIsDetailsModalOpen(true);
  };

  // Jump to specific carpark from flash alert
  const handleSelectFromAlert = (carparkId: string) => {
    const target = carparks.find((c) => c.id === carparkId);
    if (target) {
      setDriverTrip((prev) => ({
        ...prev,
        destinationName: target.name,
        destinationCoords: target.coordinates,
      }));
      handleViewDetails(target);
    }
  };

  // Compute TOP 3 Recommended Carparks based on Driver Trip and Availability (Fallback/Dynamic)
  const top3Recommendations: CarparkRecommendation[] = useMemo(() => {
    if (serverRecommendations && serverRecommendations.length > 0) {
      return serverRecommendations;
    }
    return getTop3RecommendedCarparks(carparks, driverTrip, driverPreferences);
  }, [carparks, driverTrip, driverPreferences, serverRecommendations]);

  // Full carparks list filter logic (for secondary browser)
  const filteredAllCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matches =
            cp.name.toLowerCase().includes(q) ||
            cp.address.toLowerCase().includes(q) ||
            cp.code.toLowerCase().includes(q) ||
            cp.region.toLowerCase().includes(q) ||
            cp.partner.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (selectedRegion !== 'All Regions' && cp.region !== selectedRegion) {
          return false;
        }

        if (selectedPartner !== 'all' && cp.partner !== selectedPartner) {
          return false;
        }

        if (driverPreferences.evOnly && (!cp.ev.hasEV || cp.ev.availableChargers === 0)) {
          return false;
        }

        if (highDemandOnly && !cp.isHighDemand) {
          return false;
        }

        if (driverPreferences.shelteredOnly && !cp.sheltered) {
          return false;
        }

        if (showFavoritesOnly && !favorites.includes(cp.id)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'lots-desc') return b.availableLots - a.availableLots;
        if (sortBy === 'lots-asc') return a.availableLots - b.availableLots;
        if (sortBy === 'distance-asc') return (a.distanceKm || 99) - (b.distanceKm || 99);
        if (sortBy === 'ev-desc') {
          const aEv = a.ev.hasEV ? a.ev.availableChargers : 0;
          const bEv = b.ev.hasEV ? b.ev.availableChargers : 0;
          return bEv - aEv;
        }
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [
    carparks, 
    searchTerm, 
    selectedRegion, 
    selectedPartner, 
    driverPreferences, 
    highDemandOnly, 
    showFavoritesOnly, 
    favorites, 
    sortBy
  ]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedRegion('All Regions');
    setSelectedPartner('all');
    setHighDemandOnly(false);
    setShowFavoritesOnly(false);
    setSortBy('lots-desc');
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    selectedRegion !== 'All Regions' ||
    selectedPartner !== 'all' ||
    highDemandOnly ||
    showFavoritesOnly
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Header
        onRefresh={fetchLiveCarparksFromBackend}
        isRefreshing={isRefreshing}
        onOpenSpecsModal={() => setIsSpecsModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        isLtaLive={isLiveApi}
        favoritesCount={favorites.length}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly((prev) => !prev)}
      />

      {/* Dual Government Backend API Services Status Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-300 px-4 sm:px-6 lg:px-8 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            {/* LTA DataMall Badge */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveApi ? 'bg-emerald-400' : 'bg-teal-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveApi ? 'bg-emerald-500' : 'bg-teal-500'}`} />
              </span>
              <span className="font-bold text-white">LTA DataMall:</span>
              <span className="text-emerald-300 font-mono text-[11px]">CarParkAvailabilityv2</span>
              <span className="text-[10px] text-slate-400">(HDB + LTA + URA)</span>
            </div>

            {/* OneMap SG Badge */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="font-bold text-white">OneMap GovTech:</span>
              <span className="text-cyan-300 font-mono text-[11px]">Elastic Search & Routingsvc</span>
              <span className="text-[10px] text-slate-400">(Token, Geocode, Drive/Walk)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] self-end md:self-auto">
            <span className="text-slate-400">
              Feed: <strong className="text-emerald-400 font-semibold">{isLiveApi ? 'Direct DataMall v2 Live' : 'LTA DataMall Baseline + Live Deltas'}</strong>
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">
              Last Sync: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* High Demand Flash Alert Banner */}
      <FlashAlertBanner
        alerts={flashAlerts}
        onSelectCarpark={handleSelectFromAlert}
        onFilterHighDemandOnly={() => {
          setShowAllCarparks(true);
          setHighDemandOnly((prev) => !prev);
        }}
        isHighDemandFilterActive={highDemandOnly}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* 1. KEY DRIVER INTERFACE: Origin & Destination Planner */}
        <DriverTripPlanner
          trip={driverTrip}
          onTripChange={(newTrip) => {
            setDriverTrip(newTrip);
            setServerRecommendations(null); // Clear previous static results so it updates reactively
          }}
          preferences={driverPreferences}
          onPreferencesChange={(newPrefs) => {
            setDriverPreferences(newPrefs);
            setServerRecommendations(null);
          }}
          onSubmitTrip={handleSubmitTrip}
          isSubmitting={isSubmitting}
          onRefreshAvailability={fetchLiveCarparksFromBackend}
          isRefreshing={isRefreshing}
          lastSubmitInfo={lastSubmitInfo}
        />

        {/* 2. TOP 3 RECOMMENDED CARPARKS (Primary Availability Output) */}
        <TopRecommendations
          recommendations={top3Recommendations}
          trip={driverTrip}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onViewDetails={handleViewDetails}
        />

        {/* 3. Real-time Overview Statistics Summary */}
        <StatsSummary carparks={carparks} />

        {/* 4. Optional Secondary Full Directory Browser Toggle */}
        <div className="pt-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Browse All Singapore Carparks ({carparks.length} Total in Feed)
                </h3>
                <p className="text-xs text-slate-500">
                  Search across LTA, URA, HDB, and Partner Malls across all regions.
                </p>
              </div>
            </div>

            <button
              id="toggle-all-carparks-btn"
              onClick={() => setShowAllCarparks((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
            >
              <span>{showAllCarparks ? 'Collapse Full List' : 'View Full Directory'}</span>
              {showAllCarparks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Collapsible Full Directory Search & Grid */}
          {showAllCarparks && (
            <div className="mt-4 space-y-4 pt-2 border-t border-slate-200">
              <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedRegion={selectedRegion}
                onSelectRegion={setSelectedRegion}
                selectedPartner={selectedPartner}
                onSelectPartner={setSelectedPartner}
                evOnly={driverPreferences.evOnly}
                onToggleEVOnly={() => setDriverPreferences(p => ({ ...p, evOnly: !p.evOnly }))}
                highDemandOnly={highDemandOnly}
                onToggleHighDemandOnly={() => setHighDemandOnly((prev) => !prev)}
                shelteredOnly={driverPreferences.shelteredOnly}
                onToggleShelteredOnly={() => setDriverPreferences(p => ({ ...p, shelteredOnly: !p.shelteredOnly }))}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewLayout={viewLayout}
                onViewLayoutChange={setViewLayout}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
              />

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <div>
                  Showing <strong className="text-slate-900">{filteredAllCarparks.length}</strong> carparks
                  {selectedRegion !== 'All Regions' && ` in ${selectedRegion}`}
                </div>
                <div className="text-[11px] text-slate-400">
                  Synced: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {filteredAllCarparks.length > 0 ? (
                <div className={
                  viewLayout === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                    : 'space-y-3'
                }>
                  {filteredAllCarparks.map((carpark) => (
                    <CarparkCard
                      key={carpark.id}
                      carpark={carpark}
                      isFavorite={favorites.includes(carpark.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onViewDetails={handleViewDetails}
                      layout={viewLayout}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md mx-auto">
                  <p className="text-sm font-semibold text-slate-800">No carparks match your filter</p>
                  <button
                    onClick={handleClearFilters}
                    className="mt-3 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-300"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Disqus Community Discussion & Driver Feedback */}
          <DisqusSection />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8 mt-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white">ParkFinder SG Driver Portal</span>
            <span>•</span>
            <span>Live LTA DataMall CarParkAvailabilityv2 Integration</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Agencies: LTA • HDB • URA • Malls</span>
            <button
              onClick={() => setIsSpecsModalOpen(true)}
              className="text-emerald-400 hover:underline font-medium"
            >
              View Specs & Master Prompt
            </button>
          </div>
        </div>
      </footer>

      {/* Carpark Deep Dive Drawer / Modal */}
      <CarparkDetailsModal
        carpark={selectedCarparkForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCarparkForDetails(null);
        }}
        isFavorite={selectedCarparkForDetails ? favorites.includes(selectedCarparkForDetails.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Miro Canvas & Master Prompt Modal */}
      <PromptReferenceModal
        isOpen={isSpecsModalOpen}
        onClose={() => setIsSpecsModalOpen(false)}
      />

      {/* LTA DataMall Key & Serverless Endpoints Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={() => {
          fetchLiveCarparksFromBackend();
        }}
      />
    </div>
  );
}
