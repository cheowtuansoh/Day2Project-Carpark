import React from 'react';
import { 
  Trophy, 
  Navigation, 
  Zap, 
  Car, 
  Clock, 
  Footprints, 
  Star, 
  ArrowUpRight, 
  ShieldCheck, 
  Flame, 
  CheckCircle2,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { CarparkRecommendation, DriverTrip } from '../types';

interface TopRecommendationsProps {
  recommendations: CarparkRecommendation[];
  trip: DriverTrip;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onViewDetails: (carpark: CarparkRecommendation) => void;
}

export const TopRecommendations: React.FC<TopRecommendationsProps> = ({
  recommendations,
  trip,
  favorites,
  onToggleFavorite,
  onViewDetails,
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Handle direct Google Maps turn-by-turn navigation from Origin to Carpark
  const handleStartDriving = (carpark: CarparkRecommendation, e: React.MouseEvent) => {
    e.stopPropagation();
    const originParam = encodeURIComponent(trip.originName);
    const destParam = encodeURIComponent(`${carpark.name}, ${carpark.address}`);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <section id="top-3-recommendations-section" className="space-y-4 scroll-mt-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shadow-xs flex-shrink-0">
            <Trophy className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Top 3 Recommended Carparks
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                ⚡ Ranked by Highest Vacancy
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live recommendations for trip from <strong className="text-slate-800">{trip.originName || 'Singapore'}</strong> to <strong className="text-amber-800">{trip.destinationName || 'Destination'}</strong>
            </p>
          </div>
        </div>

        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Top 3 based on OneMap & LTA DataMall
          </span>
        </div>
      </div>

      {/* Top 3 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {recommendations.map((carpark, index) => {
          const isFav = favorites.includes(carpark.id);
          const isRank1 = index === 0;
          const isRank2 = index === 1;

          // Rank styling
          const rankColors = isRank1
            ? {
                badge: 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50',
                border: 'border-emerald-500/80 shadow-md ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/30 to-white',
                numberBadge: 'bg-amber-400 text-slate-950 font-black',
                headerText: 'text-emerald-950',
              }
            : isRank2
            ? {
                badge: 'bg-sky-700 text-white shadow-xs',
                border: 'border-slate-300 hover:border-sky-400 shadow-xs bg-white',
                numberBadge: 'bg-slate-200 text-slate-800 font-bold',
                headerText: 'text-slate-900',
              }
            : {
                badge: 'bg-slate-800 text-white shadow-xs',
                border: 'border-slate-200 hover:border-slate-300 shadow-xs bg-white',
                numberBadge: 'bg-slate-100 text-slate-700 font-bold',
                headerText: 'text-slate-900',
              };

          // Status & Progress bar styling
          let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          let statusLabel = 'Plenty of Lots';
          let barBg = 'bg-emerald-500';

          if (carpark.availableLots <= 15 || carpark.lotPercentage < 10) {
            statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
            statusLabel = carpark.availableLots === 0 ? 'Full' : 'Almost Full';
            barBg = 'bg-rose-500';
          } else if (carpark.lotPercentage < 30) {
            statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
            statusLabel = 'Limited Lots';
            barBg = 'bg-amber-500';
          } else if (carpark.lotPercentage < 60) {
            statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
            statusLabel = 'Moderate Lots';
            barBg = 'bg-blue-500';
          }

          return (
            <div
              key={carpark.id}
              id={`top-recommendation-card-${index + 1}`}
              onClick={() => onViewDetails(carpark)}
              className={`rounded-3xl border ${rankColors.border} p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-lg relative overflow-hidden group`}
            >
              {/* Crown / Top Badge Ribbon */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-xl ${rankColors.numberBadge} flex items-center justify-center text-xs shadow-xs`}>
                    #{index + 1}
                  </span>
                  <span className={`text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-lg ${rankColors.badge}`}>
                    {carpark.recommendationTag}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(carpark.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                  title={isFav ? 'Remove bookmark' : 'Bookmark this carpark'}
                >
                  <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
              </div>

              {/* Carpark Identity */}
              <div>
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {carpark.partner}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {carpark.code}
                  </span>
                  {carpark.sheltered && (
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-sm">
                      Sheltered
                    </span>
                  )}
                </div>

                <h3 className={`text-base sm:text-lg font-black ${rankColors.headerText} group-hover:text-emerald-700 transition-colors leading-tight line-clamp-1`}>
                  {carpark.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {carpark.address}
                </p>

                {/* Key Driver Recommendation Reason Box */}
                <div className="mt-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-2.5 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {carpark.recommendationReason}
                  </p>
                </div>

                {/* Primary Availability Capacity Meter */}
                <div className="mt-3.5 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs">
                  <div className="flex items-end justify-between mb-1.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Live Vacancy
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">
                          {carpark.availableLots}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          / {carpark.totalLots} total lots
                        </span>
                      </div>
                    </div>

                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${statusBadgeClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Lot Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barBg}`}
                      style={{ width: `${Math.max(carpark.lotPercentage, 4)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>{carpark.lotPercentage}% capacity vacant</span>
                    <span>Synced {carpark.lastUpdated}</span>
                  </div>
                </div>

                {/* Driving ETA and Walking Distance Indicators */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {/* Driving ETA from Origin */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-tight">
                        Drive from Start
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        ~{carpark.driveEtaMinutes} mins ({carpark.driveDistanceKm} km)
                      </span>
                    </div>
                  </div>

                  {/* Walking Distance to Destination */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                      <Footprints className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-tight">
                        Walk to Target
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        {carpark.walkDistanceMeters <= 50 ? 'At venue' : `~${carpark.walkEtaMinutes} min (${carpark.walkDistanceMeters}m)`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* EV Charging summary */}
                <div className="mt-2.5">
                  {carpark.ev.hasEV ? (
                    <div className="bg-teal-50/80 border border-teal-200/80 rounded-xl p-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
                        <span className="font-bold text-teal-900">
                          {carpark.ev.availableChargers} of {carpark.ev.totalChargers} EV Bays Free
                        </span>
                      </div>
                      <span className="text-[10px] text-teal-700 font-medium truncate max-w-[110px]">
                        {carpark.ev.operator}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg">
                      <Zap className="w-3 h-3 text-slate-300" />
                      <span>No EV bays</span>
                    </div>
                  )}
                </div>

                {/* Pricing summary */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <div className="truncate pr-2">
                    <span className="text-slate-400">Rate: </span>
                    <span className="font-semibold text-slate-700">{carpark.pricingWeekday}</span>
                  </div>
                  <span className="text-emerald-700 font-semibold flex-shrink-0 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                    {carpark.gracePeriodMinutes}m free grace
                  </span>
                </div>
              </div>

              {/* Direct Driver Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2">
                <button
                  id={`drive-now-btn-${index + 1}`}
                  onClick={(e) => handleStartDriving(carpark, e)}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    isRank1
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Start Navigation</span>
                </button>

                <button
                  id={`view-details-btn-${index + 1}`}
                  onClick={() => onViewDetails(carpark)}
                  className="py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                  title="View Full Carpark & EV Specs"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Top 3 Matrix Summary Table for Fast Decision */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Quick Driver Comparison Matrix (Top 3)
          </h4>
        </div>
        <table className="w-full text-xs text-left text-slate-600">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider">
              <th className="pb-2 font-bold">Rank & Carpark</th>
              <th className="pb-2 font-bold text-center">Vacant Lots</th>
              <th className="pb-2 font-bold text-center">Drive Time</th>
              <th className="pb-2 font-bold text-center">Walk to Dest</th>
              <th className="pb-2 font-bold text-center">EV Chargers</th>
              <th className="pb-2 font-bold text-right">Grace Period</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {recommendations.map((cp, idx) => (
              <tr key={cp.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">#{idx + 1}</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[160px]">{cp.name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-center">
                  <span className="font-black text-emerald-700 text-sm bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {cp.availableLots} lots
                  </span>
                </td>
                <td className="py-2.5 text-center text-slate-700">
                  ~{cp.driveEtaMinutes} mins
                </td>
                <td className="py-2.5 text-center text-slate-700">
                  {cp.walkDistanceMeters <= 50 ? 'Direct Venue' : `${cp.walkDistanceMeters}m (${cp.walkEtaMinutes}m walk)`}
                </td>
                <td className="py-2.5 text-center">
                  {cp.ev.hasEV ? (
                    <span className="text-teal-700 font-semibold">{cp.ev.availableChargers}/{cp.ev.totalChargers} Free</span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-2.5 text-right font-semibold text-slate-700">
                  {cp.gracePeriodMinutes} mins
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
