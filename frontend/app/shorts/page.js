'use client';

import React, { useEffect, useState, useRef } from 'react';
import ShortsVideoPlayer from '@/components/ShortsVideoPlayer';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ShortsPage() {
    const [shorts, setShorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    // Use a ref so the scroll handler always has the latest activeIndex
    // without needing to be re-attached on every state change (perf fix)
    const activeIndexRef = useRef(0);

    useEffect(() => {
        const fetchShorts = async () => {
            try {
                const res = await fetch('/api/shorts');
                const data = await res.json();
                if (data.shorts) {
                    setShorts(data.shorts);
                }
            } catch (error) {
                console.error('Failed to fetch shorts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchShorts();
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            // Calculate which short occupies the majority of the viewport
            const scrollPosition = container.scrollTop;
            const windowHeight = window.innerHeight;
            const currentIndex = Math.round(scrollPosition / windowHeight);

            if (currentIndex !== activeIndexRef.current) {
                activeIndexRef.current = currentIndex;
                setActiveIndex(currentIndex);
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
        // Empty dep array — the ref keeps handler in sync without re-attaching
    }, []);

    if (loading) {
        return (
            <div className="w-full h-[100dvh] bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    if (shorts.length === 0) {
        return (
            <div className="w-full h-[100dvh] bg-black flex flex-col items-center justify-center text-white p-4">
                <p className="text-xl mb-4">No Shorts Available</p>
                <Link href="/" className="px-4 py-2 bg-primary rounded-full hover:bg-primary/90 transition-colors">
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[100dvh] bg-black overflow-hidden">
            {/* Top Navigation Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 z-50 flex items-center justify-between pointer-events-none">
                <Link href="/" className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 pointer-events-auto transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="text-white font-bold tracking-widest text-lg drop-shadow-md">
                    SHORTS
                </div>
                <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* Vertical Snap Scroll Container — .hide-scrollbar is defined in globals.css */}
            <div
                ref={containerRef}
                className="w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
            >
                {shorts.map((short, index) => (
                    <div key={short.id} className="w-full h-[100dvh] snap-center relative">
                        <ShortsVideoPlayer
                            short={short}
                            isActive={index === activeIndex}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
