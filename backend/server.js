require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const instagramRoutes = require('./routes/instagram');
const postsRoutes = require('./routes/posts');
const feedRoutes = require('./routes/feed');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

// API Routes
app.use('/api/instagram', instagramRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/feed', feedRoutes);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Zeitgeist Agent running at http://localhost:${PORT}\n`);
});
