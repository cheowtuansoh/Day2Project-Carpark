import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  ExternalLink,
  Zap,
  Server,
  Code2,
} from 'lucide-react';
import {
  getStoredLTAKey,
  setStoredLTAKey,
  verifyLTAKey,
  checkLTAStatus,
  LTAVerifyResult,
  LTAStatusResult,
} from '../utils/ltaApi';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [serverStatus, setServerStatus] = useState<LTAStatusResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<LTAVerifyResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredLTAKey();
      setInputKey(stored);
      loadStatus();
      setVerifyResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  const loadStatus = async () => {
    const status = await checkLTAStatus();
    setServerStatus(status);
  };

  const handleTestKey = async () => {
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyLTAKey(inputKey);
      setVerifyResult(result);
    } catch (err: any) {
      setVerifyResult({
        success: false,
        valid: false,
        statusCode: 500,
        message: err.message || 'Connection failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveKey = () => {
    setStoredLTAKey(inputKey);
    setSavedSuccess(true);
    onKeyUpdated();
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  const handleClearKey = () => {
    setInputKey('');
    setStoredLTAKey('');
    setVerifyResult(null);
    onKeyUpdated();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-800/80 border-b border-slate-700/80 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                LTA DataMall & Serverless Endpoints
              </h2>
              <p className="text-xs text-slate-400">
                Configure AccountKey to serve real-time LTA & HDB carpark feeds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Active Serverless Status Banner */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                Backend & Serverless Endpoints
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                Active / 200 OK
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                <div className="text-slate-400 text-[11px]">LTA Feed Endpoint</div>
                <div className="font-mono text-slate-200 text-[11px] truncate">GET /api/carparks/live</div>
              </div>
              <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Recommendation Engine</div>
                <div className="font-mono text-slate-200 text-[11px] truncate">POST /api/carparks/recommend</div>
              </div>
            </div>
          </div>

          {/* Key Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <span>LTA DataMall AccountKey</span>
              </label>
              <a
                href="https://datamall.lta.gov.sg/content/datamall/en/request-api.html"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 underline"
              >
                <span>Request Free Key at LTA</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="e.g. o7kH5J4u... or paste AccountKey"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Environment variables checked automatically: <code className="text-slate-300">LTA_DATAMALL_API_KEY</code>, <code className="text-slate-300">LTA_API_KEY</code>, <code className="text-slate-300">ACCOUNT_KEY</code>. You can also paste your key above to use it directly in this session.
            </p>
          </div>

          {/* Test & Save Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTestKey}
              disabled={isVerifying}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Testing Key...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleSaveKey}
              className="flex-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Save & Apply for Queries</span>
            </button>

            {inputKey && (
              <button
                onClick={handleClearKey}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition-colors"
                title="Clear custom session key"
              >
                Clear
              </button>
            )}
          </div>

          {/* Success Message */}
          {savedSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-600/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Key saved! Live queries will now use this AccountKey header.</span>
            </div>
          )}

          {/* Verification Result Feedback */}
          {verifyResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-1.5 animate-in fade-in ${
                verifyResult.valid
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {verifyResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>LTA DataMall Key Corresponding & Valid!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>LTA Key Verification Notice</span>
                  </>
                )}
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">{verifyResult.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Supported: LTA • HDB • URA • Malls</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
