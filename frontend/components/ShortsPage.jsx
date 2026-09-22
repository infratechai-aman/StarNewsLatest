'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import ShortsVideoPlayer from '@/components/ShortsVideoPlayer';
import {
  Loader2,
  Heart,
  MessageCircle,
  Play,
  ArrowLeft,
  Grid3x3,
  Smartphone,
  Search,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Share2
} from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

const CATEGORIES = [
  'All',
  'Trending',
  'Latest',
  'Maharashtra',
  'Politics',
  'City News',
  'Crime',
  'Business',
  'Sports',
  'Entertainment'
];

const TRENDING_BY_LANG = {
  en: [
    'Mumbai BMC Elections',
    'Maharashtra Monsoon Alert',
    'Supreme Court Hearing',
    'ISRO Space Mission',
    'Pune Metro Update',
    'Cricket World Championship',
    'Tech AI Innovations'
  ],
  mr: [
    'मुंबई महापालिका निवडणुका',
    'महाराष्ट्र मान्सून अलर्ट',
    'सर्वोच्च न्यायालय सुनावणी',
    'इस्रो अंतराळ मोहीम',
    'पुणे मेट्रो अपडेट',
    'क्रिकेट विश्व अजिंक्यपद',
    'टेक आणि एआय क्रांती'
  ],
  hi: [
    'मुंबई बीएमसी चुनाव',
    'महाराष्ट्र मानसून अलर्ट',
    'सुप्रीम कोर्ट सुनवाई',
    'इसरो अंतरिक्ष मिशन',
    'पुणे मेट्रो अपडेट',
    'क्रिकेट विश्व चैंपियनशिप',
    'टेक एआई नवाचार'
  ]
};

export default function ShortsPage({ setCurrentView }) {
  const { t, language } = useLanguage();
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  
  // 'feed' (Instagram Reels / YouTube Shorts full-screen swipe) | 'grid' (Explore grid)
  const [viewMode, setViewMode] = useState('feed');
  const [activeShortIndex, setActiveShortIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef(null);
  const activeIndexRef = useRef(0);

  const trendingList = TRENDING_BY_LANG[language] || TRENDING_BY_LANG.en;

  // Translate categories
  const getCatLabel = (cat) => {
    const keyMap = {
      'All': 'allNews',
      'Latest': 'latest',
      'Trending': 'trending',
      'Maharashtra': 'maharashtra',
      'Politics': 'politics',
      'City News': 'cityNews',
      'Crime': 'crime',
      'Business': 'business',
      'Sports': 'sports',
      'Entertainment': 'entertainment'
    };
    const key = keyMap[cat];
    if (cat === 'Maharashtra' && !t('maharashtra')) {
      return language === 'mr' ? 'महाराष्ट्र' : language === 'hi' ? 'महाराष्ट्र' : 'Maharashtra';
    }
    return key ? (t(key) || cat) : cat;
  };

  // Detect mobile view on mount and automatically enter Reels / Shorts feed mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (mobile) {
          setViewMode('feed');
        }
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Fetch shorts
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

  // Filtered shorts by category and search
  const filteredShorts = useMemo(() => {
    return shorts.filter((short) => {
      const matchesCategory =
        activeCategory === 'All' ||
        (short.category && short.category.toLowerCase() === activeCategory.toLowerCase());
      const matchesSearch =
        !searchQuery.trim() ||
        (short.title && short.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (short.caption && short.caption.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [shorts, activeCategory, searchQuery]);

  // Track active index during scroll in Feed mode
  useEffect(() => {
    if (viewMode !== 'feed') return;
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const height = container.clientHeight || window.innerHeight;
      const currentIndex = Math.round(container.scrollTop / height);
      if (currentIndex !== activeIndexRef.current && currentIndex >= 0 && currentIndex < filteredShorts.length) {
        activeIndexRef.current = currentIndex;
        setActiveShortIndex(currentIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [viewMode, filteredShorts.length]);

  // Desktop keyboard navigation (Up / Down arrows to switch short)
  useEffect(() => {
    if (viewMode !== 'feed') return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollToShort(activeShortIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollToShort(activeShortIndex - 1);
      } else if (e.key === 'm') {
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, activeShortIndex, filteredShorts.length]);

  const scrollToShort = (index) => {
    if (index < 0 || index >= filteredShorts.length) return;
    setActiveShortIndex(index);
    activeIndexRef.current = index;
    if (containerRef.current) {
      const height = containerRef.current.clientHeight || window.innerHeight;
      containerRef.current.scrollTo({
        top: index * height,
        behavior: 'smooth',
      });
    }
  };

  const openInFeed = (index) => {
    setActiveShortIndex(index);
    activeIndexRef.current = index;
    setViewMode('feed');
  };

  const handleBackNavigation = () => {
    if (setCurrentView) {
      setCurrentView('home');
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. INSTAGRAM REELS & YOUTUBE SHORTS COMBINED FEED VIEW (Mobile & Fullscreen)
  // ─────────────────────────────────────────────────────────────────────────────
  if (viewMode === 'feed') {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden select-none">
        
        {/* ── TOP FLOATING HEADER (YouTube Shorts / Instagram Reels Overlay) ── */}
        <div className="absolute top-0 left-0 right-0 z-50 pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-3 pb-4 px-3 sm:px-6">
          <div className="flex items-center justify-between gap-2 max-w-[1200px] mx-auto">
            {/* Left: Back Button & Branding */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackNavigation}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 active:scale-95 transition-all border border-white/10"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {/* YouTube Shorts + Instagram Reels Badge */}
              <div className="flex items-center gap-1.5 bg-red-600/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-lg border border-red-400/30">
                <Flame className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
                <span className="text-white font-black text-xs tracking-wider uppercase">
                  Shorts
                </span>
              </div>
            </div>

            {/* Center / Right: Action Pills */}
            <div className="flex items-center gap-2">
              {/* Toggle to Grid View */}
              <button
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/90 hover:text-white text-xs font-semibold hover:bg-black/60 transition-all active:scale-95"
                title="Switch to Grid View"
              >
                <Grid3x3 className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Grid</span>
              </button>

              {/* Global Mute / Unmute */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border border-white/15 active:scale-95 transition-all"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>

          {/* YouTube Shorts Horizontal Category Pills Bar */}
          <div className="mt-2.5 max-w-[1200px] mx-auto overflow-x-auto hide-scrollbar flex items-center gap-1.5 px-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setActiveShortIndex(0);
                  if (containerRef.current) containerRef.current.scrollTop = 0;
                }}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight transition-all duration-200 border ${
                  activeCategory === cat
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-black/40 backdrop-blur-md text-white/80 hover:text-white border-white/10 hover:bg-white/10'
                }`}
              >
                {getCatLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* ── DESKTOP VERTICAL NAVIGATION ARROWS (YouTube Shorts Desktop signature) ── */}
        {!isMobile && (
          <div className="hidden md:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-40">
            <button
              onClick={() => scrollToShort(activeShortIndex - 1)}
              disabled={activeShortIndex === 0}
              className="p-3 rounded-full bg-neutral-900/80 backdrop-blur-md border border-neutral-700 text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xl active:scale-90"
              title="Previous Short (Up Arrow)"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <button
              onClick={() => scrollToShort(activeShortIndex + 1)}
              disabled={activeShortIndex === filteredShorts.length - 1}
              className="p-3 rounded-full bg-neutral-900/80 backdrop-blur-md border border-neutral-700 text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xl active:scale-90"
              title="Next Short (Down Arrow)"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* ── MAIN VERTICAL SWIPEABLE REELS / SHORTS CONTAINER ── */}
        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-neutral-950">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
              <p className="text-neutral-400 text-xs font-semibold">
                {language === 'mr' ? 'शॉर्ट्स लोड होत आहेत...' : language === 'hi' ? 'शॉर्ट्स लोड हो रहे हैं...' : 'Loading Shorts...'}
              </p>
            </div>
          ) : filteredShorts.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-white font-bold text-lg mb-2">
                {language === 'mr' ? 'या श्रेणीत कोणतेही शॉर्ट्स नाहीत' : language === 'hi' ? 'इस श्रेणी में कोई शॉर्ट्स नहीं हैं' : 'No Shorts in this category'}
              </p>
              <button
                onClick={() => setActiveCategory('All')}
                className="px-4 py-2 bg-red-600 rounded-full text-xs font-bold text-white hover:bg-red-700"
              >
                {language === 'mr' ? 'सर्व शॉर्ट्स पहा' : language === 'hi' ? 'सभी शॉर्ट्स देखें' : 'View All Shorts'}
              </button>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="w-full h-full md:max-w-[440px] md:h-[94vh] md:my-auto md:rounded-2xl overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative bg-black shadow-2xl md:border md:border-neutral-800"
              style={{ scrollBehavior: 'smooth' }}
            >
              {filteredShorts.map((short, index) => (
                <div
                  key={short.id || index}
                  className="w-full h-full snap-center snap-always relative overflow-hidden"
                >
                  <ShortsVideoPlayer
                    short={short}
                    isActive={index === activeShortIndex}
                    isMuted={isMuted}
                    toggleMute={() => setIsMuted((prev) => !prev)}
                    onBack={handleBackNavigation}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DESKTOP / EXPLORE GRID VIEW (Instagram Explore Tab + Category Sidebar)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      {/* ── HERO BANNER ── */}
      <div className="relative w-full overflow-hidden h-[180px] md:h-[220px] bg-neutral-900">
        <Image
          src="/premium_shorts_banner_1789523899842.jpg"
          alt="StarNews Shorts"
          fill
          className="absolute inset-0 object-cover object-[center_35%] opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />
        
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col justify-center h-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              STARNEWS
            </span>
            <span className="text-neutral-400 text-xs font-semibold">
              {language === 'mr' ? 'शॉर्ट व्हिडिओ पोर्टल' : language === 'hi' ? 'शॉर्ट वीडियो पोर्टल' : 'Short Video Portal'}
            </span>
          </div>
          
          <h1 className="text-white text-3xl md:text-5xl font-black leading-tight flex items-center gap-2 mb-1">
            {language === 'mr' ? (
              <><span className="text-red-500">शॉर्ट्स</span> आणि रील्स</>
            ) : language === 'hi' ? (
              <><span className="text-red-500">शॉर्ट्स</span> और रील्स</>
            ) : (
              <><span className="text-red-500">Shorts</span> & Reels</>
            )}
          </h1>
          
          <p className="text-neutral-300 text-xs md:text-sm max-w-xl">
            {language === 'mr'
              ? '६० सेकंदात झटपट वृत्त बुलेटिन, व्हायरल कथा आणि थेट ग्राउंड रिपोर्ट.'
              : language === 'hi'
              ? '60 सेकंड में त्वरित समाचार बुलेटिन, वायरल कहानियां और ग्राउंड रिपोर्ट।'
              : 'Quick news bulletins, viral stories, and breaking ground reports in 60 seconds.'}
          </p>

          {/* Quick Launch Mobile Reels Mode */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => openInFeed(0)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{language === 'mr' ? 'रील्स फीड पहा' : language === 'hi' ? 'रील्स फीड देखें' : 'Watch Reels Feed'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── STICKY CATEGORY & SEARCH BAR ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-200 shadow-sm py-2.5">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                {getCatLabel(cat)}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative shrink-0 hidden sm:block">
            <input
              type="text"
              placeholder={t('searchShorts') || (language === 'mr' ? 'शॉर्ट्स शोधा...' : language === 'hi' ? 'शॉर्ट्स खोजें...' : 'Search shorts...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-3 pr-8 border border-neutral-200 rounded-full text-xs bg-neutral-50 focus:bg-white focus:outline-none focus:border-red-500 w-44 transition-all"
            />
            <Search className="absolute right-2.5 top-2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID + SIDEBAR ── */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          
          {/* LEFT: Shorts 9:16 Cards Grid */}
          <div>
            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
              </div>
            ) : filteredShorts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
                <p className="text-neutral-500 font-bold text-base mb-2">
                  {t('noNews') || (language === 'mr' ? 'कोणतेही शॉर्ट्स उपलब्ध नाहीत' : language === 'hi' ? 'कोई शॉर्ट्स उपलब्ध नहीं' : 'No Shorts Available')}
                </p>
                <p className="text-neutral-400 text-xs mb-4">
                  {language === 'mr' ? 'दुसरी श्रेणी निवडा किंवा शोध क्वेरी साफ करा.' : language === 'hi' ? 'दूसरी श्रेणी चुनें या अपनी खोज क्वेरी साफ़ करें।' : 'Try another category or clear your search query.'}
                </p>
                <button
                  onClick={() => {
                    setActiveCategory('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-full text-xs font-bold hover:bg-neutral-800"
                >
                  {language === 'mr' ? 'फिल्टर रीसेट करा' : language === 'hi' ? 'फ़िल्टर रीसेट करें' : 'Reset Filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredShorts.map((short, idx) => {
                  const isImage = short.mediaType === 'image';
                  const ytMatch = short.mediaUrl?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                  const ytId = ytMatch?.[1];
                  const thumb = isImage
                    ? short.mediaUrl
                    : ytId
                    ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                    : short.thumbnailUrl;

                  return (
                    <div
                      key={short.id || idx}
                      className="cursor-pointer group relative aspect-[9/16] bg-neutral-900 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      onClick={() => openInFeed(idx)}
                    >
                      {/* Thumbnail */}
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={short.title || 'Short'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                          <Play className="w-10 h-10 text-neutral-600" />
                        </div>
                      )}

                      {/* Top badge */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                          {getCatLabel(short.category) || (language === 'mr' ? 'शॉर्ट्स' : language === 'hi' ? 'शॉर्ट्स' : 'Shorts')}
                        </span>
                      </div>

                      {/* Video indicator icon */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                          <Play className="w-3 h-3 text-white fill-white translate-x-0.5" />
                        </div>
                      </div>

                      {/* Gradient bottom overlay with title */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3 pointer-events-none">
                        <p className="text-white text-xs font-bold line-clamp-2 leading-snug drop-shadow-md mb-1.5 group-hover:text-red-400 transition-colors">
                          {short.title || short.caption || 'StarNews Short'}
                        </p>
                        
                        <div className="flex items-center justify-between text-[11px] text-neutral-300">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                            <span>{short.likes || 120}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 text-neutral-300" />
                            <span>{short.comments || 12}</span>
                          </div>
                        </div>
                      </div>

                      {/* Instagram style hover action CTA */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                          <Play className="w-6 h-6 fill-white translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
                  <span className="text-red-500">⚡</span> {t('trendingTopics') || (language === 'mr' ? 'ट्रेंडिंग विषय' : language === 'hi' ? 'ट्रेंडिंग विषय' : 'Trending Topics')}
                </h3>
                <span className="text-neutral-400 text-[10px] font-bold uppercase">{t('live') || 'LIVE'}</span>
              </div>
              <div className="space-y-2.5">
                {trendingList.map((topic, idx) => (
                  <div
                    key={topic}
                    onClick={() => {
                      setSearchQuery(topic.split(' ')[0]);
                    }}
                    className="flex items-center gap-3 py-1 cursor-pointer group"
                  >
                    <span className="text-xs font-black text-neutral-400 w-4 text-right">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-bold text-neutral-800 group-hover:text-red-600 transition-colors flex-1 line-clamp-1">
                      {topic}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Watch in Full Screen Mobile Mode Card */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-5 text-white border border-neutral-800 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-md">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">
                    {language === 'mr' ? 'रील्स अनुभवा' : language === 'hi' ? 'रील्स का अनुभव लें' : 'Experience Reels UI'}
                  </h4>
                  <p className="text-neutral-400 text-[11px]">
                    {language === 'mr' ? 'अखंड स्वाइप करण्यायोग्य प्लेअर' : language === 'hi' ? 'सहज स्वाइप प्लेयर' : 'Seamless swipeable player'}
                  </p>
                </div>
              </div>
              <p className="text-neutral-300 text-xs mb-4 leading-relaxed">
                {language === 'mr'
                  ? 'तुमच्या ब्राउझरवर इंस्टाग्राम आणि यूट्यूब शॉर्ट्सप्रमाणेच फुल-स्क्रीन व्हिडिओ रील्स पहा.'
                  : language === 'hi'
                  ? 'अपने ब्राउज़र पर इंस्टाग्राम और यूट्यूब शॉर्ट्स की तरह फुल-स्क्रीन वीडियो रील्स देखें।'
                  : 'Watch full-screen immersive video reels just like Instagram and YouTube Shorts on your browser.'}
              </p>
              <button
                onClick={() => openInFeed(0)}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{language === 'mr' ? 'रील्स प्लेअर सुरू करा' : language === 'hi' ? 'रील्स प्लेयर शुरू करें' : 'Launch Reels Player'}</span>
              </button>
            </div>

            {/* Quick Links */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-neutral-500 mb-3">
                {language === 'mr' ? 'जलद नेव्हिगेशन' : language === 'hi' ? 'त्वरित नेविगेशन' : 'Quick Navigation'}
              </h4>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setCurrentView && setCurrentView('home')}
                  className="w-full text-left text-xs font-bold text-neutral-700 hover:text-red-600 py-1.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {language === 'mr' ? '← स्टार न्यूज मुख्यपृष्ठ' : language === 'hi' ? '← स्टार न्यूज़ होम' : '← StarNews Home'}
                </button>
                <button
                  onClick={() => setCurrentView && setCurrentView('news')}
                  className="w-full text-left text-xs font-bold text-neutral-700 hover:text-red-600 py-1.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {language === 'mr' ? '📰 सर्व बातम्या' : language === 'hi' ? '📰 सभी समाचार लेख' : '📰 All News Articles'}
                </button>
                <button
                  onClick={() => setCurrentView && setCurrentView('live-tv')}
                  className="w-full text-left text-xs font-bold text-neutral-700 hover:text-red-600 py-1.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {language === 'mr' ? '🔴 थेट टीव्ही प्रक्षेपण' : language === 'hi' ? '🔴 लाइव टीवी प्रसारण' : '🔴 Live TV Broadcast'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
