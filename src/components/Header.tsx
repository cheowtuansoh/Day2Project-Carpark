import React from 'react';
import { Car, Zap, RefreshCw, Layers, ShieldCheck, Key, Server } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenSpecsModal: () => void;
  onOpenApiKeyModal: () => void;
  isLtaLive: boolean;
  favoritesCount: number;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  onOpenSpecsModal,
  onOpenApiKeyModal,
  isLtaLive,
  favoritesCount,
  showFavoritesOnly,
  onToggleFavorites,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-white">
                  ParkFinder <span className="text-emerald-400 font-semibold">SG</span>
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                  isLtaLive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isLtaLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {isLtaLive ? 'LTA LIVE' : 'DATA READY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Real-time Carpark & EV Charging Resource for Motorists
              </p>
            </div>
          </div>

          {/* Partner Badges & Quick Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Integrated Agency Partners Pill */}
            <div className="hidden xl:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-slate-400">Sources:</span>
              <span className="font-semibold text-blue-300">LTA</span>
              <span>•</span>
              <span className="font-semibold text-amber-300">URA</span>
              <span>•</span>
              <span className="font-semibold text-emerald-300">HDB</span>
              <span>•</span>
              <span className="font-semibold text-purple-300">Malls</span>
            </div>

            {/* API Key & Serverless Endpoints Manager */}
            <button
              id="api-key-manager-btn"
              onClick={onOpenApiKeyModal}
              className="p-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1.5"
              title="Configure and test LTA API Key and Serverless Endpoints"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">LTA Key</span>
            </button>

            {/* Saved Bookmarks */}
            <button
              id="favorites-toggle-btn"
              onClick={onToggleFavorites}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 border ${
                showFavoritesOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>★ Saved</span>
              {favoritesCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Live Refresh */}
            <button
              id="refresh-feed-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Refresh real-time lot availability"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
            </button>

            {/* Specs / Canvas Info Button */}
            <button
              id="open-specs-modal-btn"
              onClick={onOpenSpecsModal}
              className="p-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 transition-colors flex items-center gap-1.5"
              title="View Business Canvas & Master Prompt"
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300" />
              <span className="hidden md:inline">Project Specs</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
