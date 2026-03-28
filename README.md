# PenguinPals

An integrated, end-to-end pediatric health tracking system connecting a playful Expo React Native patient app to a secure Next.js Doctor Dashboard via a real-time Supabase backend.

## Architecture Structure
This repository operates as a monorepo spanning two distinct codebases connected to a single Supabase backend:
- `/` (Root): The Patient-facing iOS/Android application built on Expo Router & React Native.
- `/dashboard`: The Doctor-facing web analytics portal built on Next.js 14 App Router.

## Getting Started

### 1. Database Setup (Supabase)
This project requires a Supabase PostgreSQL instance. 
1. Create a new Supabase project.
2. Disable "Confirm Email" in Auth -> Providers.
3. Run the complete SQL migration file (`supabase/migrations/001_schema.sql`) in the Supabase SQL Editor to generate the schema, policies, and base question library.

### 2. Environment Variables
Copy the `.env.example` file to create local `.env` files for both the Mobile and Dashboard environments:
- Root `.env` (for Expo)
- `dashboard/.env.local` (for Next.js)

### 3. Running the Patient App (Mobile)
```bash
npm install
npx expo start
```
*Note: The patient app functions fully offline using an AsyncStorage queue, syncing payload chunks securely when a connection is restored.*

### 4. Running the Doctor Dashboard (Web)
Open a separate terminal window:
```bash
cd dashboard
npm install
npm run dev
```
Navigate to `http://localhost:3000` to access the portal.

## Core Features
1. **Pairing 6-Digit Codes**: Doctors spawn secure 48-hour codes dynamically in the Web Dashboard. Patients enter the code to lock their local `device_id` to the Doctor's telemetry stream.
2. **Parametric Avatars (Pip)**: The mobile app's primary emotion-tracker bypasses heavy image blobs by utilizing pure parametric `react-native-svg` mathematics, dynamically skewing bezier vectors to display 14 specific emotional aliases instantly.
3. **Categorical Heatgrids**: Rather than just tracking linear timelines, the Dashboard incorporates highly specialized Github-style categorical chronologies to explicitly map qualitative "Yes/No" and "Pain Type" string triggers securely alongside raw temporal arrays.
