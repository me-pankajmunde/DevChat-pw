# DevChat Local

A developer-focused Progressive Web App for chatting with local and custom OpenAI API endpoints.

## Features

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
- 📊 **Storage Analytics** - Monitor data usage and session statistics
- 🛠️ **Data Management** - Import/export, cleanup old sessions, repair corrupted data

## Getting Started

1. Open the app and click the settings icon
2. Configure your API endpoint (e.g., `http://127.0.0.1:5001/v1`)
3. Enter your API key
4. Select a model from the dropdown
5. Start chatting!

## Data Management

DevChat Local includes comprehensive data persistence and backup features:

- **Auto-Save**: All changes are automatically saved in real-time
- **Auto-Backup**: Automatic backups every 30 minutes (keeps last 5)
- **Manual Backups**: Create snapshots anytime via Data Management dialog
- **Export/Import**: Download/upload complete data as JSON files
- **Storage Stats**: Monitor sessions, messages, and storage usage
- **Data Cleanup**: Delete old sessions or clear all data
- **Data Repair**: Automatic validation and repair of corrupted data

Access these features via the Database icon (💾) in the header.

For detailed documentation, see [PERSISTENCE.md](PERSISTENCE.md).

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
