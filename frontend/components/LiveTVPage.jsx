'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tv,
  Radio,
  Play,
  Share2,
  CheckCircle2,
  Users,
  Search,
  Sparkles,
  Maximize2,
  Volume2,
  Check,
  Flame,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { proxyImageUrl } from '@/lib/imageProxy';

// Extract YouTube ID
const extractYouTubeId = (url) => {
  if (!url) return null;
  const str = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  const vMatch = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];
  return null;
};

const CATEGORIES = [
  { id: 'all', label: 'All Channels', labelMr: 'सर्व चॅनेल्स', labelHi: 'सभी चैनल्स', icon: '🔥' },
  { id: 'news', label: 'News & Politics', labelMr: 'बातम्या आणि राजकारण', labelHi: 'समाचार एवं राजनीति', icon: '🔴' },
  { id: 'kids', label: 'Kids & Cartoons', labelMr: 'लहान मुलांचे चॅनल', labelHi: 'बच्चों के कार्टून', icon: '👶' },
  { id: 'business', label: 'Business & Markets', labelMr: 'शेअर बाजार आणि व्यापार', labelHi: 'शेयर बाजार व व्यापार', icon: '📈' },
  { id: 'devotional', label: 'Live Darshan', labelMr: 'थेट देवदर्शन', labelHi: 'सीधा देवदर्शन', icon: '🙏' },
  { id: 'music', label: 'Music & Hits', labelMr: 'संगीत आणि मनोरंजन', labelHi: 'संगीत एवं मनोरंजन', icon: '🎵' },
  { id: 'sports', label: 'Sports Desk', labelMr: 'क्रीडा थेट डेस्क', labelHi: 'खेल लाइव डेस्क', icon: '🏏' }
];

export default function LiveTVPage({ setCurrentView }) {
  const { t, language } = useLanguage();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [shareToast, setShareToast] = useState('');

  // Fetch channels from API
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch('/api/live-tv');
        const data = await res.json();
        if (data && Array.isArray(data.streams) && data.streams.length > 0) {
          setChannels(data.streams);
          setActiveStreamId(data.primaryStreamId || data.streams[0].id);
        }
      } catch (err) {
        console.error('Failed to load Live TV channels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  const activeChannel = useMemo(() => {
    return channels.find((ch) => ch.id === activeStreamId) || channels[0] || null;
  }, [channels, activeStreamId]);

  const youtubeId = useMemo(() => {
    return activeChannel ? extractYouTubeId(activeChannel.url) || 'GFjuqQmfVIU' : 'GFjuqQmfVIU';
  }, [activeChannel]);

  // Filter channels by Category and Search
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      const matchCat = selectedCategory === 'all' || ch.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        ch.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.channelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [channels, selectedCategory, searchQuery]);

  const switchChannel = useCallback((id) => {
    setActiveStreamId(id);
    setIsFollowing(false);
    // Smooth scroll to player on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/live-tv?stream=${activeStreamId}` : '';
    const shareData = {
      title: activeChannel?.title || 'StarNews Live TV',
      text: `Watch ${activeChannel?.channelName || 'Live TV'} streaming live on StarNews!`,
      url: shareUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl || window.location.href);
        setShareToast('Live stream link copied!');
        setTimeout(() => setShareToast(''), 2500);
      }
    } catch {
      // User cancelled
    }
  };

  const getCatTitle = (cat) => {
    if (language === 'mr') return cat.labelMr;
    if (language === 'hi') return cat.labelHi;
    return cat.label;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
        <p className="text-gray-400 text-sm font-semibold tracking-wide">
          {language === 'mr' ? 'लाइव्ह टीव्ही चॅनेल्स लोड होत आहेत...' : language === 'hi' ? 'लाइव टीवी चैनल्स लोड हो रहे हैं...' : 'Tuning into Live TV Channels...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white pb-20 select-none">
      {/* ── 1. YOUTUBE-STYLE TOP NAVIGATION HEADER ── */}
      <div className="sticky top-0 z-40 bg-[#0f131d]/95 backdrop-blur-2xl border-b border-white/10 shadow-xl">
        <div className="max-w-[1500px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Brand & Live Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1 rounded-xl shadow-lg shadow-red-900/30">
              <Tv className="w-4 h-4 text-white" />
              <span className="text-white font-black text-xs sm:text-sm tracking-wider uppercase">
                Live TV
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/70 border border-red-500/40 text-[10px] font-bold text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{channels.length} {language === 'mr' ? 'चॅनेल्स थेट' : language === 'hi' ? 'चैनल्स लाइव' : 'Channels Broadcasting'}</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'mr' ? 'चॅनेल, बातमी किंवा विषय शोधा...' : language === 'hi' ? 'चैनल, समाचार या विषय खोजें...' : 'Search news, kids, devotional or music channels...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-red-500 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-all"
            />
          </div>

          {/* Right Action */}
          <button
            onClick={() => setCurrentView && setCurrentView('home')}
            className="text-xs font-bold text-gray-300 hover:text-white px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all shrink-0"
          >
            ← {language === 'mr' ? 'मुख्य पृष्ठ' : language === 'hi' ? 'मुख्य पृष्ठ' : 'Back to News'}
          </button>
        </div>

        {/* ── 2. YOUTUBE HORIZONTAL CATEGORY CHIPS BAR ── */}
        <div className="max-w-[1500px] mx-auto px-4 py-2 overflow-x-auto hide-scrollbar flex items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-150 flex items-center gap-1.5 border active:scale-95 ${
                  isSelected
                    ? 'bg-white text-neutral-950 border-white font-black shadow-lg shadow-white/10 scale-100'
                    : 'bg-white/5 text-gray-300 hover:text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{getCatTitle(cat)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. MAIN CINEMA & CHANNELS WORKSPACE ── */}
      <div className="max-w-[1500px] mx-auto px-0 sm:px-4 pt-0 sm:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ── LEFT: YOUTUBE MAIN LIVE PLAYER + CHANNEL DETAILS ── */}
          <div className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col space-y-4`}>
            {/* The Cinema YouTube Player Container */}
            <div className="relative aspect-video w-full bg-black sm:rounded-2xl overflow-hidden shadow-2xl border-b sm:border border-white/10">
              <iframe
                key={`stream-${youtubeId}`}
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1${typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : ''}`}
                title={activeChannel?.title || 'StarNews Live Stream'}
                className="w-full h-full object-cover"
                style={{ border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />

              {/* Top Live Badge Bar Overlay */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
                <span className="flex items-center gap-1.5 bg-red-600/95 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-lg tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>LIVE</span>
                </span>
                <span className="bg-black/60 backdrop-blur-md text-gray-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-white/10">
                  HD 1080p
                </span>
              </div>
            </div>

            {/* Stream Header & Channel Action Bar */}
            <div className="px-4 sm:px-0 space-y-3">
              {/* Channel Title */}
              <h1 className="text-lg sm:text-2xl font-black text-white leading-tight tracking-tight">
                {activeChannel?.title || 'StarNews India 24/7 Live Stream'}
              </h1>

              {/* Channel Info & Interactive Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1 pb-3 border-b border-white/10">
                {/* Channel Profile */}
                <div className="flex items-center gap-3">
                  <div className="p-0.5 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 shadow-md">
                    <div className="w-10 h-10 rounded-full bg-black border border-black flex items-center justify-center overflow-hidden">
                      <span className="text-white font-black text-xs tracking-tighter">
                        {activeChannel?.channelName?.substring(0, 2).toUpperCase() || 'TV'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-sm sm:text-base">
                        {activeChannel?.channelName || 'StarNews India'}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-white fill-[#0095f6]" />
                    </div>
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <Users className="w-3 h-3 text-red-500" />
                      <span>{activeChannel?.viewers || '24K'} {language === 'mr' ? 'थेट पाहत आहेत' : language === 'hi' ? 'लाइव देख रहे हैं' : 'watching live'}</span>
                    </span>
                  </div>

                  {/* Follow Channel Button */}
                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`ml-2 text-xs font-bold px-4 py-2 rounded-full transition-all active:scale-95 shadow-md flex items-center gap-1.5 ${
                      isFollowing
                        ? 'bg-white/15 text-white/90 border border-white/20'
                        : 'bg-white text-neutral-950 hover:bg-neutral-200'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Subscribed</span>
                      </>
                    ) : (
                      <span>Subscribe</span>
                    )}
                  </button>
                </div>

                {/* Right Player Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                    className="hidden sm:flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                    title="Toggle Theater Mode"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{isTheaterMode ? 'Normal View' : 'Theater View'}</span>
                  </button>
                </div>
              </div>

              {/* Description Box */}
              {activeChannel?.description && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-300 leading-relaxed">
                  <p className="font-semibold text-white/90 mb-1">
                    🔴 {language === 'mr' ? 'थेट प्रक्षेपण माहिती:' : language === 'hi' ? 'लाइव प्रसारण विवरण:' : 'Live Stream Information:'}
                  </p>
                  <p>{activeChannel.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT / SIDEBAR: UP NEXT LIVE CHANNELS RAIL ── */}
          <div className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-4'} px-4 sm:px-0 space-y-4`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-white font-extrabold text-sm sm:text-base uppercase tracking-wider">
                  {language === 'mr' ? 'थेट प्रक्षेपित चॅनेल्स' : language === 'hi' ? 'लाइव प्रसारित चैनल्स' : 'Live Channels Rail'}
                </h3>
              </div>
              <span className="text-gray-400 text-xs font-bold">
                {filteredChannels.length} {language === 'mr' ? 'उपलब्ध' : language === 'hi' ? 'उपलब्ध' : 'Available'}
              </span>
            </div>

            {/* Channels Scrollable Vertical List */}
            <div className={`space-y-3 ${isTheaterMode ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 space-y-0' : 'max-h-[820px] overflow-y-auto hide-scrollbar'}`}>
              {filteredChannels.map((channel) => {
                const cYouTubeId = extractYouTubeId(channel.url);
                const isPlayingThis = channel.id === activeStreamId;
                return (
                  <div
                    key={channel.id}
                    onClick={() => switchChannel(channel.id)}
                    className={`flex gap-3 p-2.5 rounded-2xl cursor-pointer transition-all duration-200 border group ${
                      isPlayingThis
                        ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* 16:9 Thumbnail with LIVE badge */}
                    <div className="relative w-36 sm:w-40 aspect-video rounded-xl overflow-hidden bg-black shrink-0 shadow-md">
                      {cYouTubeId ? (
                        <img
                          src={`https://img.youtube.com/vi/${cYouTubeId}/hqdefault.jpg`}
                          alt={channel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                          <Tv className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      {/* Crimson Live Badge */}
                      <span className="absolute bottom-1.5 left-1.5 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>LIVE</span>
                      </span>
                      {isPlayingThis && (
                        <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="bg-red-600 text-white font-black text-[9px] uppercase px-2 py-1 rounded-md shadow-lg tracking-wider">
                            Playing
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Channel Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="text-white text-xs sm:text-sm font-bold line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                          {channel.title}
                        </h4>
                        <p className="text-gray-400 text-[11px] font-semibold mt-1 truncate">
                          {channel.channelName || 'StarNews Network'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mt-1">
                        <span className="text-red-400">● {channel.viewers || '15K'}</span>
                        <span className="uppercase text-gray-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                          {channel.category}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 4. CATEGORIZED SECTIONS & SHELVES (YouTube Style Multi-Channel Hub) ── */}
        <div className="mt-12 px-4 sm:px-0 space-y-10">
          {[
            { catId: 'news', title: '🔴 24/7 Marathi & National News Channels', titleMr: '🔴 २४ तास मराठी आणि राष्ट्रीय बातम्या', desc: 'Real-time breaking updates, studio debates, and live field reporters.' },
            { catId: 'kids', title: '👶 Kids Zone • Rhymes, Cartoons & Learning Stories', titleMr: '👶 लहान मुलांचे चॅनल • बालगीते, गोष्टी आणि कार्टून', desc: 'Engaging, safe, and educational live streams for toddlers and children.' },
            { catId: 'business', title: '📈 Business, Stock Market & Trading Live', titleMr: '📈 शेअर बाजार आणि बिझनेस थेट प्रक्षेपण', desc: 'Live NSE, BSE Sensex, Nifty analysis, company earnings, and finance tips.' },
            { catId: 'devotional', title: '🙏 24/7 Live Mandir Darshan • Pandharpur & Shirdi', titleMr: '🙏 २४ तास थेट देवदर्शन • पंढरपूर, शिर्डी आणि सिद्धिविनायक', desc: 'Experience continuous divine darshan, daily aartis, and prayers from sacred shrines.' },
            { catId: 'music', title: '🎵 Non-Stop Music & Bollywood Hits', titleMr: '🎵 नॉन-स्टॉप बॉलिवूड गाणी आणि संगीत', desc: 'Top party anthems, romantic melodies, and trending chartbusters.' },
            { catId: 'sports', title: '🏏 Sports Live & Cricket Match Desk', titleMr: '🏏 क्रीडा थेट विश्लेषण आणि क्रिकेट वार्ता', desc: 'Live score analysis, post-match conferences, and expert insights.' }
          ].map((section) => {
            const sectionChannels = channels.filter((c) => c.category === section.catId);
            if (sectionChannels.length === 0) return null;

            return (
              <div key={section.catId} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      {language === 'mr' ? section.titleMr : section.title}
                    </h2>
                    <p className="text-gray-400 text-xs sm:text-sm mt-0.5 font-medium">
                      {section.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory(section.catId);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-red-400 hover:text-red-300 text-xs font-black uppercase tracking-wider flex items-center gap-1 shrink-0"
                  >
                    <span>{language === 'mr' ? 'सर्व पहा' : 'View Section'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Channel Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sectionChannels.map((channel) => {
                    const cYouTubeId = extractYouTubeId(channel.url);
                    const isPlayingThis = channel.id === activeStreamId;

                    return (
                      <div
                        key={channel.id}
                        onClick={() => switchChannel(channel.id)}
                        className={`group bg-[#141824] hover:bg-[#1a2030] rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col shadow-lg ${
                          isPlayingThis ? 'border-red-500 ring-2 ring-red-500/40' : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Video Thumbnail */}
                        <div className="relative aspect-video w-full bg-black overflow-hidden">
                          {cYouTubeId ? (
                            <img
                              src={`https://img.youtube.com/vi/${cYouTubeId}/hqdefault.jpg`}
                              alt={channel.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                              <Tv className="w-8 h-8 text-gray-600" />
                            </div>
                          )}
                          <span className="absolute bottom-2 left-2 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>LIVE</span>
                          </span>
                          <span className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded">
                            {channel.viewers || '20K'} watching
                          </span>
                        </div>

                        {/* Card Info */}
                        <div className="p-3.5 flex items-start gap-3 flex-1">
                          <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm mt-0.5">
                            {channel.channelName?.substring(0, 2).toUpperCase() || 'TV'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                              {channel.title}
                            </h3>
                            <p className="text-gray-400 text-xs font-semibold mt-1 truncate">
                              {channel.channelName}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Share Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-xl border border-white/20 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{shareToast}</span>
        </div>
      )}
    </div>
  );
}
