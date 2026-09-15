# 🔑 ModelScope API Key Setup Instructions

## Overview
This application uses ModelScope's OpenAI-compatible inference API with Qwen for AI-powered career guidance and recommendations.

## How to Get Your API Key

### Step 1: Create a ModelScope token
1. Go to [https://www.modelscope.cn](https://www.modelscope.cn)
2. Sign up for a new account or log in
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the ModelScope token

### Step 2: Update Your Environment File
Create or update your `.env.local` file with your ModelScope token:

```bash
# ModelScope Qwen configuration - do not use a VITE_ prefix
MODELSCOPE_API_KEY=your_modelscope_token_here
MODELSCOPE_MODEL=Qwen-Ambassador/Qwen3.7-Plus

# Supabase Configuration (if not already set)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Step 3: Restart the Development Server
After updating the API key:
1. Stop the current dev server (Ctrl+C)
2. Run `npx netlify dev` so the local Netlify AI function can access the server-side token
3. Test the AI chat and career recommendations

## ModelScope Qwen API Features
- **Model**: `Qwen-Ambassador/Qwen3.7-Plus`
- **Base URL**: `https://api-inference.modelscope.ai/v1`
- **Compatible**: OpenAI-compatible API format
- **Pricing**: Competitive rates for high-quality AI responses

## Testing
Once you have a valid API key, all AI features should work properly:
- Career guidance chat
- Course recommendations
- Career detail generation
- Academic performance analysis

## Security Note
Never commit API keys to version control. The `.env.local` file is already in `.gitignore` to prevent this. The browser never receives this token; it is used only inside the Netlify function.
