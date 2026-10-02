'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Heart,
  MessageCircle,
  Bookmark,
  CheckCircle2,
  Music2,
  X,
  Send,
  Sparkles,
  Check,
  ChevronRight,
  Share2,
  MoreHorizontal,
  Smile,
  Repeat2,
  SlidersHorizontal
} from 'lucide-react';

export default function ShortsVideoPlayer({
  short,
  isActive,
  isMuted = true,
  toggleMute,
  onBack,
  hideHeader = false,
  theme = 'dark'
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(typeof short.likes === 'number' ? short.likes : 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showPlayIndicator, setShowPlayIndicator] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareNotice, setShareNotice] = useState('');

  // Comment state (empty by default - no mock data)
  const [commentsList, setCommentsList] = useState([]);
  const [newComment, setNewComment] = useState('');

  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef(null);

  // YouTube URL extraction
  const getYoutubeId = (url) => {
    if (!url) return null;
    const trimmed = String(url).trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const isImage = short.mediaType === 'image';
  const isVideo = short.mediaType === 'video';
  const youtubeId = isVideo ? getYoutubeId(short.mediaUrl) : null;
  const isNativeVideo = isVideo && !youtubeId;

  // Sync active status with native video playback
  useEffect(() => {
    if (isNativeVideo && videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setProgress(0);
      }
    }
  }, [isActive, isNativeVideo]);

  // Handle native video time update for progress bar
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setProgress((current / duration) * 100);
    }
  };

  // Double tap to like animation trigger
  const triggerHeartBurst = () => {
    setShowHeartBurst(true);
    setTimeout(() => {
      setShowHeartBurst(false);
    }, 900);
  };

  const handleLike = (forceLike = false) => {
    if (forceLike) {
      if (!isLiked) {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } else {
      setIsLiked(prev => {
        const next = !prev;
        setLikesCount(c => next ? c + 1 : Math.max(0, c - 1));
        return next;
      });
    }
  };

  const togglePlay = () => {
    if (!isNativeVideo) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      setShowPlayIndicator(true);
      setTimeout(() => setShowPlayIndicator(false), 700);
    }
  };

  // Video tap handler (Instagram Reels style single-tap play/pause, double-tap like)
  const handleVideoTap = (e) => {
    const now = Date.now();
    const DOUBLE_TAP_GAP = 280;

    if (now - lastTapRef.current < DOUBLE_TAP_GAP) {
      // Double tap!
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      handleLike(true);
      triggerHeartBurst();
    } else {
      // Single tap
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => {
        togglePlay();
      }, DOUBLE_TAP_GAP);
    }
    lastTapRef.current = now;
  };

  const handleShare = async (e) => {
    e?.stopPropagation();
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/shorts?id=${short.id || ''}` : '';
    const shareData = {
      title: short.title || 'StarNews Reels',
      text: short.caption || 'Watch this breaking update on StarNews Reels!',
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl || window.location.href);
        setShareNotice('Link copied to clipboard!');
        setTimeout(() => setShareNotice(''), 2500);
      }
    } catch (err) {
      // User cancelled share
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const newEntry = {
      id: Date.now(),
      user: 'you',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      text: newComment.trim(),
      time: 'Just now',
      likes: 0
    };
    setCommentsList(prev => [newEntry, ...prev]);
    setNewComment('');
  };

  const formatCount = (num) => {
    if (!num || num === 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 10000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    if (num >= 1000) return Number(num).toLocaleString('en-US');
    return String(num);
  };

  const baseLikes = likesCount || (short.views ? Math.floor(short.views * 0.08) : 284000);
  const likesDisplay = formatCount(baseLikes + (isLiked ? 1 : 0));
  const commentsDisplay = formatCount(commentsList.length > 0 ? commentsList.length : (short.commentsCount || 6138));
  const remixDisplay = formatCount(short.remixCount || 8533);
  const sharesDisplay = formatCount(short.sharesCount || 45100);
  const savesDisplay = formatCount((short.savesCount || 8822) + (isSaved ? 1 : 0));

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center snap-center select-none overflow-hidden"
      onClick={handleVideoTap}
    >
      {/* ─── 1. MEDIA LAYER (Preserves True Uploaded Orientation with Ambient Backdrop) ─── */}
      {isImage ? (
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
          {/* Ambient blurred backdrop so there are never harsh black bars */}
          <img
            src={short.mediaUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-35 select-none pointer-events-none"
          />
          {/* Authentic uploaded image in its EXACT TRUE orientation */}
          <img
            src={short.mediaUrl}
            alt={short.title || 'Reel Image'}
            className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain select-none pointer-events-none drop-shadow-2xl"
          />
        </div>
      ) : youtubeId ? (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-black">
          <iframe
            key={`yt-${youtubeId}-${isMuted ? 'muted' : 'unmuted'}`}
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${isActive ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${youtubeId}&rel=0&playsinline=1&enablejsapi=1${typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : ''}`}
            className="w-full h-full object-cover scale-[1.05] pointer-events-none"
            style={{ border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title={short.title || 'StarNews Reel'}
          />
        </div>
      ) : isNativeVideo ? (
        <div className="w-full h-full relative flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={short.mediaUrl}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
      ) : (
        <div className="text-white text-center p-4">Invalid Media Source</div>
      )}

      {/* ─── 2. INSTAGRAM DOUBLE-TAP 3D HEART BURST ─── */}
      {showHeartBurst && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="animate-heart-pop text-[#ff2d55] drop-shadow-[0_0_35px_rgba(255,45,85,0.9)]">
            <Heart className="w-32 h-32 fill-[#ff2d55] stroke-white stroke-[2]" />
          </div>
        </div>
      )}

      {/* ─── 3. SINGLE-TAP PLAY / PAUSE INDICATOR (iOS Glass Emblem) ─── */}
      {showPlayIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-opacity">
          <div className="w-20 h-20 rounded-full ios-glass-btn flex items-center justify-center text-white shadow-2xl animate-in fade-in zoom-in duration-200">
            {isPlaying ? (
              <Play className="w-9 h-9 fill-white translate-x-0.5" />
            ) : (
              <Pause className="w-9 h-9 fill-white" />
            )}
          </div>
        </div>
      )}

      {/* ─── 4. CINEMATIC GRADIENT DEPTH (Smooth Instagram Shading) ─── */}
      <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-84 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none z-10" />

      {/* ─── 5. TOP RIGHT MUTE TOGGLE (iOS Frosted Pill) ─── */}
      {hideHeader && (
        <div className="absolute top-4 right-4 z-30 pointer-events-auto" onClick={e => e.stopPropagation()}>
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full ios-glass-btn flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      )}

      {/* ─── 6. RIGHT ACTION RAIL (Authentic Instagram Reels Floating Icons with Drop Shadows) ─── */}
      <div
        className="absolute right-3 bottom-16 z-30 flex flex-col items-center gap-4 pointer-events-auto select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* 1. LIKE BUTTON */}
        <div className="flex flex-col items-center cursor-pointer group" onClick={() => handleLike()}>
          <button className="p-1 active:scale-75 transition-transform" aria-label="Like">
            <Heart
              className={`w-7 h-7 transition-all duration-150 ${
                isLiked
                  ? 'fill-[#ff2d55] stroke-[#ff2d55] scale-110 drop-shadow-[0_0_12px_rgba(255,45,85,0.9)]'
                  : 'stroke-white stroke-[2] fill-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]'
              }`}
            />
          </button>
          <span className="text-white text-[12px] font-semibold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
            {likesDisplay}
          </span>
        </div>

        {/* 2. COMMENTS BUTTON */}
        <div className="flex flex-col items-center cursor-pointer group" onClick={() => setShowComments(true)}>
          <button className="p-1 active:scale-75 transition-transform" aria-label="Comments">
            <MessageCircle className="w-7 h-7 stroke-white stroke-[2] fill-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]" />
          </button>
          <span className="text-white text-[12px] font-semibold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
            {commentsDisplay}
          </span>
        </div>

        {/* 3. REPOST / REMIX BUTTON (Matching Instagram Reels) */}
        <div className="flex flex-col items-center cursor-pointer group" onClick={handleShare}>
          <button className="p-1 active:scale-75 transition-transform" aria-label="Remix">
            <Repeat2 className="w-7 h-7 stroke-white stroke-[2] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]" />
          </button>
          <span className="text-white text-[12px] font-semibold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
            {remixDisplay}
          </span>
        </div>

        {/* 4. SHARE BUTTON (Instagram Paper Plane / Send) */}
        <div className="flex flex-col items-center cursor-pointer group" onClick={handleShare}>
          <button className="p-1 active:scale-75 transition-transform" aria-label="Share">
            <Send className="w-7 h-7 stroke-white stroke-[2] fill-none -rotate-12 -translate-y-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]" />
          </button>
          <span className="text-white text-[12px] font-semibold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
            {sharesDisplay}
          </span>
        </div>

        {/* 5. BOOKMARK / SAVE BUTTON (Instagram Ribbon with Count) */}
        <div
          className="flex flex-col items-center cursor-pointer group"
          onClick={() => {
            setIsSaved(!isSaved);
            setShareNotice(!isSaved ? 'Saved to collection' : 'Removed from collection');
            setTimeout(() => setShareNotice(''), 2000);
          }}
        >
          <button className="p-1 active:scale-75 transition-transform" aria-label="Save">
            <Bookmark
              className={`w-7 h-7 transition-all duration-150 ${
                isSaved
                  ? 'fill-white stroke-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]'
                  : 'stroke-white stroke-[2] fill-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]'
              }`}
            />
          </button>
          <span className="text-white text-[12px] font-semibold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-tight">
            {savesDisplay}
          </span>
        </div>

        {/* 6. MORE OPTIONS (...) */}
        <div className="flex flex-col items-center cursor-pointer group" onClick={handleShare}>
          <button className="p-1 active:scale-75 transition-transform" aria-label="More">
            <MoreHorizontal className="w-6 h-6 stroke-white stroke-[2] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]" />
          </button>
        </div>
      </div>

      {/* ─── 7. BOTTOM-LEFT INFORMATION OVERLAY (Exact Instagram Reels Layout - NO BOX, PURE OVERLAY) ─── */}
      <div
        className="absolute bottom-16 left-3.5 right-16 z-20 pointer-events-auto flex flex-col gap-1.5 max-w-[calc(100%-68px)] select-text"
        onClick={e => e.stopPropagation()}
      >
        {/* PROFILE ROW: [Avatar with Instagram Story Ring] username [Follow] */}
        <div className="flex items-center gap-2">
          {/* Instagram Story Gradient Outer Ring */}
          <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0 shadow-md">
            <div className="p-[1.5px] bg-black rounded-full">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-900">
                <img
                  src="/star_news_logo.png"
                  alt="StarNews"
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=100&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Account Username */}
          <span className="text-white font-semibold text-[13.5px] tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] truncate max-w-[140px]">
            {short.authorHandle || short.creator || 'starnewsindia'}
          </span>

          {/* Verified Blue Badge */}
          <svg className="w-3.5 h-3.5 fill-[#3897f0] shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.2l-3.5-3.5 1.4-1.4 2.1 2.1 5.6-5.6 1.4 1.4-7 7z" />
          </svg>

          {/* Follow Button: Transparent with thin white border matching Instagram */}
          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className="text-[12px] font-semibold px-3 py-[2px] rounded-lg border border-white/70 text-white bg-transparent hover:bg-white/15 active:scale-95 transition-all drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] shrink-0 ml-1"
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* CAPTION with Instagram-style inline "... more" expander + Equalizer Icon */}
        {(short.caption || short.title) && (
          <div className="text-[13px] text-white leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] font-normal pr-1 flex items-start justify-between gap-2 mt-0.5">
            <div className="flex-1 min-w-0">
              <span className={isCaptionExpanded ? 'break-words leading-relaxed' : 'line-clamp-2'}>
                {short.caption || short.title}
              </span>
              {((short.caption || short.title || '').length > 65) && (
                <button
                  onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                  className="text-white/80 font-bold text-[12px] ml-1.5 hover:text-white inline drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
                >
                  {isCaptionExpanded ? 'less' : '... more'}
                </button>
              )}
            </div>
            {/* Audio equalizer sliders icon matching Instagram */}
            <div className="shrink-0 pt-0.5 opacity-80">
              <SlidersHorizontal className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]" />
            </div>
          </div>
        )}

        {/* AUDIO TRACK ROW */}
        <div className="flex items-center gap-1.5 text-white/90 text-[11px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] mt-0.5">
          <Music2 className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="truncate max-w-[220px] font-medium text-white/90">
            {short.audioTitle || 'StarNews India • Original Audio'}
          </span>
        </div>
      </div>

      {/* ─── 8. BOTTOM "ADD COMMENT..." INPUT BAR (Instagram Reels Exact Full-Width Pill) ─── */}
      <div
        className="absolute bottom-3 left-3 right-3 z-30 pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        <div
          onClick={() => setShowComments(true)}
          className="w-full h-10 px-4 bg-neutral-900/60 backdrop-blur-md border border-white/20 rounded-full flex items-center cursor-pointer text-white/60 text-[13px] hover:border-white/40 active:scale-[0.99] transition-all shadow-lg"
        >
          <span>Add comment...</span>
        </div>
      </div>

      {/* ─── 8. ULTRA-THIN PROGRESS BAR (Instagram Reels Style) ─── */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20 z-40 pointer-events-none">
        <div
          className="h-full bg-white transition-[width] duration-150 ease-linear shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ─── 9. TOAST NOTIFICATION ─── */}
      {shareNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{shareNotice}</span>
        </div>
      )}

      {/* ─── 10. INSTAGRAM COMMENTS BOTTOM SHEET (iOS Frosted Glass Drawer) ─── */}
      {showComments && (
        <div
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end pointer-events-auto animate-in fade-in duration-200"
          onClick={e => {
            e.stopPropagation();
            setShowComments(false);
          }}
        >
          <div
            className="w-full bg-neutral-900/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[28px] max-h-[70%] min-h-[52%] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* iOS Drawer Grabber Handle */}
            <div className="pt-2.5 pb-1 flex flex-col items-center">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Drawer Header */}
            <div className="px-5 py-2.5 border-b border-white/10 flex items-center justify-between">
              <div className="w-6" />
              <span className="text-white text-sm font-bold tracking-tight">Comments</span>
              <button
                onClick={() => setShowComments(false)}
                className="p-1 rounded-full text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
              {commentsList.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <MessageCircle className="w-10 h-10 mb-2 stroke-[1.5] text-neutral-500" />
                  <span className={`text-sm font-semibold ${theme === 'light' ? 'text-neutral-800' : 'text-neutral-200'}`}>No comments yet</span>
                  <span className="text-xs text-neutral-400 mt-0.5">Start the conversation.</span>
                </div>
              ) : (
                commentsList.map(item => (
                  <div key={item.id} className="flex items-start gap-3">
                    <img
                      src={item.avatar}
                      alt={item.user}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${theme === 'light' ? 'text-neutral-900' : 'text-white'}`}>{item.user}</span>
                        <span className="text-neutral-500 text-[11px]">{item.time}</span>
                      </div>
                      <p className={`text-xs mt-0.5 leading-relaxed ${theme === 'light' ? 'text-neutral-700' : 'text-neutral-200'}`}>{item.text}</p>
                    </div>
                    <div className="flex flex-col items-center text-neutral-500 hover:text-rose-500 cursor-pointer pt-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-[10px] mt-0.5">{item.likes}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input Footer */}
            <form onSubmit={handleAddComment} className={`p-3 border-t flex items-center gap-2 ${theme === 'light' ? 'bg-white border-neutral-200' : 'bg-neutral-950/80 border-white/10'}`}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-bold">U</span>
              </div>
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className={`flex-1 rounded-full px-4 py-2 text-xs focus:outline-none ${
                  theme === 'light'
                    ? 'bg-neutral-100 border border-neutral-300 text-neutral-900 placeholder-neutral-500 focus:border-neutral-500'
                    : 'bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 focus:border-white/30'
                }`}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white text-xs font-bold rounded-full transition-all"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
