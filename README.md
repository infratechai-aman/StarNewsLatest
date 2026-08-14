# StarNews India

A news portal and classifieds management system for **Pune Majha / StarNews India**.

## Tech Stack

- **Framework:** Next.js 14 (App Router, standalone output)
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication (Admin SDK server-side)
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Deployment:** Vercel

## Getting Started

```bash
cd frontend
cp .env.example .env.local   # Fill in your Firebase credentials
npm install
npm run dev
```

## Project Structure

```
frontend/
├── app/              # Next.js App Router (pages + API routes)
│   ├── api/          # Backend API endpoints
│   └── page.js       # Main entry point
├── components/       # React components (UI + pages)
├── contexts/         # React context providers
├── hooks/            # Custom React hooks
├── lib/              # Shared utilities (auth, api, cache, etc.)
└── public/           # Static assets
```

## Environment Variables

See [`.env.example`](frontend/.env.example) for all required variables.
