'use client'

import React, { useRef, useEffect } from 'react';

export default function VideoLogo({ className = "", style = {}, videoSrc = "/LatestLogo.mp4" }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // Use willReadFrequently to optimize for continuous getImageData calls
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let animationFrameId;

        // Ensure video is playing and speed it up
        const playVideo = async () => {
            try {
                video.muted = true;
                video.defaultMuted = true;
                video.playbackRate = 2.0; // Adjusted playback speed based on user feedback
                if (video.paused) {
                    await video.play();
                }
            } catch (err) {
                // Ignore benign browser power-saving interruptions (AbortError / NotAllowedError)
                if (err?.name !== 'AbortError' && err?.name !== 'NotAllowedError') {
                    console.debug("VideoLogo autoplay note:", err?.message || err);
                }
            }
        };
        playVideo();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && video && video.paused) {
                playVideo();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const processFrame = () => {
            if (video && !video.paused && !video.ended && video.videoWidth > 0 && video.videoHeight > 0) {
                // OPTIMIZATION: Process canvas at a much smaller resolution to avoid 1080p pixel-loop lag (ensures 60fps)
                const MAX_WIDTH = 500;
                let calcWidth = video.videoWidth;
                let calcHeight = video.videoHeight;

                if (calcWidth > MAX_WIDTH) {
                    const ratio = MAX_WIDTH / calcWidth;
                    calcWidth = MAX_WIDTH;
                    calcHeight = Math.floor(calcHeight * ratio);
                }

                if (canvas.width !== calcWidth) canvas.width = calcWidth;
                if (canvas.height !== calcHeight) canvas.height = calcHeight;

                // Draw current video frame to canvas at scaled resolution
                ctx.drawImage(video, 0, 0, calcWidth, calcHeight);

                // Extract pixel data
                const frame = ctx.getImageData(0, 0, calcWidth, calcHeight);
                const data = frame.data;
                const length = data.length;

                // Chroma key (Green screen removal) algorithm
                for (let i = 0; i < length; i += 4) {
                    const r = data[i + 0];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Identify green pixels: high green value, significantly higher than red and blue
                    if (g > 80 && g > r * 1.2 && g > b * 1.2) {
                        const maxColor = Math.max(r, b);
                        const diff = g - maxColor;

                        if (diff > 40) {
                            data[i + 3] = 0; // fully transparent
                        } else {
                            data[i + 3] = 255 - (diff * 6); // smooth edges
                            data[i + 1] = maxColor; // remove green spill
                        }
                    }
                }

                // Put modified pixel data back
                ctx.putImageData(frame, 0, 0);
            }
            // Ask browser for next frame (runs up to 60fps)
            animationFrameId = requestAnimationFrame(processFrame);
        };

        // Start processing frame immediately
        processFrame();

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return (
        <div className={`relative ${className}`} style={style}>
            <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                style={{ position: 'fixed', top: -9999, left: -9999, width: '320px', height: '180px', opacity: 0.01, pointerEvents: 'none' }}
            />
            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain pointer-events-none"
            />
        </div>
    );
}
