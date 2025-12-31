# Environment Variables Setup

This guide explains how to configure the environment variables for DevChat Local.

## Quick Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your actual Supabase credentials

3. Restart the application for changes to take effect

## Required Variables

### Supabase Configuration

DevChat Local uses Supabase for cloud data synchronization. You need to provide:

#### Primary Variable Names (React App / GitHub Codespaces)

#### `REACT_APP_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Format**: `https://your-project-ref.supabase.co`
- **Example**: `https://cgwmhcmioxxteajbtsdd.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL

#### `REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- **Description**: Your Supabase anonymous/public API key
- **Format**: JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

#### Alternative Variable Names (Vite / Local Development)

The application also supports Vite-style environment variables:

- `VITE_SUPABASE_URL` - Same as `REACT_APP_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` - Same as `REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

**Note**: The application checks `REACT_APP_*` variables first, then falls back to `VITE_*` variables. You can use either naming convention, or both for maximum compatibility.

## Getting Your Supabase Credentials

### For the Provided Database (cgwmhcmioxxteajbtsdd)

You mentioned having access to the database: `cgwmhcmioxxteajbtsdd`

1. **Supabase URL**: `https://cgwmhcmioxxteajbtsdd.supabase.co`

2. **Supabase Anon Key**: 
   - Log in to [supabase.com](https://supabase.com)
   - Open the project `cgwmhcmioxxteajbtsdd`
   - Go to Settings → API
   - Copy the "anon public" key

3. Update your `.env` file:
   ```
   REACT_APP_SUPABASE_URL=https://cgwmhcmioxxteajbtsdd.supabase.co
   REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<paste-your-anon-key-here>
   
   VITE_SUPABASE_URL=https://cgwmhcmioxxteajbtsdd.supabase.co
   VITE_SUPABASE_ANON_KEY=<paste-your-anon-key-here>
   ```

### Creating a New Supabase Project

If you need to create a new project:

1. Visit [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project creation (takes ~2 minutes)
5. Follow the database setup in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
6. Get your credentials from Settings → API

## Security Best Practices

### ⚠️ IMPORTANT: Never Commit Your `.env` File

- The `.env` file is already listed in `.gitignore`
- Never commit actual API keys to version control
- Share credentials securely (password manager, encrypted channel)
- Use different projects for development/production

### Key Safety

- The `anon` key is safe to expose in client-side code
- It's protected by Row Level Security (RLS) in Supabase
- Still, don't share it publicly or commit it to repositories
- Each team member should use the same project credentials

## Troubleshooting

### Environment Variables Not Loading

**Problem**: Changes to `.env` not taking effect

**Solutions**:
1. Restart the development server completely
2. Clear browser cache and reload
3. Check for typos in variable names
4. Ensure `.env` is in the project root directory

### Invalid Supabase Configuration

**Problem**: "Supabase not initialized" error

**Solutions**:
1. Verify both URL and KEY variables are set
2. Check for extra spaces or quotes in values
3. Ensure URL format is correct: `https://xxxxx.supabase.co`
4. Verify the anon key is the complete JWT token

### Cannot Connect to Supabase

**Problem**: Authentication or sync failures

**Solutions**:
1. Verify credentials are correct in Supabase dashboard
2. Check that the Supabase project is active and not paused
3. Ensure the `chat_backups` table exists (see SUPABASE_SETUP.md)
4. Verify Row Level Security policies are set up correctly
5. Check browser console for detailed error messages

## Development vs Production

### Development
- Use `.env` for local development
- Can test with a development Supabase project
- Changes require server restart

### Production/Deployment
- Set environment variables in your hosting platform
- Most platforms (Vercel, Netlify, etc.) have environment variable settings
- Never commit production credentials
- Use either `REACT_APP_*` or `VITE_*` variables depending on your platform

## Example Configuration

Here's what your `.env` file should look like:

```bash
# Supabase Configuration (Both naming conventions supported)
REACT_APP_SUPABASE_URL=https://cgwmhcmioxxteajbtsdd.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_SECRET_HERE

VITE_SUPABASE_URL=https://cgwmhcmioxxteajbtsdd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_SECRET_HERE
```

Replace `YOUR_ACTUAL_SECRET_HERE` with your actual anon key from the Supabase dashboard.

## Next Steps

After setting up your environment variables:

1. Restart the development server
2. Open the application
3. Sign in with GitHub
4. Start using cloud sync features

For more information on setting up Supabase, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).
