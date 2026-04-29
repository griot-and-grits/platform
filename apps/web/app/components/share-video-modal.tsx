
import React, { useState, useEffect } from 'react';
import { X, Check, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoId: string;
    videoTitle: string;
}

const ShareVideoModal: React.FC<ShareVideoModalProps> = ({ isOpen, onClose, videoId, videoTitle }) => {
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const url = `${window.location.origin}/collection?video=${videoId}`;
            setShareUrl(url);
        }
    }, [videoId]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={handleBackdropClick}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Share2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Share Video</h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">{videoTitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* URL Display and Copy */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                Direct Link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-muted text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                                    onClick={(e) => e.currentTarget.select()}
                                />
                                <button
                                    onClick={handleCopy}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                                        copied
                                            ? 'bg-green-600 text-white'
                                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    }`}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        'Copy'
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">
                                Share this link to allow others to watch this video directly. When they click the link, the video player will automatically open.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ShareVideoModal;
