import React from 'react';
import { Search, SlidersHorizontal, Zap, Flame, Shield, X, MapPin, LayoutGrid, List } from 'lucide-react';
import { AgencyPartner } from '../types';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  selectedPartner: string;
  onSelectPartner: (partner: string) => void;
  evOnly: boolean;
  onToggleEVOnly: () => void;
  highDemandOnly: boolean;
  onToggleHighDemandOnly: () => void;
  shelteredOnly: boolean;
  onToggleShelteredOnly: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewLayout: 'grid' | 'compact';
  onViewLayoutChange: (layout: 'grid' | 'compact') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const REGIONS = [
  'All Regions',
  'Central / Orchard',
  'CBD / Marina',
  'North-East',
  'East',
  'West',
  'North',
];

const PARTNERS: Array<{ label: string; value: string; color: string }> = [
  { label: 'All Sources', value: 'all', color: 'border-slate-300 text-slate-700' },
  { label: 'LTA (Land Transport)', value: 'LTA', color: 'border-blue-300 text-blue-800 bg-blue-50/70' },
  { label: 'URA (Urban Dev)', value: 'URA', color: 'border-amber-300 text-amber-800 bg-amber-50/70' },
  { label: 'HDB (Housing Estates)', value: 'HDB', color: 'border-emerald-300 text-emerald-800 bg-emerald-50/70' },
  { label: 'Partner Malls', value: 'Key Partner Malls', color: 'border-purple-300 text-purple-800 bg-purple-50/70' },
];

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedRegion,
  onSelectRegion,
  selectedPartner,
  onSelectPartner,
  evOnly,
  onToggleEVOnly,
  highDemandOnly,
  onToggleHighDemandOnly,
  shelteredOnly,
  onToggleShelteredOnly,
  sortBy,
  onSortChange,
  viewLayout,
  onViewLayoutChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Row: Main Search bar & Sort dropdown & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="carpark-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by carpark name, street, postal code, mall, or landmark..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
          {searchTerm && (
            <button
              id="clear-search-btn"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <select
            id="sort-by-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer font-medium"
          >
            <option value="lots-desc">Lots: Most Available</option>
            <option value="lots-asc">Lots: Fewest (Congested)</option>
            <option value="distance-asc">Distance: Nearest</option>
            <option value="ev-desc">EV Chargers: Most Free</option>
            <option value="name-asc">Name: A to Z</option>
          </select>

          {/* Grid vs Compact List View */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="grid-layout-btn"
              onClick={() => onViewLayoutChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewLayout === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="compact-layout-btn"
              onClick={() => onViewLayoutChange('compact')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewLayout === 'compact' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Compact View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Second Row: Region Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1 flex-shrink-0">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          Region:
        </span>
        {REGIONS.map((region) => {
          const isSelected = selectedRegion === region;
          return (
            <button
              key={region}
              id={`region-pill-${region.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => onSelectRegion(region)}
              className={`px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {region}
            </button>
          );
        })}
      </div>

      {/* Third Row: Agency Partner Data Sources & Feature Toggles */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        {/* Agency Partners selection */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Source:
          </span>
          {PARTNERS.map((p) => {
            const isSelected = selectedPartner === p.value;
            return (
              <button
                key={p.value}
                id={`partner-btn-${p.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => onSelectPartner(p.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : `bg-white hover:bg-slate-50 ${p.color}`
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Feature Toggles (EV, High Demand, Sheltered) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* EV charging filter */}
          <button
            id="toggle-ev-btn"
            onClick={onToggleEVOnly}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-all ${
              evOnly
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-white text-teal-800 border-teal-200 hover:bg-teal-50/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>EV Charging Available</span>
          </button>

          {/* High Demand alerts filter */}
          <button
            id="toggle-high-demand-btn"
            onClick={onToggleHighDemandOnly}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-all ${
              highDemandOnly
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>High Demand Alerts</span>
          </button>

          {/* Sheltered filter */}
          <button
            id="toggle-sheltered-btn"
            onClick={onToggleShelteredOnly}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
              shelteredOnly
                ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Sheltered Only
          </button>

          {/* Reset button if active */}
          {hasActiveFilters && (
            <button
              id="clear-all-filters-btn"
              onClick={onClearFilters}
              className="text-xs text-slate-500 hover:text-slate-900 underline font-medium px-1"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
