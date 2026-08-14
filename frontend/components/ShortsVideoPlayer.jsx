'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Share2, Play } from 'lucide-react';

export default function ShortsMediaViewer({ short, isActive }) {
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

    // YouTube URL extraction
    const getYoutubeId = (url) => {
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    };

    const isImage = short.mediaType === 'image';
    const isVideo = short.mediaType === 'video';
    const youtubeId = isVideo ? getYoutubeId(short.mediaUrl) : null;
    const isNativeVideo = isVideo && !youtubeId;

    useEffect(() => {
        if (isNativeVideo && videoRef.current) {
            if (isActive) {
                videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, [isActive, isNativeVideo]);

    const handleShare = async () => {
        const shareData = {
            title: short.title || 'StarNews Reel',
            text: short.caption || 'Check out this post!',
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (e) {
            console.error('Share failed', e);
        }
    };

    const togglePlay = () => {
        if (!isNativeVideo) return;
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center snap-center group">
            {/* --- MEDIA LAYER --- */}
            {isImage ? (
                // Static Image
                <img
                    src={short.mediaUrl}
                    alt={short.title || 'Reel Image'}
                    className="w-full h-[100dvh] object-cover"
                />
            ) : youtubeId ? (
                // YouTube Embed
                // BUG FIX: The `key` prop forces the iframe to remount when isMuted changes,
                // because YouTube's mute param is baked into the src URL and cannot be
                // changed dynamically without remounting the iframe.
                <iframe
                    key={`yt-${youtubeId}-${isMuted ? 'muted' : 'unmuted'}`}
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${isActive ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0&playsinline=1`}
                    className="w-full h-[100dvh] pointer-events-none"
                    style={{ border: 'none', transform: 'scale(1.05)', objectFit: 'cover' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={short.title || 'StarNews Short'}
                />
            ) : isNativeVideo ? (
                // Native Video (.mp4)
                <>
                    <video
                        ref={videoRef}
                        src={short.mediaUrl}
                        className="w-full h-[100dvh] object-cover"
                        loop
                        muted={isMuted}
                        playsInline
                        onClick={togglePlay}
                    />
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 p-4 rounded-full">
                                <Play className="w-12 h-12 text-white opacity-80" />
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-white text-center p-4">Invalid Media Source</div>
            )}

            {/* --- OVERLAY GRADIENT --- */}
            <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

            {/* --- CONTENT LAYER --- */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 sm:pb-6 flex items-end justify-between z-10">
                <div className="flex-1 pr-12 text-white drop-shadow-md pointer-events-auto">
                    {/* Author badge */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs border border-white">
                            SN
                        </div>
                        <span className="font-semibold text-sm">StarNews India</span>
                    </div>

                    {short.title && (
                        <h2 className="text-xl font-bold mb-2 leading-tight">
                            {short.title}
                        </h2>
                    )}

                    {short.caption && (
                        <p className="text-sm text-gray-200 line-clamp-3 overflow-hidden">
                            {short.caption}
                        </p>
                    )}
                </div>

                {/* Right Action Bar */}
                <div className="flex flex-col items-center gap-6 pb-4 pointer-events-auto">
                    {isVideo && (
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>
                    )}

                    <button
                        onClick={handleShare}
                        className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                        aria-label="Share"
                    >
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}
