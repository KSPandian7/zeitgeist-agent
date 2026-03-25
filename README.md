# Zeitgeist AI — Content Engine
## Comprehensive System Breakdown & Workflow Documentation

> **Project:** Zeitgeist AI Agent — Automated News-to-Instagram Pipeline  
> **Version:** 2.0 (v4)  
> **Stack:** Node.js · SQLite · node-canvas · Instagram Graph API · Local NLP  
> **Repository:** github.com/KSPandian7/zeitgeist-agent  
> **Live Page:** @zeitgeist.in on Instagram

---
**Visit:** [zeitgeist.in](https://www.instagram.com/zeitgeist.in/)

## 1. Task Overview

### What task was assigned?
Build a **semi-automated, human-controlled AI content pipeline** that:
- Fetches live news from 50+ trusted sources
- Processes raw headlines using a local NLP model
- Lets a human approve or reject each article
- On approval — auto-generates a branded Instagram image (3:4 ratio)
- Publishes directly to Instagram via the official Graph API

### Objective
Eliminate the 2–3 hours of daily manual effort required to run a news/knowledge Instagram page. The system produces publication-ready posts in seconds, while keeping the human in control of every piece of content that goes live.

### Problem Being Solved
| Problem | Solution |
|---------|----------|
| Manual news research takes hours daily | 50-source RSS pipeline fetches automatically every 5 minutes |
| Raw titles are noisy and unpublishable | Local NLP pipeline cleans, improves, and summarises headlines |
| Branded image creation requires design tools | node-canvas generates 1080px images programmatically |
| Posting requires opening Instagram manually | Instagram Graph API publishes with one click |
| Same hashtags cause shadowban | 5-pool rotation system — never repeats the same set twice |

---

## 2. Step-by-Step Workflow

### Full Pipeline — Stage by Stage

```
RSS Sources (50)
     ↓
  RSS Parser
     ↓
  NLP Pipeline (local)
  ├─ Clean title
  ├─ Generate summary
  ├─ Extract entities
  ├─ Score India relevance
  └─ Detect sentiment
     ↓
  SQLite: feed_articles table
     ↓
  [HUMAN] Fetch & Review page
  ├─ Approve → triggers image generation + caption build
  └─ Reject → article discarded
     ↓
  node-canvas: generate 810×1080 JPEG
     ↓
  Cloudinary: upload → get public HTTPS URL
     ↓
  SQLite: posts table (status = 'approved')
     ↓
  [HUMAN] Approved Posts page
  ├─ Edit caption/hashtags inline
  ├─ Post → Instagram Graph API
  └─ Reject
     ↓
  Instagram: @zeitgeist.in
     ↓
  SQLite: status = 'posted', IG post ID logged
```

### Input
- Raw RSS feeds from 50 sources (BBC, The Hindu, Reuters, TechCrunch, Inc42, etc.)
- User approval/rejection decisions
- `.env` file with Cloudinary + Instagram tokens

### Process — Step by Step

**Step 1 — Fetch (every 5 min via node-cron)**
- `rss-parser` hits all 50 source URLs in parallel
- Timeout: 12 seconds per source
- Deduplication: `LOWER(headline)` compared against existing DB entries
- Articles older than 48 hours auto-deleted

**Step 2 — NLP Processing (nlp.js — runs 100% locally)**
- Strip noise: `| Source Name`, `BREAKING:`, `WATCH:`, multiple spaces
- Fix ALL-CAPS titles → Title Case
- Remove clickbait phrases (`"you won't believe"`, `"shocking"`, etc.)
- Extract entities (persons, orgs, places) via `compromise`
- Generate 1–2 line summary from article description
- Score India relevance (0–100) based on keyword matching
- Detect sentiment (positive / negative / neutral)
- Flag trending articles

**Step 3 — Human Review (Fetch & Review page)**
- User sees NLP-cleaned headline + summary + source + time ago
- Tabs: All / Tech / Finance / World / Science / 🇮🇳 Tamil
- Two buttons per article: ✓ Approve | ✕ Reject

**Step 4 — On Approval (automatic)**
- `hashtags.js`: builds full caption + selects rotated hashtag pool
- `image-generator.js`: draws 810×1080px JPEG via node-canvas
  - Gradient dark background (topic-specific colour)
  - Date pill + Category pill (top)
  - NLP headline + summary in bordered box (middle)
  - `@zeitgeist.in` pill (bottom right only)
- `cloudinary-upload.js`: uploads JPEG → returns public HTTPS URL
- Post saved to DB with `status = 'approved'`

**Step 5 — Human Post Decision (Approved Posts page)**
- User sees image preview + caption + hashtags
- Inline editor: edit caption and hashtags without modal
- Three buttons: 🚀 Post | ✏️ Edit | ✕ Reject

**Step 6 — Instagram Publishing**
- `instagram.js` calls Graph API v19:
  1. `POST /{ig_user_id}/media` — creates media container with image URL + caption
  2. 2 second wait
  3. `POST /{ig_user_id}/media_publish` — publishes
- IG Post ID logged in DB
- Post status updated to `'posted'`

### Output
- Published Instagram post at @zeitgeist.in
- Full audit trail in `post_history` table
- Analytics data (likes, comments, reach) synced from Instagram

### Technologies Used
| Component | Technology |
|-----------|-----------|
| Backend server | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| RSS fetching | rss-parser |
| NLP (local) | compromise, natural, stopword |
| Image generation | node-canvas (server-side Canvas API) |
| Image hosting | Cloudinary free tier |
| Instagram publishing | Meta Graph API v19 |
| Scheduling | node-cron |
| Frontend | Vanilla JS SPA |
| Hosting | Railway.app (free tier) |

---

## 3. Decision Making

### Why this approach?

**Local NLP instead of OpenAI/Gemini API:**
- Zero API cost — runs on the user's AMD Ryzen 5 machine
- No latency from external calls
- Privacy — raw titles never leave the machine
- `compromise` library is 250KB, works offline, handles English entity extraction well

**node-canvas instead of Canva/design tools:**
- 100% programmatic — no human touch needed
- Consistent brand output every time
- Runs on server, no browser required
- Produces real JPEG files, not screenshots

**SQLite instead of Postgres/MongoDB:**
- Zero setup — file-based, ships with the project
- Sufficient for single-user workload (< 10,000 posts)
- Easy to migrate to Postgres when scaling to multi-user SaaS

**Instagram Graph API instead of third-party schedulers (Buffer, Hootsuite):**
- Free — no monthly subscription
- Direct — no intermediary that can break
- Full control over posting logic

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|-------------|
| Buffer / Later | $45–99/month, no programmatic control |
| OpenAI for captions | API cost, internet required, privacy |
| Puppeteer for posting | Violates Instagram ToS, brittle |
| PostgreSQL | Overkill for single-user, complex setup |
| React frontend | Unnecessary overhead for internal tool |

---

## 4. Dependencies

### What this system depends on:
- **Cloudinary account** — free tier, 25GB storage limit
- **Meta Developer App** — ZeitgeistAIAgent (App ID: XXXXXXXX)
- **Instagram Business Account** — @zeitgeist.in (IG User ID: XXXXXXXXX)
- **Facebook Page** — Zeitgeist.in (Page ID: XXXXXXXX)
- **Meta Business Verification** — required for full API access (pending)
- **Access Token** — expires every 60 days, must be manually refreshed

### What depends on this system's output:
- Instagram page @zeitgeist.in — all content comes from this pipeline
- Future: analytics dashboard pulls IG engagement data
- Future: SaaS customers — their accounts will run through this same pipeline

---

## 5. Challenges & Solutions

| Challenge | Solution | Status |
|-----------|----------|--------|
| Meta Business Verification required for full API | Using development mode token; applied for verification | ⏳ Pending (1–2 weeks) |
| Access token expires every 60 days | Added "Extend Token" step in setup guide | ✅ Resolved |
| Tamil RSS feeds returning empty | Replaced broken FeedBurner URLs with working BBC Tamil, Hindu TN feeds | ✅ Resolved |
| node_modules pushed to GitHub | Added `.gitignore` with node_modules, .env, generated_images | ✅ Resolved |
| Railway couldn't find Node app (wrong root dir) | Set Root Directory = `backend` in Railway settings | ✅ Resolved |
| PORT mismatch on Railway | Added `PORT=8080` environment variable | ✅ Resolved |
| History page showed empty (SQL error) | Fixed comma-separated status filter; split into two API calls | ✅ Resolved |
| Image URL invalid for Instagram (placehold.co) | Replaced with real Unsplash/Cloudinary URLs | ✅ Resolved |
| Shadowban risk from repeated hashtags | Built 5-pool rotation system per topic | ✅ Resolved |
| Caption had placeholder text, not real content | Rewrote templates to use actual headline + summary from NLP | ✅ Resolved |

### Unresolved Blockers
- **Meta Business Verification** — until approved, posting works via development mode only (current workaround: using extended user token with IG user ID directly)
- **Tamil RSS** — some sources (Dinamani, Vikatan direct) block automated requests; using proxy-friendly alternatives

---

## 6. Improvements & Optimization

### Immediate (can do now)
- [ ] Add Claude API key to `.env` for AI-generated captions instead of templates
- [ ] Add Instagram Stories auto-posting (same image, different endpoint)
- [ ] LinkedIn route — `POST /v2/ugcPosts` — same approval, two platforms
- [ ] Font upgrade — download Syne Bold and register in node-canvas for brand font

### Short-term (1–2 weeks)
- [ ] Multi-user auth (bcrypt + JWT) — required before SaaS launch
- [ ] Migrate SQLite → Postgres for multi-user
- [ ] Carousel posts — 3–5 slides per article for 3x reach
- [ ] Engagement analytics auto-sync via cron

### Long-term
- [ ] Video Reels generator using text-to-video API
- [ ] Tamil language captions (Claude API translate + localise)
- [ ] Feedback loop — posts with high saves boost that topic's priority
- [ ] White-label SaaS — ₹999/mo per client, 10 clients = ₹10k MRR

---

## 7. Time & Efficiency

### Per-operation timing
| Operation | Time |
|-----------|------|
| RSS fetch (50 sources, parallel) | 8–15 seconds |
| NLP processing per article | < 5ms (local, no API) |
| Image generation (node-canvas) | 200–400ms per image |
| Cloudinary upload | 1–3 seconds |
| Instagram API publish | 3–5 seconds (2s wait + API call) |
| Full pipeline: article → live post | ~10 seconds total |

### Bottlenecks
- **Cloudinary upload** — 1–3s, unavoidable (network call)
- **Instagram 2-second wait** — required by Meta between container create and publish
- **RSS fetch failures** — ~6 of 50 sources fail per fetch (firewall/timeout); parallel fetch means they don't block the rest

### Scheduler Efficiency
- Fetch runs every 5 minutes via node-cron
- Auto-post at 8AM / 1PM / 9PM IST
- Smart scheduler picks best-performing topic for each time slot based on past engagement

---

## 8. Documentation & References

### File Structure
```
zeitgeist-agent/
├── backend/
│   ├── server.js              — Express server, starts scheduler
│   ├── db.js                  — SQLite schema + migrations
│   ├── nlp.js                 — Local NLP pipeline (offline)
│   ├── hashtags.js            — Rotation pools + caption builder
│   ├── image-generator.js     — node-canvas 810×1080 image generation
│   ├── cloudinary-upload.js   — Cloudinary signed upload
│   ├── scheduler.js           — node-cron: fetch every 5min, post 3x/day
│   ├── generated_images/      — Local JPEG cache (gitignored)
│   └── routes/
│       ├── feed.js            — /api/feed/* (fetch, approve, reject)
│       ├── posts.js           — /api/posts/* (CRUD, stats)
│       ├── instagram.js       — /api/instagram/* (connect, post)
│       └── analytics.js       — /api/analytics/* (overview, sync, best-times)
├── frontend/
│   └── public/
│       └── index.html         — Single-page app (vanilla JS)
├── .env.example               — Template for secrets
├── .gitignore                 — Excludes node_modules, .env, db, images
└── README.md                  — This file
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/feed/fetch` | Fetch from all 50 sources |
| GET | `/api/feed/articles` | List unprocessed articles |
| POST | `/api/feed/approve/:id` | Approve → generate image → create post |
| POST | `/api/feed/reject/:id` | Reject article |
| POST | `/api/feed/clear` | Clear all articles |
| GET | `/api/posts` | List posts (filter by status) |
| PUT | `/api/posts/:id` | Update caption/hashtags/status |
| POST | `/api/instagram/connect` | Save access token + page ID |
| POST | `/api/instagram/post/:id` | Publish post to Instagram |
| GET | `/api/analytics/overview` | Dashboard stats |
| POST | `/api/analytics/sync` | Pull engagement from Instagram |

### Environment Variables
```env
PORT=30XX
CLOUDINARY_SECRET=your_cloudinary_api_secret
ANTHROPIC_API_KEY=sk-ant-...   # optional — enables AI captions
```

---

## 9. Ownership & Responsibility

### Accountable for:
- ✅ **Content pipeline integrity** — every article that reaches Instagram passed through this system
- ✅ **Image quality and brand consistency** — node-canvas output matches the design specification
- ✅ **Zero duplicate posts** — SHA-level deduplication at fetch stage
- ✅ **Token security** — access tokens stored in SQLite, never in code or GitHub
- ✅ **Uptime** — scheduler runs continuously; errors logged, never crash the server
- ✅ **Data accuracy** — NLP improvements are additive only; original title always preserved as fallback

### NOT accountable for:
- Meta Business Verification timeline (external dependency)
- Instagram API rate limits (Meta-controlled)
- RSS source availability (third-party)

---

## 10. Current System Status

| Component | Status |
|-----------|--------|
| News fetching (50 sources) | ✅ Live |
| NLP pipeline (local) | ✅ Live |
| Human review workflow | ✅ Live |
| Image generation | ✅ Live |
| Cloudinary upload | ✅ Live |
| Instagram posting | ✅ Live (dev mode) |
| Auto-scheduler | ✅ Live |
| Analytics dashboard | ✅ Live |
| Railway deployment | ✅ Live |
| GitHub repo | ✅ Public |
| Meta Business Verification | ⏳ Pending |
| Multi-user SaaS | 🔲 Planned |
| LinkedIn posting | 🔲 Planned |

---

*Built in March 2026 · zeitgeist.in*
