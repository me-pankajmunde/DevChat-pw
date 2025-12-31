# Data Persistence Strategy

## Overview

DevChat Local implements a robust, multi-layered data persistence strategy using the Spark runtime's `useKV` hook and direct KV API. All chat data, settings, and session information are automatically saved and persisted between sessions.

## Persistence Architecture

### Core Storage Keys

The application uses the following storage keys:

1. **`chat-sessions`** - Array of all chat sessions with messages
2. **`session-folders`** - Array of folder configurations for organizing sessions
3. **`chat-settings`** - User settings including API configuration, theme, and preferences
4. **`current-session-id`** - Currently active session ID
5. **`backup-{timestamp}`** - Automatic and manual backups (up to 5 kept)

### Data Models

```typescript
ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model?: string
  folderId?: string
  tags?: string[]
}

SessionFolder {
  id: string
  name: string
  color?: string
  createdAt: number
}

ChatSettings {
  apiEndpoint: string
  apiKey: string
  model: string
  theme?: string
  messageDensity?: MessageDensity
  wallpaper?: Wallpaper
  customWallpaperUrl?: string
  wallpaperOpacity?: number
  wallpaperBlur?: number
}
```

## Features

### 1. Real-Time Auto-Save

- All changes are immediately persisted using React's `useKV` hook
- Sessions, folders, and settings update automatically on every change
- No manual save required - everything is always saved

### 2. Automatic Backups

- Backups created automatically every 30 minutes (if 5+ changes detected)
- Maximum of 5 backups kept automatically
- Older backups auto-deleted to save space
- Configurable via `useAutoBackup` hook

### 3. Manual Backup System

Users can manually create, restore, and manage backups through the Data Management dialog:

- **Create Backup** - Snapshot current state
- **Restore Backup** - Replace current data with a backup
- **Delete Backup** - Remove specific backups
- **View Backups** - See all backups with timestamps

### 4. Export/Import

Full data portability:

- **Export All Data** - Download complete backup as JSON file
- **Import Data** - Restore from JSON file
- Compatible with external backup systems
- Version-tagged for future compatibility

### 5. Storage Statistics

Real-time monitoring of:

- Total sessions count
- Total messages count
- Total folders count
- Estimated storage size
- Oldest and newest session dates

### 6. Data Cleanup

Tools for managing storage:

- **Delete Old Sessions** - Remove sessions older than X days
- **Clear All Data** - Nuclear option with multiple confirmations
- **Repair Data** - Validate and fix corrupted data

### 7. Data Health & Repair

Automatic validation and repair system:

- Validates session structure
- Validates folder structure
- Repairs missing timestamps
- Removes invalid entries
- Reports repairs made

## Usage

### In Components (Reactive State)

```typescript
import { useKV } from '@github/spark/hooks'

const [sessions, setSessions] = useKV<ChatSession[]>('chat-sessions', [])

// CRITICAL: Always use functional updates to avoid stale data
setSessions(currentSessions => [...currentSessions, newSession])
```

### Direct API Access

```typescript
// Get data
const sessions = await window.spark.kv.get<ChatSession[]>('chat-sessions')

// Set data
await window.spark.kv.set('chat-sessions', updatedSessions)

// Delete data
await window.spark.kv.delete('chat-sessions')

// List all keys
const keys = await window.spark.kv.keys()
```

### Auto-Backup Hook

```typescript
import { useAutoBackup } from '@/hooks/use-auto-backup'

// In your component
useAutoBackup(sessions, folders, settings, true)
```

### Data Management Dialog

```typescript
import { DataManagementDialog } from '@/components/DataManagementDialog'

<DataManagementDialog
  sessions={sessions}
  folders={folders}
  settings={settings}
  onDataUpdate={handleDataUpdate}
/>
```

## Best Practices

### 1. Always Use Functional Updates

```typescript
// ❌ WRONG - Uses stale closure value
setSessions([...sessions, newSession])

// ✅ CORRECT - Gets current value
setSessions(current => [...current, newSession])
```

### 2. Handle Null/Undefined

```typescript
const [sessions = [], setSessions] = useKV<ChatSession[]>('chat-sessions', [])
```

### 3. Validate Before Persisting

```typescript
import { validateSession } from '@/lib/persistence'

if (validateSession(session)) {
  setSessions(current => [...current, session])
}
```

### 4. Regular Backups

- Enable auto-backup for critical applications
- Encourage users to export data periodically
- Provide clear backup/restore UI

### 5. Error Handling

```typescript
try {
  await window.spark.kv.set('key', data)
} catch (error) {
  toast.error('Failed to save data')
  console.error(error)
}
```

## Data Migration

### Version 1.0.0 Format

```json
{
  "version": "1.0.0",
  "timestamp": 1234567890,
  "sessions": [...],
  "folders": [...],
  "settings": {...}
}
```

Future versions will maintain backward compatibility through version checking.

## Storage Limits

The Spark KV store has generous limits, but consider:

- Large attachments increase storage usage
- Regular cleanup of old sessions recommended
- Monitor storage stats via Data Management dialog
- Export important conversations for archival

## Security Considerations

- API keys stored in encrypted KV store
- No data leaves the browser except during export
- Manual exports contain sensitive data - handle securely
- Backups include API keys - protect backup files

## Troubleshooting

### Data Not Persisting

1. Check browser console for errors
2. Verify KV store is available: `window.spark.kv`
3. Use Data Health check to repair corruption

### Lost Data

1. Check automatic backups in Data Management
2. Look for exported JSON files
3. Contact support if data is critical

### Corrupted Data

1. Open Data Management dialog
2. Go to Overview tab
3. Click "Scan & Repair Data"
4. Review repair report

## API Reference

See `/src/lib/persistence.ts` for complete API documentation:

- `createBackup()`
- `listBackups()`
- `restoreBackup()`
- `deleteBackup()`
- `getStorageStats()`
- `cleanupOldSessions()`
- `exportAllData()`
- `importAllData()`
- `clearAllData()`
- `repairData()`
- `validateSession()`
- `validateFolder()`

## Future Enhancements

Planned improvements:

1. ✅ **Cloud sync integration** - GitHub cloud sync implemented with automatic backups
2. Selective backup/restore
3. Compression for large datasets
4. Automated cleanup scheduling
5. Data analytics and insights

## GitHub Cloud Sync

### Overview

DevChat Local now includes GitHub cloud sync for backing up your chat data to a private GitHub repository. This provides:

- **Automatic backups** at regular intervals
- **Manual sync** on demand
- **Conflict resolution** when syncing across devices
- **Private repository** storage (only you can access)

### Setup

1. Click the GitHub icon in the header
2. Ensure you're signed in to GitHub
3. The app will create a private repository called "devchat-backup"
4. Click "Sync to GitHub" to perform your first backup

### Features

#### Manual Sync

- **Backup to GitHub** - Upload current data to your private repository
- **Restore from GitHub** - Download and restore data from backup
- **Conflict Resolution** - Choose how to handle conflicts:
  - **Merge** - Combine local and remote data (recommended)
  - **Remote** - Replace local data with GitHub backup
  - **Local** - Keep current data, ignore remote

#### Auto-Sync

Enable automatic syncing in the Settings tab:

- Set sync interval (15 minutes to 6 hours)
- Automatic conflict detection
- Silent background sync
- Toast notifications on completion

#### Sync Status

View sync information:

- Last sync timestamp
- Sync success/failure status
- GitHub account connection
- Conflict warnings

### API

```typescript
import { 
  uploadToGitHub,
  downloadFromGitHub,
  enableAutoSync,
  getSyncStatus 
} from '@/lib/github-sync'

// Manual upload
await uploadToGitHub(sessions, folders, settings)

// Manual download
const remoteData = await downloadFromGitHub()

// Enable auto-sync (30 minute interval)
await enableAutoSync(30)

// Check sync status
const status = await getSyncStatus()
```

### Hook

Use the auto-sync hook in your components:

```typescript
import { useGitHubAutoSync } from '@/hooks/use-github-sync'

useGitHubAutoSync(sessions, folders, settings, true)
```

### Security

- Backups stored in private GitHub repository
- Only accessible by repository owner
- GitHub authentication required
- API keys included in backups (secure repository access)
- Repository name: `devchat-backup`

### Troubleshooting

#### Sync fails with authentication error
- Verify you're signed in to GitHub
- Check GitHub access permissions

#### Conflict detected warning
- Choose appropriate resolution strategy
- Merge strategy recommended for most cases

#### Repository not created
- Check GitHub repository creation permissions
- Verify private repository quota
