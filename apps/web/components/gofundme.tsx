"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Target, Users, TrendingUp, X, RefreshCw } from 'lucide-react';

interface GoFundMeProps {
    campaignId: string;
    useEmbedded?: boolean;
    showTracker?: boolean;
}

interface CampaignData {
    id: string;
    title: string;
    description: string;
    goal: number;
    current_amount: number;
    currency: string;
    status: string;
    donors_count: number;
    url: string;
    organizer: {
        name: string;
        location: string;
    };
    media?: {
        type: string;
        url: string;
        caption?: string;
    }[];
    minimum_donation_amount?: number;
}

const GoFundMe: React.FC<GoFundMeProps> = ({ campaignId, useEmbedded = false, showTracker = false }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPublicCampaignData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('Fetching public campaign data for:', campaignId);
            const response = await fetch(`/api/gofundme/public?id=${campaignId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Public API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Public API error:', errorText);
                throw new Error(`Failed to fetch public campaign data: ${response.status}`);
            }

            const data: CampaignData = await response.json();
            console.log('Public campaign data received:', data);
            setCampaignData(data);
        } catch (err) {
            console.error('Error fetching public campaign data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load campaign data');
        } finally {
            setIsLoading(false);
        }
    }, [campaignId]);

    // Fetch campaign data on component mount
    useEffect(() => {
        fetchPublicCampaignData();

        // Only load GoFundMe widget script if embedded mode is enabled
        if (useEmbedded) {
            const script = document.createElement('script');
            script.src = 'https://www.gofundme.com/static/js/embed.js';
            script.async = true;
            document.body.appendChild(script);

            return () => {
                // Cleanup script when component unmounts
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            };
        }
    }, [useEmbedded, campaignId, fetchPublicCampaignData]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    const goFundMeUrl = campaignData?.url || `https://give.griotandgrits.org/campaign/${campaignId}/donate`;

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const calculateProgress = () => {
        if (!campaignData) return 35; // Default fallback
        return Math.min((campaignData.current_amount / campaignData.goal) * 100, 100);
    };

    const openDonationModal = () => {
        if (useEmbedded) {
            setIsModalOpen(true);
        } else {
            // Open in new window/tab (external link)
            window.open(goFundMeUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const closeDonationModal = () => {
        setIsModalOpen(false);
    };

    return (
        <section id="donate" className="py-20 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h3 className="text-[#AE2D24] tracking-widest font-semibold text-xl mt-6 mb-4 uppercase">/ Support Our Mission</h3>
                    <p className="text-xl font-bold text-neutral-800 max-w-2xl mx-auto">
                        {campaignData?.description || 'Help us preserve Black voices and stories for future generations. Your donation directly supports our technology, equipment, and community outreach efforts.'}
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Impact Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div className="space-y-6">

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                                    <div className="w-10 h-10 bg-[#AE2D24] rounded-full flex items-center justify-center flex-shrink-0">
                                        <Heart className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-1">Preserve Stories</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Fund recording equipment and storage to capture precious family histories
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                                    <div className="w-10 h-10 bg-[#AE2D24] rounded-full flex items-center justify-center flex-shrink-0">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-1">AI Technology</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Support development of AI tools for metadata generation and story enhancement
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                                    <div className="w-10 h-10 bg-[#AE2D24] rounded-full flex items-center justify-center flex-shrink-0">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-1">Community Outreach</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Enable workshops and events to help families document their own stories
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                                    <div className="w-10 h-10 bg-[#AE2D24] rounded-full flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-1">Platform Growth</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Scale our platform to reach more communities and preserve more voices
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </motion.div>

                    {/* Every Voice Matters Call to Action */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="bg-white rounded-xl p-8 shadow-xl border border-gray-200"
                    >
                        <h4 className="text-3xl font-bold mb-4 text-center text-[#AE2D24]">Every Voice Matters</h4>
                        <p className="text-lg text-gray-700 mb-6 text-center">
                            Join us in building a lasting legacy of Black history and culture.
                            Together, we can ensure these important stories are never forgotten.
                        </p>

                        {/* Progress bar */}
                        {showTracker && (
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Raised: {campaignData ? formatCurrency(campaignData.current_amount, campaignData.currency) : 'unknown'}
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        Goal: {campaignData ? formatCurrency(campaignData.goal, campaignData.currency) : 'unknown'}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-[#AE2D24] h-3 rounded-full transition-all duration-500"
                                        style={{width: `${calculateProgress()}%`}}
                                    ></div>
                                </div>
                                {campaignData && (
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>{campaignData.donors_count} donors</span>
                                        <span>{Math.round(calculateProgress())}% funded</span>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Main donation button */}
                        <div className="text-center">
                            {isLoading ? (
                                <button disabled className="bg-gray-400 text-white px-8 py-4 rounded-lg font-bold text-xl flex items-center justify-center gap-3 mx-auto">
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                    Loading Campaign...
                                </button>
                            ) : error ? (
                                <div className="text-center">
                                    <p className="text-red-600 text-sm mb-2">{error}</p>
                                    <button
                                        onClick={fetchPublicCampaignData}
                                        className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={openDonationModal}
                                    className="bg-[#AE2D24] text-white px-8 py-4 rounded-lg font-bold text-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
                                >
                                    <Heart className="w-6 h-6" />
                                    Donate Now
                                </button>
                            )}
                            <p className="text-xs text-gray-500 mt-3">
                                {useEmbedded
                                    ? 'Secure donation form opens on this page'
                                    : 'Opens secure donation page in new window'
                                }
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Donation Modal - Only when embedded mode is enabled */}
                <AnimatePresence>
                    {useEmbedded && isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                            onClick={closeDonationModal}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] max-h-[600px] flex flex-col"
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-4 border-b">
                                    <h3 className="text-xl font-bold text-[#AE2D24]">Support Griot and Grits</h3>
                                    <button
                                        onClick={closeDonationModal}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Content - Embedded Donation */}
                                <div className="flex-1 relative">
                                    <iframe
                                        src={`https://www.gofundme.com/mvc.php?route=widgets/mediawidget&fund=${campaignId}&image=1&coinfo=1&preview=1`}
                                        className="w-full h-full border-0"
                                        title="Donation Form"
                                        allow="payment"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>

                                {/* Modal Footer */}
                                <div className="p-4 border-t bg-gray-50 text-center">
                                    <p className="text-sm text-gray-600">
                                        Secure donation processing powered by our trusted payment partner
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default GoFundMe;