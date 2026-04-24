"use client"

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type VideoProvider = 'youtube' | 'vimeo' | 'direct';

export interface VideoPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    title: string;
}

// Utility function to detect video provider and extract video ID
export function parseVideoUrl(url: string): { provider: VideoProvider; videoId: string; embedUrl: string } {
    // Handle empty or invalid URLs
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return {
            provider: 'direct',
            videoId: '',
            embedUrl: ''
        };
    }
    
    try {
        // Ensure we have a valid URL format
        const urlToTest = url.startsWith('http') ? url : `https://${url}`;
        const parsedUrl = new URL(urlToTest);
        
        // YouTube detection
        if (parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')) {
            let videoId = '';
            
            if (parsedUrl.hostname.includes('youtu.be')) {
                videoId = parsedUrl.pathname.slice(1);
            } else if (parsedUrl.hostname.includes('youtube.com')) {
                videoId = parsedUrl.searchParams.get('v') || '';
            }
            
            return {
                provider: 'youtube',
                videoId,
                embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
            };
        }
        
        // Vimeo detection
        if (parsedUrl.hostname.includes('vimeo.com')) {
            const videoId = parsedUrl.pathname.split('/').pop() || '';
            return {
                provider: 'vimeo',
                videoId,
                embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`
            };
        }
        
        // Direct video file (mp4, webm, etc.)
        if (url.match(/\.(mp4|webm|ogg)$/i)) {
            return {
                provider: 'direct',
                videoId: '',
                embedUrl: url
            };
        }
        
        // Fallback - treat as direct URL
        return {
            provider: 'direct',
            videoId: '',
            embedUrl: url
        };
    } catch (error) {
        console.error('Error parsing video URL:', error);
        return {
            provider: 'direct',
            videoId: '',
            embedUrl: ''
        };
    }
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ isOpen, onClose, videoUrl, title }) => {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    // Don't render anything during SSR to avoid hydration issues
    if (!mounted) {
        return null;
    }
    
    // Don't render if not open
    if (!isOpen) {
        return null;
    }
    
    // Don't try to parse video URL if it's not provided
    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
        return null;
    }
    
    const { provider, embedUrl } = parseVideoUrl(videoUrl);

    const renderPlayer = () => {
        
        switch (provider) {
            case 'youtube':
            case 'vimeo':
                return (
                    <iframe
                        src={embedUrl}
                        title={title}
                        className="w-full h-full border-0 rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                );
            
            case 'direct':
                if (!embedUrl) {
                    return (
                        <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
                            <div className="text-center text-muted-foreground">
                                <p className="mb-2">No video available</p>
                                <p className="text-sm">Video URL is missing or invalid</p>
                            </div>
                        </div>
                    );
                }
                return (
                    <video
                        src={embedUrl}
                        title={title}
                        className="w-full h-full rounded-lg"
                        controls
                        autoPlay
                    >
                        Your browser does not support the video tag.
                    </video>
                );
            
            default:
                return (
                    <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
                        <div className="text-center text-muted-foreground">
                            <p className="mb-2">Unable to play video</p>
                            <p className="text-sm">Unsupported video format or URL</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="relative w-full max-w-4xl mx-auto bg-background rounded-lg shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                            <h2 className="text-lg font-semibold text-foreground truncate pr-4">
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-accent transition-colors"
                                aria-label="Close video player"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Video Player */}
                        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                            {renderPlayer()}
                        </div>
                        
                        {/* Footer with provider info */}
                        <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground">
                            <p>Playing from {provider === 'youtube' ? 'YouTube' : provider === 'vimeo' ? 'Vimeo' : 'Direct source'}</p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VideoPlayer;