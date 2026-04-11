"use client"

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Video } from '@/lib/video-metadata';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
import L from 'leaflet';

// Create custom icon to avoid import issues
const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapLocation {
    name: string;
    coordinates: LatLngExpression;
    videos: Video[];
}

interface InteractiveMapProps {
    videos: Video[];
    onLocationClick: (locationName: string) => void;
    selectedLocation: string | null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
    videos, 
    onLocationClick, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectedLocation // TODO: Use for highlighting selected location
}) => {
    const [mapReady, setMapReady] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        try {
            setMapReady(true);
        } catch (error) {
            console.error('Map initialization error:', error);
            setMapError('Failed to initialize map');
        }
    }, []);

    // Group videos by unique locations
    const mapLocations: MapLocation[] = React.useMemo(() => {
        const locationMap = new Map<string, MapLocation>();

        videos.forEach(video => {
            // Get locations from historicalContext
            if (video.historicalContext) {
                video.historicalContext.forEach(ctx => {
                    if (ctx.location) {
                        const location = ctx.location;
                        if (locationMap.has(location.name)) {
                            locationMap.get(location.name)!.videos.push(video);
                        } else {
                            locationMap.set(location.name, {
                                name: location.name,
                                coordinates: [location.coordinates[0], location.coordinates[1]] as LatLngExpression,
                                videos: [video]
                            });
                        }
                    }
                });
            }
        });

        return Array.from(locationMap.values());
    }, [videos]);

    // Center map to show both United States and Africa
    const defaultCenter: LatLngExpression = [30.0, -30.0];

    if (mapError) {
        return (
            <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                    <div className="mb-2">Failed to load map</div>
                    <button 
                        onClick={() => {
                            setMapError(null);
                            setMapReady(false);
                            setTimeout(() => setMapReady(true), 100);
                        }}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!mapReady) {
        return (
            <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
                <div className="text-muted-foreground">Loading map...</div>
            </div>
        );
    }

    try {
        return (
            <div className="h-96 w-full rounded-lg overflow-hidden border border-border">
                <MapContainer
                    center={defaultCenter}
                    zoom={3}
                    style={{ height: '100%', width: '100%' }}
                    className="z-10"
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {mapLocations.map((location) => (
                        <Marker
                            key={location.name}
                            position={location.coordinates}
                            icon={customIcon}
                            eventHandlers={{
                                click: () => onLocationClick(location.name)
                            }}
                        >
                            <Popup>
                                <div className="p-2 min-w-48">
                                    <h3 className="font-semibold mb-2 text-sm">
                                        {location.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 mb-2">
                                        {location.videos.length} {location.videos.length === 1 ? 'story' : 'stories'}
                                    </p>
                                    <div className="space-y-2">
                                        {location.videos.slice(0, 3).map((video) => (
                                            <div key={video.id} className="text-xs">
                                                <div className="font-medium">{video.title}</div>
                                                <div className="text-gray-500">
                                                    {video.interviewees.join(', ')}
                                                </div>
                                            </div>
                                        ))}
                                        {location.videos.length > 3 && (
                                            <div className="text-xs text-gray-500">
                                                +{location.videos.length - 3} more videos
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            onLocationClick(location.name);
                                            // Scroll to active filters section with offset for header
                                            setTimeout(() => {
                                                const activeFiltersSection = document.querySelector('[data-active-filters]');
                                                if (activeFiltersSection) {
                                                    const elementPosition = activeFiltersSection.getBoundingClientRect().top;
                                                    const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset for header

                                                    window.scrollTo({
                                                        top: offsetPosition,
                                                        behavior: 'smooth'
                                                    });
                                                }
                                            }, 100);
                                        }}
                                        className="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                    >
                                        Show stories
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        );
    } catch (error) {
        console.error('Map render error:', error);
        return (
            <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                    <div className="mb-2">Map rendering error</div>
                    <button 
                        onClick={() => {
                            setMapReady(false);
                            setTimeout(() => setMapReady(true), 100);
                        }}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
                    >
                        Reload Map
                    </button>
                </div>
            </div>
        );
    }
};

export default InteractiveMap;