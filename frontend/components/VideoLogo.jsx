'use client'

import React, { useRef, useEffect, useState } from 'react';

export default function VideoLogo({ className = "", style = {}, videoSrc = "/LatestLogo.mp4" }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const isVisibleRef = useRef(false);
    const [hasFirstFrame, setHasFirstFrame] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let animationFrameId;
        let videoFrameCallbackId;
        let isDestroyed = false;
        let lastFrameTime = 0;

        // Ensure video is playing and speed it up
        const playVideo = async () => {
            try {
                if (!video.src) {
                    video.src = videoSrc;
                }
                video.muted = true;
                video.defaultMuted = true;
                video.playbackRate = 2.0;
                if (video.paused) {
                    await video.play();
                }
            } catch (err) {
                if (err?.name !== 'AbortError' && err?.name !== 'NotAllowedError') {
                    console.debug("VideoLogo autoplay note:", err?.message || err);
                }
            }
        };

        // 1. IntersectionObserver: Only activate video if element is actually visible on screen
        // This ensures mobile does NOT download desktop's video, and desktop does NOT download mobile's!
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            const isIntersecting = entry ? entry.isIntersecting : false;
            isVisibleRef.current = isIntersecting;

            if (isIntersecting) {
                playVideo();
            } else if (!video.paused) {
                video.pause();
            }
        }, { threshold: 0.05 });

        observer.observe(canvas);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isVisibleRef.current && video && video.paused) {
                playVideo();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const processFrame = () => {
            if (isDestroyed) return;

            // Only process if element is actually visible, video is playing and has decoded data
            if (isVisibleRef.current && video && !video.paused && !video.ended && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                // OPTIMIZATION: Render at 180px max (logo rendered size is 200px desktop / 130px mobile)
                // This eliminates ~87% of unnecessary pixel processing!
                const MAX_WIDTH = 180;
                let calcWidth = video.videoWidth;
                let calcHeight = video.videoHeight;

                if (calcWidth > MAX_WIDTH) {
                    const ratio = MAX_WIDTH / calcWidth;
                    calcWidth = MAX_WIDTH;
                    calcHeight = Math.floor(calcHeight * ratio);
                }

                if (canvas.width !== calcWidth) canvas.width = calcWidth;
                if (canvas.height !== calcHeight) canvas.height = calcHeight;

                // Draw video frame to canvas at optimized scale
                ctx.drawImage(video, 0, 0, calcWidth, calcHeight);

                // Extract pixel buffer
                const frame = ctx.getImageData(0, 0, calcWidth, calcHeight);
                const buf32 = new Uint32Array(frame.data.buffer);
                const len = buf32.length;

                // Chroma key (Green screen removal) optimized with bitwise ops
                for (let i = 0; i < len; i++) {
                    const pixel = buf32[i];
                    // Little-endian RGBA: 0xAABBGGRR
                    const r = pixel & 0xFF;
                    const g = (pixel >> 8) & 0xFF;
                    const b = (pixel >> 16) & 0xFF;

                    if (g > 80 && g > r * 1.2 && g > b * 1.2) {
                        const maxColor = r > b ? r : b;
                        const diff = g - maxColor;

                        if (diff > 40) {
                            buf32[i] = 0; // Fully transparent
                        } else {
                            const alpha = 255 - (diff * 6);
                            // Reconstruct pixel with smoothed alpha and suppressed green spill
                            buf32[i] = (alpha << 24) | (b << 16) | (maxColor << 8) | r;
                        }
                    }
                }

                // Put modified pixel data back
                ctx.putImageData(frame, 0, 0);

                // Mark that we have at least one frame drawn
                setHasFirstFrame(true);
            }

            // Schedule next frame efficiently
            scheduleNextFrame();
        };

        const scheduleNextFrame = () => {
            if (isDestroyed) return;

            // Preferred: video.requestVideoFrameCallback (only runs when hardware decodes a new frame)
            if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && video?.requestVideoFrameCallback) {
                videoFrameCallbackId = video.requestVideoFrameCallback(() => {
                    processFrame();
                });
            } else {
                // Fallback: throttled requestAnimationFrame (capped at 25fps to prevent CPU exhaustion)
                animationFrameId = requestAnimationFrame((timestamp) => {
                    if (timestamp - lastFrameTime >= 40) {
                        lastFrameTime = timestamp;
                        processFrame();
                    } else {
                        scheduleNextFrame();
                    }
                });
            }
        };

        // Start processing
        scheduleNextFrame();

        return () => {
            isDestroyed = true;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (videoFrameCallbackId && video?.cancelVideoFrameCallback) {
                video.cancelVideoFrameCallback(videoFrameCallbackId);
            }
            observer.disconnect();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return (
        <div className={`relative ${className}`} style={style}>
            {/* Fallback image shown immediately while video loads/buffers */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/starnews-logo.png"
                alt="Star News Logo"
                className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 ${hasFirstFrame ? 'opacity-0' : 'opacity-100'}`}
            />
            <video
                ref={videoRef}
                crossOrigin="anonymous"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                style={{ position: 'fixed', top: -9999, left: -9999, width: '180px', height: '100px', opacity: 0.01, pointerEvents: 'none' }}
            />
            <canvas
                ref={canvasRef}
                className={`w-full h-full object-contain pointer-events-none transition-opacity duration-300 ${hasFirstFrame ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
}
