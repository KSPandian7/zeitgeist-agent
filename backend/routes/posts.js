const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all posts with optional status filter
router.get('/', (req, res) => {
  const { status, topic } = req.query;
  let query = 'SELECT * FROM posts';
  const params = [];
  const conditions = [];
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (topic) { conditions.push('topic = ?'); params.push(topic); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// GET single post
router.get('/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const history = db.prepare('SELECT * FROM post_history WHERE post_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ ...post, history });
});

// POST create post
router.post('/', (req, res) => {
  const { topic, headline, caption, hashtags, image_url, best_time, location, scheduled_at } = req.body;
  const result = db.prepare(`
    INSERT INTO posts (topic, headline, caption, hashtags, image_url, best_time, location, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(topic, headline, caption, hashtags, image_url || null, best_time, location || 'India', scheduled_at || null);
  
  db.prepare('INSERT INTO post_history (post_id, action, note) VALUES (?, ?, ?)').run(result.lastInsertRowid, 'created', 'Post created by AI agent');
  res.json({ id: result.lastInsertRowid, success: true });
});

// PUT update post
router.put('/:id', (req, res) => {
  const { caption, hashtags, scheduled_at, status, image_url } = req.body;
  db.prepare(`
    UPDATE posts SET caption = COALESCE(?, caption), hashtags = COALESCE(?, hashtags),
    scheduled_at = COALESCE(?, scheduled_at), status = COALESCE(?, status),
    image_url = COALESCE(?, image_url)
    WHERE id = ?
  `).run(caption, hashtags, scheduled_at, status, image_url, req.params.id);
  
  if (status) {
    db.prepare('INSERT INTO post_history (post_id, action, note) VALUES (?, ?, ?)').run(req.params.id, status, `Status changed to ${status}`);
  }
  res.json({ success: true });
});

// DELETE post
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET post history
router.get('/:id/history', (req, res) => {
  const history = db.prepare('SELECT * FROM post_history WHERE post_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(history);
});

// POST seed demo posts
router.post('/seed/demo', (req, res) => {
  const demoPosts = [
    {
      topic: 'finance', headline: "Trump's tariff war shakes global markets",
      caption: "Is your portfolio ready for what's coming? 📉\n\nTrump's sweeping new tariffs are rattling markets from Wall Street to Dalal Street.\n\n→ Which Indian sectors get hit hardest\n→ What RBI might do next\n→ How to protect your investments\n\nSave this — things are moving fast.\n\n@zeitgeist.in",
      hashtags: '#TariffWar #IndiaMarkets #Sensex #Finance #TradeWar #InvestSmart #EconomyNews #StockMarket',
      best_time: '8:00 AM IST', location: 'India / Mumbai', scheduled_at: '2026-03-21T08:00:00'
    },
    {
      topic: 'tech', headline: "Gemini 2.5 just dethroned GPT-4 on reasoning",
      caption: "Is this the AI inflection point? 🤖\n\nGoogle just dropped Gemini 2.5 — and the benchmarks are wild.\n\n→ What changed under the hood\n→ What this means for Indian developers\n→ Should you switch from ChatGPT?\n\nFollow @zeitgeist.in for daily tech breakdowns.",
      hashtags: '#GoogleGemini #AINews #TechIndia #LLM #FutureOfTech #GeminiAI #ArtificialIntelligence',
      best_time: '9:00 PM IST', location: 'India / Bengaluru', scheduled_at: '2026-03-21T21:00:00'
    },
    {
      topic: 'world', headline: "India & Canada resume trade talks after 2-year freeze",
      caption: "Two years of silence — now they're talking again. 🤝\n\nIndia and Canada are officially back at the negotiating table.\n\n→ What caused the breakdown\n→ What's at stake for Indian students\n→ Why AI & energy ties matter here\n\nFollow @zeitgeist.in for daily insights.",
      hashtags: '#IndiaCanada #TradeRelations #Diplomacy #WorldNews #IndiaNews #GeoPolitics',
      best_time: '1:00 PM IST', location: 'India / Delhi', scheduled_at: '2026-03-22T13:00:00'
    },
    {
      topic: 'science', headline: "5 physics discoveries that shook 2025",
      caption: "Science just had its biggest year in decades. 🔬\n\n5 physics discoveries that will change how we see the universe:\n\n→ Dark matter: a signal finally detected\n→ Quantum entanglement at record scale\n→ New element confirmed by CERN\n\nSave & share with someone who loves science.",
      hashtags: '#ScienceNews #Physics #CERN #QuantumPhysics #DarkMatter #Science2025 #Zeitgeist',
      best_time: '9:00 PM IST', location: 'Global', scheduled_at: '2026-03-23T21:00:00'
    }
  ];

  for (const p of demoPosts) {
    const r = db.prepare(`INSERT INTO posts (topic, headline, caption, hashtags, best_time, location, scheduled_at) VALUES (?,?,?,?,?,?,?)`).run(p.topic, p.headline, p.caption, p.hashtags, p.best_time, p.location, p.scheduled_at);
    db.prepare('INSERT INTO post_history (post_id, action, note) VALUES (?,?,?)').run(r.lastInsertRowid, 'created', 'Demo seed post');
  }
  res.json({ success: true, count: demoPosts.length });
});

// GET stats
router.get('/stats/overview', (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as c FROM posts").get().c;
  const pending = db.prepare("SELECT COUNT(*) as c FROM posts WHERE status='pending'").get().c;
  const scheduled = db.prepare("SELECT COUNT(*) as c FROM posts WHERE status='scheduled'").get().c;
  const posted = db.prepare("SELECT COUNT(*) as c FROM posts WHERE status='posted'").get().c;
  const rejected = db.prepare("SELECT COUNT(*) as c FROM posts WHERE status='rejected'").get().c;
  res.json({ total, pending, scheduled, posted, rejected });
});

module.exports = router;
