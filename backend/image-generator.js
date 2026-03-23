const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const THEMES = {
  tech:    { bg: '#05050e', accent: '#7c6cfa', pillBg: '#1a1240', pillText: '#b0a0ff', label: 'TECH / AI' },
  finance: { bg: '#0c0800', accent: '#f0b840', pillBg: '#201000', pillText: '#f0c060', label: 'FINANCE' },
  world:   { bg: '#000b16', accent: '#40d0f0', pillBg: '#001828', pillText: '#60d8f8', label: 'WORLD' },
  science: { bg: '#030010', accent: '#52d68a', pillBg: '#0a2018', pillText: '#70f0b0', label: 'SCIENCE' },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '', lines = [];
  for (const w of words) {
    const t = line + w + ' ';
    if (ctx.measureText(t).width > maxW && line) { lines.push(line.trim()); line = w + ' '; }
    else line = t;
  }
  if (line.trim()) lines.push(line.trim());
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return lines.length;
}

async function generatePostImage(post) {
  const topic = post.topic || 'world';
  const theme = THEMES[topic] || THEMES.world;
  const S = 1080;
  const canvas = createCanvas(S, S);
  const ctx = canvas.getContext('2d');

  const dateStr = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  const PAD = 60;

  // ── BACKGROUND
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, S, S);

  // Subtle dot grid
  ctx.fillStyle = 'rgba(255,255,255,0.018)';
  for (let gx = 54; gx < S; gx += 54)
    for (let gy = 54; gy < S; gy += 54) {
      ctx.beginPath(); ctx.arc(gx, gy, 1.5, 0, Math.PI*2); ctx.fill();
    }

  // ── LEFT ACCENT STRIPE
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, 5, S);

  // ── TOP ROW: @zeitgeist.in left + Category pill right
  // brand handle top left
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.font = '400 26px monospace';
  ctx.fillText('@zeitgeist.in', PAD, 72);

  // category pill top right
  ctx.font = '700 24px monospace';
  const lbl = theme.label;
  const pillW = ctx.measureText(lbl).width + 52;
  const pillX = S - pillW - PAD;
  ctx.fillStyle = theme.pillBg;
  roundRect(ctx, pillX, 40, pillW, 46, 23); ctx.fill();
  ctx.fillStyle = theme.pillText;
  ctx.textAlign = 'center';
  ctx.fillText(lbl, pillX + pillW/2, 70);
  ctx.textAlign = 'left';

  // ── ROW 2: Date pill + Type pill (below top row)
  const row2Y = 118;

  // Date pill
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  roundRect(ctx, PAD, row2Y, 220, 40, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '400 21px monospace';
  ctx.fillText(dateStr, PAD + 14, row2Y + 26);

  // Dot separator
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '700 24px monospace';
  ctx.fillText('·', PAD + 238, row2Y + 26);

  // Type pill
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  roundRect(ctx, PAD + 262, row2Y, 160, 40, 8); ctx.fill();
  ctx.fillStyle = theme.accent;
  ctx.font = '600 21px monospace';
  ctx.fillText('Analysis', PAD + 276, row2Y + 26);

  // ── ROW 3: BIG TITLE BOX (takes most of the space)
  const titleY = 200;
  const titleW = S - PAD * 2;

  // Measure title to set box height
  ctx.font = 'bold 64px Arial';
  const title = post.headline || '';
  let tLine = '', tLines = [];
  for (const w of title.split(' ')) {
    const t = tLine + w + ' ';
    if (ctx.measureText(t).width > titleW - 40 && tLine) {
      tLines.push(tLine.trim()); tLine = w + ' ';
    } else tLine = t;
  }
  if (tLine.trim()) tLines.push(tLine.trim());

  const lineH = 76;
  const titleBoxH = tLines.length * lineH + 60;

  // Draw title border box
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  roundRect(ctx, PAD, titleY, titleW, titleBoxH, 12);
  ctx.stroke();

  // Subtle fill inside title box
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  roundRect(ctx, PAD, titleY, titleW, titleBoxH, 12);
  ctx.fill();

  // Draw title text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px Arial';
  tLines.forEach((l, i) => ctx.fillText(l, PAD + 22, titleY + 58 + i * lineH));

  // ── BOTTOM RIGHT: @zeitgeist.in pill only
  const brPillW = 220;
  const brPillX = S - brPillW - PAD;
  const brPillY = S - 80;

  ctx.fillStyle = theme.pillBg;
  roundRect(ctx, brPillX, brPillY, brPillW, 40, 8); ctx.fill();
  ctx.fillStyle = theme.accent;
  ctx.font = '700 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('@zeitgeist.in', brPillX + brPillW/2, brPillY + 26);
  ctx.textAlign = 'left';

  // ── SAVE
  const dir = path.join(__dirname, 'generated_images');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `post_${post.id || Date.now()}.jpg`);
  fs.writeFileSync(file, canvas.toBuffer('image/jpeg', { quality: 0.93 }));
  console.log('Image saved:', file);
  return file;
}

module.exports = { generatePostImage };
