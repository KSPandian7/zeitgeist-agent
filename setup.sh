#!/bin/bash
echo ""
echo "================================================"
echo "  Zeitgeist AI Agent — Setup"
echo "================================================"
echo ""

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 16 ]; then
  echo "❌ Node.js v16+ required. Current: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) found"
echo ""
echo "📦 Installing dependencies..."
cd backend && npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "================================================"
echo "  To start the app:"
echo "  cd backend && npm start"
echo "  Then open: http://localhost:3001"
echo "================================================"
echo ""
