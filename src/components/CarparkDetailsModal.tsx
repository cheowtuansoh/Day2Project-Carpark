import React from 'react';
import { 
  X, 
  Car, 
  Zap, 
  Navigation, 
  Flame, 
  Star, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Info,
  DollarSign,
  Shield,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Carpark } from '../types';

interface CarparkDetailsModalProps {
  carpark: Carpark | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const CarparkDetailsModal: React.FC<CarparkDetailsModalProps> = ({
  carpark,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  if (!isOpen || !carpark) return null;

  const lotPercentage = carpark.totalLots > 0 
    ? Math.round((carpark.availableLots / carpark.totalLots) * 100) 
    : 0;

  const handleOpenMaps = () => {
    const query = encodeURIComponent(`${carpark.name}, ${carpark.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                {carpark.partner} Verified Feed
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Code: {carpark.code}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {carpark.region}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {carpark.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{carpark.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(carpark.id)}
              className="p-2 rounded-full text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
              title="Bookmark"
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* High Demand Warning Alert */}
          {carpark.isHighDemand && (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-3">
              <Flame className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-900 text-sm">Active High Demand Flash Alert</h4>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  {carpark.demandAlertMsg}
                </p>
              </div>
            </div>
          )}

          {/* Real-time Capacity Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Car Lot Availability
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900">
                    {carpark.availableLots}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    Available / {carpark.totalLots} Total Bays
                  </span>
                </div>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-sm font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
                  {lotPercentage}% Free Capacity
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Synced {carpark.lastUpdated}</p>
              </div>
            </div>

            {/* Meter */}
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  carpark.availableLots < 20 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(lotPercentage, 4)}%` }}
              />
            </div>

            {/* Sub attributes: Motorcycle & Height */}
            <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Structure:</span>
                <span className="font-bold text-slate-800">{carpark.type} ({carpark.sheltered ? 'Sheltered' : 'Open Air'})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Height Limit:</span>
                <span className="font-bold text-slate-800">{carpark.heightLimit ? `${carpark.heightLimit}m` : 'No limit'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Motorcycle Lots:</span>
                <span className="font-bold text-slate-800">
                  {carpark.motorcycleLots ? `${carpark.motorcycleLots.available}/${carpark.motorcycleLots.total} Free` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* EV Charging Stations Section */}
          <div className="border border-teal-200/90 bg-teal-50/40 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Electric Vehicle (EV) Charging Station
                  </h4>
                  <p className="text-xs text-teal-800">
                    Operator: <span className="font-semibold">{carpark.ev.operator || 'Not installed'}</span>
                  </p>
                </div>
              </div>
              {carpark.ev.hasEV && (
                <span className="text-xs font-bold text-teal-800 bg-white border border-teal-300 px-2.5 py-1 rounded-full">
                  {carpark.ev.availableChargers} / {carpark.ev.totalChargers} Available
                </span>
              )}
            </div>

            {carpark.ev.hasEV ? (
              <div className="space-y-2 mt-3">
                {carpark.ev.chargerTypes.map((charger, idx) => (
                  <div 
                    key={idx}
                    className="bg-white p-3 rounded-xl border border-teal-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{charger.type}</span>
                      <span className="text-slate-500">Rate: {charger.pricePerKWh || '$0.55/kWh'}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold px-2 py-0.5 rounded-md ${
                        charger.available > 0 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {charger.available} / {charger.total} Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2">
                This carpark currently does not have dedicated EV charging bays installed.
              </p>
            )}
          </div>

          {/* Pricing & Parking Tariff Rates */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Parking Tariffs & Rates
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-500 block mb-1">Mondays to Fridays</span>
                <p className="font-bold text-slate-800 text-sm">{carpark.pricingWeekday}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-500 block mb-1">Weekends & Public Holidays</span>
                <p className="font-bold text-slate-800 text-sm">{carpark.pricingWeekend}</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
              <span>Grace period before charges apply:</span>
              <span className="font-bold text-slate-800">{carpark.gracePeriodMinutes} minutes free</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Close
          </button>

          <button
            onClick={handleOpenMaps}
            className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-md flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            <span>Open in Google Maps</span>
          </button>
        </div>
      </div>
    </div>
  );
};
