export interface Location {
    name: string;
    coordinates: [number, number];
}

export interface HistoricalContext {
    year?: number;
    location?: Location;
}

export interface TagWithPopularity {
    name: string;
    popularity: number;
}

export interface PersonWithPopularity {
    name: string;
    popularity: number;
}

export interface Video {
    id: string;
    thumbnail: string;
    title: string;
    interviewees: string[];
    description: string;
    duration: string;
    createdDate: string;
    videoUrl: string;
    podcastUrl?: string;
    tags: string[];
    people: string[];
    historicalYears?: number[]; // Deprecated: use historicalContext instead
    historicalContext?: HistoricalContext[];
    featured?: boolean;
}

export interface VideoMetadata {
    videos: Video[];
}

export interface FilterMetadata {
    tags: TagWithPopularity[];
    people: PersonWithPopularity[];
}

import { getImageUrl } from './cdn';

export interface HistoricalEra {
    id: string;
    name: string;
    subtitle: string;
    yearRange: { start: number; end: number | null };
    image: string;
}

export const HISTORICAL_ERAS: HistoricalEra[] = [
    {
        id: 'early-roots',
        name: 'Early Roots',
        subtitle: 'Pre-1950s',
        yearRange: { start: 0, end: 1949 },
        image: getImageUrl('era1.png') // Vintage sepia-toned historical photograph
    },
    {
        id: 'civil-rights',
        name: 'Civil Rights Era',
        subtitle: '1950s - 1970s',
        yearRange: { start: 1950, end: 1979 },
        image: getImageUrl('era2.png') // Raised fist civil rights imagery
    },
    {
        id: 'urban-evolution',
        name: 'Urban Evolution',
        subtitle: '1980s - 1990s',
        yearRange: { start: 1980, end: 1999 },
        image: getImageUrl('era3.png') // Urban street graffiti art
    },
    {
        id: 'modern-narratives',
        name: 'Modern Narratives',
        subtitle: '2000s - Present',
        yearRange: { start: 2000, end: null },
        image: getImageUrl('era4.png') // Contemporary diverse community gathering
    }
];

export function getHistoricalYears(video: Video): number[] {
    const years = new Set<number>();

    // Add years from historicalYears (deprecated field)
    if (video.historicalYears) {
        video.historicalYears.forEach(year => years.add(year));
    }

    // Add years from historicalContext
    if (video.historicalContext) {
        video.historicalContext.forEach(ctx => {
            if (ctx.year !== undefined) {
                years.add(ctx.year);
            }
        });
    }

    return Array.from(years).sort((a, b) => a - b);
}

export function getHistoricalLocations(video: Video): Location[] {
    const locationMap = new Map<string, Location>();

    // Add locations from historicalContext
    if (video.historicalContext) {
        video.historicalContext.forEach(ctx => {
            if (ctx.location) {
                locationMap.set(ctx.location.name, ctx.location);
            }
        });
    }

    return Array.from(locationMap.values());
}

export function getAllTags(videos: Video[], filters: FilterMetadata): TagWithPopularity[] {
    const usedTags = new Set<string>();

    videos.forEach(video => {
        video.tags.forEach(tag => {
            usedTags.add(tag);
        });
    });

    return filters.tags
        .filter(tag => usedTags.has(tag.name))
        .sort((a, b) => {
            // Sort by popularity first (descending)
            if (b.popularity !== a.popularity) {
                return b.popularity - a.popularity;
            }
            // If popularity is equal, sort alphabetically
            return a.name.localeCompare(b.name);
        });
}

export function getAllPeople(videos: Video[], filters: FilterMetadata): PersonWithPopularity[] {
    const usedPeople = new Set<string>();

    videos.forEach(video => {
        video.people.forEach(person => {
            usedPeople.add(person);
        });
    });

    return filters.people
        .filter(person => usedPeople.has(person.name))
        .sort((a, b) => {
            // Sort by popularity first (descending)
            if (b.popularity !== a.popularity) {
                return b.popularity - a.popularity;
            }
            // If popularity is equal, sort alphabetically
            return a.name.localeCompare(b.name);
        });
}

export function getAllLocations(videos: Video[]): string[] {
    const locations = new Set<string>();

    videos.forEach(video => {
        // Add locations from historical context
        if (video.historicalContext) {
            video.historicalContext.forEach(ctx => {
                if (ctx.location) {
                    locations.add(ctx.location.name);
                }
            });
        }
    });

    return [...locations];
}

export function filterVideos(
    videos: Video[],
    searchQuery: string,
    selectedFilters: string[],
    selectedLocation: string | null,
    selectedEra: string | null = null
): Video[] {
    let filtered = videos;

    if (searchQuery) {
        filtered = filtered.filter(video =>
            video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.interviewees.some(interviewee => interviewee.toLowerCase().includes(searchQuery.toLowerCase())) ||
            video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
            video.people.some(person => person.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    if (selectedFilters.length > 0) {
        filtered = filtered.filter(video =>
            selectedFilters.some(filter =>
                video.tags.some(tag => tag === filter) ||
                video.people.some(person => person === filter)
            )
        );
    }

    // Filter by location and/or era
    if (selectedLocation || selectedEra) {
        const era = selectedEra ? HISTORICAL_ERAS.find(e => e.id === selectedEra) : null;

        filtered = filtered.filter(video => {
            // If both filters are active, we need to check for combined context
            if (selectedLocation && selectedEra && era) {
                // Check if any historical context item matches BOTH location and era
                const hasMatchingContext = video.historicalContext?.some(ctx => {
                    const locationMatches = ctx.location?.name === selectedLocation;
                    const yearMatches = ctx.year !== undefined &&
                        ctx.year >= era.yearRange.start &&
                        (era.yearRange.end === null || ctx.year <= era.yearRange.end);
                    return locationMatches && yearMatches;
                });

                return hasMatchingContext;
            }

            // Only location filter is active
            if (selectedLocation && !selectedEra) {
                // Check historical context locations
                const inHistoricalContext = video.historicalContext?.some(ctx =>
                    ctx.location?.name === selectedLocation
                );
                return inHistoricalContext || false;
            }

            // Only era filter is active
            if (selectedEra && !selectedLocation && era) {
                // Check historicalYears for backwards compatibility
                const inHistoricalYears = video.historicalYears?.some(year =>
                    year >= era.yearRange.start &&
                    (era.yearRange.end === null || year <= era.yearRange.end)
                );
                // Check historicalContext years
                const inHistoricalContext = video.historicalContext?.some(ctx =>
                    ctx.year !== undefined &&
                    ctx.year >= era.yearRange.start &&
                    (era.yearRange.end === null || ctx.year <= era.yearRange.end)
                );
                return inHistoricalYears || inHistoricalContext || false;
            }

            return true;
        });
    }

    // Always sort by creation date in descending order (newest first)
    filtered.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

    return filtered;
}