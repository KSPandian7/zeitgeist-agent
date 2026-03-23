# Zeitgeist AI Content Agent

A full-stack local app to fetch, review, and post content to Instagram.  
**100% free. No paid services required.**

---

## Quick Start

### Requirements
- Node.js v18+ → https://nodejs.org
- A Facebook Developer account (free)
- Instagram Business/Creator account (free to convert)

### Run Locally

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Start the server
npm start

# 3. Open in browser
# http://localhost:3001
```

---

## Instagram Setup (Free, 5 mins)

### Step 1 — Convert Instagram to Business Account
1. Open Instagram → Settings → Account
2. Tap "Switch to Professional Account" → Choose "Business"
3. It's free and reversible

### Step 2 — Create a Facebook Developer App
1. Go to https://developers.facebook.com
2. Click "My Apps" → "Create App"
3. Choose "Other" → "Business" → give it any name
4. Add the "Instagram" product to your app

### Step 3 — Link a Facebook Page
- Your Instagram Business account must be linked to a Facebook Page
- Facebook Page → Settings → Instagram → Connect Account

### Step 4 — Get Your Access Token
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app in the dropdown
3. Select your Facebook Page
4. Add these permissions:
   - `instagram_basic`
   - `instagram_content_publish`  
   - `pages_read_engagement`
5. Click "Generate Access Token"
6. Copy the token

### Step 5 — Find Your Page ID
- Open your Facebook Page → Settings → About → scroll to Page ID
- It's a long number like `123456789012345`

### Step 6 — Connect in the App
- Open http://localhost:3001
- Go to "Instagram Connect" in the sidebar
- Paste your token + Page ID
- Click Connect ✓

---

## Features

| Feature | Status |
|---------|--------|
| Live RSS news fetching (BBC, TechCrunch, ET, NDTV, etc.) | ✅ |
| AI post generation from articles | ✅ |
| Post visual preview (dark branded cards) | ✅ |
| Caption + hashtag generation | ✅ |
| One-click Instagram posting | ✅ |
| Post scheduling (date/time) | ✅ |
| Full post history with IG post IDs | ✅ |
| Edit caption before posting | ✅ |
| SQLite local database (no cloud needed) | ✅ |
| Dark UI matching your Zeitgeist brand | ✅ |

---

## Project Structure

```
zeitgeist-agent/
├── backend/
│   ├── server.js          # Express server
│   ├── db.js              # SQLite setup
│   ├── zeitgeist.db       # Auto-created database
│   ├── routes/
│   │   ├── instagram.js   # IG auth + posting
│   │   ├── posts.js       # CRUD + history
│   │   └── feed.js        # RSS fetch + AI generate
│   └── package.json
└── frontend/
    └── public/
        └── index.html     # Complete SPA frontend
```

---

## Free Hosting Options (Run from Anywhere)

### Option 1: Railway (Recommended — Free tier)
1. Push to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. It auto-detects Node.js
4. Add env var: `PORT=3001`
5. Get a free `yourapp.railway.app` URL

### Option 2: Render (Free)
1. Push to GitHub
2. Go to https://render.com → New Web Service
3. Build command: `cd backend && npm install`
4. Start command: `cd backend && npm start`

### Option 3: Fly.io (Free tier)
```bash
npm install -g flyctl
fly launch
fly deploy
```

### Option 4: Always-on on your laptop
```bash
# Install PM2 process manager
npm install -g pm2

cd backend
pm2 start server.js --name zeitgeist
pm2 startup  # Auto-start on boot
pm2 save
```

---

## Notes on Token Expiry
- The token from Graph API Explorer expires in ~60 days
- For long-term use: Create a System User in Facebook Business Manager and generate a never-expiring token
- Guide: https://developers.facebook.com/docs/pages/access-tokens

---

## Cost Breakdown
| Service | Cost |
|---------|------|
| Instagram Graph API | Free |
| Facebook Developer App | Free |
| RSS News Sources | Free |
| Node.js hosting (Railway/Render) | Free |
| SQLite database | Free |
| **Total** | **$0/month** |
