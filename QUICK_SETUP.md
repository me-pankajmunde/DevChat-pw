# Quick Supabase Setup Guide for DevChat Local

## ⚡ Fast Track Setup (5 minutes)

Your Supabase project is **already configured** at: `https://cgwmhcmioxxteajbtsdd.supabase.co`

You just need to add your **anon key** to enable cloud sync!

### Step 1: Get Your Anon Key

1. **Open your Supabase dashboard:**
   - Go to: https://supabase.com/dashboard/project/cgwmhcmioxxteajbtsdd/settings/api
   - Or navigate: Supabase Dashboard → Your Project → Settings (⚙️) → API

2. **Copy your anon key:**
   - Look for the section **"Project API keys"**
   - Find the key labeled **"anon public"** (NOT service_role!)
   - Click the copy icon or select and copy the entire key
   - It should look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long string)

### Step 2: Update the .env File

1. **Open the `.env` file** in the project root
2. **Replace the placeholder** on line 2 with your actual anon key:
   ```env
   VITE_SUPABASE_URL=https://cgwmhcmioxxteajbtsdd.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
   ```
3. **Save the file**

### Step 3: Create Database Table (One-time setup)

If you haven't already created the database table, run this SQL:

1. Go to: https://supabase.com/dashboard/project/cgwmhcmioxxteajbtsdd/editor
2. Click **"New Query"** or open the SQL Editor
3. Paste and run this SQL:

```sql
-- Create the chat_backups table
CREATE TABLE IF NOT EXISTS chat_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE chat_backups ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing users to access their own data)
CREATE POLICY "Users can view own backups"
  ON chat_backups FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own backups"
  ON chat_backups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own backups"
  ON chat_backups FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own backups"
  ON chat_backups FOR DELETE
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_backups_user_id 
  ON chat_backups(user_id);

-- Create function to auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_chat_backups_updated_at
  BEFORE UPDATE ON chat_backups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 4: Restart the Application

1. **Stop the application** (if running)
2. **Start it again** to load the new environment variables
3. You should see: **✅ Supabase initialized successfully** in the console

### Step 5: Test Cloud Sync

1. **Click the Database icon** (HardDrives) in the top toolbar
2. **Click "Sync to Supabase"** to backup your current chats
3. If successful, you'll see a success toast notification!

## 🎯 What You Get

Once configured, you'll have:

- ✅ **Automatic cloud backup** of all your chats
- ✅ **Sync across devices** - access your chats anywhere
- ✅ **Data persistence** - never lose your conversations
- ✅ **Privacy** - data stored in YOUR Supabase project only
- ✅ **GitHub authentication** - secure sign-in

## 🔒 Security Notes

- **Anon key is SAFE** for client-side use
- Never use your `service_role` key in the frontend!
- Your data is protected by Row Level Security
- Only you can access your Supabase project data

## ⚠️ Common Issues

### "Supabase not configured"
- Check that your `.env` file has the anon key
- Make sure you saved the `.env` file
- Restart the application

### "Failed to upload data"
- Verify you created the `chat_backups` table (Step 3)
- Check your anon key is correct
- Check your internet connection

### "Not authenticated"
- Sign in with GitHub from the Data Management dialog
- Make sure GitHub authentication is enabled in Supabase

## 📚 More Information

For detailed setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

## 🆘 Need Help?

If you're stuck:
1. Check the browser console (F12) for error messages
2. Verify your Supabase project is active
3. Make sure the table was created successfully
4. Try refreshing the page after updating `.env`
