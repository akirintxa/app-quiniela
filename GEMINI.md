# Project: App Quiniela

## Project Overview
App Quiniela is a Next.js (v16) application designed for managing predictions for the 2026 World Cup. It leverages Supabase as the backend for database operations and authentication. Users can join pools, make predictions for group stage matches and knockout rounds, and track their performance on a global ranking.

## Technology Stack
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Database/Auth:** [Supabase](https://supabase.com/)
- **Styling:** Tailwind CSS (via PostCSS)
- **Component Libraries/Utilities:** React, Supabase SSR

## Building and Running
The project uses standard Next.js scripts defined in `package.json`:

- **Development Server:** `npm run dev` (Access at [http://localhost:3000](http://localhost:3000))
- **Build:** `npm run build`
- **Start Production Server:** `npm run start`
- **Linting:** `npm run lint`

## Development Conventions
- **Routing:** Uses the Next.js App Router with route groups for authentication (`(auth)`).
- **Authentication:** Managed via Supabase Auth. Routes are protected based on user state.
- **State Management:** Uses React `useState` and `useEffect` for client-side interactions (e.g., `MatchCard`, `RandomizeButton`).
- **Database:** Tables are defined in `schema.sql`. Row Level Security (RLS) is used for access control.
- **Components:** Functional components located in `src/components/`. 
- **Server Actions:** Logic for saving predictions and randomizing is handled via server actions in `src/app/actions.ts`.

## Key Files
- `src/app/`: Core application routes and pages.
- `src/components/`: Reusable UI components (e.g., `MatchCard`, `Bracket`).
- `src/lib/`: Business logic, including prediction and standing calculations.
- `src/utils/supabase/`: Supabase client initialization.
- `schema.sql`: Database schema definition.
