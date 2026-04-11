# Griot & Grits Website + Admin Portal

This repository hosts the public marketing site for Griot & Grits and the admin portal used to manage the digital preservation backend. The admin experience lives under `/admin` inside the Next.js App Router and connects to the FastAPI preservation service delivered in `griot-and-grits-backend`.

## What’s Included

- Public marketing experience (`/`)
- Admin dashboard with quick actions
- Artifact management (list, detail view, ingestion form)
- Preservation metadata panels (storage locations, events, fixity)
- Archive package workflow: draft → upload → confirm
- GitHub / development auth scaffolding via NextAuth
- React Query data layer, React Hook Form + Zod validation helpers

## Contributing

### Adding New Videos

For detailed instructions on adding new video interviews to the website, see [ADDING_VIDEOS.md](ADDING_VIDEOS.md).

This guide covers:
- Using AI tools to generate descriptions and extract metadata
- Uploading videos to the YouTube channel
- Updating video metadata in `metadata/videos.yaml`
- Managing tags and filters in `metadata/filters.yaml`

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm (ships with Node) or an alternative package manager
- Access to the preservation API (default base URL `http://localhost:8009`)
- GitHub OAuth credentials (production) or a development token (local testing)

## Installation

Install dependencies after cloning:

```bash
npm install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Feature Flags

This project uses server-side feature flags to control the availability of certain features in production.

### Ask the Griot Feature

The "Ask the Griot" AI chatbot feature on the Collection page can be enabled or disabled using an environment variable.

**To enable the feature (default behavior):**
```bash
export FEATURE_ASK_THE_GRIOT=true
```

**To disable the feature:**
```bash
export FEATURE_ASK_THE_GRIOT=false
```

### GoFundMe Donation Integration

The GoFundMe donation section on the main page can be configured and controlled using environment variables.

**Required API Credentials (for real-time campaign data):**
```bash
export GOFUNDME_CLIENT_ID=your-classy-client-id       # Required: Your Classy API client ID
export GOFUNDME_CLIENT_SECRET=your-classy-secret      # Required: Your Classy API client secret
```

**Optional Configuration:**
```bash
export GOFUNDME_CAMPAIGN_ID=731313     # Default campaign ID
export FEATURE_GOFUNDME=true           # Enable/disable the feature (default: enabled)
export GOFUNDME_USE_EMBEDDED=false     # Use embedded modal vs external links (default: false - external links)
export GOFUNDME_SHOW_TRACKER=false     # Show/hide fundraising progress tracker (default: false - hide tracker)
export GOFUNDME_REDIRECT_URI=http://localhost:3000/oauth/callback  # OAuth redirect URI (not currently used)
```

**To use embedded donation modal:**
```bash
export GOFUNDME_USE_EMBEDDED=true      # Opens donation form in modal on your site
```

**To show the fundraising progress tracker:**
```bash
export GOFUNDME_SHOW_TRACKER=true      # Shows the "Raised/Goal" progress bar and donor count
```

**To disable the GoFundMe section:**
```bash
export FEATURE_GOFUNDME=false
```

**For deployment platforms:**

- **Vercel**: Add environment variables in the Vercel dashboard:
  - `GOFUNDME_CLIENT_ID=your-classy-client-id` (**Required** for real-time data)
  - `GOFUNDME_CLIENT_SECRET=your-classy-secret` (**Required** for real-time data)
  - `FEATURE_ASK_THE_GRIOT=false` (to disable Ask the Griot)
  - `GOFUNDME_CAMPAIGN_ID=your-campaign-id` (to set your campaign)
  - `FEATURE_GOFUNDME=false` (to disable GoFundMe section)
  - `GOFUNDME_USE_EMBEDDED=true` (to use embedded modal instead of external links)
  - `GOFUNDME_SHOW_TRACKER=true` (to show the fundraising progress tracker)


- **Docker**: Pass environment variables when running the container:
  ```bash
  docker run -e GOFUNDME_CLIENT_ID=your-classy-client-id \
             -e GOFUNDME_CLIENT_SECRET=your-classy-secret \
             -e FEATURE_ASK_THE_GRIOT=false \
             -e GOFUNDME_CAMPAIGN_ID=your-campaign-id \
             -e FEATURE_GOFUNDME=true \
             -e GOFUNDME_USE_EMBEDDED=true \
             -e GOFUNDME_SHOW_TRACKER=true \
             your-app
  ```


**Notes:**
- Feature flags are evaluated server-side during page rendering for security
- Changes require a deployment/restart to take effect
- **GoFundMe API Credentials**:
  - **Required** for real-time campaign data (current amount raised, donor count, etc.)
  - Without credentials, the GoFundMe section will show fallback/default values
  - Credentials are from Classy API (GoFundMe's partner platform for organizations)
- **GoFundMe Default**: External links (opens `https://give.griotandgrits.org/campaign/731313/donate` in new window)
- **GoFundMe Embedded**: Modal overlay with embedded donation form (when `GOFUNDME_USE_EMBEDDED=true`)
- If environment variables are not set, features default to enabled with campaign ID 731313
- When disabled, the respective features will not appear on the website

### Mailchimp Newsletter Integration

The newsletter subscription feature allows users to subscribe to your email list through the "Get In Touch" section on the main page. This feature requires a Mailchimp account and API credentials.

**Required Environment Variables:**
```bash
export MAILCHIMP_API_KEY=your-mailchimp-api-key           # Required: Your Mailchimp API key
export MAILCHIMP_API_SERVER=us1                           # Required: Your Mailchimp server prefix (e.g., us1, us2, us21)
export MAILCHIMP_AUDIENCE_ID=your-audience-list-id        # Required: The Mailchimp audience/list ID to subscribe users to
```

**How to Get Your Mailchimp Credentials:**
1. **API Key**: Mailchimp → Account → Extras → API keys → Create New Key
2. **Server Prefix**: Check your Mailchimp account URL (e.g., `https://us1.admin.mailchimp.com/` means server is "us1")
3. **Audience ID**: Mailchimp → Audience → Settings → Audience name and defaults → Audience ID

**For deployment platforms:**

- **Vercel**: Add environment variables in the Vercel dashboard:
  - `MAILCHIMP_API_KEY=your-mailchimp-api-key` (**Required**)
  - `MAILCHIMP_API_SERVER=us1` (**Required**)
  - `MAILCHIMP_AUDIENCE_ID=your-audience-list-id` (**Required**)

- **Docker**: Pass environment variables when running the container:
  ```bash
  docker run -e MAILCHIMP_API_KEY=your-mailchimp-api-key \
             -e MAILCHIMP_API_SERVER=us1 \
             -e MAILCHIMP_AUDIENCE_ID=your-audience-list-id \
             your-app
  ```

**Notes:**
- Without these credentials configured, newsletter subscriptions will fail with an error
- The subscription form will still be visible, but users will see an error message when attempting to subscribe
- Subscribers are added to your Mailchimp audience with status "subscribed"
- Email validation is handled by the Mailchimp API


## Deployment

This application is deployed on [Fly.io](https://fly.io) with automated deployments via GitHub Actions.

### Production Environment

The admin portal is protected by GitHub OAuth and requires membership in the configured GitHub organization.

**Required Secrets (GitHub Actions):**
- `FLY_API_TOKEN` - Fly.io deployment token
- `NEXT_PUBLIC_ADMIN_API_BASE_URL` - Backend API URL (set at build time)
- `AUTH_SECRET` - NextAuth.js secret (generate with `openssl rand -base64 32`)
- `GITHUB_CLIENT_ID` - GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth app client secret
- `ADMIN_ALLOWED_GITHUB_ORG` - GitHub organization slug for access control

### Deployment Process

Deployments are triggered automatically on pushes to `main` or `dev` branches. The workflow:
1. Runs security audit with `npm audit`
2. Builds Docker image with build-time secrets
3. Deploys to Fly.io

### Manual Deployment

```bash
flyctl deploy --remote-only --app gng-web \
  --build-arg NEXT_PUBLIC_ADMIN_API_BASE_URL="https://your-api.fly.dev"
```
