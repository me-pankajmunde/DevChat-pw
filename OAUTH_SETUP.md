# OAuth Authentication Setup Guide

DevChat Local now supports OAuth authentication with GitHub and Google. This guide will help you set up OAuth for your deployment.

## Overview

The application uses **Supabase Auth** by default, which provides:
- ✅ GitHub OAuth
- ✅ Google OAuth  
- ✅ No backend required
- ✅ Automatic session management
- ✅ Token refresh handling
- ✅ Free tier available

## Setup Options

### Option 1: Supabase Auth (Recommended)

This is the easiest and most reliable option.

#### Step 1: Set up Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project (or create one)
3. Copy your project URL and anon key from **Settings → API**
4. Update `.env` file:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

#### Step 2: Enable GitHub OAuth

1. In Supabase Dashboard, go to **Authentication → Providers**
2. Click on **GitHub** provider
3. Toggle **Enable Sign in with GitHub**

**Create GitHub OAuth App:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - **Application name**: `DevChat Local`
   - **Homepage URL**: `http://localhost:5000` (or your domain)
   - **Authorization callback URL**: `https://your-project.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy the **Client ID** and **Client Secret**
6. Paste them into Supabase GitHub provider settings
7. Click **Save**

#### Step 3: Enable Google OAuth

1. In Supabase Dashboard, go to **Authentication → Providers**
2. Click on **Google** provider
3. Toggle **Enable Sign in with Google**

**Create Google OAuth App:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** in the library
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure consent screen if prompted
6. Select **Web application** as application type
7. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**
10. Paste them into Supabase Google provider settings
11. Click **Save**

#### Step 4: Configure Site URL

1. In Supabase Dashboard, go to **Authentication → URL Configuration**
2. Set **Site URL** to your frontend URL:
   - Development: `http://localhost:5000`
   - Production: `https://your-domain.com`
3. Add your URL to **Redirect URLs** list

#### Step 5: Test Authentication

1. Start your application: `npm run dev`
2. Click **Continue with GitHub** or **Continue with Google**
3. Authorize the application
4. You should be redirected back and logged in

### Option 2: Custom FastAPI Backend

For advanced users who need full control over the OAuth flow, we provide a FastAPI backend. See [backend/README.md](backend/README.md) for setup instructions.

**When to use this option:**
- You need custom authentication logic
- You want to integrate with your own database
- You need additional backend endpoints
- You prefer self-hosted solutions

## Configuration Files

### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Backend (backend/.env) - Optional
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Production Deployment

### Supabase Configuration

1. Update Site URL to production domain
2. Add production URL to Redirect URLs
3. Update OAuth app redirect URIs to use production Supabase URL
4. Enable RLS (Row Level Security) on your tables

### Security Checklist

- [ ] Site URL is set correctly
- [ ] All redirect URLs are added
- [ ] OAuth apps use correct callback URLs
- [ ] HTTPS is enabled in production
- [ ] Environment variables are secure
- [ ] `.env` file is in `.gitignore`
- [ ] RLS policies are configured
- [ ] CORS origins are restricted

## Troubleshooting

### "Supabase is not configured" Error
- Make sure `.env` file exists with correct values
- Restart the development server after changing `.env`
- Check that environment variable names match exactly

### OAuth Redirect Loop
- Verify callback URLs in OAuth apps match Supabase callback URL
- Check Site URL in Supabase settings
- Ensure redirect URLs are added to allowed list

### "Invalid redirect URI" Error
- Check OAuth app callback URL format
- Verify Supabase project URL is correct
- Make sure HTTPS is used in production

### User Data Not Syncing
- Verify Supabase connection is working
- Check browser console for errors
- Ensure user has granted necessary permissions

## User Data Structure

After successful login, the user object contains:

```typescript
{
  login: string        // Username or display name
  avatarUrl: string    // Profile picture URL
  email: string        // User email
  id: string          // Unique user ID
  provider: 'github' | 'google'  // OAuth provider
}
```

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [FastAPI Backend Setup](backend/README.md)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure OAuth apps are configured correctly
4. Check Supabase logs in the dashboard
5. Review this guide and linked documentation

## Migration from Mock Auth

If you're migrating from the old mock authentication:

1. The user ID type changed from `number` to `string`
2. User sessions are now managed by Supabase
3. No code changes needed in your components
4. Existing data is preserved in localStorage
5. First login will create a new Supabase user

The application will automatically handle the migration seamlessly.
