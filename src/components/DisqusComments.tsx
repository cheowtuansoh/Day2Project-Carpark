import React, { useState } from 'react';
import { MessageSquare, MessageCircle, ChevronDown, ChevronUp, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';

interface DisqusCommentsProps {
  currentLocation: { id: string; name: string };
  shortname?: string;
}

export const DisqusComments: React.FC<DisqusCommentsProps> = ({
  currentLocation,
  shortname = 'day2-project-carpark'
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const embedSrc = `/disqus-embed.html?shortname=${shortname}&id=${encodeURIComponent(currentLocation.id)}&title=${encodeURIComponent(currentLocation.name)}`;

  return (
    <section className="bg-white rounded-3xl p-6 border-2 border-[#efe7d9] flex flex-col gap-6 mt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#fbf3e4] rounded-2xl">
            <MessageSquare className="w-6 h-6 text-[#4A7856]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1e1b13]">Discussion & Tips</h2>
            <p className="text-xs text-[#717971]">Day2-project-carpark</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://${shortname}.disqus.com`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fbf3e4] hover:bg-[#f5ebd6] border border-[#e9e2d3] text-xs font-bold text-[#5D4037] transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#4A7856]" />
            <span>Disqus ({shortname})</span>
            <ExternalLink className="w-3 h-3 text-[#717971]" />
          </a>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-full hover:bg-[#f7f2ea] text-[#717971] transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="min-h-[380px] relative flex flex-col gap-2">
          <div className="bg-[#fbf9f5] rounded-2xl p-2 border border-[#e9e2d3]/80 overflow-hidden">
            <iframe
              key={`${currentLocation.id}-${reloadKey}`}
              src={embedSrc}
              title={`Disqus Comments for ${currentLocation.name}`}
              className="w-full min-h-[420px] md:min-h-[480px] border-0 bg-transparent"
              loading="lazy"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#717971] px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#90BE6D]" />
              Disqus discussion (language: US English)
            </span>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="flex items-center gap-1 hover:text-[#5D4037] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Frame</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
