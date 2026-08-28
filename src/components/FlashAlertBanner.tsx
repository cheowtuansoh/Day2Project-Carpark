import React from 'react';
import { AlertTriangle, Flame, ArrowRight, BellRing } from 'lucide-react';
import { FlashAlert } from '../types';

interface FlashAlertBannerProps {
  alerts: FlashAlert[];
  onSelectCarpark: (carparkId: string) => void;
  onFilterHighDemandOnly: () => void;
  isHighDemandFilterActive: boolean;
}

export const FlashAlertBanner: React.FC<FlashAlertBannerProps> = ({
  alerts,
  onSelectCarpark,
  onFilterHighDemandOnly,
  isHighDemandFilterActive,
}) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-rose-900/90 via-amber-950/90 to-rose-950 text-white border-y border-rose-700/50 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Alert Header Tag */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-rose-300">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>High Demand Flash Alerts</span>
            </div>
            <span className="bg-rose-800 text-rose-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {alerts.length} Hotspots
            </span>
          </div>

          {/* Alert Ticker / Carousel Cards */}
          <div className="flex-1 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  id={`flash-alert-${alert.id}`}
                  onClick={() => onSelectCarpark(alert.carparkId)}
                  className="flex items-center gap-2 bg-black/40 hover:bg-black/60 border border-rose-500/30 rounded-lg px-2.5 py-1 text-xs text-left transition-colors group"
                >
                  <span className="font-semibold text-rose-200 group-hover:text-white underline decoration-rose-400/50">
                    {alert.carparkName}
                  </span>
                  <span className="text-slate-300 line-clamp-1 max-w-[280px] sm:max-w-md text-[11px]">
                    {alert.message}
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono flex-shrink-0">
                    {alert.timestamp}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Toggle Filter */}
          <button
            id="toggle-high-demand-filter-btn"
            onClick={onFilterHighDemandOnly}
            className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-md font-medium border flex items-center gap-1 transition-all ${
              isHighDemandFilterActive
                ? 'bg-rose-500 text-white border-rose-400 shadow-xs'
                : 'bg-rose-950/60 hover:bg-rose-900 text-rose-200 border-rose-800'
            }`}
          >
            <span>{isHighDemandFilterActive ? 'Showing Alerts Only' : 'Filter Congested'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
