# Brewing Tracker

Brewing Tracker is a simple brewery production and inventory MVP for an internal team. It focuses on:

- batch tracking across the brewery lifecycle
- multiple tanks and vessel visibility
- keg and can packaging
- simple inventory with reorder awareness
- two roles: `Admin` and `General User`

## Agreed MVP scope

- Production only: no sales, ordering, or shipping
- Core batch metrics: `OG`, `FG`, `ABV`, `IBU`
- Packaging types: `Keg` and `Can`
- Simple inventory first, with room to automate later
- Email/password auth planned, not implemented in this scaffold

## Stack

- Next.js
- React
- Tailwind CSS
- Supabase auth and database integration
- Supabase-ready SQL schema in [supabase/schema.sql](/Users/spencerstrand/brewery-app/supabase/schema.sql)

## Pages

- `/` dashboard
- `/batches` production
- `/tanks`
- `/inventory`

## Run locally

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env.local`
3. Add your Supabase project URL and anon key
4. Run the SQL in [supabase/schema.sql](/Users/spencerstrand/brewery-app/supabase/schema.sql)
5. Start the app with `npm run dev`

## Live data behavior

- If Supabase env vars are missing, the app uses the built-in demo dataset
- If Supabase is configured, the dashboard and core pages read from live tables
- If the schema has not been run yet, the pages show a warning and empty-state messaging instead of crashing

## Next implementation steps

1. Replace sample data in `lib/data.ts` with server-backed queries
2. Protect app routes based on auth state
3. Add create/edit flows for batches, tanks, and inventory
4. Add manual inventory adjustment forms
5. Add audit history and production notes per batch
