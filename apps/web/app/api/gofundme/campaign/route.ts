import { NextRequest, NextResponse } from 'next/server';

interface GoFundMeCampaign {
    id: string;
    title: string;
    description: string;
    goal: number;
    current_amount: number;
    currency: string;
    status: string;
    created_date: string;
    deadline?: string;
    beneficiary?: {
        name: string;
        location: string;
    };
    organizer: {
        name: string;
        location: string;
    };
    category: {
        name: string;
        id: string;
    };
    media?: {
        type: string;
        url: string;
        caption?: string;
    }[];
    updates_count: number;
    donors_count: number;
    shares_count: number;
    url: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('id');

        if (!campaignId) {
            return NextResponse.json(
                { error: 'Campaign ID is required' },
                { status: 400 }
            );
        }

        // Get access token from Authorization header
        const authHeader = request.headers.get('Authorization');
        const accessToken = authHeader?.replace('Bearer ', '');

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Access token is required' },
                { status: 401 }
            );
        }

        // Fetch campaign data from Classy API (GoFundMe's partner platform)
        console.log('Fetching campaign data for ID:', campaignId, 'with token:', accessToken?.substring(0, 10) + '...');

        const response = await fetch(`https://api.classy.org/2.0/campaigns/${campaignId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                return NextResponse.json(
                    { error: 'Invalid or expired access token' },
                    { status: 401 }
                );
            }

            if (response.status === 404) {
                return NextResponse.json(
                    { error: 'Campaign not found' },
                    { status: 404 }
                );
            }

            const errorData = await response.text();
            console.error('GoFundMe API error:', errorData);

            return NextResponse.json(
                { error: 'Failed to fetch campaign data' },
                { status: response.status }
            );
        }

        const campaignData: GoFundMeCampaign = await response.json();

        return NextResponse.json(campaignData);

    } catch (error) {
        console.error('Campaign fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error while fetching campaign' },
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
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}