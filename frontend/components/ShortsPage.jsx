'use client';

import React, { useEffect, useState, useRef } from 'react';
import ShortsVideoPlayer from '@/components/ShortsVideoPlayer';
import { Loader2, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = ['For You', 'Latest', 'Trending', 'Maharashtra', 'India', 'Politics', 'Business', 'Sports', 'Technology', 'Entertainment', 'More+'];

const TRENDING = [
  'Mumbai BMC Elections',
  'Supreme Court',
  'Maharashtra Rains',
  'ISRO Mission',
  'Nitish Kumar',
  'Pune News',
  'Ayushman Bharat',
  'Cricket World Cup',
  'India vs Tech',
  'Uddhav Thackeray',
];

export default function ShortsPage({ setCurrentView }) {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('For You');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'player'
  const [activeShortIndex, setActiveShortIndex] = useState(0);
  const containerRef = useRef(null);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const res = await fetch('/api/shorts');
        const data = await res.json();
        if (data.shorts) setShorts(data.shorts);
      } catch (error) {
        console.error('Failed to fetch shorts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShorts();
  }, []);

  useEffect(() => {
    if (viewMode !== 'player') return;
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const currentIndex = Math.round(container.scrollTop / window.innerHeight);
      if (currentIndex !== activeIndexRef.current) {
        activeIndexRef.current = currentIndex;
        setActiveShortIndex(currentIndex);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [viewMode]);

  const openPlayer = (index) => {
    setActiveShortIndex(index);
    activeIndexRef.current = index;
    setViewMode('player');
  };

  // Full-screen player mode
  if (viewMode === 'player') {
    return (
      <div className="relative w-full h-[100dvh] bg-black overflow-hidden">
        <div className="absolute top-0 left-0 right-0 p-4 z-50 flex items-center justify-between pointer-events-none">
          <button onClick={() => setViewMode('grid')} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 pointer-events-auto transition-colors">
            ← Back
          </button>
          <div className="text-white font-bold tracking-widest text-lg drop-shadow-md">SHORTS</div>
          <div className="w-10" />
        </div>
        <div ref={containerRef} className="w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory hide-scrollbar" style={{ scrollBehavior: 'smooth' }}>
          {shorts.map((short, index) => (
            <div key={short.id || index} className="w-full h-[100dvh] snap-center relative">
              <ShortsVideoPlayer short={short} isActive={index === activeShortIndex} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ─── HERO BANNER ─── */}
      <div className="relative w-full overflow-hidden h-[160px] md:h-[200px]">
        <Image src="/premium_shorts_banner_1789523899842.jpg" alt="Shorts" fill className="absolute inset-0 object-cover object-[center_35%]" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col justify-center h-full">
          <div>
            <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">STARNEWS</p>
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-1">
              <span className="text-red-500">Shorts</span>
            </h1>
            <p className="text-gray-300 text-xs md:text-sm">Quick reads. Big stories. Stay informed in seconds.</p>
          </div>
        </div>
      </div>

      {/* ─── CATEGORY TABS ─── */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-30 shadow-sm py-2">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
            <div className="flex-1" />
            <div className="relative shrink-0">
              <input type="text" placeholder="Search shorts..." className="h-8 pl-3 pr-8 border border-gray-200 rounded-full text-xs bg-white focus:outline-none focus:border-red-400 w-40" />
              <svg className="absolute right-2.5 top-2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          {/* LEFT: Shorts Grid */}
          <div>
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              </div>
            ) : shorts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 font-bold text-lg mb-2">No Shorts Available</p>
                <p className="text-gray-300 text-sm">Check back soon for quick news updates!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-1">
                  {shorts.map((short, idx) => {
                    const isImage = short.mediaType === 'image';
                    const isYT = short.mediaUrl?.includes('youtube') || short.mediaUrl?.includes('youtu.be');
                    const ytMatch = short.mediaUrl?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                    const ytId = ytMatch?.[1];
                    const thumb = isImage ? short.mediaUrl : (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : short.thumbnailUrl);

                    return (
                      <div
                        key={short.id || idx}
                        className="cursor-pointer group relative aspect-square bg-gray-100 overflow-hidden"
                        onClick={() => openPlayer(idx)}
                      >
                        {/* Image */}
                        {thumb ? (
                          <img src={thumb} alt={short.title || 'Post'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => e.target.style.display = 'none'} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <Play className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        {/* Video indicator */}
                        {!isImage && (
                          <div className="absolute top-2 right-2">
                            <Play className="w-4 h-4 text-white drop-shadow-lg fill-white" />
                          </div>
                        )}
                        {/* Hover overlay — Instagram style */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-5">
                          <span className="flex items-center gap-1.5 text-white font-bold text-sm">
                            <Heart className="w-5 h-5 fill-white" />
                            {short.likes || Math.floor(Math.random() * 999 + 100)}
                          </span>
                          <span className="flex items-center gap-1.5 text-white font-bold text-sm">
                            <MessageCircle className="w-5 h-5 fill-white" />
                            {short.comments || Math.floor(Math.random() * 99 + 5)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center mt-6 mb-4">
                  <button className="border border-gray-200 text-gray-700 text-xs font-bold px-6 py-2.5 rounded-full hover:bg-gray-50 transition-colors">
                    Load More Posts ↓
                  </button>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-4">
            {/* Trending Topics */}
            <div className="border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
                  <span className="text-red-500">⚡</span> Trending Topics
                </h3>
                <button className="text-red-600 text-[10px] font-bold">View All</button>
              </div>
              <div className="space-y-2">
                {TRENDING.map((topic, idx) => (
                  <div key={topic} className="flex items-center gap-3 py-1 cursor-pointer group">
                    <span className="text-[10px] font-black text-gray-400 w-4 text-right">{idx + 1}</span>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-red-600 transition-colors flex-1 line-clamp-1">{topic}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Small Stories CTA */}
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-black">★</span>
                </div>
                <div>
                  <p className="text-white text-xs font-black">Small Stories</p>
                  <p className="text-gray-400 text-[10px]">Big Impact.</p>
                </div>
              </div>
              <p className="text-gray-400 text-[11px] mb-3">News that matters — in a format you love.</p>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-black py-2 rounded-lg transition-colors">Watch Now →</button>
            </div>

            {/* Categories */}
            <div className="border border-gray-100 rounded-xl p-4 shadow-sm">
              <h3 className="font-black text-sm text-gray-900 mb-3">Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Politics','City News','Business','Sports','Technology','Entertainment','Education','Health','Defense','International'].map(cat => (
                  <button key={cat} className="text-left text-[11px] text-gray-600 hover:text-red-600 font-bold py-1 flex items-center gap-1.5 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />{cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Be a Part of the Story */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="font-black text-sm text-gray-900 mb-1">Be a Part of the Story</h3>
              <p className="text-[11px] text-gray-500 mb-3">Share news insights or photos from your area.</p>
              <button onClick={() => setCurrentView && setCurrentView('home')} className="w-full block bg-red-600 hover:bg-red-700 text-white text-xs font-black py-2 rounded-lg text-center transition-colors">
                Back to Home →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
