import { NextRequest, NextResponse } from 'next/server';
import { GOFUNDME_CLIENT_ID, GOFUNDME_CLIENT_SECRET } from '@/lib/constants';

interface PublicCampaignData {
    id: string;
    title: string;
    description: string;
    goal: number;
    current_amount: number;
    currency: string;
    status: string;
    donors_count: number;
    percent_to_goal: number;
    url: string;
    organizer: {
        name: string;
        location: string;
    };
    minimum_donation_amount?: number;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const campaignUrl = searchParams.get('url');
        const campaignId = searchParams.get('id');

        if (!campaignUrl && !campaignId) {
            return NextResponse.json(
                { error: 'Campaign URL or ID is required' },
                { status: 400 }
            );
        }

        console.log('Fetching GoFundMe campaign data using client credentials for ID:', campaignId);

        let campaignData: PublicCampaignData | null = null;

        // Step 1: Get access token using client credentials
        try {
            console.log('Getting access token with client credentials...');

            const tokenResponse = await fetch('https://api.classy.org/oauth2/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: GOFUNDME_CLIENT_ID,
                    client_secret: GOFUNDME_CLIENT_SECRET,
                }).toString(),
            });

            if (!tokenResponse.ok) {
                const tokenError = await tokenResponse.text();
                console.error('Token request failed:', tokenError);
                throw new Error(`Token request failed: ${tokenResponse.status}`);
            }

            const tokenData = await tokenResponse.json();
            console.log('Access token obtained successfully');

            // Step 2: Use access token to fetch campaign data
            console.log('Fetching campaign data with access token...');

            const campaignResponse = await fetch(`https://api.classy.org/2.0/campaigns/${campaignId}`, {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!campaignResponse.ok) {
                const campaignError = await campaignResponse.text();
                console.error('Campaign request failed:', campaignError);
                throw new Error(`Campaign request failed: ${campaignResponse.status}`);
            }

            const classyData = await campaignResponse.json();
            console.log('Campaign data received:', classyData);

            // Step 3: Fetch overview data for fundraising metrics
            console.log('Fetching campaign overview data...');

            let currentAmount = 0;
            let donorsCount = 0;
            let percentToGoal = 0;

            try {
                // Fetch overview to get total_gross_amount, donors_count, and percent_to_goal
                const overviewResponse = await fetch(`https://api.classy.org/2.0/campaigns/${campaignId}/overview`, {
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`,
                        'Accept': 'application/json',
                    },
                });

                if (overviewResponse.ok) {
                    const overviewData = await overviewResponse.json();
                    console.log('Overview data received:', overviewData);

                    currentAmount = parseFloat(overviewData.total_gross_amount || '0');
                    donorsCount = overviewData.donors_count || 0;
                    percentToGoal = parseFloat(overviewData.percent_to_goal || '0');

                    console.log(`Overview metrics - Amount: $${currentAmount}, Donors: ${donorsCount}, Progress: ${percentToGoal}%`);
                }

            } catch (fundraisingError) {
                console.error('Error fetching overview data:', fundraisingError);
            }

            // Map Classy API response to our interface
            campaignData = {
                id: classyData.id?.toString() || campaignId,
                title: classyData.name || classyData.title || 'Campaign Title',
                description: classyData.description || classyData.story || '',
                goal: parseFloat(classyData.goal || classyData.raw_goal || '0'),
                current_amount: currentAmount,
                currency: classyData.currency_code || 'USD',
                status: classyData.status || 'active',
                donors_count: donorsCount,
                percent_to_goal: percentToGoal,
                url: classyData.canonical_url || campaignUrl || `https://give.griotandgrits.org/campaign/${campaignId}/donate`,
                organizer: {
                    name: classyData.organizer?.first_name
                        ? `${classyData.organizer.first_name} ${classyData.organizer.last_name}`
                        : classyData.organizer?.name || 'Griot and Grits Team',
                    location: classyData.organizer?.location || 'United States',
                },
                minimum_donation_amount: parseFloat(classyData.minimum_donation_amount || '5'),
            };

        } catch (authError) {
            console.error('Authenticated API request failed:', authError);
        }

        // If both API calls failed, return an error
        if (!campaignData) {
            console.error('All API attempts failed for campaign:', campaignId);
            return NextResponse.json(
                { error: 'Unable to fetch campaign data from GoFundMe APIs. Please check the campaign ID and ensure it is public.' },
                { status: 404 }
            );
        }

        console.log('Returning campaign data:', campaignData);
        return NextResponse.json(campaignData);

    } catch (error) {
        console.error('Public campaign fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch public campaign data' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}