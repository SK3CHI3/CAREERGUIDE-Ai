# Netlify Deployment Guide

## Quick Deploy

### Option 1: Connect GitHub Repository (Recommended)
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub account
4. Select the `AI-CAREER-FINDER` repository
5. Netlify will auto-detect settings from `netlify.toml`

### Option 2: Manual Deploy
1. Run `npm run build` locally
2. Drag and drop the `dist` folder to Netlify dashboard

## Build Configuration

Defined in `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
```

## Environment Variables

Set these in Netlify Dashboard → Site Settings → Environment Variables:

### Required
```
MODELSCOPE_API_KEY=your_modelscope_token_here
MODELSCOPE_MODEL=Qwen-Ambassador/Qwen3.7-Plus
```

### For Counselor Bookings (Optional)
```
VITE_INTASEND_PUBLIC_KEY=your_intasend_public_key
VITE_INTASEND_LIVE=true
INTASEND_WEBHOOK_SECRET=your_webhook_secret
```

### For Database (Optional)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** The platform works without Supabase keys. Database is only used for career fields data and anonymous tracking.

## Edge Functions

The platform uses Netlify Edge Functions for AI chat:

- **Location**: `netlify/functions/ai-chat.js`
- **Purpose**: Proxies AI requests to ModelScope API with rate limiting
- **Rate Limit**: 10 requests per 10 minutes per IP (anonymous users)

## Custom Domain

1. Go to Site Settings → Domain Management
2. Add your custom domain
3. Configure DNS settings as instructed by Netlify

## SPA Routing

The `netlify.toml` includes a catch-all redirect:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures React Router handles all client-side routing.

## Security Headers

Configured in `netlify.toml`:

- `X-Frame-Options: DENY` — Prevents clickjacking
- `X-Content-Type-Options: nosniff` — Prevents MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` — Controls referrer information
- `Permissions-Policy` — Restricts browser features

## Caching Strategy

- **Static assets** (`/assets/*`): 1 year cache, immutable
- **HTML files**: No cache, always revalidate
- **API responses**: No cache

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all required environment variables are set
- Check build logs in Netlify dashboard
- Run `npm run build` locally to reproduce errors

### Routing Issues (404 on refresh)
- Ensure `netlify.toml` has the catch-all redirect
- Check that `dist/index.html` exists after build

### AI Chat Returns 401 Unauthorized
- Check that `MODELSCOPE_API_KEY` is set
- Verify the edge function is deployed (`netlify/functions/ai-chat.js`)
- Check rate limiting (10 requests per 10 minutes)

### Counselor Booking Fails
- Verify IntaSend environment variables are set
- Check webhook endpoint is configured
- Test with IntaSend sandbox mode first

## Performance

The site is optimized for:
- ✅ Static asset caching (1 year, immutable)
- ✅ HTML file revalidation
- ✅ Brotli/Gzip compression (automatic)
- ✅ Security headers
- ✅ SPA routing
- ✅ Code splitting (lazy-loaded routes)
- ✅ Image optimization (WebP format)

## Monitoring

Check these in Netlify dashboard:
- **Deploys**: Build status and logs
- **Functions**: Edge function invocations and errors
- **Analytics**: Traffic and performance metrics
- **Forms**: Form submissions (if enabled)

## Support

For deployment issues:
1. Check Netlify build logs
2. Check browser console for errors
3. Verify environment variables are correctly set
4. Test locally with `netlify dev`
