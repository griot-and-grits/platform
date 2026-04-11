"use client"

import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface StatItem {
    count: number;
    label: string;
}

const Stats: React.FC = () => {
    const stats: StatItem[] = [
        { count: 129, label: 'People Interviewed' },
        { count: 1507, label: 'Stories Told' },
        { count: 108, label: 'Families Included' },
        { count: 103, label: 'AI-Enriched Memories' }
    ];

    return (
        <section className="relative bg-stats bg-top bg-cover bg-no-repeat py-16">
            {/* Black overlay with reduced opacity */}
            <div className="absolute inset-0 bg-black/70"></div>
            
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <StatItem key={index} {...stat} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const StatItem: React.FC<StatItem> = ({ count, label }) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const controls = useAnimation();

    React.useEffect(() => {
        if (inView) {
            controls.start({
                opacity: 1,
                y: 0,
                transition: { 
                    duration: 0.8, 
                    ease: 'easeOut' 
                }
            });
        }
    }, [inView, controls]);

    return (
        <motion.div 
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={controls}
            className="bg-transparent p-6 rounded-2xl text-center border border-gray-700/50"
        >
            <CountAnimation count={count} />
            <h5 className="text-lg text-gray-300 mt-2">{label}</h5>
        </motion.div>
    );
};

const CountAnimation: React.FC<{ count: number }> = ({ count }) => {
    const [displayCount, setDisplayCount] = React.useState(0);
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    React.useEffect(() => {
        if (inView) {
            const duration = 2; // Total animation duration in seconds
            const increment = count / (duration * 60); // Smooth increment

            const counter = setInterval(() => {
                setDisplayCount(prevCount => {
                    const nextCount = prevCount + increment;
                    return nextCount >= count ? count : nextCount;
                });
            }, 1000 / 60);

            return () => clearInterval(counter);
        }
    }, [count, inView]);

    return (
        <motion.div 
            ref={ref}
            className="text-4xl font-bold text-white border-b w-fit mx-auto pb-2"  
        >
            {Math.round(displayCount).toLocaleString()}
        </motion.div>
    );
};

export default Stats;