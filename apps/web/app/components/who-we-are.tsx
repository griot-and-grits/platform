
import React, { useState } from 'react';
// Image: using standard img tag
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getBioImageUrl, getImageUrl, getLogoUrl } from '@/lib/cdn';

// LinkedIn SVG component (Simple Icons doesn't include LinkedIn)
const LinkedInIcon = ({ size = 24 }: { size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
    >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
);

interface TeamMember {
    name: string;
    title: string;
    photo: string;
    bio: string;
    linkedin?: string;
}

interface Sponsor {
    name: string;
    logo: string;
    website?: string;
}

const WhoWeAre = () => {
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    const teamMembers: TeamMember[] = [
        {
            name: "Ty McDuffie",
            title: "Executive Director & Founder",
            photo: getBioImageUrl("T_McDuffie.jpg"),
            bio: "Ty McDuffie is the founder of Griot and Grits, a non-profit organization dedicated to preserving Black family narratives through AI-enhanced video interviews. An Air Force veteran, Ty brings a disciplined, strategic approach to the urgent work of cultural preservation.\n\n​Driven by the realization that many Black families are losing their history to time and illness, Ty established Griot and Grits to bridge the gap between tradition and technology. His organization empowers families to secure their legacies, ensuring that the stories of the past remain accessible to inspire the future."
        },
        {
            name: "Sherard Griffin",
            title: "Board Chair",
            photo: getBioImageUrl("S_Griffin.jpg"),
            bio: "Sherard Griffin leads the Griot and Grits Board, providing the vision, mission and strategic direction. He has over 25 years of experience architecting and developing large-scale enterprise data and AI solutions. He is currently Head of Engineering for OpenShift AI at Red Hat, an enterprise open-source Gen AI and MLOps platform.\n\nSherard serves on the Strategic Advisory Board of North Carolina State University's Computer Science Department. He is a passionate advocate for broadening participation in technology, mentoring emerging technologists, and promoting inclusive workforce development across the AI and open-source communities. His work reflects a holistic vision of technology as both a tool for innovation and a platform for empowerment.",
            linkedin: "https://www.linkedin.com/in/sherardgriffin"
        },
        {
            name: "Rickey Thomas Jr.",
            title: "Creative Executive Producer",
            photo: getBioImageUrl("R_Thomas.jpg"),
            bio: "Rickey is an experienced media producer whose passion for film and television began early, running a studio camera at the age of 14 and directing live broadcasts by 16 through his church's television ministry. Those early opportunities nurtured his creative and technical skills across audio, directing, editing, and live production.\n\nHe went on to earn a B.A. in Mass Communications with a concentration in Film and Television from Shaw University, later joining the Inspiration Networks as an Associate Producer. Under the mentorship of seasoned industry professionals, he contributed to a wide range of programs including producing, directing and editing more than eighty episodes of \"A Muslim Journey to Hope\".\n\nRickey founded the creative banner Under the Sun Studios and has produced the feature film \"Young King\", the documentary \"Open Legs with a Closed Mind\", as well as commercials and music videos across multiple platforms. At Griot and Grits, he brings his production expertise to guide volunteers, capture oral histories, and ensure every story is recorded with care, creativity, and cultural respect."
        }
    ];

    const boardMembers: TeamMember[] = [
        {
            name: "Carmen Wimberley Cauthen",
            title: "Historian, Author and Advocate",
            photo: getBioImageUrl("C_Cauthen.jpg"),
            bio: `Carmen Wimberley Cauthen is a historian, author, and advocate known for connecting personal memory with public history. A Raleigh native, she spent over two decades in the North Carolina House of Representatives as an Administrative Clerk, gaining deep insight into how policy shapes communities.\n\n
She is the author of "Historic Black Neighborhoods of Raleigh", an award-winning bestseller that documents the resilience and displacement of Black communities. Her expertise spans Black history, Reconstruction, affordable housing, and systemic oppression, and her work is used in universities and planning departments.\n\n
Beyond writing, Carmen is a sought-after speaker featured on PBS, ABC11, WRAL, and featured in "Walter Magazine", "News & Observer", and "IndyWeek". She hosts the podcast "Quiet No More" and curates events honoring Black women whose stories have shaped communities.\n\n
Her workshops empower women over 55 to preserve family legacies through genealogy and storytelling, ensuring that ordinary and extraordinary voices are remembered for generations.
`
        },
        {
            name: "Dr. M. Keith Daniel",
            title: "Co-founder/Managing Director of Resilient Ventures, LLC",
            photo: getBioImageUrl("K_Daniel.jpg"),
            bio: "Dr. M. Keith Daniel is Co-founder/Managing Director of Resilient Ventures, LLC. and owner of Madison Consulting Group, LLC. (MCG). Resilient Fund I launched in 2019 and successfully deployed $2.1M in eleven companies led by African American founders. Resilient Fund II, launched in 2024, is a $6.4M fund investing primarily in B2B/SaaS/Tech companies in a broad range of sectors.\n\nDr. Daniel has over 3 decades of management and servant-leadership in the public sector, higher education administration and management at the Fuqua School of Business, HR Learning and Development, Duke Divinity School, and Duke University Chapel. Daniel served as Executive Director for StepUp NC and DurhamCares, Inc.\n\nHe earned a B.A. in Comparative Area Studies, Duke University; Master of Higher Education, North Carolina State University; Master and Doctor of Divinity, Duke University. He resides in Durham, NC with his wife Lorna. They have and enjoy their two young adult children, Madison II and Loren."
        },
        {
            name: "Dr. Alanna Miller",
            title: "Associate Professor, Fayetteville State University",
            photo: getBioImageUrl("A_Miller.jpg"),
            bio: `Dr. Alanna Miller is an associate professor in the Department of Communication, Languages,
and Cultures at Fayetteville State University, where she has served since 2015. She earned her
Ph.D. in media and communication from Temple University, with a master’s from Syracuse
University in Television, Radio, and Film, and a bachelor’s in journalism from the University of
Maryland. Dr. Miller also serves as faculty advisor for "The Voice" student newspaper and
coordinates the department's internship program. Her research focuses on the intersection of
identity and media.\n\n
Dr. Miller is also a native of Raleigh and is committed to helping her community through
teaching and media practice. She is firmly committed to diversifying media fields through
serving all her students, including first generation students, military-affiliated students, rural
students, and students of color. She believes that we all benefit from learning each other's stories
and amplifying all perspectives.`
        },
        {
            name: "Debra Clark Jones",
            title: "Executive Vice President and Chief Institutional Advancement Officer at Bennett College",
            photo: getBioImageUrl("D_Jones.jpg"),
            bio: `Debra Clark Jones is Executive Vice President and Chief Institutional Advancement Officer at Bennett College, where she previously served as Acting President and as a member of the Board of Trustees. A respected leader in enterprise management, strategic communications, and data-driven decision-making, she has helped position Bennett for long-term stability through strategic fundraising, organizational alignment, and a renewed focus on institutional effectiveness.\n\n
            Before returning to her alma mater, Clark Jones served as Associate Vice President for Community Health at Duke Health, where she advanced systemwide strategies addressing the social drivers of health across North Carolina and secured a historic $30 million grant from Bloomberg Philanthropies—the largest in Duke Health’s history. Her prior roles include Vice President for University Advancement and External Affairs at Saint Augustine’s University and senior leadership positions in North Carolina state government, where she managed a $132 million statewide information technology initiative across 43 agencies and universities and later served as Chief Information Officer for the Department of Public Instruction.\n\n
            Clark Jones’ career also spans the private sector, with leadership roles at IBM and SAS Institute, where she advised P–20 education systems on analytics-driven decision tools to improve outcomes and efficiency. She is the president of TEQuity, a strategy consulting firm focused on advancing equity through data-informed strategy, and has led statewide health equity campaigns and cross-sector partnerships. A proud Bennett College graduate, she holds a bachelor’s degree in computer science with a minor in mathematics and a master’s degree in data analytics from the University of Maryland.`
        },
        {
            name: "Koren Townsend",
            title: "Chief of Staff, Red Hat AI Platform Engineering",
            photo: getBioImageUrl("K_Townsend.jpg"),
            bio: "Koren Townsend is a Chief of Staff in Red Hat’s AI Engineering organization, where she focuses on supporting project efforts on the AI Platform team.  She serves her community in several organizations including Delta Sigma Theta Sorority, Inc., Jack and Jill of America, and is the Operations Director of the Clark STEM and Leadership Academy.  She is the immediate past Chairwoman and current Advisor of Red Hat Blacks United In Leadership and Diversity (B.U.I.L.D.), a DEI community.  Koren and her husband, Mitchell, and their sons reside in Raleigh, NC."
        },
        {
            name: "Alexandra Machado",
            title: "Principal AI Architect in the Field CTO Office at Red Hat",
            photo: getBioImageUrl("A_Machado.jpg"),
            bio: `Alexandra Machado is a global technology and social innovation leader dedicated to using technology as a catalyst for positive, lasting societal impact. With over 17 years of experience spanning engineering, consulting and strategy, she currently serves as a Principal AI Architect in the Field CTO Office at Red Hat, where she helps organizations, particularly in financial services and emerging markets, focus on long term strategy aligning technology with value.\n\n
            With an MBA and an MSc in Information and Communication Technologies specializing in AI, Alexandra brings a rare blend of deep technical expertise and executive-level strategic thinking. A passionate advocate for open source, Alexandra has led and advised initiatives at the intersection of technology, social impact, environmental sustainability and cultural preservation, partnering with global institutions, nonprofits, and community organizations. Having lived and worked across seven countries and three continents, she brings a global, empathetic perspective to leadership and governance, guided by a deep belief that technology should serve the greater good.`
        }
    ];

    const goldSponsors: Sponsor[] = [
        {
            name: "Resilient Ventures",
            logo: getLogoUrl("RV Color Horizontal.jpg"),
            website: "https://resilient-ventures.com"
        }
    ];

    const silverSponsors: Sponsor[] = [];

    const bronzeSponsors: Sponsor[] = [];

    const partners: Sponsor[] = [
        {
            name: "Mass Open Cloud",
            logo: getLogoUrl("MOCwordmark_RGB_small.png"),
            website: "https://massopen.cloud"
        }
    ];

    const MemberCard = ({ member, onClick }: { member: TeamMember; onClick: () => void }) => (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer"
            onClick={onClick}
        >
            <div className="relative w-full aspect-square">
                <img
                    src={member.photo}
                    alt={member.name}
                   
                    className="object-contain bg-gray-100"
                />
            </div>
            <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-[#AE2D24] font-medium text-sm">{member.title}</p>
            </div>
        </motion.div>
    );

    const BioModal = ({ member, onClose }: { member: TeamMember; onClose: () => void }) => (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden p-8 relative flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
                    >
                        <X size={24} />
                    </button>
                    <div className="flex flex-col md:flex-row gap-6 min-h-0 flex-1">
                        <div className="flex-shrink-0 flex flex-col">
                            <div className="relative w-32 h-32">
                                <img
                                    src={member.photo}
                                    alt={member.name}
                                   
                                    className="object-cover rounded-lg"
                                />
                            </div>
                            {member.linkedin && (
                                <a
                                    href={member.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 hover:opacity-80 transition-opacity"
                                    aria-label={`${member.name}'s LinkedIn profile`}
                                >
                                    <LinkedInIcon size={24} />
                                </a>
                            )}
                        </div>
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="flex-shrink-0">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h2>
                                <p className="text-[#AE2D24] font-medium mb-4">{member.title}</p>
                            </div>
                            <div className="overflow-y-auto flex-1 pr-2">
                                <div className="text-gray-700 leading-relaxed space-y-4">
                                    {member.bio.split('\n\n').map((paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mission Section */}
            <section className="bg-[#AE2D24] text-white py-20">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Mission</h1>
                        <p className="text-xl md:text-2xl leading-relaxed">
                            Griot and Grits is a 501(c)(3) nonprofit organization dedicated to preserving
                            the oral histories of African American families through community-centered
                            storytelling and ethical uses of AI.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Our Team Section */}
            <section className="py-20">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Our Team</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 px-20">
                            {teamMembers.map((member) => (
                                <MemberCard
                                    key={member.name}
                                    member={member}
                                    onClick={() => setSelectedMember(member)}
                                />
                            ))}
                        </div>

                        {/* Volunteers Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="mt-12 bg-white rounded-lg shadow-lg overflow-hidden mx-auto max-w-6xl"
                        >
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Griot & Grits Storykeeping Collective</h3>
                                <p className="text-gray-700 text-lg leading-relaxed text-center mb-8">
                                    Many dedicated volunteers who have contributed countless hours to preserving
                                    and sharing the stories that matter. Their passion and commitment make our mission possible.
                                </p>

                                {/* Creative collage - grid on desktop, vertical on mobile */}
                                <div className="flex flex-col md:relative md:w-full md:h-[500px] gap-4 md:gap-0">
                                    {/* Mobile: vertical stack, Desktop: grid layout */}
                                    <div className="flex flex-col md:relative md:w-full md:h-full gap-4 md:gap-0">
                                        {/* First image */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5, delay: 0.3 }}
                                            className="relative w-full h-64 md:absolute md:top-0 md:left-0 md:w-[45%] md:h-[45%] shadow-xl z-10"
                                        >
                                            <img
                                                src={getImageUrl("2239728647962445031.jpg")}
                                                alt="Volunteers at work"
                                               
                                                className="object-cover object-top rounded-lg"
                                            />
                                        </motion.div>

                                        {/* Second image */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5, delay: 0.4 }}
                                            className="relative w-full h-64 md:absolute md:top-0 md:right-0 md:w-[45%] md:h-[45%] shadow-xl z-10"
                                        >
                                            <img
                                                src={getImageUrl("crew2.png")}
                                                alt="Community engagement"
                                               
                                                className="object-cover object-top rounded-lg"
                                            />
                                        </motion.div>

                                        {/* Third image */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5, delay: 0.5 }}
                                            className="relative w-full h-64 md:absolute md:bottom-0 md:left-0 md:w-[45%] md:h-[45%] shadow-xl z-10"
                                        >
                                            <img
                                                src={getImageUrl("3797497829222735602.jpg")}
                                                alt="Storykeeping session"
                                               
                                                className="object-cover object-top rounded-lg"
                                            />
                                        </motion.div>

                                        {/* Fourth image */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5, delay: 0.6 }}
                                            className="relative w-full h-64 md:absolute md:bottom-0 md:right-0 md:w-[45%] md:h-[45%] shadow-xl z-10"
                                        >
                                            <img
                                                src={getImageUrl("8348915442707023838.jpg")}
                                                alt="Volunteer team"
                                               
                                                className="object-cover object-top rounded-lg"
                                            />
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Strategic Advisory Board Section */}
            {boardMembers.length > 0 && (
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Strategic Advisory Board</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto justify-items-center">
                                {boardMembers.map((member) => (
                                    <MemberCard
                                        key={member.name}
                                        member={member}
                                        onClick={() => setSelectedMember(member)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Sponsors Section */}
            {(goldSponsors.length > 0 || silverSponsors.length > 0 || bronzeSponsors.length > 0) && (
                <section className="py-20 bg-gray-100">
                    <div className="container mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Our Sponsors</h2>

                        {/* Gold Sponsors */}
                        {goldSponsors.length > 0 && (
                            <div className="mb-16">
                                <h3 className="text-2xl font-bold text-center mb-8 text-yellow-600">Gold Sponsors</h3>
                                <div className="flex flex-wrap justify-center gap-12">
                                    {goldSponsors.map((sponsor) => (
                                        <motion.a
                                            key={sponsor.name}
                                            href={sponsor.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            whileHover={{ scale: 1.05 }}
                                            className="bg-white p-8 rounded-lg shadow-lg"
                                        >
                                            <div className="relative w-64 h-32">
                                                <img
                                                    src={sponsor.logo}
                                                    alt={sponsor.name}
                                                   
                                                    className="object-contain"
                                                />
                                            </div>
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Silver Sponsors */}
                        {silverSponsors.length > 0 && (
                            <div className="mb-16">
                                <h3 className="text-2xl font-bold text-center mb-8 text-gray-400">Silver Sponsors</h3>
                                <div className="flex flex-wrap justify-center gap-8">
                                    {silverSponsors.map((sponsor) => (
                                        <motion.a
                                            key={sponsor.name}
                                            href={sponsor.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            whileHover={{ scale: 1.05 }}
                                            className="bg-white p-6 rounded-lg shadow-lg"
                                        >
                                            <div className="relative w-48 h-24">
                                                <img
                                                    src={sponsor.logo}
                                                    alt={sponsor.name}
                                                   
                                                    className="object-contain"
                                                />
                                            </div>
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bronze Sponsors */}
                        {bronzeSponsors.length > 0 && (
                            <div>
                                <h3 className="text-2xl font-bold text-center mb-8 text-orange-600">Bronze Sponsors</h3>
                                <div className="flex flex-wrap justify-center gap-6">
                                    {bronzeSponsors.map((sponsor) => (
                                        <motion.a
                                            key={sponsor.name}
                                            href={sponsor.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            whileHover={{ scale: 1.05 }}
                                            className="bg-white p-4 rounded-lg shadow-lg"
                                        >
                                            <div className="relative w-32 h-16">
                                                <img
                                                    src={sponsor.logo}
                                                    alt={sponsor.name}
                                                   
                                                    className="object-contain"
                                                />
                                            </div>
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        )}
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Partners Section */}
            {partners.length > 0 && (
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Our Partners</h2>
                            <div className="flex flex-wrap justify-center gap-12">
                                {partners.map((partner) => (
                                    <motion.a
                                        key={partner.name}
                                        href={partner.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.05 }}
                                        className="bg-gray-50 p-8 rounded-lg shadow-lg"
                                    >
                                        <div className="relative w-64 h-32">
                                            <img
                                                src={partner.logo}
                                                alt={partner.name}
                                               
                                                className="object-contain"
                                            />
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Bio Modal */}
            {selectedMember && (
                <BioModal
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                />
            )}
        </div>
    );
};

export default WhoWeAre;
