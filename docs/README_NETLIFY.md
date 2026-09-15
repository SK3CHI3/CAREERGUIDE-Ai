# CareerPath AI - Netlify Deployment

## 🚀 Quick Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/SK3CHI3/AI-CAREER-FINDER)

## 📋 Prerequisites

- GitHub repository connected
- Netlify account
- Environment variables ready

## ⚙️ Environment Variables

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```bash
VITE_SUPABASE_URL=https://yrgtkuwejsaxhsfozxfh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZ3RrdXdlanNheGhzZm96eGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMzUsImV4cCI6MjA3MTkwNzIzNX0.bQEGRE4OU5_cBJd5DNtdZ-DSdhO9wIKGc2L1DaR9l-s
MODELSCOPE_API_KEY=your_modelscope_token_here
MODELSCOPE_MODEL=Qwen-Ambassador/Qwen3.7-Plus
```

## 🛠️ Build Settings

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: `18`
- **Functions Directory**: `netlify/functions`

## ✨ Features

- ✅ **SPA Routing**: All routes handled by React Router
- ✅ **Security Headers**: XSS protection, frame options
- ✅ **Caching**: Optimized for static assets
- ✅ **Functions**: Ready for serverless functions
- ✅ **Environment Variables**: Secure API key handling

## 📁 Project Structure

```
├── netlify.toml          # Netlify configuration
├── public/
│   └── _redirects        # SPA routing rules
├── netlify/
│   └── functions/        # Serverless functions
└── NETLIFY_DEPLOYMENT.md # Detailed deployment guide
```

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

1. **Connect Repository**: Link your GitHub repo to Netlify
2. **Set Environment Variables**: Add all required env vars
3. **Deploy**: Netlify will automatically build and deploy
4. **Custom Domain**: Add your domain in Site Settings

## 📊 Performance

- **Build Time**: ~38 seconds
- **Bundle Size**: Optimized with Vite
- **Caching**: Static assets cached for 1 year
- **Security**: Comprehensive security headers

## 🆘 Troubleshooting

### Build Fails
- Check Node.js version (18)
- Verify environment variables
- Check build logs

### Routing Issues
- Ensure `_redirects` file exists
- Check `netlify.toml` redirect rules

### Environment Variables
- AI secrets must not start with `VITE_`; add `MODELSCOPE_API_KEY` in Netlify's server-side environment settings.
- Redeploy after adding new variables

## 📞 Support

For deployment issues:
1. Check Netlify build logs
2. Verify environment variables
3. Check browser console for errors
4. Review `NETLIFY_DEPLOYMENT.md` for detailed guide

---

**CareerPath AI** - Empowering Kenya's Students Through CBE 🎓
