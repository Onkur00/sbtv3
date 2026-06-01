/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { EnhancedChannel } from '../types.ts';
import { playBeep } from '../utils/beep.ts';

interface ChannelContainerProps {
  activeCategory: string;
  filteredChannels: EnhancedChannel[];
  allChannels: EnhancedChannel[];
  searchTerm: string;
  activeChannelUrl: string | null;
  onSelectChannel: (url: string, name: string, el?: HTMLElement) => void;
}

export const ChannelContainer: React.FC<ChannelContainerProps> = ({
  activeCategory,
  filteredChannels,
  allChannels,
  searchTerm,
  activeChannelUrl,
  onSelectChannel,
}) => {
  const isSearching = searchTerm.trim().length > 0;
  
  // High-performance dynamic rendering slice count (lazy loading)
  const [visibleCount, setVisibleCount] = useState(80);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  // Reset rendering slice when category or search changes
  useEffect(() => {
    setVisibleCount(80);
  }, [activeCategory, searchTerm]);

  // Set up intersection observer for infinite scroll triggers at bottom of grid
  useEffect(() => {
    if (activeCategory === 'all' && !isSearching) return; // Grouped rails handle slicing internally static

    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 60, filteredChannels.length));
        }
      },
      { rootMargin: '350px' } // Load more 350px before screen view for absolute fluid scroll experience
    );

    observerRef.current.observe(triggerEl);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [filteredChannels, activeCategory, isSearching]);

  // Custom key/Enter triggers for item card selection
  const handleItemClick = (ch: EnhancedChannel, e: React.MouseEvent<HTMLDivElement>) => {
    playBeep('select');
    onSelectChannel(ch.url, ch.name, e.currentTarget);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, ch: EnhancedChannel) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playBeep('select');
      onSelectChannel(ch.url, ch.name, e.currentTarget);
    }
  };

  // Helper to highlight matching characters in name during search
  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, idx) => 
          part.toLowerCase() === term.toLowerCase() ? (
            <span key={idx} className="bg-yellow-400 text-[#0f172a] font-bold px-0.5 rounded-sm">
              {part}
            </span>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </>
    );
  };

  // If user is in the "all" category and is NOT searching, represent grouped carousels
  if (activeCategory === 'all' && !isSearching) {
    const categoriesList = ['News', 'Sports', 'Kids', 'Bangla', 'Hindi', 'English'];
    
    // Group all channels by their display group title mapping
    const groupedMap = new Map<string, EnhancedChannel[]>();
    for (const ch of allChannels) {
      // Find matches for group title order
      let matchedGroup = 'Other';
      for (const cat of categoriesList) {
        if (ch.original.groupTitle.toLowerCase() === cat.toLowerCase() || ch.category.toLowerCase() === cat.toLowerCase()) {
          matchedGroup = cat;
          break;
        }
      }
      
      // If none matches but group title is defined (like "Akash Go" which is bangla), we fallback to groupTitle
      if (matchedGroup === 'Other' && ch.original.groupTitle) {
        matchedGroup = ch.original.groupTitle;
      }

      if (!groupedMap.has(matchedGroup)) {
        groupedMap.set(matchedGroup, []);
      }
      groupedMap.get(matchedGroup)!.push(ch);
    }

    // Sort sections so preferred order comes first
    const headingsOrder = [...categoriesList];
    groupedMap.forEach((_, key) => {
      if (!headingsOrder.includes(key)) headingsOrder.push(key);
    });

    return (
      <div className="px-5 py-0.5 bg-transparent">
        {headingsOrder.map((groupTitle) => {
          const channelsInGroup = groupedMap.get(groupTitle) || [];
          if (channelsInGroup.length === 0) return null;

          return (
            <div key={groupTitle} className="mb-2 last:mb-1 text-left">
              <h3 className="text-xs font-bold text-white mb-0.5 select-none tracking-wide uppercase">
                {groupTitle}
              </h3>
              
              <div 
                className="group-channel-grid flex flex-row overflow-x-auto gap-2 py-0.5 px-0.5 scrollbar-none whitespace-nowrap"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {channelsInGroup.slice(0, 50).map((ch) => {
                  const isActive = activeChannelUrl === ch.url;
                  return (
                    <div
                      key={`grouped-${ch.id}-${ch.category}`}
                      data-url={ch.url}
                      data-name={ch.name}
                      tabIndex={0}
                      onClick={(e) => handleItemClick(ch, e)}
                      onKeyDown={(e) => handleKeyDown(e, ch)}
                      className={`channel-logo-card shrink-0 w-16 h-16 sm:w-20 sm:h-20 p-1.5 bg-slate-900/40 backdrop-blur-xs rounded-2xl text-center cursor-pointer transition-all border flex items-center justify-center hover:bg-slate-800/60 focus-visible:outline-2 focus-visible:outline-white/40 outline-hidden hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] ${
                        isActive 
                          ? 'border-white bg-slate-800 ring-2 ring-white/50 shadow-lg scale-[1.02] font-bold active-channel' 
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <img 
                        src={ch.logoUrl || `https://placehold.co/160x160/1e293b/facc15?text=${ch.short}`} 
                        alt={ch.name} 
                        className={`w-full h-full rounded-xl mx-auto object-cover block transition-transform duration-300 ${
                          isActive ? 'shadow-lg shadow-white/20 scale-[1.01] border border-white' : 'shadow-md border border-white/5'
                        }`}
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://placehold.co/160x160/1e293b/facc15?text=${ch.short}`;
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Otherwise, render a single responsive flat grid layout
  const visibleChannels = filteredChannels.slice(0, visibleCount);

  return (
    <div className="px-5 py-1.5 bg-transparent">
      {filteredChannels.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm select-none">
          😞 No channels match your selection or search criteria.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
            {visibleChannels.map((ch) => {
              const isActive = activeChannelUrl === ch.url;
              return (
                <div
                  key={`flat-${ch.id}-${ch.category}`}
                  data-url={ch.url}
                  data-name={ch.name}
                  tabIndex={0}
                  onClick={(e) => handleItemClick(ch, e)}
                  onKeyDown={(e) => handleKeyDown(e, ch)}
                  className={`channel-logo-card p-1.5 bg-slate-900/40 backdrop-blur-xs rounded-2xl cursor-pointer transition-all border w-full aspect-square flex items-center justify-center hover:bg-slate-800/60 focus-visible:outline-2 focus-visible:outline-white/40 outline-hidden hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] ${
                    isActive 
                      ? 'border-white bg-slate-800 ring-2 ring-white/50 shadow-lg scale-[1.02] font-bold active-channel' 
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <img 
                    src={ch.logoUrl || `https://placehold.co/160x160/1e293b/facc15?text=${ch.short}`} 
                    alt={ch.name} 
                    className={`w-full h-full rounded-xl object-cover block transition-transform duration-300 ${
                      isActive ? 'shadow-lg shadow-white/20 scale-[1.01] border border-white' : 'shadow-md border border-white/5'
                    }`}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://placehold.co/160x160/1e293b/facc15?text=${ch.short}`;
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Trigger point for Infinite Scroll lazy loader loading more items */}
          {filteredChannels.length > visibleCount && (
            <div 
              ref={triggerRef} 
              className="py-6 flex justify-center items-center gap-2 text-slate-400 col-span-full select-none"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="text-[11px] font-mono tracking-widest uppercase">Loading additional channels...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
