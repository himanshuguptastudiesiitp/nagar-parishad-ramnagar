# Ramnagar Digital Governance

A bilingual digital municipal governance platform for Nagar Parishad Ramnagar, West Champaran, Bihar. It provides citizen services, ward information, grievance management, complaint tracking, and an administrative staff dashboard.

## Run Locally

Prerequisites: Node.js 22+

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set `SESSION_SECRET` to a long random value.
3. Start the portal:
   `npm run dev`
4. Open `http://localhost:3000`.

## Demo Staff Accounts

All demo accounts use the password `Bihar@2026`:

- `mukhiya`
- `sachiv`
- `sarpanch`
- `ward4`

## Validation

- `npm run lint`
- `npm run build`

## Deploy to Vercel

1. Import the GitHub repository in Vercel.
2. Set `SESSION_SECRET` to a long random value in Vercel Project Settings.
3. Deploy with the included `vercel.json` configuration.

The API is served by `api/index.ts`, and the React application is built into `dist`.

The included SQLite database is copied into `/tmp` on Vercel for demonstration use. Vercel serverless storage is temporary, so an external managed database is recommended for persistent production data.
