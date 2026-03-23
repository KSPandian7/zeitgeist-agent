const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'zeitgeist.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS instagram_session (
    id INTEGER PRIMARY KEY,
    access_token TEXT,
    user_id TEXT,
    username TEXT,
    page_id TEXT,
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT,
    headline TEXT,
    caption TEXT,
    hashtags TEXT,
    image_url TEXT,
    best_time TEXT,
    location TEXT,
    status TEXT DEFAULT 'pending',
    scheduled_at TEXT,
    posted_at DATETIME,
    instagram_post_id TEXT,
    engagement_likes INTEGER DEFAULT 0,
    engagement_comments INTEGER DEFAULT 0,
    engagement_reach INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feed_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    summary TEXT,
    source TEXT,
    topic TEXT,
    url TEXT,
    relevance_score INTEGER,
    credibility_score INTEGER,
    sentiment TEXT,
    trending INTEGER DEFAULT 0,
    processed INTEGER DEFAULT 0,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS post_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    action TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES posts(id)
  );
`);

module.exports = db;
