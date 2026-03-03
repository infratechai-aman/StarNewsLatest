'use client'

import React, { useRef, useEffect } from 'react';

export default function VideoLogo({ className = "", style = {}, videoSrc = "/StarNewsLogo.mp4" }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // Use willReadFrequently to optimize for continuous getImageData calls
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let animationFrameId;

        // Ensure video is playing
        const playVideo = async () => {
            try {
                if (video.paused) {
                    await video.play();
                }
            } catch (err) {
                console.warn("Autoplay was prevented by the browser. Interaction may be required.", err);
            }
        };
        playVideo();

        const processFrame = () => {
            if (video && !video.paused && !video.ended && video.videoWidth > 0 && video.videoHeight > 0) {
                // Match canvas size to video size
                if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
                if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

                // Draw current video frame to canvas
                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

                // Extract pixel data
                const frame = ctx.getImageData(0, 0, video.videoWidth, video.videoHeight);
                const data = frame.data;
                const length = data.length;

                // Chroma key (Green screen removal) algorithm
                for (let i = 0; i < length; i += 4) {
                    const r = data[i + 0];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Identify green pixels: high green value, significantly higher than red and blue
                    if (g > 80 && g > r * 1.2 && g > b * 1.2) {
                        // Calculate how "green" the pixel is for anti-aliasing edges
                        const maxColor = Math.max(r, b);
                        const diff = g - maxColor;

                        if (diff > 40) {
                            data[i + 3] = 0; // fully transparent
                        } else {
                            // semi-transparent blending for smoother edges
                            data[i + 3] = 255 - (diff * 6);
                            // remove color spill 
                            data[i + 1] = maxColor;
                        }
                    }
                }

                // Put modified pixel data back
                ctx.putImageData(frame, 0, 0);
            }
            // Keep looping regardless of current state to catch when video starts playing
            animationFrameId = requestAnimationFrame(processFrame);
        };

        // Start processing frame immediately
        processFrame();

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
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
                className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none -z-10"
            />
            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain pointer-events-none"
            />
        </div>
    );
}
