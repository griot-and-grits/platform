
import React, { useState, useEffect } from 'react';
// Image: using standard img tag
import { Link } from 'react-router';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { SiGithub, SiFacebook, SiX, SiInstagram, SiYoutube, SiSpotify } from '@icons-pack/react-simple-icons';

const Nav = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Handle hash navigation after page load
    useEffect(() => {
        const handleHashNavigation = () => {
            const hash = window.location.hash.substring(1);
            if (hash) {
                setTimeout(() => {
                    const element = document.getElementById(hash);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            }
        };

        handleHashNavigation();
        window.addEventListener('hashchange', handleHashNavigation);

        return () => {
            window.removeEventListener('hashchange', handleHashNavigation);
        };
    }, []);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        toggleMenu();

        // Handle hash navigation
        if (href.startsWith('/#')) {
            const hash = href.substring(2); // Remove '/#'

            // Check if we're already on the home page
            if (window.location.pathname === '/') {
                // Same page, just scroll
                setTimeout(() => {
                    const element = document.getElementById(hash);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 300); // Delay to allow menu to close
            } else {
                // Different page, navigate then scroll
                navigate('/');
                setTimeout(() => {
                    const element = document.getElementById(hash);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 500); // Longer delay for page navigation
            }
        } else {
            // Regular navigation
            navigate(href);
        }
    };

    const socialLinks = [
        { Icon: SiGithub, href: 'https://github.com/griot-and-grits/griot-and-grits' },
        { Icon: SiFacebook, href: 'https://www.facebook.com/profile.php?id=61571179057798' },
        { Icon: SiX, href: 'https://x.com/GriotandGrits' },
        { Icon: SiInstagram, href: 'https://www.instagram.com/griotngrits/' },
        { Icon: SiYoutube, href: 'https://www.youtube.com/@GriotandGrits' },
        { Icon: SiSpotify, href: 'https://open.spotify.com/show/4eIOKi8JuzTyBeuScT3wU2' }
    ];

    const navLinks = [
        { label: 'Home', href: '/#home' },
        { label: 'Our Collection', href: '/collection' },
        //{ label: 'Curated Stories', href: '/' },
        { label: 'Who We Are', href: '/who-we-are' },
        { label: 'Support Us', href: '/#donate' },
        { label: 'Get In Touch', href: '/#contact' }
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
        },
        hover: {
        scale: 1.05,
        color: "#cc147f",
        transition: { duration: 0.3 }
        }
    };

    const textVariants: Variants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: "spring",
            stiffness: 100
        }
        }
    };

    return (
        <nav className="w-full z-50 bg-white shadow-md transition-all duration-300 sticky top-0">
        <div className="flex items-center justify-between px-10 py-2">
            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-4"
            >
                <Link to="/#home" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                    <img
                        src="./logo.png"
                        alt="Griot and Grits Logo"
                        width={600}
                        height={600}
                        className="w-20 sm:w-24 md:w-32 h-auto"
                    />
                </Link>
            </motion.div>

            {/* Right side - Donate button and Menu toggle */}
            <div className="flex items-center gap-4">
                {/* Donate Button */}
                <motion.a
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    href="/#donate"
                    onClick={(e) => {
                        e.preventDefault();
                        const hash = 'donate';

                        // Check if we're already on the home page
                        if (window.location.pathname === '/') {
                            // Same page, just scroll
                            const element = document.getElementById(hash);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        } else {
                            // Different page, navigate then scroll
                            navigate('/');
                            setTimeout(() => {
                                const element = document.getElementById(hash);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 500);
                        }
                    }}
                    className="inline-flex items-center gap-2 bg-[#AE2D24] text-white px-4 py-2 rounded-full font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                    Donate
                </motion.a>

                {/* Mobile Menu Toggle */}
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={toggleMenu}
                    className="rounded-full bg-black w-12 h-11 flex items-center justify-center group"
                >
                    <div className="relative w-[20px] h-[2px] bg-white transition-all duration-300 group-hover:bg-[#AE2D24]">
                        <div className="absolute -top-[9px] w-full h-full bg-inherit group-hover:bg-[#AE2D24]"></div>
                        <div className="absolute -bottom-[9px] w-full h-full bg-inherit group-hover:bg-[#AE2D24]"></div>
                    </div>
                </motion.button>
            </div>
        </div>

        {/* Navigation Drawer */}
        <AnimatePresence>
            {isMenuOpen && (
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={toggleMenu}
                    className="fixed inset-0 bg-black/50 z-[90]"
                />

                {/* Drawer */}
                <motion.nav
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "tween" }}
                    className="fixed top-0 right-0 w-[280px] h-full bg-black text-white transform z-[100]"
                >
                {/* Close Button */}
                <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={toggleMenu}
                className="absolute top-4 right-4 w-8 h-8 bg-black/30 rounded flex items-center justify-center z-10"
                >
                <X className="w-5 h-5 text-white" />
                </motion.button>

                <div className="p-10 overflow-y-auto h-full">
                <motion.div
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-1 mb-12 pr-8"
                >
                    <img
                        src="./logo_text_alt.png"
                        alt="Griot and Grits"
                        width={800}
                        height={200}
                        className="w-full h-auto"
                    />
                </motion.div>

                {/* Navigation Links */}
                <motion.ul 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="border-y border-white/10"
                >
                    {navLinks.map((link, index) => (
                    <motion.li
                        key={index}
                        variants={itemVariants}
                        whileHover="hover"
                        className="border-b border-white/5 last:border-b-0"
                    >
                        <Link
                            to={link.href}
                            className="block py-4 text-lg text-white/50 hover:text-white transition-colors"
                            onClick={(e) => handleNavClick(e, link.href)}
                        >
                        {link.label}
                        </Link>
                    </motion.li>
                    ))}
                </motion.ul>

                {/* Social Links */}
                <motion.ul
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex space-x-4 text-white/50 mt-8"
                >
                    {socialLinks.map(({ Icon: IconComponent, href }) => (
                    <motion.li
                        key={href}
                        variants={itemVariants}
                        whileHover="hover"
                    >
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors"
                        >
                        <IconComponent size={24} />
                        </a>
                    </motion.li>
                    ))}
                </motion.ul>
                </div>
            </motion.nav>
            </>
            )}
        </AnimatePresence>
        </nav>
    );
};

export default Nav;
