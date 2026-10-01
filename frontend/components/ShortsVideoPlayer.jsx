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
  Share2
} from 'lucide-react';

export default function ShortsVideoPlayer({
  short,
  isActive,
  isMuted = true,
  toggleMute,
  onBack,
  hideHeader = false
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(short.likes || Math.floor(Math.random() * 850 + 150));
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showPlayIndicator, setShowPlayIndicator] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareNotice, setShareNotice] = useState('');

  // Comment state
  const [commentsList, setCommentsList] = useState([
    { id: 1, user: 'priya_sharma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60', text: 'Important ground report! Thanks StarNews for covering this.', time: '2h', likes: 24 },
    { id: 2, user: 'rahul_deshmukh', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60', text: 'Clean coverage, loving this quick reel format 🙌🔥', time: '5h', likes: 11 },
    { id: 3, user: 'akshay_pune', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60', text: 'Very timely alert for citizens in the city!', time: '6h', likes: 7 }
  ]);
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

  const formattedLikes = likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount;
  const commentCount = commentsList.length;

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center snap-center select-none overflow-hidden"
      onClick={handleVideoTap}
    >
      {/* ─── 1. MEDIA LAYER (Fills 9:16 Aspect Screen) ─── */}
      {isImage ? (
        <img
          src={short.mediaUrl}
          alt={short.title || 'Reel Image'}
          className="w-full h-full object-cover select-none pointer-events-none"
        />
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

      {/* ─── 6. RIGHT ACTION RAIL (Native Instagram iOS Glass Buttons) ─── */}
      <div
        className="absolute right-3 bottom-12 z-30 flex flex-col items-center gap-4 pointer-events-auto select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* LIKE BUTTON (Instagram Heart) */}
        <div className="flex flex-col items-center cursor-pointer group" onClick={() => handleLike()}>
          <button
            className={`w-12 h-12 rounded-full ios-glass-btn flex items-center justify-center transition-all duration-150 active:scale-75 ${
              isLiked ? 'border-rose-500/40 bg-rose-500/20' : ''
            }`}
            aria-label="Like"
          >
            <Heart
              className={`w-6 h-6 transition-all duration-200 ${
                isLiked
                  ? 'fill-[#ff2d55] stroke-[#ff2d55] scale-110 drop-shadow-[0_0_14px_rgba(255,45,85,0.9)]'
                  : 'fill-transparent stroke-white stroke-[2.2] group-hover:scale-110'
              }`}
            />
          </button>
          <span className="text-white text-[11px] font-bold mt-1 drop-shadow-md tracking-tight">
            {formattedLikes}
          </span>
        </div>

        {/* COMMENTS BUTTON (Instagram Speech Bubble) */}
        <div className="flex flex-col items-center cursor-pointer group" onClick={() => setShowComments(true)}>
          <button
            className="w-12 h-12 rounded-full ios-glass-btn flex items-center justify-center transition-all duration-150 active:scale-75"
            aria-label="Comments"
          >
            <MessageCircle className="w-6 h-6 stroke-white stroke-[2.2] fill-white/10 group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-white text-[11px] font-bold mt-1 drop-shadow-md tracking-tight">
            {commentCount}
          </span>
        </div>

        {/* BOOKMARK / SAVE BUTTON (Instagram Ribbon) */}
        <div
          className="flex flex-col items-center cursor-pointer group"
          onClick={() => {
            setIsSaved(!isSaved);
            setShareNotice(!isSaved ? 'Saved to collection' : 'Removed from collection');
            setTimeout(() => setShareNotice(''), 2000);
          }}
        >
          <button
            className={`w-12 h-12 rounded-full ios-glass-btn flex items-center justify-center transition-all duration-150 active:scale-75 ${
              isSaved ? 'border-amber-400/40 bg-amber-500/20' : ''
            }`}
            aria-label="Save"
          >
            <Bookmark
              className={`w-6 h-6 transition-all duration-200 ${
                isSaved
                  ? 'fill-[#ffd60a] stroke-[#ffd60a] scale-110 drop-shadow-[0_0_12px_rgba(255,214,10,0.8)]'
                  : 'fill-transparent stroke-white stroke-[2.2] group-hover:scale-110'
              }`}
            />
          </button>
          <span className="text-white text-[11px] font-bold mt-1 drop-shadow-md tracking-tight">
            {isSaved ? 'Saved' : 'Save'}
          </span>
        </div>

        {/* SHARE BUTTON (Instagram Paper Plane / Send) */}
        <div className="flex flex-col items-center cursor-pointer group" onClick={handleShare}>
          <button
            className="w-12 h-12 rounded-full ios-glass-btn flex items-center justify-center transition-all duration-150 active:scale-75"
            aria-label="Share"
          >
            <Send className="w-6 h-6 stroke-white stroke-[2.2] -rotate-12 -translate-y-0.5 group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-white text-[11px] font-bold mt-1 drop-shadow-md tracking-tight">
            Share
          </span>
        </div>

        {/* ROTATING AUDIO VINYL DISC (Instagram Signature Audio Cover) */}
        <div className="relative mt-1 cursor-pointer flex items-center justify-center group">
          {/* Floating musical note animation */}
          {isPlaying && (
            <div className="absolute -top-3.5 -left-2 text-white/90 animate-float-music pointer-events-none">
              <Music2 className="w-4 h-4 text-rose-400" />
            </div>
          )}

          {/* Vinyl Disc with authentic groove rings */}
          <div
            className={`w-11 h-11 rounded-full border-2 border-white/60 bg-gradient-to-tr from-neutral-950 via-neutral-800 to-neutral-900 shadow-2xl flex items-center justify-center overflow-hidden ${
              isPlaying ? 'animate-disc-spin' : ''
            }`}
          >
            {/* Center label */}
            <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] border border-white flex items-center justify-center shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-black" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 7. BOTTOM-LEFT INFORMATION OVERLAY (Instagram Feed Aesthetic) ─── */}
      <div
        className="absolute bottom-5 left-3.5 right-18 z-20 pointer-events-auto flex flex-col gap-2 max-w-[calc(100%-80px)] select-text"
        onClick={e => e.stopPropagation()}
      >
        {/* CHANNEL / PROFILE ROW (Instagram Story Ring + Verified + Follow Pill) */}
        <div className="flex items-center gap-2.5">
          {/* Channel Avatar with Story Multi-Color Gradient Ring */}
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-lg shrink-0">
            <div className="w-8 h-8 rounded-full bg-black border border-black flex items-center justify-center overflow-hidden">
              <span className="text-white font-black text-[11px] tracking-tight">SN</span>
            </div>
          </div>

          {/* Account Handle & Verified Badge */}
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-white font-bold text-sm tracking-tight drop-shadow-md truncate">
              starnewsindia
            </span>
            <CheckCircle2 className="w-4 h-4 text-white fill-[#0095f6] shrink-0 drop-shadow-sm" />
          </div>

          {/* Instagram-Style "Follow" / "Following" Pill Button */}
          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-all duration-150 active:scale-95 shadow-sm shrink-0 flex items-center gap-1 ${
              isFollowing
                ? 'bg-white/20 backdrop-blur-md text-white/90 border border-white/25'
                : 'bg-white text-neutral-950 font-bold hover:bg-neutral-100 shadow-md'
            }`}
          >
            {isFollowing ? (
              <>
                <Check className="w-3 h-3 text-white" />
                <span>Following</span>
              </>
            ) : (
              <span>Follow</span>
            )}
          </button>
        </div>

        {/* HEADLINE / ARTICLE TITLE */}
        {short.title && (
          <h2 className="text-white font-bold text-[14px] sm:text-[15px] leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] line-clamp-2">
            {short.title}
          </h2>
        )}

        {/* CAPTION with Instagram-style inline "...more" expander */}
        {short.caption && (
          <div className="text-xs text-white/85 drop-shadow-md pr-1 leading-relaxed">
            <p className={isCaptionExpanded ? 'text-white/95 leading-relaxed break-words' : 'line-clamp-2 text-white/80'}>
              {short.caption}
            </p>
            {short.caption.length > 70 && (
              <button
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-white font-bold text-[11px] mt-0.5 hover:underline transition-colors opacity-90 hover:opacity-100"
              >
                {isCaptionExpanded ? 'less' : '...more'}
              </button>
            )}
          </div>
        )}

        {/* INSTAGRAM AUDIO PILL WITH BOUNCING EQUALIZER WAVES */}
        <div className="flex items-center gap-2 mt-0.5">
          <div className="inline-flex items-center gap-2 bg-black/45 backdrop-blur-xl border border-white/15 rounded-full px-3 py-1 shadow-md max-w-[240px] overflow-hidden">
            <Music2 className="w-3 h-3 text-white shrink-0" />
            <div className="overflow-hidden whitespace-nowrap min-w-0 flex-1">
              <span className="animate-audio-marquee text-[11px] font-medium text-white/90 pr-4">
                starnewsindia • Original Audio • Daily Breaking News
              </span>
            </div>
            {/* 3 Animated Equalizer Wave Bars */}
            <div className="flex items-end gap-[2px] h-3.5 shrink-0 px-0.5">
              <span className="w-[2.5px] bg-white rounded-full animate-eq-1" />
              <span className="w-[2.5px] bg-white rounded-full animate-eq-2" />
              <span className="w-[2.5px] bg-white rounded-full animate-eq-3" />
            </div>
          </div>
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
              {commentsList.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <img
                    src={item.avatar}
                    alt={item.user}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-bold">{item.user}</span>
                      <span className="text-neutral-500 text-[11px]">{item.time}</span>
                    </div>
                    <p className="text-neutral-200 text-xs mt-0.5 leading-relaxed">{item.text}</p>
                  </div>
                  <div className="flex flex-col items-center text-neutral-500 hover:text-rose-500 cursor-pointer pt-1">
                    <Heart className="w-3.5 h-3.5" />
                    <span className="text-[10px] mt-0.5">{item.likes}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Input Footer (iOS Style) */}
            <form onSubmit={handleAddComment} className="p-3 border-t border-white/10 flex items-center gap-2 bg-neutral-950/80">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-bold">U</span>
              </div>
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="flex-1 bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
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
