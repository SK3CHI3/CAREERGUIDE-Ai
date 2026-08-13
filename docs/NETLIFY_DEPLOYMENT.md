# Netlify Deployment Guide

## Quick Deploy

### Option 1: Connect GitHub Repository
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub account
4. Select the `AI-CAREER-FINDER` repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

### Option 2: Manual Deploy
1. Run `npm run build` locally
2. Drag and drop the `dist` folder to Netlify dashboard

## Environment Variables

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

## Build Settings

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `18`
- **Functions directory**: `netlify/functions`

## Custom Domain (Optional)

1. Go to Site Settings → Domain Management
2. Add your custom domain
3. Configure DNS settings as instructed by Netlify

## Features Included

✅ **SPA Routing**: All routes redirect to `index.html` for React Router
✅ **Security Headers**: XSS protection, frame options, content type options
✅ **Caching**: Optimized cache headers for static assets
✅ **Functions**: Ready for serverless functions if needed
✅ **Environment Variables**: Secure handling of API keys

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18)
- Verify all environment variables are set
- Check build logs in Netlify dashboard

### Routing Issues
- Ensure `_redirects` file is in `public/` folder
- Check that `netlify.toml` has correct redirect rules

### Environment Variables Not Working
- Variables must start with `VITE_` to be accessible in the frontend
- Redeploy after adding new environment variables

## Performance Optimization

The site is optimized for:
- ✅ Static asset caching (1 year)
- ✅ HTML file revalidation
- ✅ Gzip compression
- ✅ Security headers
- ✅ SPA routing

## Support

For issues with deployment, check:
1. Netlify build logs
2. Browser console for errors
3. Environment variables are correctly set
4. All dependencies are in `package.json`
