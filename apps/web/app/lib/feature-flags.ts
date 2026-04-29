export interface FeatureFlags {
    askTheGriot: boolean;
    goFundMe: boolean;
}

export interface GoFundMeConfig {
    campaignId: string | null;
    enabled: boolean;
    useEmbedded: boolean;
    showTracker: boolean;
}

/**
 * Get feature flags from environment variables or default configuration.
 * This function runs on the server side only.
 */
export function getFeatureFlags(): FeatureFlags {
    return {
        askTheGriot: process.env.FEATURE_ASK_THE_GRIOT === 'true',
        goFundMe: process.env.FEATURE_GOFUNDME !== 'false',
    };
}

/**
 * Get GoFundMe configuration from environment variables.
 * This function runs on the server side only.
 */
export function getGoFundMeConfig(): GoFundMeConfig {
    const campaignId = process.env.GOFUNDME_CAMPAIGN_ID || '731313';
    const enabled = isFeatureEnabled('goFundMe') && campaignId !== null;
    const useEmbedded = process.env.GOFUNDME_USE_EMBEDDED === 'true'; // Default to false (external links)
    const showTracker = process.env.GOFUNDME_SHOW_TRACKER === 'true'; // Default to false (hide tracker)

    return {
        campaignId,
        enabled,
        useEmbedded,
        showTracker,
    };
}

/**
 * Check if a specific feature is enabled.
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    const flags = getFeatureFlags();
    return flags[feature];
}