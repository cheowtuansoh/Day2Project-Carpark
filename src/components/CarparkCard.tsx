import React from 'react';
import { 
  Car, 
  Zap, 
  Navigation, 
  Flame, 
  Star, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight, 
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Carpark } from '../types';

interface CarparkCardProps {
  carpark: Carpark;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onViewDetails: (carpark: Carpark) => void;
  layout?: 'grid' | 'compact';
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
  layout = 'grid',
}) => {
  const lotPercentage = carpark.totalLots > 0 
    ? Math.round((carpark.availableLots / carpark.totalLots) * 100) 
    : 0;

  // Compute status
  let statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let statusText = 'Plenty of Lots';
  let barColor = 'bg-emerald-500';

  if (carpark.availableLots <= 15 || lotPercentage < 10) {
    statusColor = 'bg-rose-50 text-rose-700 border-rose-200';
    statusText = carpark.availableLots === 0 ? 'Full' : 'Almost Full';
    barColor = 'bg-rose-500';
  } else if (lotPercentage < 30) {
    statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
    statusText = 'Limited Lots';
    barColor = 'bg-amber-500';
  } else if (lotPercentage < 60) {
    statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
    statusText = 'Moderate Lots';
    barColor = 'bg-blue-500';
  }

  // Partner styling
  const partnerBadgeClasses = {
    'LTA': 'bg-blue-50 text-blue-700 border-blue-200',
    'URA': 'bg-amber-50 text-amber-800 border-amber-200',
    'HDB': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Key Partner Malls': 'bg-purple-50 text-purple-700 border-purple-200',
  }[carpark.partner] || 'bg-slate-100 text-slate-700 border-slate-200';

  const handleOpenMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = encodeURIComponent(`${carpark.name}, ${carpark.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  if (layout === 'compact') {
    return (
      <div 
        id={`carpark-compact-${carpark.id}`}
        onClick={() => onViewDetails(carpark)}
        className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(carpark.id);
            }}
            className="text-slate-400 hover:text-amber-500 transition-colors mt-0.5"
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">{carpark.name}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${partnerBadgeClasses}`}>
                {carpark.partner}
              </span>
              {carpark.isHighDemand && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse">
                  <Flame className="w-3 h-3" />
                  HIGH DEMAND
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">{carpark.address}</p>
          </div>
        </div>

        {/* Lots, EV and Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          {/* Real-time lot number */}
          <div className="text-left sm:text-right">
            <div className="flex items-baseline gap-1 sm:justify-end">
              <span className="text-lg sm:text-xl font-black text-slate-900">{carpark.availableLots}</span>
              <span className="text-xs text-slate-400">/ {carpark.totalLots}</span>
            </div>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border ${statusColor}`}>
              {statusText}
            </span>
          </div>

          {/* EV status */}
          <div className="min-w-[100px] text-left sm:text-right hidden sm:block">
            {carpark.ev.hasEV ? (
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-teal-600" />
                  {carpark.ev.availableChargers}/{carpark.ev.totalChargers} EV Free
                </span>
                <span className="text-[10px] text-slate-400">{carpark.ev.operator}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">No EV</span>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={handleOpenMaps}
            className="p-2 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
            title="Directions"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      id={`carpark-card-${carpark.id}`}
      onClick={() => onViewDetails(carpark)}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
    >
      {/* Top Details & Header */}
      <div className="p-5 pb-3">
        {/* Top meta line */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${partnerBadgeClasses}`}>
              {carpark.partner}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {carpark.code}
            </span>
            {carpark.distanceKm !== undefined && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                ~{carpark.distanceKm} km away
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(carpark.id);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
            title={isFavorite ? 'Remove bookmark' : 'Bookmark this carpark'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Name & Address */}
        <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
          {carpark.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
          {carpark.address}
        </p>

        {/* High Demand Flash Alert Banner on Card */}
        {carpark.isHighDemand && (
          <div className="mt-3 bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 flex items-start gap-2">
            <Flame className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5 fill-rose-500/20" />
            <div className="text-xs">
              <span className="font-bold text-rose-700 uppercase tracking-tight block">
                Flash Alert: High Demand
              </span>
              <p className="text-rose-900/90 text-[11px] leading-tight mt-0.5">
                {carpark.demandAlertMsg}
              </p>
            </div>
          </div>
        )}

        {/* Real-time Lot Capacity Meter */}
        <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <div className="flex items-end justify-between mb-1.5">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Available Lots
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">
                  {carpark.availableLots}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  / {carpark.totalLots} lots
                </span>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${statusColor}`}>
              {statusText}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.max(lotPercentage, 3)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
            <span>{lotPercentage}% space remaining</span>
            <span>Updated {carpark.lastUpdated}</span>
          </div>
        </div>

        {/* EV Charging Station Indicator */}
        <div className="mt-3">
          {carpark.ev.hasEV ? (
            <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-teal-900">
                      {carpark.ev.availableChargers} of {carpark.ev.totalChargers} EV Ports Free
                    </span>
                  </div>
                  <p className="text-[10px] text-teal-700">
                    {carpark.ev.operator || 'Fast Charging Station'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-teal-800 bg-white border border-teal-200 px-2 py-0.5 rounded-full">
                {carpark.ev.availableChargers > 0 ? 'Ready' : 'In Use'}
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
              <Zap className="w-3.5 h-3.5 text-slate-300" />
              <span>No EV charging bays currently installed</span>
            </div>
          )}
        </div>

        {/* Pricing snippet & Height Limit */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block">Weekday Rates:</span>
            <span className="font-semibold text-slate-700 line-clamp-1">{carpark.pricingWeekday}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Grace Period:</span>
            <span className="font-semibold text-slate-700">{carpark.gracePeriodMinutes} mins free</span>
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="bg-slate-50/80 border-t border-slate-200 px-5 py-3 flex items-center justify-between gap-2">
        <button
          onClick={() => onViewDetails(carpark)}
          className="text-xs font-semibold text-slate-700 hover:text-emerald-700 flex items-center gap-1 transition-colors"
        >
          <span>Full Rates & Bay Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleOpenMaps}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors shadow-2xs"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-700" />
          <span>Navigate</span>
        </button>
      </div>
    </div>
  );
};
