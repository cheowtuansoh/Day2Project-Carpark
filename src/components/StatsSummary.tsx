import React from 'react';
import { Car, Zap, CheckCircle2, AlertOctagon, Building2 } from 'lucide-react';
import { Carpark } from '../types';

interface StatsSummaryProps {
  carparks: Carpark[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ carparks }) => {
  const totalLots = carparks.reduce((acc, cp) => acc + cp.totalLots, 0);
  const availableLots = carparks.reduce((acc, cp) => acc + cp.availableLots, 0);
  const totalEV = carparks.reduce((acc, cp) => acc + (cp.ev.hasEV ? cp.ev.totalChargers : 0), 0);
  const availableEV = carparks.reduce((acc, cp) => acc + (cp.ev.hasEV ? cp.ev.availableChargers : 0), 0);
  const highDemandCount = carparks.filter((cp) => cp.isHighDemand).length;
  const occupancyRate = totalLots > 0 ? Math.round(((totalLots - availableLots) / totalLots) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Available Lots */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Lots</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {availableLots.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ {totalLots.toLocaleString()}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600">
            <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${100 - occupancyRate}%` }}
              />
            </div>
            <span>{100 - occupancyRate}% Free capacity</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <Car className="w-6 h-6" />
        </div>
      </div>

      {/* EV Charging Availability */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">EV Chargers Free</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-600">
              {availableEV}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ {totalEV} Active</span>
          </div>
          <p className="text-[11px] text-teal-700 font-medium mt-1">
            Fast DC & AC 22kW charging
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-6 h-6 fill-teal-500/30" />
        </div>
      </div>

      {/* High Demand Alerts */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Demand Hotspots</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl sm:text-3xl font-extrabold ${highDemandCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {highDemandCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Flash alert areas</span>
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-1">
            {highDemandCount > 0 ? 'High occupancy detected' : 'Normal flow across zones'}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          highDemandCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
        }`}>
          <AlertOctagon className="w-6 h-6" />
        </div>
      </div>

      {/* Data Source Partners */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Partner Feeds</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
              4 Agencies
            </span>
          </div>
          <p className="text-[11px] text-indigo-700 font-medium mt-1">
            LTA • URA • HDB • Malls
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
