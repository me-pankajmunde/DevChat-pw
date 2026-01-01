# DevChat Local

A developer-focused Progressive Web App for chatting with local and custom OpenAI API endpoints.

## Features

- � **OAuth Authentication** - Sign in with GitHub or Google
- 🔌 **Custom API Endpoints** - Connect to any OpenAI-compatible API (local or remote)
- 💬 **Multi-Session Chat** - Organize conversations with folders, tags, and search
- 🖼️ **Image Attachments** - Send images to vision-capable models
- 🎨 **Markdown & Code** - Syntax highlighting with 100+ languages supported
- 🌈 **Customizable Themes** - Multiple color schemes and chat wallpapers
- 📱 **Progressive Web App** - Install and use offline
- 🗂️ **Session Management** - Create, rename, organize, and search chat sessions
- 🏷️ **Tags & Folders** - Organize chats with color-coded folders and tags
- ⚡ **Streaming Responses** - Real-time token streaming for fast feedback
- 💾 **Robust Data Persistence** - Auto-save, backups, export/import, and data health monitoring
- 🔄 **Auto-Backup** - Automatic backups every 30 minutes with version control
- ☁️ **Supabase Cloud Sync** - Backup and restore data to your Supabase database
- 📊 **Storage Analytics** - Monitor data usage and session statistics
- 🛠️ **Data Management** - Import/export, cleanup old sessions, repair corrupted data
- 🔀 **Model Comparison** - Compare responses from multiple models side-by-side

## Getting Started

### 1. Authentication Setup

DevChat Local uses OAuth for secure authentication:

- **GitHub Login** - Sign in with your GitHub account
- **Google Login** - Sign in with your Google account

**Quick Setup:**
1. Copy `.env.example` to `.env`
2. Add your Supabase URL and anon key
3. Configure OAuth providers in Supabase Dashboard
4. Start the app and sign in!

**📖 Detailed Instructions**: See [OAUTH_SETUP.md](OAUTH_SETUP.md) for complete OAuth setup guide

### 2. Environment Setup (Required for Authentication & Sync)

**⚠️ IMPORTANT**: To enable authentication and cloud sync, configure your Supabase credentials!

Your Supabase URL is already configured: `https://cgwmhcmioxxteajbtsdd.supabase.co`

**Quick Setup (2 minutes):**

1. Get your anon key from: https://supabase.com/dashboard/project/cgwmhcmioxxteajbtsdd/settings/api
2. Copy `.env.example` to `.env` in the project root
3. Replace the placeholder with your actual anon key
4. Configure OAuth providers (see [OAUTH_SETUP.md](OAUTH_SETUP.md))
5. Save and restart the application

**📖 Setup Guides**:
- [OAUTH_SETUP.md](OAUTH_SETUP.md) - OAuth authentication setup
- [QUICK_SETUP.md](QUICK_SETUP.md) - Quick start guide
- [backend/README.md](backend/README.md) - Optional FastAPI backend (advanced)

### 3. API Configuration

1. Sign in to the app
2. Click the settings icon
3. Configure your API endpoint (e.g., `http://127.0.0.1:5001/v1`)
4. Enter your API key
5. Select a model from the dropdown
6. Start chatting!

## Data Management

DevChat Local includes comprehensive data persistence and backup features:

- **Auto-Save**: All changes are automatically saved in real-time
- **Auto-Backup**: Automatic backups every 30 minutes (keeps last 5)
- **Supabase Cloud Sync**: Backup to Supabase database with auto-sync
- **Manual Backups**: Create snapshots anytime via Data Management dialog
- **Export/Import**: Download/upload complete data as JSON files
- **Storage Stats**: Monitor sessions, messages, and storage usage
- **Data Cleanup**: Delete old sessions or clear all data
- **Data Repair**: Automatic validation and repair of corrupted data

Access local data management via the HardDrives icon (💾) in the header.
Access Supabase Cloud Sync via the Database icon (🗄️) in the header.

For detailed documentation:
- [OAUTH_SETUP.md](OAUTH_SETUP.md) - OAuth authentication setup
- [ENV_SETUP.md](ENV_SETUP.md) - Environment variables configuration
- [PERSISTENCE.md](PERSISTENCE.md) - Local data persistence
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Supabase Cloud Sync guide
- [backend/README.md](backend/README.md) - Optional FastAPI backend

## API Configuration

DevChat Local works with any OpenAI-compatible API endpoint:

```bash
# Example: Local API
Endpoint: http://127.0.0.1:5001/v1
Key: YOUR_TOKEN
Model: gpt-4o (or any model from /v1/models)
```

## Built With

- React + TypeScript
- Tailwind CSS + shadcn/ui
- Vite
- Phosphor Icons
- React Markdown + Syntax Highlighter

## License

MIT License - See LICENSE file for details
