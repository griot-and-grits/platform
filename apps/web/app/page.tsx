import About, { CollectionCTA } from '@/components/about'
import ContactSection from '@/components/contact'
import GoFundMe from '@/components/gofundme'
import Hero from '@/components/hero'
import MediaCoverage from '@/components/media-coverage'
import Nav from '@/components/nav'
import Services from '@/components/services'
import Testimonials from '@/components/testimonials'
import Works from '@/components/works'
import { loadVideoMetadata } from '@/lib/load-metadata'
import { getGoFundMeConfig } from '@/lib/feature-flags'
import React from 'react'

const page = () => {
    const videoMetadata = loadVideoMetadata();
    const goFundMeConfig = getGoFundMeConfig();

    return (
        <>
            <div id="home"></div>
            <Nav />
            <Hero />
            <CollectionCTA />
            <Works videos={videoMetadata.videos} />
            <About />
            <Services />
            {/* <Stats /> */}
            {goFundMeConfig.enabled && goFundMeConfig.campaignId && (
                <GoFundMe
                    campaignId={goFundMeConfig.campaignId}
                    useEmbedded={goFundMeConfig.useEmbedded}
                    showTracker={goFundMeConfig.showTracker}
                />
            )}
            <MediaCoverage />
            <Testimonials />
            {/* <FAQ /> */}
            <ContactSection />
        </>
    )
}

export default page