
import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { gsap } from "gsap"
// Image: using standard img tag
import { type Testimonial, testimonials } from "@/lib/constants"

    const FuturisticTestimonials: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(0)
    const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)
    const testimonialsPerPage = 2
    const pageCount = Math.ceil(testimonials.length / testimonialsPerPage)

    useEffect(() => {
        const interval = setInterval(() => {
        if (!selectedTestimonial) {
            setCurrentPage((prevPage) => (prevPage + 1) % pageCount)
        }
        }, 8000)

        return () => clearInterval(interval)
    }, [selectedTestimonial, pageCount])

    const handleTestimonialClick = (testimonial: Testimonial) => {
        setSelectedTestimonial(testimonial)
    }

    const handleCloseSelected = () => {
        setSelectedTestimonial(null)
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    useEffect(() => {
        gsap.fromTo(".testimonial-card", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
    }, [])

    return (
        <section className="bg-white py-10">
        <div className="flex flex-col justify-center items-center p-4">
        <h2 className="text-2xl font-bold text-center mb-6">Our History, Told By Us</h2>
        <div className="w-full max-w-4xl">
            <div className="grid grid-cols-1 border-t-2 md:grid-cols-2 gap-8">
            {testimonials
                .slice(currentPage * testimonialsPerPage, (currentPage + 1) * testimonialsPerPage)
                .map((testimonial) => (
                <motion.div
                    key={testimonial.id}
                    className="testimonial-card bg-pink-50 bg-opacity-10 md:border-l backdrop-filter backdrop-blur-lg p-6 cursor-pointer transform transition-all duration-300 hover:scale-105"
                    whileHover={{ scale: 0.95 }}
                    onClick={() => handleTestimonialClick(testimonial)}
                >
                    <p className="line-clamp-3">{testimonial.content}</p>
                    <p className="text-sm text-neutral-600">Read More...</p>
                    <div className="flex items-center">
                    <img
                        src={testimonial.avatarUrl || "/placeholder.svg"}
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full bg-cover mt-4 mr-4"
                        width={1000}
                        height={1000}
                    />
                    <div>
                        <p className="font-semibold">{testimonial.author}</p>
                        <p className="text-gray-500">{testimonial.position}</p>
                    </div>
                    </div>
                </motion.div>
                ))}
            </div>
            <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: pageCount }).map((_, index) => (
                <button
                key={index}
                onClick={() => handlePageChange(index)}
                className={`w-3 h-3 rounded-full ${currentPage === index ? "bg-[#AE2D24]" : "bg-gray-300"}`}
                />
            ))}
            </div>
        </div>
        <AnimatePresence>
            {selectedTestimonial && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                onClick={handleCloseSelected}
            >
                <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg p-8 max-w-2xl"
                onClick={(e) => e.stopPropagation()}
                >
                <p className="text-gray-800 text-lg mb-6">{selectedTestimonial.content}</p>
                <div className="flex items-center">
                    <img
                    src={selectedTestimonial.avatarUrl || "/placeholder.svg"}
                    alt={selectedTestimonial.author}
                    className="w-16 h-16 rounded-full mr-4"
                    width={1000}
                    height={1000}
                    />
                    <div>
                    <p className="text-gray-800 font-semibold text-xl">{selectedTestimonial.author}</p>
                    <p className="text-gray-600">{selectedTestimonial.position}</p>
                    </div>
                </div>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
        </div>
        </section>
    )
}

export default FuturisticTestimonials

