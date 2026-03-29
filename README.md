# Jenny

A patient health tracking app that connects patients with their doctors. Patients check in daily through a mobile app, and where doctors can monitor trends through a web dashboards.

## How It Works

**Patients** open the Jenny mobile app and answer a short daily check-in (pain levels, mood, sleep, medication adherence, etc.). Their responses are stored in Supabase and synced in real-time.

**Doctors** log into the web dashboard to view longitudinal charts, categorical heatmaps, and AI-powered summaries of each patient's recent health trends. The AI pipeline runs through an n8n workflow → Gemini to produce clinician-ready insights.

## Project Structure

```
/                → Patient mobile app (Expo + React Native)
/dashboard       → Doctor web dashboard (Next.js 14)
/shared          → Shared TypeScript types
/supabase        → Database migrations
/n8n_inputs      → n8n workflow node scripts
```

## Setup

### 1. Supabase
- Create a new Supabase project
- Disable "Confirm Email" in Auth → Providers
- Run `supabase/migrations/001_schema.sql` in the SQL Editor

### 2. Environment Variables
Copy `.env.example` to `.env` (root) and `dashboard/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 3. Run the Mobile App
```bash
npm install
npx expo start
```
Press `i` for iOS simulator or scan the QR code with Expo Go.

### 4. Run the Doctor Dashboard
```bash
cd dashboard
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Features

- **Daily Check-ins** — patients answer doctor-curated questions (scales, yes/no, mood grids, categorical)
- **6-Digit Pairing** — doctors generate time-limited codes to securely link patients
- **Longitudinal Charts** — track patient metrics over time with interactive area charts
- **Categorical Heatmaps** — GitHub-style grids showing yes/no and multi-select patterns
- **AI Summaries** — one-click Gemini-powered patient summaries via n8n webhook pipeline
- **Offline Support** — the mobile app queues responses locally and syncs when online

## Tech Stack

| Layer | Tech |
|-------|------|
| Mobile | Expo Router, React Native, react-native-svg |
| Web | Next.js 14 (App Router), Recharts |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| AI Pipeline | n8n → Gemini |
