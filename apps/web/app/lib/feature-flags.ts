import type { Env } from "./env";

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

export function getFeatureFlags(env: Env): FeatureFlags {
    return {
        askTheGriot: env.FEATURE_ASK_THE_GRIOT === 'true',
        goFundMe: env.FEATURE_GOFUNDME !== 'false',
    };
}

export function getGoFundMeConfig(env: Env): GoFundMeConfig {
    const campaignId = env.GOFUNDME_CAMPAIGN_ID || '731313';
    const enabled = isFeatureEnabled('goFundMe', env) && campaignId !== null;
    const useEmbedded = env.GOFUNDME_USE_EMBEDDED === 'true';
    const showTracker = env.GOFUNDME_SHOW_TRACKER === 'true';

    return {
        campaignId,
        enabled,
        useEmbedded,
        showTracker,
    };
}

export function isFeatureEnabled(feature: keyof FeatureFlags, env: Env): boolean {
    return getFeatureFlags(env)[feature];
}
