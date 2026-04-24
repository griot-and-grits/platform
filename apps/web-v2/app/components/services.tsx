"use client"

import React from "react"
import { useEffect, useState } from "react"
import { motion, useAnimation, type Variants } from "framer-motion"
import { useInView } from "react-intersection-observer"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
// Image: using standard img tag
import { Play } from "lucide-react"
import VideoPlayer from './video-player'
import { getImageUrl } from '@/lib/cdn'

interface Service {
  icon: string
  title: string
  excerpt: string
  description: string
}

interface ServiceCardProps {
  service: Service
  variants: Variants
}

const services: Service[] = [
    {
        icon: "",
        title: "Centralized Repository",
        excerpt: "A unified storage solution for seamless data management and access.",
        description: `A centralized repository is a single storage location for data, documents, or code. It provides a unified point of access, ensuring
        consistency and facilitating collaboration across an organization.`
    },
    {
        icon: "",
        title: "AI Metadata Extraction",
        excerpt: "Intelligent extraction of metadata to enhance data organization.",
        description: `AI metadata extraction involves using artificial intelligence to automatically collect and organize metadata from various data sources.
        This process enhances data management by extracting relevant information such as names, definitions, context, and technical attributes.`
    },
    {
        icon: "",
        title: "Content Enrichment",
        excerpt: "Advanced AI techniques for comprehensive content enhancement.",
        description: `Content enrichment is the process of applying advanced techniques like machine learning and AI to automatically extract meaningful
        information from documents. It involves creating fully-enriched products with extensive, customer-centric attributes. This process improves
        searchability, enhances product discovery, and provides valuable insights for better decision-making.`
    },
    {
        icon: "",
        title: "AI Annotation",
        excerpt: "Smart labeling system for enhanced machine learning comprehension.",
        description: `AI annotation is the practice of labeling or tagging data to make it comprehensible for machine learning models. It involves adding
        metadata or labels to various data types, including images, text, audio, or video.`
    },
    {
        icon: "",
        title: "Generative AI Enhancement",
        excerpt: "Cutting-edge AI models for automated process optimization.",
        description: `Generative AI models can enhance various aspects of data processing, transformation, and analysis. They can automate repetitive tasks,
        improve decision-making, and boost productivity across industries.`
    },
    {
        icon: "",
        title: "Searchable Index",
        excerpt: "Optimized data indexing for efficient information retrieval.",
        description: `A searchable index is a structured collection of data optimized for quick and efficient information retrieval. It contains searchable
        content available for indexing, full-text search, vector search, and filtered queries.`
    },
]

const ServiceCard: React.FC<ServiceCardProps> = ({ service, variants }) => {
  return (
    <motion.div
      variants={variants}
      className="p-6 rounded-xl backdrop-filter backdrop-blur-lg bg-white bg-opacity-10 border border-white border-opacity-20 shadow-xl transition-all duration-300 hover:bg-opacity-20"
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-4xl mb-4">{service.icon}</div>
      <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
      <p className="text-sm text-gray-600 mb-4">{service.excerpt}</p>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            Learn More
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{service.icon}</span>
              {service.title}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600">
            {service.description}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

const Services: React.FC = () => {
    const controls = useAnimation()
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })
    const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);

    useEffect(() => {
        if (inView) {
            controls.start("visible")
        }
    }, [controls, inView])

    const handleVideoPlay = () => {
        setIsVideoPlayerOpen(true);
    };

    const handleVideoPlayerClose = () => {
        setIsVideoPlayerOpen(false);
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    }

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
            },
        },
    }

    return (
        <section id="services" className="py-20 w-full bg-gray-50 overflow-hidden">
            <div className="container max-w-7xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <h3 className="text-[#AE2D24] tracking-widest font-semibold text-xl mt-6 mb-4 uppercase">/ Work Of The Project</h3>
                    <p className="text-xl font-bold text-neutral-800 max-w-2xl mx-auto">
                        Bringing the Black experience to life for generations to come
                    </p>
                </motion.div>
                
                {/* Featured How It Works Video */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="max-w-2xl mx-auto mb-16"
                >
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                        <div className="relative aspect-video bg-gray-900 group">
                            <img
                                src={getImageUrl("bringing_stories_to_life_video_thumbnail.png")}
                                alt="Griot and Grits - Bringing Stories to Life"
                               
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={handleVideoPlay}
                                    className="bg-white/90 rounded-full p-6 hover:bg-white transition-colors transform hover:scale-110 duration-300"
                                    aria-label="Play Griot and Grits video"
                                >
                                    <Play className="w-8 h-8 text-[#AE2D24] ml-1" />
                                </button>
                            </div>
                            <div className="absolute bottom-4 left-4 bg-[#AE2D24] text-white px-3 py-1 rounded-full text-sm font-medium">
                                Platform Overview
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Griot and Grits - Bringing Stories to Life</h3>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Watch how the Griot and Grits community brings the stories of black families to life using AI and advanced technologies to preserve oral history.
                            </p>
                        </div>
                    </div>
                </motion.div>
                
                <motion.div
                    ref={ref}
                    variants={containerVariants}
                    initial="hidden"
                    animate={controls}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {services.map((service, index) => (
                        <ServiceCard key={index} service={service} variants={itemVariants} />
                    ))}
                </motion.div>
                
                {/* Video Player Modal */}
                <VideoPlayer
                    isOpen={isVideoPlayerOpen}
                    onClose={handleVideoPlayerClose}
                    videoUrl="https://www.youtube.com/watch?v=JwHJFHz3mu4"
                    title="Griot and Grits - Bringing Stories to Life"
                />
            </div>
        </section>
    )
}

export default Services