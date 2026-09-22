'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Share2,
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
  Check
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showPlayIndicator, setShowPlayIndicator] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareNotice, setShareNotice] = useState('');

  // Comment state
  const [commentsList, setCommentsList] = useState([
    { id: 1, user: 'Priya_Sharma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60', text: 'Important update! Thanks StarNews for covering this.', time: '2h ago', likes: 14 },
    { id: 2, user: 'Rahul_M', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60', text: 'Best news coverage format, loving these quick shorts 🙌', time: '5h ago', likes: 8 }
  ]);
  const [newComment, setNewComment] = useState('');

  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef(null);

  // YouTube URL extraction
  const getYoutubeId = (url) => {
    if (!url) return null;
    const trimmed = String(url).trim();
    // Direct 11-char video ID support
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
      title: short.title || 'StarNews Shorts',
      text: short.caption || 'Watch this breaking update on StarNews Shorts!',
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
      user: 'You',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      text: newComment.trim(),
      time: 'Just now',
      likes: 0
    };
    setCommentsList(prev => [newEntry, ...prev]);
    setNewComment('');
  };

  const formattedLikes = likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount;
  const commentCount = commentsList.length;

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center snap-center select-none overflow-hidden"
      onClick={handleVideoTap}
    >
      {/* ─── 1. MEDIA LAYER ─── */}
      {isImage ? (
        <img
          src={short.mediaUrl}
          alt={short.title || 'Reel Image'}
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      ) : youtubeId ? (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          <iframe
            key={`yt-${youtubeId}-${isMuted ? 'muted' : 'unmuted'}`}
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${isActive ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${youtubeId}&rel=0&playsinline=1&enablejsapi=1${typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : ''}`}
            className="w-full h-full object-cover scale-[1.03] pointer-events-none"
            style={{ border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title={short.title || 'StarNews Short'}
          />
        </div>
      ) : isNativeVideo ? (
        <div className="w-full h-full relative flex items-center justify-center">
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

      {/* ─── 2. INSTAGRAM DOUBLE-TAP HEART BURST ANIMATION ─── */}
      {showHeartBurst && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="animate-heart-pop text-red-500 drop-shadow-[0_0_25px_rgba(255,0,85,0.8)]">
            <Heart className="w-28 h-28 fill-red-500 stroke-white stroke-[1.5]" />
          </div>
        </div>
      )}

      {/* ─── 3. SINGLE-TAP PLAY / PAUSE INDICATOR ─── */}
      {showPlayIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-opacity">
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-200">
            {isPlaying ? (
              <Play className="w-9 h-9 fill-white translate-x-0.5" />
            ) : (
              <Pause className="w-9 h-9 fill-white" />
            )}
          </div>
        </div>
      )}

      {/* ─── 4. OVERLAYS & GRADIENTS (Reels / Shorts Cinematic Depth) ─── */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

      {/* ─── 5. TOP FLOATING CONTROLS (Sound & Category) ─── */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
        {/* Sound Mute / Unmute Toggle */}
        <button
          onClick={toggleMute}
          className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/15 hover:bg-black/60 active:scale-95 transition-all shadow-lg"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-red-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* ─── 6. RIGHT VERTICAL ACTION RAIL (Instagram Reels + YouTube Shorts) ─── */}
      <div
        className="absolute right-3 bottom-14 z-30 flex flex-col items-center gap-5 pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* LIKE BUTTON (Instagram Heart with animated fill) */}
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => handleLike()}>
          <button
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 active:scale-75 ${
              isLiked
                ? 'bg-red-500/20 text-red-500'
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
            aria-label="Like"
          >
            <Heart
              className={`w-7 h-7 transition-transform ${
                isLiked
                  ? 'fill-red-500 stroke-red-500 scale-110 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                  : 'fill-transparent stroke-white'
              }`}
            />
          </button>
          <span className="text-white text-[11px] font-bold mt-1 drop-shadow-md tracking-tight">
            {formattedLikes}
          </span>
        </div>

        {/* COMMENTS BUTTON (Instagram Speech Bubble) */}
        <div className="flex flex-col items-center cursor-pointer" onClick={() => setShowComments(true)}>
          <button
            className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 active:scale-75 transition-all duration-200"
            aria-label="Comments"
          >
            <MessageCircle className="w-7 h-7 stroke-white fill-white/10" />
          </button>
          <span className="text-white text-[11px] font-bold mt-1 drop-shadow-md tracking-tight">
            {commentCount}
          </span>
        </div>

        {/* BOOKMARK / SAVE BUTTON (Instagram Ribbon) */}
        <div
          className="flex flex-col items-center cursor-pointer"
          onClick={() => {
            setIsSaved(!isSaved);
            setShareNotice(!isSaved ? 'Saved to bookmarks' : 'Removed from bookmarks');
            setTimeout(() => setShareNotice(''), 2000);
          }}
        >
          <button
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 active:scale-75 ${
              isSaved
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
            aria-label="Save"
          >
            <Bookmark
              className={`w-7 h-7 transition-transform ${
                isSaved ? 'fill-amber-400 stroke-amber-400 scale-110' : 'fill-transparent stroke-white'
              }`}
            />
          </button>
          <span className="text-white text-[11px] font-bold mt-1 drop-shadow-md tracking-tight">
            {isSaved ? 'Saved' : 'Save'}
          </span>
        </div>

        {/* SHARE BUTTON (YouTube curved arrow / Paper plane) */}
        <div className="flex flex-col items-center cursor-pointer" onClick={handleShare}>
          <button
            className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 active:scale-75 transition-all duration-200"
            aria-label="Share"
          >
            <Share2 className="w-7 h-7 stroke-white" />
          </button>
          <span className="text-white text-[11px] font-bold mt-1 drop-shadow-md tracking-tight">
            Share
          </span>
        </div>

        {/* ROTATING AUDIO VINYL DISC (Instagram Reels & YouTube Shorts signature) */}
        <div className="relative mt-2 cursor-pointer flex items-center justify-center">
          {/* Floating musical note animation */}
          {isPlaying && (
            <div className="absolute -top-3 -left-2 text-white/80 animate-float-music pointer-events-none">
              <Music2 className="w-4 h-4 text-red-400" />
            </div>
          )}

          {/* Vinyl Disc with groove styling */}
          <div
            className={`w-10 h-10 rounded-full border-2 border-gray-900 bg-gradient-to-tr from-gray-950 via-gray-800 to-gray-900 shadow-xl flex items-center justify-center overflow-hidden ${
              isPlaying ? 'animate-disc-spin' : ''
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-red-600 border border-white flex items-center justify-center shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 7. BOTTOM-LEFT INFORMATION OVERLAY ─── */}
      <div
        className="absolute bottom-4 left-3 right-16 z-20 pointer-events-auto flex flex-col gap-2"
        onClick={e => e.stopPropagation()}
      >
        {/* CHANNEL / AUTHOR ROW (Instagram Story Ring + YouTube Subscribe Button) */}
        <div className="flex items-center gap-2.5">
          {/* Channel Avatar with Story Gradient */}
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 shadow-md">
            <div className="w-8 h-8 rounded-full bg-black border border-white/80 flex items-center justify-center overflow-hidden">
              <span className="text-white font-black text-[11px] tracking-tighter">SN</span>
            </div>
          </div>

          {/* Channel Handle & Verified Tick */}
          <div className="flex items-center gap-1">
            <span className="text-white font-bold text-sm drop-shadow-md hover:underline cursor-pointer">
              @starnewsindia
            </span>
            <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400/20" />
          </div>

          {/* YouTube Shorts Signature Red "Subscribe" Button */}
          <button
            onClick={() => setIsSubscribed(!isSubscribed)}
            className={`text-xs font-bold px-3 py-1 rounded-full transition-all active:scale-95 shadow-md flex items-center gap-1 ${
              isSubscribed
                ? 'bg-white/20 backdrop-blur-md text-white border border-white/30'
                : 'bg-red-600 hover:bg-red-700 text-white'
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

        {/* HEADLINE / TITLE */}
        {short.title && (
          <h2 className="text-white font-extrabold text-sm sm:text-base leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">
            {short.title}
          </h2>
        )}

        {/* CAPTION with Instagram-style "...more" expandable toggle */}
        {short.caption && (
          <div className="text-xs text-gray-200 drop-shadow-md pr-2">
            <p className={isCaptionExpanded ? 'text-gray-100 leading-relaxed' : 'line-clamp-2 text-gray-300'}>
              {short.caption}
            </p>
            {short.caption.length > 75 && (
              <button
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-white/80 hover:text-white font-bold text-[11px] mt-0.5 underline transition-colors"
              >
                {isCaptionExpanded ? 'Show less' : '...more'}
              </button>
            )}
          </div>
        )}

        {/* AUDIO TRACK TICKER (Reels & Shorts signature pill) */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1 text-[11px] text-white/90 shadow-sm max-w-[220px] overflow-hidden">
            <Music2 className="w-3 h-3 text-white shrink-0 animate-pulse" />
            <div className="overflow-hidden whitespace-nowrap">
              <span className="animate-audio-marquee text-[11px] font-medium pr-4">
                StarNews Original Audio • Breaking Bulletin • Daily Marathi & Hindi News
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 8. YOUTUBE SHORTS ULTRA-THIN PROGRESS BAR ─── */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/20 z-40 pointer-events-none">
        <div
          className="h-full bg-red-600 transition-[width] duration-150 ease-linear shadow-[0_0_8px_rgba(239,68,68,0.9)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ─── 9. SHARE / TOAST NOTIFICATION ─── */}
      {shareNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-lg border border-white/20 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{shareNotice}</span>
        </div>
      )}

      {/* ─── 10. INSTAGRAM COMMENTS BOTTOM SHEET DRAWER ─── */}
      {showComments && (
        <div
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end pointer-events-auto animate-in fade-in duration-200"
          onClick={e => {
            e.stopPropagation();
            setShowComments(false);
          }}
        >
          <div
            className="w-full bg-neutral-900 border-t border-neutral-800 rounded-t-2xl max-h-[65%] min-h-[50%] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
              <div className="w-8" />
              <div className="flex flex-col items-center">
                <div className="w-10 h-1 bg-neutral-700 rounded-full mb-1" />
                <span className="text-white text-xs font-bold">Comments ({commentCount})</span>
              </div>
              <button
                onClick={() => setShowComments(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
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
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-neutral-700"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-bold">{item.user}</span>
                      <span className="text-neutral-500 text-[10px]">{item.time}</span>
                    </div>
                    <p className="text-neutral-200 text-xs mt-0.5">{item.text}</p>
                  </div>
                  <div className="flex flex-col items-center text-neutral-500 hover:text-red-500 cursor-pointer">
                    <Heart className="w-3.5 h-3.5" />
                    <span className="text-[10px] mt-0.5">{item.likes}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Input Footer */}
            <form onSubmit={handleAddComment} className="p-3 border-t border-neutral-800 flex items-center gap-2 bg-neutral-950">
              <input
                type="text"
                placeholder="Add a comment as guest..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-full px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="p-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-full transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
