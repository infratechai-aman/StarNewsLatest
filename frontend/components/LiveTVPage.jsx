'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Tv,
  Play,
  Share2,
  CheckCircle2,
  Users,
  Search,
  Maximize2,
  Check,
  ChevronRight,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Sun,
  Moon,
  Sparkles,
  Send,
  Radio,
  Bookmark,
  Compass,
  Smile
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Helper to extract YouTube ID
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
  { id: 'all', label: 'All', labelMr: 'सर्व', labelHi: 'सभी', icon: '🔥' },
  { id: 'news', label: 'News & Politics', labelMr: 'बातम्या', labelHi: 'समाचार', icon: '🔴' },
  { id: 'kids', label: 'Kids & Cartoons', labelMr: 'लहान मुले', labelHi: 'कार्टून', icon: '👶' },
  { id: 'business', label: 'Business & Markets', labelMr: 'व्यापार', labelHi: 'बिजनेस', icon: '📈' },
  { id: 'devotional', label: 'Live Darshan', labelMr: 'देवदर्शन', labelHi: 'दर्शन', icon: '🙏' },
  { id: 'music', label: 'Music & Hits', labelMr: 'संगीत', labelHi: 'संगीत', icon: '🎵' },
  { id: 'sports', label: 'Sports Desk', labelMr: 'क्रीडा', labelHi: 'खेल', icon: '🏏' }
];

const INITIAL_CHAT_MESSAGES = [
  { id: 1, user: 'Rohit Patil', text: 'पुण्यातील हवामान आणि पावसाची बातमी महत्त्वाची आहे!', time: '1m ago', isMod: false, badge: 'Pune' },
  { id: 2, user: 'StarNews Desk', text: 'Welcome to StarNews 24/7 Live Broadcast! Post your live comments here.', time: '1m ago', isMod: true, badge: 'Official' },
  { id: 3, user: 'Amit Sharma', text: 'Sound and video quality is crisp! Best news feed.', time: 'Just now', isMod: false, badge: 'Mumbai' },
  { id: 4, user: 'Pooja Deshmukh', text: 'नमस्कार स्टार न्यूज टीम! ग्राउंड रिपोर्ट खूप छान आहे.', time: 'Just now', isMod: false, badge: 'Nagpur' },
  { id: 5, user: 'Vikram Joshi', text: 'Sensex and Nifty updates live chalu ahet ka?', time: 'Just now', isMod: false, badge: 'Nashik' },
];

export default function LiveTVPage({ setCurrentView }) {
  const { t, language } = useLanguage();
  
  // Theme state: 'dark' (YouTube Dark) or 'light' (StarNews Clean Light)
  const [theme, setTheme] = useState('dark');
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // YouTube UI interactive state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(2450000);
  const [likes, setLikes] = useState(24580);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [shareToast, setShareToast] = useState('');
  
  // Sidebar tab: 'chat' | 'upnext'
  const [activeSidebarTab, setActiveSidebarTab] = useState('chat');
  
  // Live Chat state
  const [chatMessages, setChatMessages] = useState(INITIAL_CHAT_MESSAGES);
  const [userComment, setUserComment] = useState('');
  const chatBottomRef = useRef(null);

  // Initialize theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('livetv_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('livetv_theme', nextTheme);
    } catch (e) {}
  };

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
    return activeChannel ? extractYouTubeId(activeChannel.url) || '2g811Eo7K8U' : '2g811Eo7K8U';
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
    setIsSubscribed(false);
    setHasLiked(false);
    setHasDisliked(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubscribeToggle = () => {
    if (isSubscribed) {
      setIsSubscribed(false);
      setSubCount((prev) => prev - 1);
    } else {
      setIsSubscribed(true);
      setSubCount((prev) => prev + 1);
    }
  };

  const handleLike = () => {
    if (hasLiked) {
      setHasLiked(false);
      setLikes((prev) => prev - 1);
    } else {
      setHasLiked(true);
      setLikes((prev) => prev + 1);
      if (hasDisliked) setHasDisliked(false);
    }
  };

  const handleDislike = () => {
    if (hasDisliked) {
      setHasDisliked(false);
    } else {
      setHasDisliked(true);
      if (hasLiked) {
        setHasLiked(false);
        setLikes((prev) => prev - 1);
      }
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/?view=live-tv`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          setShareToast(language === 'mr' ? 'लाइव्ह लिंक कॉपी झाली!' : language === 'hi' ? 'लाइव लिंक कॉपी हो गया!' : 'Live stream link copied!');
          setTimeout(() => setShareToast(''), 3000);
        });
      }
    }
  };

  // Live Chat: Add user message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userComment.trim()) return;
    const newMsg = {
      id: Date.now(),
      user: 'You',
      text: userComment.trim(),
      time: 'Just now',
      isMod: false,
      badge: 'Viewer'
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setUserComment('');
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Periodic random chat message
  useEffect(() => {
    const randomComments = [
      { user: 'Kunal Shinde', text: 'स्टार न्यूज लाईव्ह कव्हरेज सर्वोत्तम आहे 👌', badge: 'Satara' },
      { user: 'Sanjay More', text: 'पुणे कँप आणि कोंढवा बातम्यांचा अपडेट द्या', badge: 'Pune' },
      { user: 'Meera Rao', text: 'Very smooth streaming, thanks team!', badge: 'Bengaluru' },
      { user: 'Pravin Jadhav', text: 'जय महाराष्ट्र! सत्य आणि निःपक्षपाती पत्रकारिता.', badge: 'Kolhapur' },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      const comment = randomComments[idx % randomComments.length];
      idx++;
      setChatMessages((prev) => [
        ...prev.slice(-30), // Keep last 30 messages
        { id: Date.now(), user: comment.user, text: comment.text, time: 'Just now', isMod: false, badge: comment.badge }
      ]);
    }, 18000);

    return () => clearInterval(interval);
  }, []);

  const getCatTitle = (cat) => {
    if (language === 'mr') return cat.labelMr || cat.label;
    if (language === 'hi') return cat.labelHi || cat.label;
    return cat.label;
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#0f0f0f] text-[#f1f1f1]' : 'bg-[#f9fafb] text-[#0f172a]'
    }`}>
      {/* ── 1. YOUTUBE HEADER BAR ── */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        isDark ? 'bg-[#0f0f0f]/95 border-[#272727]' : 'bg-white/95 border-gray-200 shadow-sm'
      }`}>
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
          
          {/* Left Brand Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg shadow-md transition-all cursor-pointer" onClick={() => setCurrentView && setCurrentView('home')}>
              <Tv className="w-4 h-4 fill-white" />
              <span className="font-black text-xs tracking-wider uppercase flex items-center gap-1">
                <span>StarNews</span>
                <span className="bg-white text-red-600 text-[9px] px-1 py-0.2 rounded font-black tracking-normal">LIVE</span>
              </span>
            </div>

            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isDark ? 'bg-red-950/40 text-red-400 border border-red-900/50' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{channels.length} {language === 'mr' ? 'चॅनेल्स थेट' : language === 'hi' ? 'लाइव चैनल्स' : 'Live Streams'}</span>
            </div>
          </div>

          {/* Center: YouTube Search Bar */}
          <div className="relative flex-1 max-w-lg hidden sm:block">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder={language === 'mr' ? 'चॅनेल, बातमी किंवा विषय शोधा...' : language === 'hi' ? 'चैनल, समाचार या विषय खोजें...' : 'Search live news, cartoons, markets, music...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-full pl-9 pr-4 py-1.5 text-xs font-medium focus:outline-none transition-all border ${
                isDark 
                  ? 'bg-[#121212] border-[#303030] text-white focus:border-red-500 focus:bg-black placeholder-gray-500' 
                  : 'bg-gray-100 border-gray-300 text-gray-900 focus:border-red-600 focus:bg-white placeholder-gray-400 shadow-inner'
              }`}
            />
          </div>

          {/* Right: Theme Switcher & Back Button */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isDark
                  ? 'bg-[#272727] hover:bg-[#383838] border-[#3f3f3f] text-yellow-400'
                  : 'bg-white hover:bg-gray-100 border-gray-300 text-slate-800 shadow-sm'
              }`}
              title={isDark ? 'Switch to Clean Light Mode' : 'Switch to YouTube Dark Mode'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 fill-yellow-400" /> : <Moon className="w-3.5 h-3.5 fill-slate-800" />}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            {/* Back to Home */}
            <button
              onClick={() => setCurrentView && setCurrentView('home')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${
                isDark
                  ? 'bg-[#212121] hover:bg-[#303030] text-gray-300 border-[#333]'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300 shadow-sm'
              }`}
            >
              ← {language === 'mr' ? 'मुख्य पृष्ठ' : 'Exit'}
            </button>
          </div>
        </div>

        {/* ── YouTube Signature Category Chips ── */}
        <div className={`border-t px-3 sm:px-6 py-2 overflow-x-auto hide-scrollbar flex items-center gap-2 ${
          isDark ? 'border-[#272727] bg-[#0f0f0f]' : 'border-gray-100 bg-gray-50/50'
        }`}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 flex items-center gap-1.5 border active:scale-95 ${
                  isSelected
                    ? isDark
                      ? 'bg-white text-black border-white font-bold shadow'
                      : 'bg-[#0f172a] text-white border-[#0f172a] font-bold shadow-sm'
                    : isDark
                    ? 'bg-[#272727] text-gray-300 hover:bg-[#3f3f3f] border-transparent hover:text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{getCatTitle(cat)}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* ── 2. MAIN YOUTUBE VIEWPORT WORKSPACE ── */}
      <main className="max-w-[1600px] mx-auto px-0 sm:px-4 py-0 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* ── LEFT: YOUTUBE MAIN PLAYER & BROADCAST DETAILS ── */}
          <div className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col space-y-3`}>
            
            {/* Cinema Player Container */}
            <div className={`relative aspect-video w-full bg-black sm:rounded-2xl overflow-hidden shadow-2xl border ${
              isDark ? 'border-[#272727]' : 'border-gray-200'
            }`}>
              <iframe
                key={`stream-${youtubeId}`}
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                title={activeChannel?.title || 'Live Stream Player'}
                className="w-full h-full object-cover"
                style={{ border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />

              {/* Top YouTube Live Indicator */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
                <span className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-lg tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>LIVE</span>
                </span>
                <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
                  1080p Full HD
                </span>
              </div>
            </div>

            {/* Video Title & Actions */}
            <div className="px-4 sm:px-0 space-y-3">
              <h1 className={`text-base sm:text-xl md:text-2xl font-black leading-tight tracking-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {activeChannel?.title || 'StarNews India 24/7 Live Stream'}
              </h1>

              {/* YouTube Channel Bar & Interactive Buttons */}
              <div className={`flex flex-wrap items-center justify-between gap-3 pt-1 pb-3 border-b ${
                isDark ? 'border-[#272727]' : 'border-gray-200'
              }`}>
                {/* Channel Profile */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white font-black text-sm flex items-center justify-center shadow shrink-0">
                    {activeChannel?.channelName?.[0] || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {activeChannel?.channelName || 'StarNews India'}
                      </h3>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
                    </div>
                    <p className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(subCount / 1000000).toFixed(2)}M subscribers
                    </p>
                  </div>

                  {/* YouTube Red Subscribe Button */}
                  <button
                    onClick={handleSubscribeToggle}
                    className={`ml-2 px-4 py-2 rounded-full text-xs font-black tracking-wide transition-all duration-200 flex items-center gap-1.5 shadow ${
                      isSubscribed
                        ? isDark
                          ? 'bg-[#272727] text-gray-300 hover:bg-[#383838]'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
                    }`}
                  >
                    {isSubscribed ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Subscribed</span>
                      </>
                    ) : (
                      <span>Subscribe</span>
                    )}
                  </button>
                </div>

                {/* Right: Like, Dislike, Share, Theater */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Like / Dislike Pill */}
                  <div className={`flex items-center rounded-full border overflow-hidden ${
                    isDark ? 'bg-[#272727] border-[#383838]' : 'bg-gray-100 border-gray-200'
                  }`}>
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
                        hasLiked ? 'text-red-500' : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-red-500' : ''}`} />
                      <span>{likes.toLocaleString()}</span>
                    </button>
                    <div className={`w-px h-4 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
                    <button
                      onClick={handleDislike}
                      className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                        hasDisliked ? 'text-red-500' : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
                      }`}
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${hasDisliked ? 'fill-red-500' : ''}`} />
                    </button>
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      isDark ? 'bg-[#272727] border-[#383838] text-gray-300 hover:bg-[#383838]' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>

                  {/* Theater Mode Toggle */}
                  <button
                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                    className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      isTheaterMode ? 'bg-red-600 text-white border-red-600' : isDark ? 'bg-[#272727] border-[#383838] text-gray-300 hover:bg-[#383838]' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    }`}
                    title="Toggle Theater Mode"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Cinema</span>
                  </button>
                </div>
              </div>

              {/* YouTube Description Box */}
              <div className={`p-3.5 rounded-xl text-xs space-y-1.5 border leading-relaxed ${
                isDark ? 'bg-[#212121] border-[#2e2e2e] text-gray-300' : 'bg-gray-100/80 border-gray-200 text-gray-700'
              }`}>
                <div className="flex items-center gap-3 font-black text-[11px]">
                  <span className="text-red-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    {activeChannel?.viewers || '24.5K'} watching right now
                  </span>
                  <span>•</span>
                  <span>Category: {activeChannel?.category?.toUpperCase()}</span>
                </div>
                <p>
                  {activeChannel?.description || 'Ground reports, verified bulletins, and breaking political updates live from StarNews broadcast team.'}
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: YOUTUBE DUAL-TAB PANEL (LIVE CHAT / UP NEXT) ── */}
          <div className={`${isTheaterMode ? 'lg:col-span-12 mt-4' : 'lg:col-span-4'} flex flex-col`}>
            
            {/* YouTube Right Panel Container */}
            <div className={`rounded-2xl border flex flex-col h-[580px] lg:h-[720px] overflow-hidden shadow-lg ${
              isDark ? 'bg-[#181818] border-[#272727]' : 'bg-white border-gray-200'
            }`}>
              
              {/* Dual Tab Header (Live Chat vs Up Next) */}
              <div className={`flex items-center border-b p-1.5 gap-1 shrink-0 ${
                isDark ? 'border-[#272727] bg-[#121212]' : 'border-gray-200 bg-gray-50'
              }`}>
                <button
                  onClick={() => setActiveSidebarTab('chat')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    activeSidebarTab === 'chat'
                      ? isDark
                        ? 'bg-[#272727] text-white shadow'
                        : 'bg-white text-gray-900 shadow-sm'
                      : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-red-500" />
                  <span>Live Chat</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-0.5" />
                </button>

                <button
                  onClick={() => setActiveSidebarTab('upnext')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    activeSidebarTab === 'upnext'
                      ? isDark
                        ? 'bg-[#272727] text-white shadow'
                        : 'bg-white text-gray-900 shadow-sm'
                      : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5 text-red-500" />
                  <span>Channels ({filteredChannels.length})</span>
                </button>
              </div>

              {/* TAB 1: YOUTUBE LIVE CHAT STREAM */}
              {activeSidebarTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Chat Sub-header */}
                  <div className={`px-4 py-2 text-[11px] font-bold border-b flex items-center justify-between ${
                    isDark ? 'border-[#272727] text-gray-400 bg-[#151515]' : 'border-gray-100 text-gray-500 bg-gray-50/50'
                  }`}>
                    <span>Top Chat • Live stream</span>
                    <span className="text-red-500 flex items-center gap-1 font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      LIVE
                    </span>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5 hide-scrollbar">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-2.5 text-xs leading-relaxed animate-in fade-in duration-200">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white ${
                          msg.isMod ? 'bg-red-600 ring-2 ring-red-400/50' : msg.user === 'You' ? 'bg-blue-600' : 'bg-slate-700'
                        }`}>
                          {msg.user[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-black text-[11px] ${
                              msg.isMod ? 'text-red-500 font-extrabold' : msg.user === 'You' ? 'text-blue-400' : isDark ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                              {msg.user}
                            </span>
                            {msg.badge && (
                              <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded ${
                                msg.isMod ? 'bg-red-600 text-white' : isDark ? 'bg-[#333] text-gray-300' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {msg.badge}
                              </span>
                            )}
                            <span className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{msg.time}</span>
                          </div>
                          <p className={`text-[12px] break-words mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat Input Bar */}
                  <form onSubmit={handleSendMessage} className={`p-2.5 border-t flex items-center gap-2 ${
                    isDark ? 'border-[#272727] bg-[#121212]' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      Y
                    </div>
                    <input
                      type="text"
                      placeholder="Chat as Viewer..."
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      className={`flex-1 text-xs rounded-full px-3.5 py-2 border focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-[#222] border-[#333] text-white placeholder-gray-500 focus:border-red-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-red-600 shadow-sm'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!userComment.trim()}
                      className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 flex items-center justify-center transition-all shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: YOUTUBE CHANNELS & UP NEXT LIST */}
              {activeSidebarTab === 'upnext' && (
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 hide-scrollbar">
                  {filteredChannels.map((channel) => {
                    const cYouTubeId = extractYouTubeId(channel.url);
                    const isPlayingThis = channel.id === activeStreamId;
                    const thumbUrl = channel.thumbnail || (cYouTubeId ? `https://img.youtube.com/vi/${cYouTubeId}/hqdefault.jpg` : '/placeholder-news.svg');

                    return (
                      <div
                        key={channel.id}
                        onClick={() => switchChannel(channel.id)}
                        className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 border group ${
                          isPlayingThis
                            ? isDark
                              ? 'bg-red-950/40 border-red-500 shadow-md'
                              : 'bg-red-50 border-red-300 shadow-sm'
                            : isDark
                            ? 'bg-[#202020] border-[#292929] hover:bg-[#2a2a2a] hover:border-[#383838]'
                            : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        {/* 16:9 Thumbnail with LIVE badge */}
                        <div className="relative w-36 aspect-video rounded-lg overflow-hidden bg-black shrink-0 shadow-sm">
                          <img
                            src={thumbUrl}
                            alt={channel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/placeholder-news.svg';
                            }}
                          />
                          <span className="absolute bottom-1 left-1 bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded shadow flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                            <span>LIVE</span>
                          </span>
                          {isPlayingThis && (
                            <div className="absolute inset-0 bg-red-600/30 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="bg-red-600 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded shadow tracking-wider">
                                Playing
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <h4 className={`text-xs font-bold line-clamp-2 leading-snug group-hover:text-red-500 transition-colors ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {channel.title}
                            </h4>
                            <p className={`text-[11px] font-semibold mt-1 truncate ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {channel.channelName || 'Broadcaster'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold mt-1">
                            <span className="text-red-500">● {channel.viewers || '20K'}</span>
                            <span className={`uppercase text-[9px] px-1.5 py-0.2 rounded ${
                              isDark ? 'bg-[#333] text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {channel.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. CATEGORIZED BROADCAST SHELVES (YouTube Multi-Channel Hub) ── */}
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
                <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-1 border-b pb-3 ${
                  isDark ? 'border-[#272727]' : 'border-gray-200'
                }`}>
                  <div>
                    <h2 className={`text-lg sm:text-2xl font-black tracking-tight flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {language === 'mr' ? section.titleMr : section.title}
                    </h2>
                    <p className={`text-xs sm:text-sm mt-0.5 font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {section.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory(section.catId);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-red-500 hover:text-red-400 text-xs font-black uppercase tracking-wider flex items-center gap-1 shrink-0"
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
                    const thumbUrl = channel.thumbnail || (cYouTubeId ? `https://img.youtube.com/vi/${cYouTubeId}/hqdefault.jpg` : '/placeholder-news.svg');

                    return (
                      <div
                        key={channel.id}
                        onClick={() => switchChannel(channel.id)}
                        className={`group rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col shadow-md ${
                          isPlayingThis
                            ? 'border-red-500 ring-2 ring-red-500/40'
                            : isDark
                            ? 'bg-[#181818] hover:bg-[#222] border-[#292929] hover:border-[#383838]'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        {/* Video Thumbnail */}
                        <div className="relative aspect-video w-full bg-black overflow-hidden">
                          <img
                            src={thumbUrl}
                            alt={channel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/placeholder-news.svg';
                            }}
                          />
                          <span className="absolute bottom-2 left-2 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>LIVE</span>
                          </span>
                          <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded">
                            {channel.viewers || '25K'}
                          </span>
                          {isPlayingThis && (
                            <div className="absolute inset-0 bg-red-600/30 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="bg-red-600 text-white font-black text-xs uppercase px-3 py-1 rounded-md shadow-lg tracking-wider">
                                Now Playing
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title and details */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className={`font-bold text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-red-500 transition-colors ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {channel.title}
                            </h3>
                            <p className={`text-[11px] font-semibold mt-1.5 truncate ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {channel.channelName || 'StarNews Network'}
                            </p>
                          </div>
                          <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[10px] font-bold ${
                            isDark ? 'border-[#292929] text-gray-500' : 'border-gray-100 text-gray-400'
                          }`}>
                            <span className="text-red-500">● Live Streaming</span>
                            <span className="flex items-center gap-0.5 group-hover:text-red-500 transition-colors">
                              Watch Now <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                            </span>
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
      </main>
    </div>
  );
}
