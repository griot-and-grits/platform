
import type React from "react";
import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
// Image: using standard img tag
import { Play, Clock, User, Tag, Calendar, MapPin, History, Headphones, Share2 } from "lucide-react";
import VideoPlayer from './video-player';
import ShareVideoModal from './share-video-modal';
import { type Video, getHistoricalYears, getHistoricalLocations } from '@/lib/video-metadata';

interface WorksProps {
  videos: Video[];
}

const FeaturedStories: React.FC<WorksProps> = ({ videos }) => {
  const controls = useAnimation()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [featuredVideos, setFeaturedVideos] = useState<Video[]>([]);
  const [expandedTags, setExpandedTags] = useState<{ [videoId: string]: boolean }>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [videoId: string]: boolean }>({});
  const [shareVideo, setShareVideo] = useState<Video | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  useEffect(() => {
    // Filter videos marked as featured (treat missing as false) and sort by creation date descending
    const filteredVideos = videos
      .filter(video => video.featured ?? false)
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

    setFeaturedVideos(filteredVideos);
  }, [videos]);

  const handleVideoPlay = (video: Video) => {
    if (video && video.videoUrl && video.videoUrl.trim() !== '') {
      setSelectedVideo(video);
      setIsVideoPlayerOpen(true);
    }
  };

  const handleVideoPlayerClose = () => {
    setIsVideoPlayerOpen(false);
    setSelectedVideo(null);
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

  const handleShareClick = (video: Video) => {
    setShareVideo(video);
    setIsShareModalOpen(true);
  };

  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
    setShareVideo(null);
  };

  return (
    <section id="works" className="pt-20 overflow-hidden bg-gray-50">
      <div className="container mx-auto px-4">        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h3 className="text-[#AE2D24] tracking-widest font-semibold text-xl mt-6 mb-4 uppercase">/ Featured Stories</h3>
          <p className="text-xl font-bold text-neutral-800 max-w-2xl mx-auto">
            Discover and watch the rich tapestry of Black experiences
          </p>
        </motion.div>

        {/* Video Grid - Using Collection Page Styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {featuredVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                 
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {video.title}
                </h3>
                
                <div className="flex items-center text-sm text-gray-600 mb-3">
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

                <div className="text-gray-600 text-sm mb-4">
                  <p className={expandedDescriptions[video.id] ? '' : 'line-clamp-3'}>
                    {video.description}
                  </p>
                  {video.description.length > 150 && (
                    <button
                      onClick={() => toggleDescriptionExpansion(video.id)}
                      className="text-xs text-[#AE2D24] hover:text-[#282420] underline mt-1 cursor-pointer"
                    >
                      {expandedDescriptions[video.id] ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>

                {(() => {
                  const locations = getHistoricalLocations(video);
                  return locations.length > 0 && (
                    <div
                      className="flex items-center text-sm text-gray-600 mb-4 cursor-help"
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
                      className="flex items-center text-sm text-gray-600 mb-4 cursor-help"
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
                  className="flex items-center text-sm text-gray-600 mb-4 cursor-help"
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
                <div className="flex flex-wrap gap-2 mb-4">
                  {(expandedTags[video.id] ? video.tags : video.tags.slice(0, 3)).map(tag => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                  {video.tags.length > 3 && (
                    <button
                      onClick={() => toggleTagExpansion(video.id)}
                      className="text-xs text-[#AE2D24] hover:text-[#282420] underline cursor-pointer"
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
        </div>

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
  )
}

export default FeaturedStories
