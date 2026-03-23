const express = require('express');
const router = express.Router();
const Parser = require('rss-parser');
const db = require('../db');

const parser = new Parser({ 
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZeitgeistBot/1.0)' }
});

const SOURCES = [
  // INDIAN
  { url: 'https://feeds.feedburner.com/ndtvnews-top-stories', name: 'NDTV', credibility: 85, topic: 'world' },
  { url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', name: 'Economic Times', credibility: 87, topic: 'finance' },
  { url: 'https://www.livemint.com/rss/markets', name: 'Mint Markets', credibility: 86, topic: 'finance' },
  { url: 'https://www.livemint.com/rss/technology', name: 'Mint Tech', credibility: 86, topic: 'tech' },
  { url: 'https://www.thehindu.com/news/national/feeder/default.rss', name: 'The Hindu', credibility: 92, topic: 'world' },
  { url: 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss', name: 'The Hindu Tech', credibility: 92, topic: 'tech' },
  { url: 'https://www.thehindu.com/business/feeder/default.rss', name: 'The Hindu Business', credibility: 92, topic: 'finance' },
  { url: 'https://indianexpress.com/feed/', name: 'Indian Express', credibility: 88, topic: 'world' },
  { url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', name: 'Times of India', credibility: 83, topic: 'world' },
  { url: 'https://www.businesstoday.in/rssfeeds/1', name: 'Business Today', credibility: 84, topic: 'finance' },
  { url: 'https://inc42.com/feed/', name: 'Inc42', credibility: 85, topic: 'tech' },
  // GLOBAL TECH
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', credibility: 88, topic: 'tech' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', credibility: 87, topic: 'tech' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica', credibility: 90, topic: 'tech' },
  { url: 'https://venturebeat.com/feed/', name: 'VentureBeat', credibility: 85, topic: 'tech' },
  // GLOBAL NEWS
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', credibility: 94, topic: 'world' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Tech', credibility: 94, topic: 'tech' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', credibility: 94, topic: 'finance' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', name: 'NYT Tech', credibility: 94, topic: 'tech' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NYT World', credibility: 94, topic: 'world' },
  // SCIENCE
  { url: 'https://www.sciencedaily.com/rss/top/science.xml', name: 'Science Daily', credibility: 89, topic: 'science' },
  { url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', name: 'BBC Science', credibility: 94, topic: 'science' },
  { url: 'https://www.thehindu.com/sci-tech/science/feeder/default.rss', name: 'The Hindu Science', credibility: 92, topic: 'science' },
  // FINANCE
  { url: 'https://feeds.feedburner.com/reuters/businessNews', name: 'Reuters Business', credibility: 95, topic: 'finance' },
  { url: 'https://feeds.feedburner.com/reuters/technologyNews', name: 'Reuters Tech', credibility: 95, topic: 'tech' },
];

const TOPIC_KEYWORDS = {
  tech: ['AI', 'tech', 'software', 'Google', 'Apple', 'Microsoft', 'startup', 'app', 'cyber', 'robot', 'machine learning', 'OpenAI', 'ChatGPT', 'Gemini', 'Meta', 'iPhone', 'Android', 'chip', 'semiconductor'],
  finance: ['market', 'stock', 'economy', 'GDP', 'RBI', 'rupee', 'inflation', 'trade', 'tariff', 'SEBI', 'sensex', 'nifty', 'investment', 'crypto', 'bitcoin', 'bank', 'interest rate', 'budget', 'tax'],
  world: ['India', 'China', 'US', 'war', 'election', 'government', 'diplomacy', 'policy', 'geopolitics', 'sanctions', 'NATO', 'UN', 'Pakistan', 'Russia', 'Ukraine', 'Modi', 'Trump', 'parliament'],
  science: ['space', 'NASA', 'ISRO', 'physics', 'climate', 'discovery', 'research', 'study', 'biology', 'quantum', 'CERN', 'telescope', 'planet', 'cancer', 'vaccine', 'DNA'],
};

function detectTopic(title, desc, sourceTopic) {
  const text = (title + ' ' + (desc || '')).toLowerCase();
  let best = { topic: sourceTopic, score: 0 };
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const score = keywords.filter(k => text.includes(k.toLowerCase())).length;
    if (score > best.score) best = { topic, score };
  }
  return best.score > 0 ? best.topic : sourceTopic;
}

function detectSentiment(text) {
  const pos = ['launch', 'growth', 'surge', 'record', 'win', 'success', 'boost', 'gain', 'rise', 'improve', 'achieve', 'breakthrough', 'leads', 'tops'];
  const neg = ['crash', 'war', 'crisis', 'fall', 'drop', 'ban', 'attack', 'death', 'collapse', 'sanction', 'lose', 'fail', 'decline', 'threat', 'risk', 'warning'];
  const t = text.toLowerCase();
  const posScore = pos.filter(w => t.includes(w)).length;
  const negScore = neg.filter(w => t.includes(w)).length;
  if (posScore > negScore) return 'positive';
  if (negScore > posScore) return 'negative';
  return 'neutral';
}

function isTrending(title) {
  const trending = ['breaking', 'just in', 'urgent', 'update', 'live', 'exclusive', 'alert', 'latest', 'announces', 'launches'];
  return trending.some(w => title.toLowerCase().includes(w)) ? 1 : 0;
}

function calcRelevance(title, desc) {
  const indiaKeywords = ['india', 'indian', 'modi', 'rbi', 'sebi', 'sensex', 'rupee', 'mumbai', 'delhi', 'bengaluru', 'startup', 'isro'];
  const text = (title + ' ' + (desc || '')).toLowerCase();
  const indiaScore = indiaKeywords.filter(k => text.includes(k)).length * 8;
  const baseScore = Math.floor(55 + Math.random() * 30);
  return Math.min(99, baseScore + indiaScore);
}

router.get('/fetch', async (req, res) => {
  const results = { fetched: 0, sources: [], errors: [] };
  
  // Clear articles older than 48 hours — keeps feed fresh
  db.prepare("DELETE FROM feed_articles WHERE fetched_at < datetime('now', '-48 hours')").run();

  const promises = SOURCES.map(async (source) => {
    try {
      const feed = await parser.parseURL(source.url);
      let count = 0;
      for (const item of (feed.items || []).slice(0, 10)) {
        const title = (item.title || '').trim();
        if (!title || title.length < 10) continue;
        const summary = (item.contentSnippet || item.summary || item.content || '').substring(0, 600);
        const topic = detectTopic(title, summary, source.topic);
        const sentiment = detectSentiment(title + ' ' + summary);
        const relevance = calcRelevance(title, summary);
        const trending = isTrending(title);
        const existing = db.prepare('SELECT id FROM feed_articles WHERE LOWER(title) = LOWER(?)').get(title);
        if (!existing) {
          db.prepare(`INSERT INTO feed_articles (title, summary, source, topic, url, relevance_score, credibility_score, sentiment, trending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(title, summary, source.name, topic, item.link || '', relevance, source.credibility, sentiment, trending);
          count++;
        }
      }
      return { name: source.name, count, credibility: source.credibility };
    } catch (err) {
      return { error: true, name: source.name, msg: err.message };
    }
  });

  const settled = await Promise.allSettled(promises);
  for (const r of settled) {
    if (r.status === 'fulfilled') {
      if (r.value && r.value.error) results.errors.push({ source: r.value.name, error: r.value.msg });
      else if (r.value) { results.fetched += r.value.count; results.sources.push(r.value); }
    }
  }
  res.json(results);
});

router.get('/articles', (req, res) => {
  const { topic, limit = 50 } = req.query;
  let query = 'SELECT * FROM feed_articles';
  const params = [];
  const conditions = ['processed = 0'];
  if (topic && topic !== 'all') { conditions.push('topic = ?'); params.push(topic); }
  query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY trending DESC, relevance_score DESC, credibility_score DESC, fetched_at DESC LIMIT ?';
  params.push(parseInt(limit));
  res.json(db.prepare(query).all(...params));
});

router.post('/generate/:articleId', async (req, res) => {
  const article = db.prepare('SELECT * FROM feed_articles WHERE id = ?').get(req.params.articleId);
  if (!article) return res.status(404).json({ error: 'Article not found' });

  const captions = {
    tech: `Here's something that's changing the game 🤖\n\n${article.title}\n\n→ What this actually means\n→ The bigger picture\n→ What it means for India's tech ecosystem\n\nFollow @zeitgeist.in for daily tech insights.\n\nSource: ${article.source}`,
    finance: `Your money. Your future. Stay informed 📊\n\n${article.title}\n\n→ How this affects Indian markets\n→ What investors should know right now\n→ Expert read on what comes next\n\nSave this. Share with someone who needs to know.\n\nSource: ${article.source}`,
    world: `This is the story you need to know today 🌍\n\n${article.title}\n\n→ What happened\n→ Why India needs to pay attention\n→ What happens next\n\nFollow @zeitgeist.in — Bite-sized knowledge daily.\n\nSource: ${article.source}`,
    science: `Science just did something remarkable 🔬\n\n${article.title}\n\n→ What was discovered\n→ Why this changes things\n→ What researchers say comes next\n\nShare with a curious mind 👇\n\nSource: ${article.source}`,
  };

  const topicHashtags = {
    tech: '#TechNews #AINews #TechIndia #Innovation #FutureOfTech #Technology #Zeitgeist #IndianStartups',
    finance: '#Finance #IndiaMarkets #Investment #Economy #MoneyTips #StockMarket #Zeitgeist #BusinessNews',
    world: '#WorldNews #India #GeoPolitics #GlobalNews #CurrentAffairs #News #Zeitgeist #IndiaNews',
    science: '#Science #Discovery #SpaceNews #Research #Physics #ScienceNews #Zeitgeist #ISRO',
  };

  const bestTimes = { tech: '9:00 PM IST', finance: '8:00 AM IST', world: '1:00 PM IST', science: '9:00 PM IST' };
  const caption = captions[article.topic] || captions.world;
  const hashtags = topicHashtags[article.topic] || topicHashtags.world;

  const result = db.prepare(`INSERT INTO posts (topic, headline, caption, hashtags, best_time, location, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(article.topic, article.title, caption, hashtags, bestTimes[article.topic] || '9:00 PM IST', 'India', null);
  db.prepare('UPDATE feed_articles SET processed = 1 WHERE id = ?').run(article.id);
  db.prepare('INSERT INTO post_history (post_id, action, note) VALUES (?,?,?)').run(result.lastInsertRowid, 'generated', `Generated from ${article.source}`);
  res.json(db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid));
});

module.exports = router;
