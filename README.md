<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ff23ef03-ad5f-4861-9765-5cc2fe7d9d3b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

1. Import the repository in Vercel and use the default Vite project settings.
2. Set `SESSION_SECRET` to a long random value in Vercel Project Settings.
3. Deploy. The API is served by `api/index.ts`; the React application is built into `dist`.

The SQLite database is copied into `/tmp` on Vercel. This supports the demo and read/write operations, but Vercel serverless filesystem changes are not guaranteed to persist across cold starts or regions. Use a managed SQLite-compatible service such as Turso or a Vercel database integration for durable production data.
