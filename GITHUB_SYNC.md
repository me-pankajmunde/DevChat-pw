# GitHub Cloud Sync - User Guide

## Overview

DevChat Local now includes GitHub Cloud Sync - a powerful feature that backs up your chat data to a private GitHub repository. This provides peace of mind with automatic backups and enables seamless synchronization across multiple devices.

## Features

### 🔄 Automatic Backups
- Set intervals from 15 minutes to 6 hours
- Silent background sync
- Smart change detection
- Toast notifications on completion

### 📤 Manual Sync
- One-click backup to GitHub
- Instant data upload
- Conflict detection and warnings
- Success/failure feedback

### 📥 Restore from Cloud
- Download backups from GitHub
- Multiple conflict resolution strategies
- Merge local and remote data intelligently
- Preview before restoring

### 🔒 Privacy & Security
- Private repository storage
- Only you can access your data
- Automatic repository creation
- Encrypted GitHub authentication

## Getting Started

### 1. Initial Setup

1. **Open GitHub Sync Dialog**
   - Click the GitHub icon (🐙) in the app header
   - The dialog will open with two tabs: Sync and Settings

2. **Authenticate with GitHub**
   - Ensure you're signed in to your GitHub account
   - The app uses GitHub Spark authentication
   - Your username and avatar will appear once authenticated

3. **First Backup**
   - Click "Sync to GitHub" button
   - The app automatically creates a private repository called `devchat-backup`
   - Your data uploads to the repository
   - Wait for success confirmation

### 2. Enable Auto-Sync (Recommended)

1. **Navigate to Settings Tab**
   - Click the "Settings" tab in the GitHub Sync dialog

2. **Enable Auto-Sync**
   - Toggle the "Auto-Sync" switch ON
   - Choose your preferred sync interval:
     - Every 15 minutes (frequent backups)
     - Every 30 minutes (recommended)
     - Every hour
     - Every 2 hours
     - Every 6 hours (minimal backups)

3. **Confirm**
   - Auto-sync will now run in the background
   - You'll see toast notifications when syncs complete
   - No manual action required

## Using GitHub Sync

### Manual Backup

**When to use**: Before major changes, when switching devices, or for peace of mind

**How to do it**:
1. Click GitHub icon in header
2. Click "Sync to GitHub" button
3. Wait for confirmation
4. Done! Your data is backed up

### Restore from Backup

**When to use**: New device setup, data loss recovery, or syncing changes from another device

**How to do it**:
1. Click GitHub icon in header
2. Choose conflict resolution strategy:
   - **Merge** (recommended) - Combines local and remote data
   - **Remote** - Replaces local data with GitHub backup
   - **Local** - Keeps current data, ignores remote
3. Click "Restore from GitHub" button
4. Wait for download and merge
5. Your data is updated!

### Conflict Resolution Strategies

#### Merge Strategy (Recommended)
- **What it does**: Intelligently combines local and remote data
- **Sessions**: Keeps the newest version of each session
- **Folders**: Combines all folders from both sources
- **Settings**: Uses local settings (you can manually sync after)
- **Best for**: Regular syncing between devices

#### Remote Strategy
- **What it does**: Replaces all local data with GitHub backup
- **Warning**: All local changes will be lost
- **Best for**: Setting up a new device, recovering from corruption

#### Local Strategy
- **What it does**: Keeps your current data, ignores remote
- **Best for**: Testing or when you know your local data is correct

## Sync Status Information

The sync dialog shows:

### Last Sync
- **Time**: When your last sync occurred (e.g., "5 minutes ago")
- **Status**: Success ✓ or Failed ✗

### GitHub Connection
- **Avatar**: Your GitHub profile picture
- **Username**: Your GitHub handle
- **Badge**: Authentication status

## Understanding Auto-Sync

### How It Works

1. **Change Detection**
   - The app monitors your chat data for changes
   - Only syncs when changes are detected
   - Prevents unnecessary uploads

2. **Interval Timer**
   - Syncs occur at your configured interval
   - Timer starts after last successful sync
   - Minimum interval: 15 minutes

3. **Background Operation**
   - Syncs happen silently in background
   - Toast notification on completion
   - No interruption to your work

4. **Conflict Handling**
   - Auto-sync uses merge strategy
   - Combines changes intelligently
   - Prevents data loss

### Best Practices

✅ **Recommended**:
- Enable auto-sync with 30-minute interval
- Use merge strategy for restores
- Perform manual sync before major changes
- Check sync status periodically

❌ **Avoid**:
- Disabling auto-sync if using multiple devices
- Using "remote" strategy without checking recent changes
- Ignoring sync failure notifications
- Setting intervals below 15 minutes (unnecessary)

## Troubleshooting

### "Not authenticated" Message

**Problem**: App cannot connect to GitHub

**Solutions**:
1. Sign out and sign back in to GitHub
2. Check GitHub permissions in browser
3. Clear browser cache and reload
4. Verify network connection

### "Failed to create backup repository"

**Problem**: Repository creation failed

**Solutions**:
1. Check GitHub repository limits (you may have reached max)
2. Verify private repository quota
3. Check GitHub status (github.com/status)
4. Try again in a few minutes

### Sync Fails with Error

**Problem**: Upload or download failed

**Solutions**:
1. Check network connection
2. Verify GitHub authentication
3. Try manual sync to see detailed error
4. Check browser console for error details

### Conflict Detected Warning

**Problem**: Remote data differs from local data

**Solutions**:
1. Choose appropriate resolution strategy
2. Use merge strategy if unsure
3. Review last sync time to understand what changed
4. Perform manual backup before restore if needed

### Repository Not Found

**Problem**: Backup repository doesn't exist

**Solutions**:
1. Perform first manual sync to create repository
2. Check if repository was accidentally deleted
3. Repository name must be exactly `devchat-backup`
4. Create repository manually if needed (private, named `devchat-backup`)

## Advanced Usage

### Multiple Devices

1. **Setup**:
   - Enable auto-sync on all devices
   - Use same GitHub account
   - Set similar intervals (e.g., 30 minutes on all)

2. **Workflow**:
   - Work on Device A → Auto-sync uploads changes
   - Switch to Device B → Auto-sync downloads changes
   - Continue working seamlessly

3. **Conflict Resolution**:
   - Use merge strategy (default)
   - Newest messages always kept
   - All folders preserved
   - No data loss

### Manual Repository Access

Your backup repository is at:
```
https://github.com/YOUR_USERNAME/devchat-backup
```

Inside you'll find:
- `devchat-sync.json` - Your complete backup file
- Commit history - Previous versions of your data

### Backup File Format

The backup file contains:
```json
{
  "version": "1.0.0",
  "timestamp": 1234567890,
  "sessions": [...],
  "folders": [...],
  "settings": {...},
  "deviceId": "device-xxx"
}
```

## FAQ

### Is my data secure?
Yes! The backup repository is private and only accessible by you.

### Does this include my API keys?
Yes, your settings (including API keys) are backed up. Keep your GitHub account secure.

### Can I use a different repository name?
Not currently - the app uses `devchat-backup` by default.

### What if I delete the repository?
No problem! The app will recreate it on next sync.

### Does this cost anything?
No! GitHub private repositories are free for personal accounts.

### How much GitHub space does this use?
Typical chat history uses less than 1MB. Even with images, most users stay under 10MB.

### Can I sync with non-GitHub services?
Not currently - GitHub sync is the only cloud option.

### What happens if sync fails during auto-sync?
The app will retry on the next interval. Manual sync will show detailed errors.

## Support

If you encounter issues:

1. Check this guide first
2. Review the [PERSISTENCE.md](PERSISTENCE.md) documentation
3. Check browser console for errors
4. Verify GitHub service status
5. Try manual sync to see specific errors

## Privacy Notice

- Backups stored in YOUR private GitHub repository
- No third-party services involved
- No data sent anywhere except GitHub
- You have complete control over your data
- You can delete backups anytime by deleting the repository

---

**Enjoy secure, automatic backups with GitHub Cloud Sync! 🚀**
