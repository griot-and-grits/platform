
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-cards';
import { EffectCards, Autoplay } from 'swiper/modules';
// Image: using standard img tag
import { Link } from 'react-router';
import { Play, ArrowRight, Mail } from 'lucide-react';
import LoadingDots from './loading-dots';
import { PUBLIC_API_BASE_URL } from '~/lib/public-api';

export const CollectionCTA = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const subscribe = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const res = await fetch(`${PUBLIC_API_BASE_URL}/integrations/subscribe`, {
            body: JSON.stringify({
                email: inputRef.current!.value
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST'
        });

        const data = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
        const error = data.detail ?? data.error;

        if (error) {
            setMessage(error);
            setLoading(false);

            return;
        }

        inputRef.current!.value = '';
        setMessage('You are now subscribed to our newsletter!');
        setLoading(false);
    };

    return (
        <section className="pt-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                {/* Call to Action for Collections */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <div className="bg-[#AE2D24] rounded-xl p-8 text-white text-center shadow-xl">
                        <div className="flex items-center justify-center mb-4">
                            <Play className="w-8 h-8 mr-3" />
                            <h4 className="text-2xl font-bold">Explore Our Oral History Collection</h4>
                        </div>
                        <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
                            Discover powerful stories, voices, and experiences from our community.
                            Browse, filter, and watch our growing archive of oral history videos.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/collection">
                                <button className="bg-white text-[#AE2D24] font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 text-lg shadow-lg">
                                    View Our Collection
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>
                            <a
                                href={`mailto:info@griotandgrits.org?subject=${encodeURIComponent('I Want to Share My Story')}&body=${encodeURIComponent(`Hello Griot and Grits Team,

I would like to share my story with your oral history collection.

Please provide the following information:

Your Full Name:

Your Contact Information (Phone/Email):

Brief Description of Your Story:


Location (City, State):

Preferred Interview Format (In-person/Virtual):


Additional Notes:


Thank you for preserving our community's history. We understand there is high demand and appreciate your patience as the team works to connect with everyone. We will reach out to you as soon as possible to schedule your interview.

Best regards`)}`}
                                className="bg-[#AE2D24] text-white font-semibold px-8 py-4 rounded-lg hover:bg-[#282420] transition-all duration-300 transform hover:scale-105 flex items-center gap-3 text-lg shadow-lg border-2 border-white"
                            >
                                <Mail className="w-5 h-5" />
                                Tell Us Your Story
                            </a>
                        </div>

                        {/* Newsletter Subscription */}
                        <div className="mt-8 max-w-md mx-auto">
                            <p className="text-white text-center mb-4 opacity-90 text-lg">Stay connected with new stories.</p>
                            <form onSubmit={subscribe} className="relative">
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    ref={inputRef}
                                    className="w-full bg-white/20 px-4 py-3 rounded-full text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-white text-[#AE2D24] px-6 py-2 rounded-full hover:opacity-90 duration-300 transition-all font-semibold"
                                >
                                    {loading ? <LoadingDots className="mb-3 bg-white" /> : <span>Subscribe</span>}
                                </button>
                            </form>
                            <p className="mt-2 text-center text-white text-sm">{message ? message : ``}</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const About = () => {
    const processItems = [
        {
        number: '1',
        title: 'Record',
        description: 'Help families digitize and catalog interviews, family photos, videos, and important historical documents.'
        },
        {
        number: '2',
        title: 'Collect',
        description: 'Generate metadata to create a comprehensive, searchable library of recorded stories of the lives of Black people.'
        },
        {
        number: '3',
        title: 'Improve',
        description: 'Recreate a documentary-like view of individual stories with the assistance of AI to augment key events with additional relevant background information, photos and videos.'
        },
        {
        number: '4',
        title: 'Display',
        description: 'Build referencable family chapters containing AI-enhanced content for individuals to find out more about their unique family history along with others.'
        }
    ];

    return (
        <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
            >
            <h3 className="text-[#AE2D24] tracking-widest font-semibold text-xl mt-6 mb-4 uppercase">/ Our Purpose</h3>            
            <p className="text-xl font-bold text-neutral-800 max-w-2xl mx-auto">
                Our mission is to preserve the history of the black experience, one voice at a time, through the use of AI and other advanced technologies.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-9 py-10">
                <div className="flex items-center">
                    <div className="space-y-3 text-left text-xl w-full text-black dark:text-neutral-800">
                        <p>
                            <strong>Griot:</strong> a member of a hereditary caste among the peoples of western Africa whose function is to keep an oral history of the tribe or village and to entertain with stories, poems, songs, dances, etc.  
                            <br />
                            <br />
                            <strong>Grits:</strong> a dish of coarsely ground corn kernels boiled with water or milk and then sometimes fried, eaten as a breakfast dish or as a side dish with meat. A staple in Southern cooking.
                        </p>
                    </div>
                </div>
                <div>
                    <Swiper
                        effect={'cards'}
                        grabCursor={true}
                        modules={[EffectCards, Autoplay]}
                        autoplay={{
                            delay: 1000,
                            disableOnInteraction: false,
                        }}
                        className="max-w-[180px] sm:max-w-[280px]"
                    >
                        <SwiperSlide>
                            <img
                                src="https://res.cloudinary.com/ducxigdil/image/upload/v1739464588/about-3_iin3fu.png"
                                width={250}
                                height={350}
                                className='object-cover h-[320px] sm:h-[400px] w-[280px] rounded-2xl'
                                alt="About Us Image"
                    
                            />
                        </SwiperSlide>
                        <SwiperSlide>
                            <img
                            src="https://res.cloudinary.com/ducxigdil/image/upload/v1739464588/about-2_kecd9x.png"
                            width={250}
                            height={350}
                            className='object-cover h-[320px] sm:h-[400px] w-[280px] rounded-2xl'
                            alt="About Us Image"
                            
                            />
                        </SwiperSlide>
                        <SwiperSlide>
                            <img
                            src="https://res.cloudinary.com/ducxigdil/image/upload/v1738772015/photo-1531384441138-2736e62e0919_u0qhau.jpg"
                            width={250}
                            height={350}
                            className='object-cover h-[320px] sm:h-[400px] w-[280px] rounded-2xl'
                            alt="About Us Image"                        
                        />
                        </SwiperSlide>
                        <SwiperSlide>
                            <img
                                src="https://res.cloudinary.com/ducxigdil/image/upload/v1739464588/about-5_y1c2hw.png"
                                width={250}
                                height={350}
                                className='object-cover h-[320px] sm:h-[400px] w-[280px] rounded-2xl'
                                alt="About Us Image"
                    
                            />
                        </SwiperSlide>
                        <SwiperSlide>
                            <img
                                src="https://res.cloudinary.com/ducxigdil/image/upload/v1738771857/photo-1617551307538-c9cdb9d71289_flqy5x.jpg"
                                width={250}
                                height={350}
                                className='object-cover h-[320px] sm:h-[400px] w-[280px] rounded-2xl'
                                alt="About Us Image"
                    
                            />
                        </SwiperSlide>
                        <SwiperSlide>
                            <img
                                src="https://res.cloudinary.com/ducxigdil/image/upload/v1738772206/photo-1604095087269-e7289837cf40_gobij2.jpg"
                                width={250}
                                height={350}
                                className='object-cover h-[320px] sm:h-[400px] w-[280px] rounded-2xl'
                                alt="About Us Image"
                    
                            />
                        </SwiperSlide>
                        <SwiperSlide>
                            <img
                            src="https://res.cloudinary.com/ducxigdil/image/upload/v1738771924/photo-1529245019870-59b249281fd3_htrgci.jpg"
                            width={250}
                            height={350}
                            className='object-cover h-[320px] sm:h-[400px] w-[280px] rounded-2xl'
                            alt="About Us Image"
                            
                            />
                        </SwiperSlide>
                        <SwiperSlide>
                            <img
                            src="https://res.cloudinary.com/ducxigdil/image/upload/v1739464588/about-8_jwajbx.png"
                            width={250}
                            height={350}
                            className='object-cover h-[320px] sm:h-[400px] w-[280px] rounded-2xl'
                            alt="About Us Image"                        
                        />
                        </SwiperSlide>
                    </Swiper>
                </div>
            </div>
            </motion.div>

            {/* Process Grid */}
            <div className="grid md:grid-cols-2 gap-8">
            {processItems.map((item, index) => (
                <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 rounded-lg p-6 relative border border-[#AE2D24]"
                >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#AE2D24] rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{item.number}</span>
                    </div>
                    <div>
                    <h4 className="text-xl font-bold text-neutral-800 mb-2">{item.title}</h4>
                    <p className="text-gray-500">{item.description}</p>
                    </div>
                </div>
                </motion.div>
            ))}
            </div>
        </div>
        </section>
    );
};

export default About;
