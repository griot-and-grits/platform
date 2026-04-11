"use client"

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
    Search,
    Filter,
    MapPin,
    MessageSquare,
    Play,
    Clock,
    User,
    Tag,
    X,
    Calendar,
    Send,
    Loader2,
    History,
    Headphones,
    Share2
} from 'lucide-react';
import {
    Video,
    FilterMetadata,
    getAllTags,
    getAllPeople,
    filterVideos,
    HISTORICAL_ERAS,
    getHistoricalYears,
    getHistoricalLocations
} from '@/lib/video-metadata';
import { griotLLM, ChatMessage } from '@/lib/griot-llm';
import dynamic from 'next/dynamic';
import VideoPlayer from './video-player';
import ShareVideoModal from './share-video-modal';

// Dynamically import the map component to avoid SSR issues
const InteractiveMap = dynamic(() => import('./interactive-map'), {
    ssr: false,
    loading: () => (
        <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
            <div className="text-muted-foreground">Loading map...</div>
        </div>
    )
});

interface CollectionsProps {
    videos: Video[];
    filters: FilterMetadata;
    askTheGriotEnabled?: boolean;
}

const Collections: React.FC<CollectionsProps> = ({ videos, filters, askTheGriotEnabled = true }) => {
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [showMap, setShowMap] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [selectedEra, setSelectedEra] = useState<string | null>(null);
    const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
    const [expandedTags, setExpandedTags] = useState<{ [videoId: string]: boolean }>({});
    const [expandedDescriptions, setExpandedDescriptions] = useState<{ [videoId: string]: boolean }>({});
    const [showAllTags, setShowAllTags] = useState(false);
    const [showAllPeople, setShowAllPeople] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
    const [shareVideo, setShareVideo] = useState<Video | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const allTags = getAllTags(videos, filters);
    const allPeople = getAllPeople(videos, filters);

    // Get top 10 most popular tags and people
    const topTags = allTags.slice(0, 10);
    const remainingTags = allTags.slice(10);
    const topPeople = allPeople.slice(0, 10);
    const remainingPeople = allPeople.slice(10);

    useEffect(() => {
        // Sort videos by creation date descending (newest first) on initial load
        const sortedVideos = [...videos].sort((a, b) =>
            new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        );
        setFilteredVideos(sortedVideos);
    }, [videos]);

    // Handle direct video links via URL parameter
    useEffect(() => {
        const videoId = searchParams.get('video');
        if (videoId) {
            const video = videos.find(v => v.id === videoId);
            if (video) {
                handleVideoPlay(video);
            }
        }
    }, [searchParams, videos]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        updateFilteredVideos(query, selectedFilters, selectedLocation, selectedEra);
    };

    const handleFilterToggle = (filter: string) => {
        const newFilters = selectedFilters.includes(filter)
            ? selectedFilters.filter(f => f !== filter)
            : [...selectedFilters, filter];
        setSelectedFilters(newFilters);
        updateFilteredVideos(searchQuery, newFilters, selectedLocation, selectedEra);
    };

    const handleLocationSelect = (location: string | null) => {
        setSelectedLocation(location);
        updateFilteredVideos(searchQuery, selectedFilters, location, selectedEra);
    };

    const handleEraToggle = (eraId: string | null) => {
        setSelectedEra(eraId);
        updateFilteredVideos(searchQuery, selectedFilters, selectedLocation, eraId);

        // Scroll to appropriate section after era selection
        setTimeout(() => {
            const isMobile = window.innerWidth < 768; // md breakpoint

            if (isMobile) {
                // On mobile, scroll to first video
                const videosGrid = document.querySelector('[data-videos-grid]');
                if (videosGrid) {
                    const elementPosition = videosGrid.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - 100;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            } else {
                // On desktop, scroll to show era filters at top with videos visible below
                const eraSection = document.querySelector('[data-era-filters]');
                if (eraSection) {
                    const elementPosition = eraSection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - 120;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        }, 100);
    };

    const updateFilteredVideos = (query: string, filters: string[], location: string | null, era: string | null) => {
        const filtered = filterVideos(videos, query, filters, location, era);
        setFilteredVideos(filtered);
    };

    const toggleTagExpansion = (videoId: string) => {
        setExpandedTags(prev => ({
            ...prev,
            [videoId]: !prev[videoId]
        }));
    };

    const toggleDescriptionExpansion = (videoId: string) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [videoId]: !prev[videoId]
        }));
    };

    const handleVideoPlay = (video: Video) => {
        // Only open video player if we have a valid video URL
        if (video && video.videoUrl && video.videoUrl.trim() !== '') {
            setSelectedVideo(video);
            setIsVideoPlayerOpen(true);
        } else {
            console.error('Cannot play video: missing or invalid video URL', video);
        }
    };

    const handleVideoPlayerClose = () => {
        setIsVideoPlayerOpen(false);
        setSelectedVideo(null);
    };

    const handleShareClick = (video: Video) => {
        setShareVideo(video);
        setIsShareModalOpen(true);
    };

    const handleShareModalClose = () => {
        setIsShareModalOpen(false);
        setShareVideo(null);
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: chatMessage.trim()
        };

        setChatHistory(prev => [...prev, userMessage]);
        setChatMessage('');
        setIsLoading(true);

        // Add placeholder assistant message for streaming updates
        const assistantMessageIndex = chatHistory.length + 1;
        setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: ''
        }]);

        try {
            const context = await griotLLM.loadContext();
            const systemMessage = griotLLM.createSystemMessage(context, userMessage.content);
            
            await griotLLM.chatStream([systemMessage, userMessage], (chunk) => {
                if (chunk.error) {
                    console.error('Stream error:', chunk.error);
                    setChatHistory(prev => {
                        const updated = [...prev];
                        updated[assistantMessageIndex] = {
                            role: 'assistant',
                            content: "I apologize, but I'm having trouble connecting to the knowledge base right now. Please try again in a moment."
                        };
                        return updated;
                    });
                    setIsLoading(false);
                    return;
                }

                if (chunk.done) {
                    setIsLoading(false);
                    return;
                }

                // Update the assistant message with new content
                setChatHistory(prev => {
                    const updated = [...prev];
                    updated[assistantMessageIndex] = {
                        role: 'assistant',
                        content: updated[assistantMessageIndex].content + chunk.content
                    };
                    return updated;
                });

                // Auto-scroll to bottom to follow the streaming text
                setTimeout(() => {
                    if (chatMessagesRef.current) {
                        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
                    }
                }, 0);
            });
        } catch (error) {
            console.error('Chat error:', error);
            setChatHistory(prev => {
                const updated = [...prev];
                updated[assistantMessageIndex] = {
                    role: 'assistant',
                    content: "I apologize, but I'm having trouble connecting to the knowledge base right now. Please try again in a moment."
                };
                return updated;
            });
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <section id="collections" className="py-20 px-6 bg-background">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6">
                        Our Collection
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Explore our archive of oral history videos, preserving the stories and experiences 
                        that shape our communities and culture.
                    </p>
                </motion.div>

                {/* Search and Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search videos, people, topics, or descriptions..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowMap(!showMap)}
                                className={`px-4 py-3 rounded-lg border flex items-center gap-2 transition-colors ${
                                    showMap
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-card text-foreground border-border hover:bg-accent'
                                }`}
                            >
                                <MapPin className="w-5 h-5" />
                                Map
                            </button>
                            {askTheGriotEnabled && (
                                <button
                                    onClick={() => setShowChatbot(!showChatbot)}
                                    className={`px-4 py-3 rounded-lg border flex items-center gap-2 transition-colors ${
                                        showChatbot
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-card text-foreground border-border hover:bg-accent'
                                    }`}
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Ask the Griot
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Map View - Shows directly below buttons */}
                    {showMap && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 bg-card border border-border rounded-lg p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">Video Locations</h3>
                                {selectedLocation && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>Filtering by:</span>
                                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
                                            📍 {selectedLocation}
                                        </span>
                                        <button
                                            onClick={() => handleLocationSelect(null)}
                                            className="text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <InteractiveMap 
                                videos={videos}
                                onLocationClick={handleLocationSelect}
                                selectedLocation={selectedLocation}
                            />
                            <div className="mt-4 text-sm text-muted-foreground">
                                <p>Click on map pins to filter videos by location. Each pin shows videos recorded in that area.</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Griot AI Interface - Shows directly below buttons */}
                    {askTheGriotEnabled && showChatbot && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 bg-card border border-border rounded-lg p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                    <span className="text-primary-foreground font-bold text-lg">🪘</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">The Griot</h3>
                                    <p className="text-sm text-muted-foreground">Your guide to our oral history collection</p>
                                </div>
                            </div>
                            
                            {/* Chat History */}
                            <div className="space-y-4 mb-4">
                                {chatHistory.length === 0 && (
                                    <div className="bg-muted rounded-lg p-4">
                                        <div className="text-foreground text-sm">
                                            <p className="mb-2">
                                                <em>&ldquo;Greetings, friend. I am the keeper of these stories, the voices that echo through time. 
                                                I&rsquo;ve spent countless hours listening, learning, and cataloging the experiences that shape our communities.&rdquo;</em>
                                            </p>
                                            <p className="text-muted-foreground text-xs mb-3">
                                                Tell me what stories you seek, and I&rsquo;ll guide you to the voices that speak to your heart and mind.
                                            </p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <button 
                                                    onClick={() => setChatMessage("Tell me about stories of resilience during difficult times")}
                                                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80"
                                                >
                                                    &ldquo;Stories of resilience&rdquo;
                                                </button>
                                                <button 
                                                    onClick={() => setChatMessage("Show me videos about family traditions and cultural heritage")}
                                                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80"
                                                >
                                                    &ldquo;Cultural heritage&rdquo;
                                                </button>
                                                <button 
                                                    onClick={() => setChatMessage("Find stories about community leaders and changemakers")}
                                                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80"
                                                >
                                                    &ldquo;Community leaders&rdquo;
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Chat Messages */}
                                <div ref={chatMessagesRef} className="max-h-96 overflow-y-auto space-y-3">
                                    {chatHistory.map((message, index) => (
                                        <div 
                                            key={index}
                                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {message.role === 'assistant' && (
                                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-primary-foreground text-sm">🪘</span>
                                                </div>
                                            )}
                                            <div 
                                                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                                    message.role === 'user' 
                                                        ? 'bg-primary text-primary-foreground' 
                                                        : 'bg-muted text-foreground'
                                                }`}
                                            >
                                                {message.content}
                                                {/* Show typing indicator for empty assistant messages when loading */}
                                                {message.role === 'assistant' && !message.content && isLoading && (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <div className="flex space-x-1">
                                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {message.role === 'user' && (
                                                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4 text-secondary-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {/* Loading indicator */}
                                    {isLoading && (
                                        <div className="flex gap-3 justify-start">
                                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-primary-foreground text-sm">🪘</span>
                                            </div>
                                            <div className="bg-muted text-foreground p-3 rounded-lg text-sm flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                The Griot is thinking...
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Input Area */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Tell the Griot what stories you're seeking..."
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={isLoading}
                                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-50"
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!chatMessage.trim() || isLoading}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    Ask
                                </button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Time Period Filter */}
                <motion.div
                    data-era-filters
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="mb-8"
                >
                    <div className="mb-3">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Time Period
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {HISTORICAL_ERAS.map((era) => (
                            <button
                                key={era.id}
                                onClick={() => handleEraToggle(selectedEra === era.id ? null : era.id)}
                                className={`relative h-32 rounded-3xl overflow-hidden transition-all ${
                                    selectedEra === era.id
                                        ? 'ring-4 ring-primary ring-offset-2 ring-offset-background scale-105'
                                        : 'hover:scale-105'
                                }`}
                            >
                                <Image
                                    src={era.image}
                                    alt={era.name}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
                                    <h4 className="text-lg font-bold text-center uppercase tracking-wide">
                                        {era.name}
                                    </h4>
                                    <p className="text-base mt-1 opacity-90">
                                        ({era.subtitle})
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Filter Bar - Always above videos */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mb-8 space-y-4"
                >
                    {/* Filter Tags */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Filters:</span>
                        </div>
                        
                        {/* Tags */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</h4>
                                {remainingTags.length > 0 && (
                                    <button
                                        onClick={() => setShowAllTags(!showAllTags)}
                                        className="text-xs text-primary hover:text-primary/80 underline"
                                    >
                                        {showAllTags ? 'Show less' : `+${remainingTags.length} more`}
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(showAllTags ? allTags : topTags).map(tag => (
                                    <button
                                        key={tag.name}
                                        onClick={() => handleFilterToggle(tag.name)}
                                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                            selectedFilters.includes(tag.name)
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-card text-foreground border-border hover:bg-accent'
                                        }`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* People */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">People</h4>
                                {remainingPeople.length > 0 && (
                                    <button
                                        onClick={() => setShowAllPeople(!showAllPeople)}
                                        className="text-xs text-primary hover:text-primary/80 underline"
                                    >
                                        {showAllPeople ? 'Show less' : `+${remainingPeople.length} more`}
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(showAllPeople ? allPeople : topPeople).map(person => (
                                    <button
                                        key={person.name}
                                        onClick={() => handleFilterToggle(person.name)}
                                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                            selectedFilters.includes(person.name)
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-card text-foreground border-border hover:bg-accent'
                                        }`}
                                    >
                                        {person.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Active Filters */}
                    {(selectedFilters.length > 0 || selectedLocation || selectedEra) && (
                        <div data-active-filters className="flex flex-wrap gap-2 items-center">
                            <span className="text-sm text-muted-foreground">Active:</span>
                            {selectedFilters.map(filter => (
                                <span
                                    key={filter}
                                    className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-sm flex items-center gap-1"
                                >
                                    {filter}
                                    <button onClick={() => handleFilterToggle(filter)}>
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            {selectedLocation && (
                                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                    📍 {selectedLocation}
                                    <button onClick={() => handleLocationSelect(null)}>
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {selectedEra && (
                                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                    🕒 {HISTORICAL_ERAS.find(e => e.id === selectedEra)?.name}
                                    <button onClick={() => handleEraToggle(null)}>
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Video Grid */}
                <motion.div
                    data-videos-grid
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {filteredVideos.map((video, index) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-muted">
                                <Image
                                    src={video.thumbnail}
                                    alt={video.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleVideoPlay(video)}
                                        className="bg-white/90 rounded-full p-3 hover:bg-white transition-colors"
                                        aria-label={`Play ${video.title}`}
                                    >
                                        <Play className="w-6 h-6 text-black ml-1" />
                                    </button>
                                </div>
                                <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {video.duration}
                                </div>
                                <button
                                    onClick={() => handleShareClick(video)}
                                    className="absolute bottom-2 right-2 bg-black/80 hover:bg-black/90 text-white p-2 rounded-full transition-colors"
                                    aria-label="Share video"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    {video.title}
                                </h3>
                                
                                <div className="flex items-center text-sm text-muted-foreground mb-3">
                                    <User className="w-4 h-4 mr-2" />
                                    <div className="flex flex-wrap gap-1">
                                        {video.interviewees.map((interviewee, index) => (
                                            <span key={interviewee}>
                                                {interviewee}
                                                {index < video.interviewees.length - 1 && ', '}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-muted-foreground text-sm mb-4">
                                    <p className={expandedDescriptions[video.id] ? '' : 'line-clamp-3'}>
                                        {video.description}
                                    </p>
                                    {video.description.length > 150 && (
                                        <button
                                            onClick={() => toggleDescriptionExpansion(video.id)}
                                            className="text-xs text-primary hover:text-primary/80 underline mt-1 cursor-pointer"
                                        >
                                            {expandedDescriptions[video.id] ? 'Show less' : 'Read more'}
                                        </button>
                                    )}
                                </div>

                                {(() => {
                                    const locations = getHistoricalLocations(video);
                                    return locations.length > 0 && (
                                        <div
                                            className="flex items-center text-sm text-muted-foreground mb-4 cursor-help"
                                            title="Location(s) mentioned in this story"
                                        >
                                            <MapPin className="w-4 h-4 mr-2" />
                                            <div className="flex flex-wrap gap-1">
                                                {locations.map((location, index) => (
                                                    <span key={location.name}>
                                                        {location.name}
                                                        {index < locations.length - 1 && '; '}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Historical Years */}
                                {(() => {
                                    const years = getHistoricalYears(video);
                                    return years.length > 0 && (
                                        <div
                                            className="flex items-center text-sm text-muted-foreground mb-4 cursor-help"
                                            title="Historical time period(s) referenced in this story"
                                        >
                                            <History className="w-4 h-4 mr-2" />
                                            <div className="flex flex-wrap gap-1">
                                                {years.map((year, index) => (
                                                    <span key={year}>
                                                        {year}
                                                        {index < years.length - 1 && ', '}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div
                                    className="flex items-center text-sm text-muted-foreground mb-4 cursor-help"
                                    title="Date this video was recorded"
                                >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(video.createdDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>

                                {/* Tags */}
                                <div className="relative flex flex-wrap gap-2 mb-4">
                                    {(expandedTags[video.id] ? video.tags : video.tags.slice(0, 3)).map(tag => (
                                        <span
                                            key={tag}
                                            className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs flex items-center gap-1"
                                        >
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                    {video.tags.length > 3 && (
                                        <button
                                            onClick={() => toggleTagExpansion(video.id)}
                                            className="text-xs text-primary hover:text-primary/80 underline cursor-pointer"
                                        >
                                            {expandedTags[video.id] 
                                                ? 'Show less' 
                                                : `+${video.tags.length - 3} more`
                                            }
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleVideoPlay(video)}
                                    className="w-full bg-[#AE2D24] text-white py-2 rounded-lg hover:bg-[#282420] transition-colors flex items-center justify-center gap-2"
                                >
                                    <Play className="w-4 h-4" />
                                    Watch Video
                                </button>

                                {video.podcastUrl && (
                                    <a
                                        href={video.podcastUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-2"
                                    >
                                        <Headphones className="w-4 h-4" />
                                        Listen on Spotify
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* No Results */}
                {filteredVideos.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="text-muted-foreground mb-4">
                            <Search className="w-12 h-12 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold">No videos found</h3>
                            <p>Try adjusting your search or filters to find more content.</p>
                        </div>
                    </motion.div>
                )}

                {/* Results Count */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="text-center mt-12 text-muted-foreground"
                >
                    <p>
                        Showing {filteredVideos.length} of {videos.length} videos
                        {(searchQuery || selectedFilters.length > 0 || selectedLocation || selectedEra) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedFilters([]);
                                    setSelectedLocation(null);
                                    setSelectedEra(null);
                                    // Sort videos by creation date descending when clearing filters
                                    const sortedVideos = [...videos].sort((a, b) =>
                                        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
                                    );
                                    setFilteredVideos(sortedVideos);
                                }}
                                className="ml-4 text-primary hover:text-primary/80 underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </p>
                </motion.div>
                
                {/* Video Player Modal */}
                <VideoPlayer
                    isOpen={isVideoPlayerOpen}
                    onClose={handleVideoPlayerClose}
                    videoUrl={selectedVideo?.videoUrl || ''}
                    title={selectedVideo?.title || ''}
                />

                {/* Share Video Modal */}
                <ShareVideoModal
                    isOpen={isShareModalOpen}
                    onClose={handleShareModalClose}
                    videoId={shareVideo?.id || ''}
                    videoTitle={shareVideo?.title || ''}
                />
            </div>
        </section>
    );
};

export default Collections;