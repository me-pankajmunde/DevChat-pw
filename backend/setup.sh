#!/bin/bash

# Quick start script for FastAPI backend
# This script helps you quickly test the backend setup

echo "🚀 DevChat Local - FastAPI Backend Setup"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Check if we're in the backend directory
if [ ! -f "main.py" ]; then
    echo "📁 Changing to backend directory..."
    cd backend || { echo "❌ Backend directory not found"; exit 1; }
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate || { echo "❌ Failed to activate virtual environment"; exit 1; }

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env from example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env with your OAuth credentials!"
    echo "   - Get GitHub OAuth App: https://github.com/settings/developers"
    echo "   - Get Google OAuth App: https://console.cloud.google.com/apis/credentials"
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  cd backend"
echo "  source venv/bin/activate  # On Windows: venv\\Scripts\\activate"
echo "  python main.py"
echo ""
echo "Or simply run: python main.py"
echo ""
echo "Server will be available at: http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo ""
echo "📖 For detailed instructions, see backend/README.md"
