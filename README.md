# Lumo E-Commerce App

A modern e-commerce platform built with Next.js, Firebase, and powered by Google's Gemini AI for intelligent shopping assistance.

## Features

- Product browsing and search
- AI-powered shopping assistant (Gemini 2.0 Flash)
- Product recommendations
- Natural language product queries
- Firebase authentication and storage
- Responsive UI with Tailwind CSS
- Server-side rendering with Next.js 15

## Quick Start

### Prerequisites

- Node.js 20.x
- npm or yarn
- Google AI API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Google AI API key to `.env.local`:
   ```
   GOOGLE_API_KEY=your_google_ai_api_key_here
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## AI Assistant Setup

The app includes an intelligent shopping assistant powered by **Google Gemini AI** and **Firebase Genkit**.

For detailed setup instructions, see [AI_SETUP.md](./AI_SETUP.md)

### Quick AI Setup:

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env.local`: `GOOGLE_API_KEY=your_key`
3. Restart dev server
4. Click the bot icon in the bottom-right corner

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run emulator:start` - Start Firebase emulators

## Project Structure

```
src/
├── ai/
│   ├── flows/              # AI flows (shopping assistant, Q&A, recommendations)
│   └── genkit.ts           # Genkit configuration
├── app/
│   ├── api/assistant/      # AI assistant API endpoint
│   └── ...                 # Pages and layouts
├── components/
│   ├── ai-assistant-widget.tsx
│   ├── chat-interface.tsx
│   └── ...                 # UI components
└── lib/                    # Utilities and configs
```

## Tech Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **AI**: Google Gemini 2.0 Flash, Firebase Genkit
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI Components**: Radix UI, Lucide Icons
- **Deployment**: Vercel

## Environment Variables

See `.env.example` for all available configuration options.

Required for AI features:
- `GOOGLE_API_KEY` - Google AI API key for Gemini

Optional:
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Firebase admin credentials
- `FIREBASE_COOKIE_NAME` - Session cookie name

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `GOOGLE_API_KEY`
   - Any Firebase credentials
4. Deploy

### Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add `GOOGLE_API_KEY` for all environments
3. Redeploy

## Troubleshooting

### AI Not Working

If the AI assistant doesn't respond:
1. Check if `GOOGLE_API_KEY` is set in `.env.local`
2. Verify API key is valid at [Google AI Studio](https://aistudio.google.com/)
3. Check server logs for errors
4. See [AI_SETUP.md](./AI_SETUP.md) for detailed troubleshooting

### AI Diagnostics

If the AI assistant is not working in production, check the diagnostics endpoint:

```bash
# Visit this URL (replace with your domain)
https://your-app.vercel.app/api/ai-diagnostics
```

This will show:
- Which AI API keys are configured
- Key lengths (to verify they're not truncated)
- Recommendations for fixing issues

**Common Issues:**
- Missing `GOOGLE_API_KEY` - Add it to Vercel with the same value as `GEMINI_API_KEY`
- Wrong key length - Should be around 39 characters for Gemini
- Environment not set - Make sure variables are set for Production environment

### Development

For development tips and common issues, check:
- Server logs in terminal
- Browser console for client-side errors
- Firebase emulator logs if using Firebase locally

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of Firebase Studio.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Genkit](https://firebase.google.com/docs/genkit)
- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Docs](https://ai.google.dev/docs)
