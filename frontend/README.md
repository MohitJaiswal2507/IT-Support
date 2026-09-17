# Veridian Internal Service Agent - Frontend

Next.js frontend application for the Veridian Internal IT Support Agent.

## Phase 0 Scope
Phase 0 establishes the UI project foundation, corporate design system tokens, responsive status card, and dynamic health check communication with the FastAPI backend.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide React icons
- **Language**: TypeScript (strict typing)

## Project Structure
```text
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with corporate styling
│   │   ├── page.tsx           # Foundation page displaying connection status
│   │   └── globals.css        # Tailwind CSS imports
│   ├── components/
│   │   ├── Header.tsx         # Top corporate navigation header
│   │   ├── StatusCard.tsx     # Dynamic health check status card & retry logic
│   │   └── ui/                # Reusable UI primitives (Card, Badge, Button)
│   └── lib/
│       ├── api.ts             # Typed health check API client
│       └── utils.ts           # Class merging helper (clsx + tailwind-merge)
├── .env.example               # Example environment variables
├── package.json
└── tsconfig.json
```

## Setup & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```
Ensure `NEXT_PUBLIC_API_URL` points to your backend instance (default: `http://localhost:8000`).

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build Production Bundle
```bash
npm run build
```
