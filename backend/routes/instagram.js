const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');

const FB_API = 'https://graph.facebook.com/v19.0';
const IG_USER_ID = '17841477315026803';

const TOPIC_IMAGES = {
  tech:    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&h=1080&fit=crop',
  finance: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&h=1080&fit=crop',
  world:   'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1080&h=1080&fit=crop',
  science: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1080&h=1080&fit=crop',
};

let generatePostImage, uploadImage;
try { generatePostImage = require('../image-generator').generatePostImage; } catch(e) {}
try { uploadImage = require('../cloudinary-upload').uploadImage; } catch(e) {}

router.get('/status', (req, res) => {
  const s = db.prepare('SELECT * FROM instagram_session WHERE id=1').get();
  res.json(s ? { connected:true, username:s.username, user_id:s.user_id } : { connected:false });
});

router.post('/connect', async (req, res) => {
  const { access_token, page_id } = req.body;
  if (!access_token) return res.status(400).json({ error:'Access token required' });
  try {
    await axios.get(`${FB_API}/me`, { params:{ fields:'id,name', access_token } });
    db.prepare('INSERT OR REPLACE INTO instagram_session (id,access_token,user_id,username,page_id) VALUES (1,?,?,?,?)')
      .run(access_token, IG_USER_ID, 'zeitgeist.in', page_id||'1022392770959905');
    res.json({ success:true, username:'zeitgeist.in', user_id:IG_USER_ID, note:'Connected!' });
  } catch(err) {
    res.status(400).json({ error: err.response?.data?.error?.message||'Failed' });
  }
});

router.post('/disconnect', (req, res) => {
  db.prepare('DELETE FROM instagram_session WHERE id=1').run();
  res.json({ success:true });
});

router.post('/post/:id', async (req, res) => {
  const session = db.prepare('SELECT * FROM instagram_session WHERE id=1').get();
  if (!session) return res.status(401).json({ error:'Not connected' });
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error:'Post not found' });

  try {
    const caption = post.caption + '\n\n' + post.hashtags;
    const token = session.access_token;
    let imageUrl = post.image_url;

    // Step 1: Generate branded image
    if (!imageUrl && generatePostImage) {
      try {
        const imgPath = await generatePostImage(post);
        // Step 2: Upload to Cloudinary
        if (uploadImage) {
          const uploaded = await uploadImage(imgPath);
          if (uploaded) imageUrl = uploaded;
        }
      } catch(e) { console.error('Image gen failed:', e.message); }
    }

    // Fallback to topic image
    imageUrl = imageUrl || TOPIC_IMAGES[post.topic] || TOPIC_IMAGES.world;
    console.log('Posting image:', imageUrl);

    // Step 3: Create IG media container
    const container = await axios.post(`${FB_API}/${IG_USER_ID}/media`, null, {
      params: { image_url: imageUrl, caption, access_token: token }
    });

    await new Promise(r => setTimeout(r, 2000));

    // Step 4: Publish
    const publish = await axios.post(`${FB_API}/${IG_USER_ID}/media_publish`, null, {
      params: { creation_id: container.data.id, access_token: token }
    });

    const igPostId = publish.data.id;
    db.prepare("UPDATE posts SET status='posted', posted_at=CURRENT_TIMESTAMP, instagram_post_id=? WHERE id=?").run(igPostId, req.params.id);
    db.prepare('INSERT INTO post_history (post_id,action,note) VALUES (?,?,?)').run(req.params.id, 'posted', `IG: ${igPostId}`);
    res.json({ success:true, instagram_post_id: igPostId });
  } catch(err) {
    const msg = err.response?.data?.error?.message || err.message;
    db.prepare('INSERT INTO post_history (post_id,action,note) VALUES (?,?,?)').run(req.params.id, 'failed', msg);
    res.status(400).json({ error: msg });
  }
});

router.get('/pages', async (req, res) => {
  const { access_token } = req.query;
  try {
    const r = await axios.get(`${FB_API}/me/accounts`, { params:{ access_token } });
    res.json(r.data);
  } catch(err) {
    res.status(400).json({ error: err.response?.data?.error?.message||'Failed' });
  }
});

module.exports = router;
