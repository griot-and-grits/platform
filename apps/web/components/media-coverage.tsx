"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Calendar, Globe } from 'lucide-react'

interface MediaArticle {
    title: string
    url: string
    publication: string
    date: string
    description: string
    type: 'article' | 'video' | 'audio'
    language?: string
}

const mediaArticles: MediaArticle[] = [
    {
        title: "Griot and Grits dinner launches $100K campaign to preserve Black family histories",
        url: "https://abc11.com/post/griot-grits-dinner-launches-100k-campaign-preserve-black-family-histories/18702630/",
        publication: "ABC 11 WTVD",
        date: "2026-03-11T12:00:00",
        description: "Raleigh's John Chavis Community Center became a gathering place Tuesday evening for residents dedicated to ensuring Black history is preserved for future generations.",
        type: "article",
        language: "English"
    },{
        title: "Young. Black. Oklahoma. - Interview",
        url: "https://www.youtube.com/watch?v=UdIQcN7cXms",
        publication: "FOX 23 News",
        date: "2026-02-20T12:00:00",
        description: "Preserving history doesn't just mean keeping old pictures or going to museums. One non-profit is using artificial intelligence to make sure black stories live on for generations.",
        type: "video",
        language: "English"
    },
    {
        title: "Griot & Grits Project preserving Black families' history using AI: 'Crazy and exciting'",
        url: "https://abc11.com/post/black-history-month-red-hat-partners-griot-grits-preserve-family-histories-ai/15963216/",
        publication: "ABC 11 WTVD",
        date: "2025-02-28T12:00:00",
        description: "Red Hat partners with Griot & Grits to create an AI-powered digital archive for African American family histories and oral traditions.",
        type: "article",
        language: "English"
    },
    {
        title: "Griot and Grits is preserving Black history through AI",
        url: "https://www.redhat.com/en/blog/griot-and-grits-preserving-black-history-through-ai",
        publication: "Red Hat Blog",
        date: "2025-02-24T12:00:00",
        description: "How AI is being used to enrich and synthesize the context of historical events, figures and movements in education.",
        type: "article",
        language: "English"
    },
    {
        title: "Volver al pasado: ahora usan inteligencia artificial para reconstruir historias que nadie registró",
        url: "https://www.clarin.com/tecnologia/volver-pasado-ahora-usan-inteligencia-artificial-reconstruir-historias-nadie-registro_0_lRtXVF0WnU.html",
        publication: "Clarín",
        date: "2025-11-02T12:00:00",
        description: "With the Griot and Grits project, universities, museums and companies come together to store the oral history of the African-American community in the United States in the cloud.",
        type: "article",
        language: "Spanish"
    },
    {
        title: "Red Hat：AIとオープンソースで、口承文化をデジタル継承へ",
        url: "https://enterprisezine.jp/article/detail/21699?p=2",
        publication: "EnterpriseZine",
        date: "2025-04-08T12:00:00",
        description: "Red Hat's initiative to use AI and open source technologies to digitally preserve cultural heritage and maintain historical narratives.",
        type: "article",
        language: "Japanese"
    }
]

const MediaCoverage: React.FC = () => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const getLinkText = (type: 'article' | 'video' | 'audio') => {
        switch (type) {
            case 'video':
                return 'Watch Video'
            case 'audio':
                return 'Listen to Audio'
            case 'article':
            default:
                return 'Read Article'
        }
    }

    return (
        <section className="py-20 px-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h3 className="text-[#AE2D24] tracking-widest font-semibold text-xl mt-6 mb-4 uppercase">/ In The Media</h3>
                    <p className="text-xl font-bold text-neutral-800 max-w-2xl mx-auto">
                        Discover how leading publications are covering our mission to preserve Black history through innovative AI technology.
                    </p>
                </motion.div>

                {/* Articles Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {mediaArticles.map((article, index) => (
                        <motion.article
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                        >
                            <div className="space-y-4">
                                {/* Publication and Date */}
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-[#AE2D24]">
                                            {article.publication}
                                        </span>
                                        {article.language && (
                                            <div className="flex items-center gap-1">
                                                <Globe className="w-3 h-3" />
                                                <span className="text-xs">
                                                    {article.language}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(article.date)}</span>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-foreground leading-tight line-clamp-2">
                                    {article.title}
                                </h3>

                                {/* Description */}
                                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                                    {article.description}
                                </p>

                                {/* Read More Link */}
                                <div className="pt-4">
                                    <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-[#AE2D24] hover:text-[#282420] font-semibold transition-colors group-hover:gap-3 duration-300"
                                    >
                                        {getLinkText(article.type)}
                                        <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </a>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-center mt-16 p-8 bg-[#AE2D24]/5 rounded-xl"
                >
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                        Media Inquiries
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                        Interested in featuring Griot and Grits in your publication? We&apos;d love to share our story and mission with your audience.
                    </p>
                    <a
                        href="#contact"
                        className="inline-flex items-center gap-2 bg-[#AE2D24] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#282420] transition-colors"
                    >
                        Contact Us
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </motion.div>
            </div>
        </section>
    )
}

export default MediaCoverage