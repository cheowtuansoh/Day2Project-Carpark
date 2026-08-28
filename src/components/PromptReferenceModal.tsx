import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Layers, 
  Copy, 
  Check, 
  ShieldCheck, 
  Users, 
  Zap,
  Globe2,
  Server,
  Key,
  Route,
  Navigation
} from 'lucide-react';

interface PromptReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MASTER_PROMPT_TEXT = `# the master prompt, assembled

# ---- R : ROLE --------------------------
You are a senior front-end developer:
vanilla JavaScript, responsive UI, and
serverless functions on Vercel. You follow
Material Design and hold every element
to WCAG 2.1 AA.

# ---- G : GOAL --------------------------
Build a carpark lot availability webpage with following features
1. Search by locations
2. View real time information on available carpark lots
3. View availability of EV charging station 
4. Provide flash alerts of high demand by locations

# ---- O : OUTPUT ------------------------
Deliver four files: index.html, styles.css,
app.js, api/insight.js. Semantic HTML5.
CSS Grid + Flexbox, mobile-first,
breakpoints at 768px / 1024px. Comment
every function: the reader knows HTML,
not JavaScript.

# ---- G : GUARDRAILS --------------------
Do NOT use React, Vue or Angular.
Do NOT write inline styles or handlers.
Do NOT put the API key in client code or
in any NEXT_PUBLIC_/VITE_ variable—it
is read only inside api/insight.js from
process.env.
Do NOT invent APIs; flag uncertainty.
Validate every user input server-side.

# ---- C : CONTEXT -----------------------
Audience: Car owners and motorists
Environment: built in Google AI Studio,
versioned on GitHub, hosted on Vercel.
Resources: data/customers.json is already
in the repo, 12 months of records.
Purpose: live workshop demo with a
Gemini-powered insight panel.

> **Rule of thumb**
> Save this. It is an asset, not a message—version it like code, and change one block at a time when the output is wrong.`;

export const PromptReferenceModal: React.FC<PromptReferenceModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'apis' | 'canvas' | 'prompt'>('apis');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(MASTER_PROMPT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Backend Connections & Architecture
              </h2>
              <p className="text-xs text-slate-500">
                Real-time integration with LTA DataMall and OneMap GovTech APIs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 border-b border-slate-100 flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('apis')}
            className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'apis'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Backend API Connections
          </button>
          <button
            onClick={() => setActiveTab('canvas')}
            className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'canvas'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Business Canvas & Key Partners
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'prompt'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Master Prompt (Markdown)
          </button>
        </div>

        {/* Tab 1: Backend APIs */}
        {activeTab === 'apis' && (
          <div className="p-6 space-y-6">
            {/* LTA DataMall Box */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  1. LTA DataMall Real-Time Carpark Service
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Queries live lot vacancy across HDB, LTA, URA, and major shopping mall carparks across Singapore.
              </p>
              <div className="bg-slate-900 rounded-xl p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                <code>GET https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2</code>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Header: <code className="text-emerald-700 font-mono">AccountKey: &lt;LTA_DATAMALL_API_KEY&gt;</code></li>
                <li>App Route: <code className="text-slate-800 font-semibold font-mono">GET /api/carparks/live</code></li>
              </ul>
            </div>

            {/* OneMap GovTech Suite Box */}
            <div className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  2. OneMap Singapore GovTech API Suite
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Provides official Singapore location search, reverse geocoding, and routing ETA calculations.
              </p>

              <div className="space-y-3">
                {/* 1. Token */}
                <div className="bg-white border border-cyan-100 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 mb-1">
                    <Key className="w-3.5 h-3.5 text-cyan-600" />
                    <span>A. Mint a Token (Lasts 3 days / 72 hours)</span>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-2 text-[11px] font-mono text-cyan-300 overflow-x-auto mb-1">
                    <code>POST https://www.onemap.gov.sg/api/auth/post/getToken</code>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    JSON Body: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{`{"email":"...","password":"..."}`}</code>
                  </p>
                </div>

                {/* 2. Geocode Search */}
                <div className="bg-white border border-cyan-100 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 mb-1">
                    <Navigation className="w-3.5 h-3.5 text-cyan-600" />
                    <span>B. Geocode / Search (Elastic Search)</span>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-2 text-[11px] font-mono text-cyan-300 overflow-x-auto mb-1">
                    <code>GET https://www.onemap.gov.sg/api/common/elastic/search?searchVal=raffles%20place&returnGeom=Y&getAddrDetails=Y&pageNum=1</code>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Authorization Header officially required. App Route: <code className="text-slate-800 font-semibold font-mono">/api/onemap/search?searchVal=...</code>
                  </p>
                </div>

                {/* 3. Reverse Geocode */}
                <div className="bg-white border border-cyan-100 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 mb-1">
                    <Globe2 className="w-3.5 h-3.5 text-cyan-600" />
                    <span>C. Reverse Geocode</span>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-2 text-[11px] font-mono text-cyan-300 overflow-x-auto mb-1">
                    <code>GET https://www.onemap.gov.sg/api/public/revgeocode?location=1.3,103.8&buffer=40&addressType=All</code>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Converts GPS coordinates into real Singapore building & street names. App Route: <code className="text-slate-800 font-semibold font-mono">/api/onemap/revgeocode</code>
                  </p>
                </div>

                {/* 4. Routing */}
                <div className="bg-white border border-cyan-100 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 mb-1">
                    <Route className="w-3.5 h-3.5 text-cyan-600" />
                    <span>D. Routing (Drive & Walk)</span>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-2 text-[11px] font-mono text-cyan-300 overflow-x-auto mb-1">
                    <code>GET https://www.onemap.gov.sg/api/public/routingsvc/route?start=1.32,103.84&end=1.30,103.83&routeType=drive</code>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Computes turn-by-turn routes, distance, and transit times across Singapore road networks.
                  </p>
                </div>
              </div>
            </div>

            {/* Combined Top 3 Carpark Recommendation Engine Box */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  3. OneMap + LTA DataMall Top 3 Recommendation Pipeline
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Triggered when user inputs Origin + Destination and clicks <strong>Submit</strong>. Geocodes destination via OneMap Elastic Search, queries LTA DataMall real-time vacant lot feed, calculates driving/walking distances, and ranks the Top 3 carparks based on highest availability.
              </p>
              <div className="bg-slate-900 rounded-xl p-3 text-[11px] font-mono text-amber-300 overflow-x-auto">
                <code>POST /api/carparks/recommend</code>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Business Canvas */}
        {activeTab === 'canvas' && (
          <div className="p-6 space-y-6">
            {/* Key Partners Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Key Partners (Carpark & Geospatial Data)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Government and Commercial Stakeholders providing real-time data pipelines:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl text-center shadow-xs">
                  <span className="font-black text-blue-900 text-base block">LTA</span>
                  <span className="text-[11px] text-blue-700 font-medium">Land Transport Authority (Public carparks)</span>
                </div>
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl text-center shadow-xs">
                  <span className="font-black text-amber-900 text-base block">URA</span>
                  <span className="text-[11px] text-amber-700 font-medium">Urban Redevelopment Authority</span>
                </div>
                <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-xl text-center shadow-xs">
                  <span className="font-black text-emerald-900 text-base block">HDB</span>
                  <span className="text-[11px] text-emerald-700 font-medium">Housing & Development Board</span>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-xl text-center shadow-xs">
                  <span className="font-black text-purple-900 text-base block">OneMap / SLA</span>
                  <span className="text-[11px] text-purple-700 font-medium">Singapore Land Authority (Geospatial & Routing)</span>
                </div>
              </div>
            </div>

            {/* Target Audience & Value Proposition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-sm">Target Audience</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Car owners, EV drivers, and motorists</strong> seeking frictionless parking, zero cruising time, clear parking rates, and real-time charging bay status across Singapore.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-teal-600" />
                  <h4 className="font-bold text-slate-900 text-sm">Core Value Propositions</h4>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Origin & Destination trip planning with OneMap geocoding</li>
                  <li>Top 3 availability recommendations ranked by vacant lot counts</li>
                  <li>Real-time lot availability percentage and EV charger status</li>
                  <li>Flash alerts during peak rush demand</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Master Prompt Raw View */}
        {activeTab === 'prompt' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                File: <code className="text-indigo-600">/MASTER_PROMPT.md</code>
              </span>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 overflow-x-auto text-emerald-400 font-mono text-xs leading-relaxed max-h-[50vh]">
              <pre>{MASTER_PROMPT_TEXT}</pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
