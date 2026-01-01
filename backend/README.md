# DevChat Local - FastAPI Backend

This is an optional FastAPI backend for DevChat Local that provides custom OAuth endpoints for GitHub and Google authentication.

## Why Use This Backend?

The main application uses **Supabase Auth** by default, which is the recommended approach as it:
- Handles OAuth flows automatically
- Provides built-in session management
- Requires no backend setup
- Is free and scalable

Use this FastAPI backend if you need:
- Full control over the OAuth flow
- Custom authentication logic
- Integration with your own user database
- Additional backend endpoints
- Custom token management

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure OAuth Applications

#### GitHub OAuth App
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: `DevChat Local`
   - Homepage URL: `http://localhost:5000`
   - Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Save the Client ID and Client Secret

#### Google OAuth App
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project (if needed)
3. Click "Create Credentials" → "OAuth client ID"
4. Choose "Web application"
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Save the Client ID and Client Secret

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your OAuth credentials
```

### 4. Run the Server

```bash
# Development
python main.py

# Or with uvicorn for hot reload
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /
```

### GitHub OAuth
```
GET /auth/github/login
GET /auth/github/callback?code=xxx
```

### Google OAuth
```
GET /auth/google/login
GET /auth/google/callback?code=xxx
```

## Integration with Frontend

To use this backend instead of Supabase Auth, modify `src/lib/auth.ts` to call these endpoints instead of using Supabase Auth methods.

Example:
```typescript
export async function signInWithGitHub(): Promise<User> {
  window.location.href = 'http://localhost:8000/auth/github/login'
  throw new Error('OAUTH_REDIRECT')
}
```

## Production Deployment

### Recommended Services
- **Railway**: `railway up`
- **Render**: Connect your repo
- **Fly.io**: `flyctl launch`
- **DigitalOcean App Platform**

### Security Checklist
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in production
- [ ] Implement JWT token validation
- [ ] Add rate limiting
- [ ] Set proper CORS origins
- [ ] Use secure session storage
- [ ] Enable CSRF protection
- [ ] Add request logging

## Default Recommendation

**We recommend using Supabase Auth** (the default) unless you have specific requirements for custom backend logic. The current implementation in `src/lib/auth.ts` uses Supabase Auth which provides:

- ✅ Automatic OAuth flow handling
- ✅ Session management
- ✅ Token refresh
- ✅ Multiple provider support
- ✅ No backend required
- ✅ Free tier available

The FastAPI backend is provided as an alternative for advanced users who need full control.
