# VULCA Deployment Guide

## Domain Strategy

### Production URLs
- **Marketing Site**: `https://vulca.ai` (SEO-friendly, static pages)
- **App**: `https://vulca.ai/app` or `https://app.vulca.ai` (SPA with HashRouter)
- **API**: `https://api.vulca.ai` (Cloud Run backend)

### Current State
- Frontend: `https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/`
- API: `https://wenxin-moyun-api-229980166599.asia-east1.run.app`

## Recommended Architecture (Minimal Change for 7-Day Sprint)

```
vulca.ai (Firebase Hosting / Cloud Storage + CDN)
├── / (Marketing - Static HTML for SEO)
│   ├── index.html (Home)
│   ├── pricing/index.html
│   ├── solutions/index.html
│   ├── customers/index.html
│   ├── trust/index.html
│   ├── methodology/index.html
│   ├── dataset/index.html
│   └── papers/index.html
│
└── /app (SPA - React App with HashRouter)
    └── index.html → Full React SPA
```

## Option 1: Firebase Hosting (Recommended for 7-Day Sprint)

### Why Firebase Hosting?
- Free custom domain with auto SSL
- Built-in CDN
- Easy rewrites for SPA
- No server management

### Setup Steps

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Initialize (in project root)
firebase init hosting

# 4. Configure firebase.json
```

### firebase.json Configuration
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/app/**",
        "destination": "/app/index.html"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

## Option 2: Cloud Run + Load Balancer (Current GCP Stack)

### DNS Configuration (Cloud DNS)
```
vulca.ai.        A       [LOAD_BALANCER_IP]
www.vulca.ai.    CNAME   vulca.ai.
api.vulca.ai.    CNAME   wenxin-moyun-api-229980166599.asia-east1.run.app.
```

### Cloud Storage + CDN
1. Create bucket: `vulca-ai-static`
2. Upload dist/ to bucket
3. Configure Cloud CDN with custom domain
4. SSL via Google-managed certificate

## SEO Strategy

### Marketing Pages (Must be indexable)
These pages need to be server-rendered or pre-rendered:
- `/` - Home
- `/pricing` - Pricing
- `/solutions` - Solutions overview
- `/solutions/ai-labs` - AI Labs solution
- `/solutions/research` - Research solution
- `/solutions/museums` - Museum solution
- `/customers` - Customer stories
- `/trust` - Trust & Security
- `/methodology` - Methodology
- `/dataset` - Dataset
- `/papers` - Academic papers

### App Pages (SPA is fine)
These can remain as SPA (HashRouter acceptable):
- `/app/models` - Leaderboard
- `/app/vulca` - VULCA Demo
- `/app/evaluations` - User evaluations
- `/app/exhibitions` - Exhibitions

## Quick Win: Hybrid Approach

For the 7-day sprint, we recommend:

1. **Keep current SPA** at `/app` or with hash routes
2. **Add static marketing pages** at root paths
3. **Use Vite SSG plugin** or manual HTML generation for marketing pages

### Vite SSG Setup (vite-ssg)
```bash
npm install vite-ssg --save-dev
```

Or simpler: **Generate static HTML files for marketing pages** during build.

## Environment Variables

### Frontend Production (.env.production)
```
VITE_API_BASE_URL=https://api.vulca.ai
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_APP_VERSION=1.2.0
VITE_MONITORING_ENDPOINT=https://api.vulca.ai/monitoring
```

### Backend Environment Variables
```bash
# Lead Notification (Discord/Slack webhook)
LEAD_NOTIFICATION_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
# Or for Slack:
# LEAD_NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx

# Enable/disable notifications (default: true)
ENABLE_LEAD_NOTIFICATIONS=true

# Team email for notifications (optional, future SMTP support)
LEAD_NOTIFICATION_EMAIL=team@vulca.ai
```

### Setting Up Discord Webhook
1. Go to Discord Server Settings → Integrations → Webhooks
2. Create new webhook named "VULCA Leads"
3. Copy webhook URL
4. Set `LEAD_NOTIFICATION_WEBHOOK_URL` environment variable

### Setting Up Slack Webhook
1. Go to Slack API → Apps → Create App → Incoming Webhooks
2. Enable Incoming Webhooks
3. Add New Webhook to Workspace
4. Copy webhook URL
5. Set `LEAD_NOTIFICATION_WEBHOOK_URL` environment variable

### Email Configuration (SMTP)

The backend supports sending confirmation emails to leads via SMTP. Compatible with SendGrid, Amazon SES, Mailgun, or any SMTP provider.

```bash
# SMTP Configuration
SMTP_HOST=smtp.sendgrid.net        # or smtp.gmail.com, email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=apikey                    # for SendGrid, use "apikey" as username
SMTP_PASSWORD=your-sendgrid-api-key  # API key or password
SMTP_FROM_EMAIL=noreply@vulca.ai
SMTP_FROM_NAME=VULCA Team
SMTP_USE_TLS=true
ENABLE_EMAIL_CONFIRMATION=true
```

#### Provider-Specific Setup

**SendGrid (Recommended)**
1. Create SendGrid account at sendgrid.com
2. Go to Settings → API Keys → Create API Key
3. Grant "Mail Send" permission
4. Use settings:
   - `SMTP_HOST=smtp.sendgrid.net`
   - `SMTP_USER=apikey`
   - `SMTP_PASSWORD=<your-api-key>`

**Amazon SES**
1. Verify domain in SES console
2. Create SMTP credentials in SES
3. Use settings:
   - `SMTP_HOST=email-smtp.<region>.amazonaws.com`
   - `SMTP_USER=<ses-smtp-username>`
   - `SMTP_PASSWORD=<ses-smtp-password>`

**Mailgun**
1. Create Mailgun account
2. Get SMTP credentials from domain settings
3. Use settings:
   - `SMTP_HOST=smtp.mailgun.org`
   - `SMTP_USER=<your-smtp-login>`
   - `SMTP_PASSWORD=<your-smtp-password>`

#### Testing Email Configuration
```bash
# Quick test (requires backend running)
curl -X POST http://localhost:8001/api/v1/leads/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@example.com",
    "use_case": "research",
    "source_page": "book_demo"
  }'
```

If SMTP is configured correctly, you'll receive a confirmation email within 1 minute.

## Sentry Error Monitoring

### Frontend Sentry Setup
1. Create a Sentry project at https://sentry.io (choose React platform)
2. Get DSN from Project Settings → Client Keys (DSN)
3. Add to environment:
   ```bash
   VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```

### Features Enabled
- **Error Tracking**: Automatic capture of unhandled exceptions
- **Performance Monitoring**: 10% sampling in production
- **Session Replay**: 10% of sessions, 100% of error sessions
- **Breadcrumbs**: User actions leading to errors
- **Release Tracking**: Automatic version tagging

### Verification
After deployment, trigger a test error:
```javascript
// In browser console
throw new Error('Sentry test error');
```
Check Sentry dashboard within 1 minute for the error.

### Backend Sentry Setup (Optional)
```bash
# Install
pip install sentry-sdk[fastapi]

# In main.py
import sentry_sdk
sentry_sdk.init(
    dsn="...",
    traces_sample_rate=0.1,
    environment="production"
)
```

## Deployment Checklist

### Pre-deployment
- [ ] Domain registered and DNS configured
- [ ] SSL certificate provisioned
- [ ] Environment variables set
- [ ] Build passes (`npm run build`)
- [ ] Sample Report PDF uploaded

### Post-deployment
- [ ] HTTPS working
- [ ] All pages accessible
- [ ] API endpoints responding
- [ ] Sentry receiving events
- [ ] Google Search Console connected

## GCP Monitoring & Alerts

### Quick Setup
```bash
# Set environment variables
export GCP_PROJECT_ID=wenxin-moyun-prod-new
export ALERT_EMAIL=team@vulca.ai

# Run alert setup script
cd wenxin-backend
chmod +x scripts/setup_gcp_alerts.sh
./scripts/setup_gcp_alerts.sh
```

### Alert Policies Created

| Alert | Condition | Action |
|-------|-----------|--------|
| High Error Rate | >1% 5xx errors | Email notification |
| High Latency | P95 >5 seconds | Email notification |
| Database CPU | >80% utilization | Email notification |
| Instance Scaling | >10 instances | Email notification |

### Manual Alert Setup (Console)

1. Go to Cloud Monitoring: https://console.cloud.google.com/monitoring
2. Navigate to Alerting → Policies
3. Create Policy with conditions above

### Budget Alerts

```bash
# Run budget setup script
chmod +x scripts/setup_gcp_budget.sh
./scripts/setup_gcp_budget.sh
```

Budget thresholds:
- **50%**: Early warning
- **80%**: High usage
- **100%**: Budget exceeded
- **120% forecasted**: Overspend forecast

### Recommended Monthly Budget

| Environment | Budget | Alerts |
|-------------|--------|--------|
| Development | $10 | 50%, 100% |
| Staging | $25 | 50%, 80%, 100% |
| Production | $50 | 50%, 80%, 100%, 120% forecast |

## Rollback Plan

1. Keep previous version tagged in git
2. Cloud Storage versioning enabled
3. One-click rollback via:
   ```bash
   gcloud storage cp gs://vulca-ai-static-backup/* gs://vulca-ai-static/
   ```
