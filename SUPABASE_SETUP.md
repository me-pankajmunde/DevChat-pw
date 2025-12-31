# Supabase Cloud Sync Setup

This application uses Supabase for cloud data synchronization, allowing you to backup and restore your chat sessions, folders, and settings across devices.

## Prerequisites

1. A Supabase account (free tier is sufficient)
2. A Supabase project created

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in your project details and wait for it to be created

### 2. Enable GitHub Authentication (Optional but Recommended)

1. In your Supabase dashboard, go to Authentication > Providers
2. Enable GitHub provider
3. Add your GitHub OAuth credentials:
   - Go to GitHub Settings > Developer Settings > OAuth Apps
   - Create a new OAuth app
   - Set the callback URL to: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret to Supabase

### 3. Create the Database Table

Run the following SQL in the Supabase SQL Editor (Database > SQL Editor):

```sql
-- Create the chat_backups table
CREATE TABLE IF NOT EXISTS chat_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE chat_backups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access only their own backups
CREATE POLICY "Users can view own backups"
  ON chat_backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backups"
  ON chat_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backups"
  ON chat_backups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups"
  ON chat_backups FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_backups_user_id 
  ON chat_backups(user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_chat_backups_updated_at
  BEFORE UPDATE ON chat_backups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 5. Configure DevChat Local

**The Supabase configuration is now pre-configured using environment variables.**

1. Copy the `.env.example` file to `.env` in the project root
2. Edit the `.env` file and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. For the database `cgwmhcmioxxteajbtsdd`, use:
   ```
   VITE_SUPABASE_URL=https://cgwmhcmioxxteajbtsdd.supabase.co
   VITE_SUPABASE_ANON_KEY=<get-from-supabase-dashboard>
   ```
4. Restart the application for the environment variables to take effect

**Note:** The manual Supabase configuration option has been removed from settings. All Supabase configuration is now done via the `.env` file for better security and easier deployment.

### 6. Sign In and Sync

1. Click the Database icon in the top toolbar
2. Click "Sign in with GitHub" (if you enabled GitHub auth)
3. Once authenticated, you can:
   - **Sync to Supabase**: Upload your current data
   - **Restore from Supabase**: Download previously saved data
   - **Enable Auto-Sync**: Automatically backup changes at regular intervals

## Features

### Manual Sync

- **Backup to Supabase**: Uploads all your chats, folders, and settings to the cloud
- **Restore from Supabase**: Downloads your data from the cloud

### Conflict Resolution

When restoring data, you can choose how to handle conflicts:

- **Merge**: Combines local and remote data (recommended)
- **Remote**: Replaces all local data with cloud data
- **Local**: Keeps your local data unchanged

### Auto-Sync

Enable automatic synchronization to keep your data backed up:

- Runs at configurable intervals (15 min to 6 hours)
- Only syncs when changes are detected
- Runs silently in the background

## Data Structure

The `data` JSONB column in the `chat_backups` table contains:

```json
{
  "version": "1.0.0",
  "timestamp": 1234567890,
  "userId": "uuid-here",
  "sessions": [...],
  "folders": [...],
  "settings": {...}
}
```

## Security

- All data is protected by Row Level Security (RLS)
- Users can only access their own backups
- Data is encrypted in transit (HTTPS)
- Supabase encrypts data at rest
- Your API keys and settings are included in backups (be mindful of this)

## Troubleshooting

### "Supabase not configured"

Check that your `.env` file exists and contains valid Supabase URL and Anon Key values. Restart the application after making changes to the `.env` file.

### "Not authenticated"

Sign in with GitHub through the Supabase Sync dialog.

### "Failed to upload data"

- Check your internet connection
- Verify your Supabase credentials are correct
- Ensure the `chat_backups` table exists
- Check the browser console for detailed error messages

### "Failed to download data"

- You may not have any backups yet - try syncing first
- Check your Supabase credentials
- Verify you're signed in with the same account that created the backup

## Privacy Notes

- Your chat data is stored in your own Supabase project
- Only you have access to your Supabase project and data
- The app developers cannot access your Supabase data
- Consider the sensitivity of data before enabling cloud sync
- API keys and settings are included in backups

## Migrating from GitHub Sync

If you were previously using GitHub Sync:

1. Set up Supabase as described above
2. Your local data will still be available
3. Perform a manual "Sync to Supabase" to create your first backup
4. Your GitHub repository backups will remain but won't be updated
5. You can delete the `devchat-backup` repository from GitHub if desired
