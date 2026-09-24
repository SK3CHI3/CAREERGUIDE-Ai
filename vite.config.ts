import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { handler as localAiChatHandler } from "./netlify/functions/ai-chat.js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, process.cwd(), '');
  process.env.MODELSCOPE_API_KEY ||= serverEnv.MODELSCOPE_API_KEY;
  process.env.MODELSCOPE_MODEL ||= serverEnv.MODELSCOPE_MODEL;

  return {
    server: {
      host: "127.0.0.1",
      port: 8080,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        manifest: {
          name: "CareerGuide AI - Kenya's Career Guidance",
          short_name: 'CareerGuide',
          description: "Career guidance for Kenyan students.",
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: '#1d4ed8',
          background_color: '#ffffff',
          icons: [
            { src: '/logos/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/logos/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/logos/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        },
      }),
      mode === 'development' && componentTagger(),
      {
        name: 'local-ai-chat-function',
        configureServer(server) {
          server.middlewares.use('/.netlify/functions/ai-chat', (request, response, next) => {
            if (request.method !== 'POST' && request.method !== 'OPTIONS') return next();

            let body = '';
            request.on('data', chunk => { body += chunk; });
            request.on('end', async () => {
              try {
                const headers = Object.fromEntries(Object.entries(request.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value || '']));
                const result = await localAiChatHandler({ httpMethod: request.method, headers, body });
                response.statusCode = result.statusCode;
                Object.entries(result.headers || {}).forEach(([key, value]) => response.setHeader(key, value));
                response.end(result.body);
              } catch (error) {
                console.error('Local AI function failed:', error);
                response.statusCode = 500;
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify({ error: 'AI guidance is temporarily unavailable. Please try again.' }));
              }
            });
          });
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
