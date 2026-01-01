# Deployment Guide

## Overview
DevChat Local is a static web application that can be deployed to any hosting service that supports static sites. No server-side runtime is required.

## Build for Production

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates an optimized production build in the `dist/` directory.

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Environment Variables** (optional, for Supabase sync):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Option 2: Netlify

1. **Build Command:** `npm run build`
2. **Publish Directory:** `dist`
3. **Environment Variables** (optional):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Option 3: GitHub Pages

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json scripts:**
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

### Option 4: Any Static Host (Cloudflare Pages, AWS S3, etc.)

Simply upload the contents of the `dist/` directory after building.

## Environment Variables

Create a `.env` file in the project root (optional, only needed for cloud sync):

```env
# Supabase Configuration (optional for cloud sync)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Alternative naming (also supported)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
```

## Configuration

### Base URL (for subdirectory deployment)

If deploying to a subdirectory, update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/your-subdirectory/',
  // ... rest of config
})
```

### Service Worker (PWA)

The app includes a service worker for offline functionality. After deployment, users can install it as a PWA.

## Post-Deployment

### Testing
1. Open the deployed URL in a browser
2. The app should load without authentication by default
3. Configure API endpoint in Settings
4. Start chatting!

### Data Storage
- All data is stored in browser localStorage
- No server-side storage required
- Optional cloud backup via Supabase (requires configuration)

### HTTPS Required
For PWA functionality and service workers, the app must be served over HTTPS. Most hosting providers (Vercel, Netlify, etc.) provide HTTPS by default.

## Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### TypeScript Errors
The build script uses `tsc -b --noCheck` to skip type checking during build. To check types separately:
```bash
npx tsc --noEmit
```

### Service Worker Issues
Clear browser cache and unregister service worker:
1. Open DevTools → Application → Service Workers
2. Unregister all workers
3. Hard refresh (Ctrl+Shift+R)

## Performance

The production build is optimized with:
- Code splitting
- Tree shaking
- Minification
- Asset optimization

Typical bundle size: ~500KB gzipped

## Security

- API keys are stored in browser localStorage (never sent to any server except the configured API endpoint)
- No backend authentication required (easily add your own)
- Supabase sync uses row-level security (configure in Supabase dashboard)

## Custom Domain

Configure custom domain in your hosting provider's dashboard:
- Vercel: Project Settings → Domains
- Netlify: Site Settings → Domain Management
- GitHub Pages: Repository Settings → Pages → Custom Domain
