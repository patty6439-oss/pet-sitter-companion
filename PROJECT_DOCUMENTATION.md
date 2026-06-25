# PetSitter Companion — Project Documentation

---

## Project Name

**PetSitter Companion**

---

## Project Overview

PetSitter Companion is a mobile-first web application for professional pet sitters. It allows sitters to manage pet profiles, track daily care tasks with a live checklist, log medications, and upload proof-of-life photo updates for pet owners — all backed by a persistent database with user authentication.

---

## Problem the App Solves

Pet sitters juggle multiple animals with different feeding schedules, medications, and care routines. Without a dedicated tool, instructions get lost in text threads, tasks are forgotten, and owners have no visibility into whether their pet's care actually happened. PetSitter Companion gives sitters one organized place to store pet information, work through a daily task checklist, and document completed care with photos and captions — giving owners peace of mind.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 (Vite) |
| Routing | React Router v6 |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (email + password) |
| Styling | Custom CSS variables, no external UI library |
| Build tool | Vite 8 |
| Deployment-ready | Static build via `npm run build` |

---

## Required Features Completed

- [x] User registration and login (email/password)
- [x] Protected routes — unauthenticated users are redirected to login
- [x] Create, read, update, and delete pet profiles
- [x] Add, edit, and delete medications per pet
- [x] Add and delete daily tasks per pet (with task type and scheduled time)
- [x] Daily checklist with real-time completion toggle (persisted to database)
- [x] Progress ring and progress bar showing today's completion percentage
- [x] Proof-of-life photo upload linked to a completed task (persisted to database)
- [x] Photo gallery showing today's uploaded proof-of-life entries
- [x] Dashboard summary stats (pets, medications, daily tasks)
- [x] Per-pet progress bar on the dashboard card (live, today's data)
- [x] Full logout

---

## Authentication Summary

Authentication is handled entirely by **Supabase Auth**.

- **Registration:** User submits email and password. Supabase creates an `auth.users` record. A database trigger (`handle_new_user`) automatically creates a matching row in the public `users` table.
- **Login:** Supabase validates credentials and returns a session. The session is stored in `localStorage` by the Supabase client.
- **Session persistence:** `AuthContext` calls `supabase.auth.getSession()` on mount and listens to `onAuthStateChange` so the app stays authenticated across page refreshes.
- **Protected routes:** The `ProtectedRoute` component checks for an active session and redirects to `/` (login) if none exists.
- **Logout:** Calls `supabase.auth.signOut()` and navigates back to the login screen.
- **Row Level Security:** All database tables have RLS enabled. Users can only read and write their own data (pets, tasks, medications, care logs, photos).

---

## CRUD Resources

### Pets
| Operation | Where |
|---|---|
| Create | Add New Pet form (`/pets/new`) |
| Read | Dashboard pet cards, Pet Profile page |
| Update | Edit Pet form (`/pets/:id/edit`) |
| Delete | Delete button on Pet Profile page (cascades to tasks, logs, photos) |

### Medications
| Operation | Where |
|---|---|
| Create | Medical tab in Add/Edit Pet form |
| Read | Pet Profile page, medication badge on dashboard card |
| Update | Edit button on each medication row (inline form) |
| Delete | × button on each medication row |

### Daily Tasks
| Operation | Where |
|---|---|
| Create | "+ Add Task" form on Daily Checklist page |
| Read | Daily Checklist page, Pet Profile page |
| Update | Completion toggle (writes/deletes a care log record) |
| Delete | × button on each task row (cascades care logs) |

### Care Logs
| Operation | Where |
|---|---|
| Create | Checking off a task on the Daily Checklist |
| Read | Checklist completion state, dashboard progress bar, Proof of Life task selector |
| Delete | Unchecking a completed task removes the care log record |

### Proof-of-Life Photos
| Operation | Where |
|---|---|
| Create | Upload Proof of Life form (`/pets/:id/proof-of-life`) |
| Read | "Today's Photos" gallery on the Proof of Life page |
| Delete | × button on each photo card in the gallery |

---

## Supabase / Database Summary

### Tables

| Table | Purpose |
|---|---|
| `users` | Mirrors Supabase auth users; created automatically via trigger |
| `pets` | One row per pet; owned by a user |
| `medications` | Many-to-one with pets |
| `daily_tasks` | Recurring care tasks; many-to-one with pets |
| `care_logs` | One record per task completion per day; many-to-one with daily_tasks |
| `proof_of_life_photos` | Photo/caption entries linked to a care log |

### Key design decisions

- All primary keys are UUIDs with `DEFAULT gen_random_uuid()`.
- All timestamp columns use `DEFAULT NOW()`.
- Optional fields (breed, age, feeding instructions, etc.) are nullable to avoid requiring them on every pet.
- Care logs are date-filtered in queries (`gte`/`lte` on `created_at`) so the checklist and dashboard always reflect today's state.
- Proof-of-life photos store images as data URLs in the `photo_url` TEXT column — no external storage bucket is required.
- Cascading deletes are enforced via FK constraints (`ON DELETE CASCADE`) so deleting a pet removes all associated records.

### SQL migration files (run in order in Supabase SQL Editor)
1. `schema.sql` — base table definitions
2. `schema_fix2.sql` — adds UUID defaults
3. `schema_fix3.sql` — makes optional task fields nullable
4. `schema_updates.sql` — fixes FK constraints, adds timestamp defaults, makes optional fields nullable, adds the new-user trigger, enables RLS, and sets all access policies

---

## Error Handling Summary

- **Form validation:** Pet name is required before submitting; medication name is required before adding. Empty submissions are blocked at the UI level.
- **Database errors:** All Supabase calls check the returned `error` object. Failures surface a red error banner inside the relevant page (e.g., "Failed to load pets.", "Failed to add task: …").
- **Not found states:** Pet Profile and Checklist show a clear error message if the pet ID in the URL doesn't match any record.
- **Loading states:** Every page that fetches data shows a "Loading…" message while the request is in flight, preventing blank or broken renders.
- **Auth guard:** Navigation to any protected route without a session redirects to login rather than crashing.
- **Optimistic vs. confirmed updates:** Task completion toggling waits for Supabase confirmation before updating local state, so the UI stays consistent with the database.

---

## Demo Account Credentials

| Field | Value |
|---|---|
| Email | `demo@test.com` |
| Password | `TestPass99!` |

This account has two pre-loaded pets:

| Pet | Species | Breed | Age | Photo | Notes |
|---|---|---|---|---|---|
| **Biscuit** | Dog | Golden Retriever | 3 yrs | Emoji (🐕) | 1 medication (Apoquel), 2 morning tasks |
| **Kit** | Cat | Domestic Shorthair Tabby | 11 yrs | `kit.jpg` (static asset) | Feeding and food instructions set |

---

## Known Limitations

- **Photo storage:** Photos are stored as base64 data URLs in the database rather than in Supabase Storage. This works for a demo but is not suitable for production (large row sizes, no CDN delivery).
- **Photo upload is text-only fallback:** If neither a file nor a caption is provided, the upload button is disabled. A file or caption is required.
- **Proof-of-life requires a completed task:** Because `care_log_id` is NOT NULL in the schema, a photo can only be uploaded after at least one task has been checked off for the day.
- **No real-time sync:** If two devices are logged in simultaneously, checklist state won't sync without a page refresh.
- **Pet photo upload not implemented via UI:** The "Add Photo" section on the Add/Edit Pet form shows "Coming soon." The demo photo for Kit is a static asset (`public/kit.jpg`) with `photo_url` set directly in the database — not uploaded through the app.
- **No password reset flow:** The "Forgot password?" link is present on the login page but does not navigate anywhere.
- **No pagination:** The dashboard loads all pets and tasks at once. For accounts with many pets this could be slow.

---

## Future Improvements

- Integrate Supabase Storage for proper image hosting with CDN URLs
- Add real-time subscription (`supabase.channel`) so checklist updates sync across devices instantly
- Implement password reset via Supabase's built-in email flow
- Add pet profile photo upload through the UI (currently set via database only for the Kit demo)
- Add owner-facing view (separate role) so pet owners can log in and see their pet's daily reports
- Push notifications or email summaries when all tasks are completed
- Multi-day history view for care logs and proof-of-life photos
- Pagination or infinite scroll for large pet lists

---

## How to Run the App Locally

### Prerequisites
- Node.js 18+
- A Supabase project with the schema applied (run migration files in order)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/patty6439-oss/pet-sitter-companion.git
cd pet-sitter-companion

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env          # or create .env manually

# 4. Add your Supabase credentials to .env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 5. Apply the database schema (in Supabase SQL Editor, run in order):
#    schema.sql → schema_fix2.sql → schema_fix3.sql → schema_updates.sql

# 6. Start the development server
npm run dev

# App will be available at http://localhost:5173
```

### Production build
```bash
npm run build       # outputs to /dist
npm run preview     # preview the production build locally
```

---

## What to Demonstrate in the Video

Follow this sequence for a complete walkthrough:

1. **Login screen** — show the branded login page; log in with the demo account
2. **Dashboard** — point out the stats row (pets, medications, daily tasks); scroll through both pet cards — Kit shows a real photo, Biscuit shows the dog emoji; note the live progress bars
3. **Kit's profile** — tap "View Profile" on Kit; show the real cat photo in the banner, breed, age, feeding instructions, and approved/forbidden foods
4. **Add a pet** — tap "+ Add Pet", fill in name/species/breed/age on the Basic Info tab, switch to the Care tab and add feeding instructions and forbidden foods, switch to the Medical tab and add a medication, then save
5. **Pet profile** — open the new pet's profile; show the info sections (feeding, medications, daily tasks list)
6. **Daily checklist** — open Biscuit's checklist; show the "0 of 2 completed" progress ring; check off "Morning Walk" and show the ring jump to 50%, the green progress bar, and the strikethrough; check off "Breakfast" and show "All done! 🎉"
7. **Dashboard progress bar** — navigate back to the dashboard and show Biscuit's card now reads "2/2 done" with a full green bar
8. **Proof of Life** — tap "Proof of Life" on Biscuit; show the banner with "2 tasks completed today"; select a completed task from the dropdown; add a caption; tap Upload and show the entry appear in the "Today's Photos" gallery
9. **Edit & delete** — open a pet profile, tap Edit, change a field, save; then show the delete button (do not delete if you want the data to persist for grading)
10. **Logout** — tap Log out and confirm the redirect back to the login screen
