# PetSitter Companion — Version 2 Roadmap

---

## Version 1 Summary

Version 1 of PetSitter Companion was intentionally scoped and completed to satisfy all required project rubric items before moving on to additional features planned for future versions. The following core requirements were implemented, tested, and documented:

- **Authentication** — User registration and login via Supabase Auth with session persistence and protected routes
- **CRUD functionality** — Full create, read, update, and delete for pets, medications, daily tasks, care logs, and proof-of-life photos
- **Supabase backend** — PostgreSQL database with Row Level Security, cascading deletes, and proper relational structure
- **Dashboard** — Live summary stats, per-pet progress bars reflecting today's completed tasks, and quick access navigation
- **Daily care tracking** — Task checklist with real-time completion toggling, time-grouped tasks, and progress visualization
- **Proof of Life photos** — Photo upload linked to completed tasks, persisted to Supabase, with a daily gallery view
- **Documentation** — Full project documentation including tech stack, CRUD resources, authentication summary, known limitations, and a video walkthrough guide
- **Testing** — Manually tested end-to-end using a demo account with pre-loaded pet profiles

Version 1 is complete, tested, and stable. Every feature decision during this phase was made with the goal of satisfying all required rubric items first, before expanding scope or adding complexity.

---

## Engineering Decisions

### Photo Storage

During my project proposal, I planned to use **Cloudinary (free tier)** for cloud-based photo storage, and this approach was discussed and approved as the intended solution for where pet photos would be stored.

For Version 1, I intentionally chose to use local static assets and data URLs rather than integrating Cloudinary. This was a deliberate engineering decision based on the following reasoning:

- The project rubric did not require cloud storage — the requirement was to implement proof-of-life photo functionality, which Version 1 successfully implements
- I wanted to complete all required functionality and verify it was working correctly before expanding the project scope
- Integrating Cloudinary close to the submission deadline would have added meaningful complexity — new API credentials, upload handling, error states, and additional testing requirements
- Keeping Version 1 stable and rubric-complete was the highest priority

This was an intentional design decision, not an omission. Cloudinary integration remains the planned approach for Version 2 and is described in detail below.

---

## Planned Version 2 Features

### Pet Profiles

**Expanded profile fields:**
- Pet sex / gender field — As someone with an educational background in veterinary science, I recognize that sex/gender is important information for medical records, medications, and overall pet care. It was intentionally deferred to Version 2 so Version 1 could remain focused on completing the required project functionality.
- Additional care notes and behavioral information
- Expanded medical history section

**Expanded animal categories:**
- Dogs
- Cats
- Small Animals (rabbits, hamsters, guinea pigs, etc.)
- Birds
- Reptiles
- Aquatic Animals
- Farm / Livestock
- Other

**Medical information:**
- Vaccination records with expiration tracking
- Veterinarian name, clinic, and contact information
- Emergency contacts specific to each pet

---

### Photos

- Replace local static demo images with **Cloudinary (free tier)** as originally planned
- Allow pet owners and sitters to upload photos directly from their phones through the app
- Store Cloudinary image URLs in the database instead of local asset paths or data URLs
- Build a full photo history and gallery for each pet — not just today's uploads, but a complete care timeline over the length of a sitting engagement

---

### User Experience

- Improved dashboard statistics with a clearer daily overview across all pets
- Daily care timeline view showing tasks in chronological order with completion history
- Push notifications or email alerts when all tasks are completed for a pet
- Improved owner and sitter communication features
- Better mobile experience with smoother navigation and loading states

---

### Pet Sitting Features

- **Shared access** — Allow a pet owner to grant a pet sitter access to their pets without sharing login credentials
- **QR code for emergency information** — Generate a scannable QR code for each pet containing key medical and contact details, accessible without an account
- **Visit history** — Log and view a history of care visits over time
- **Care notes** — Sitters can leave detailed notes per visit, visible to the owner
- **Medication reminders** — Scheduled reminders to ensure medications are not missed

---

### Future Integrations

- **Public deployment** — Host the application on a production platform (Vercel, Netlify, or similar) with a custom domain
- **External APIs** — Integrate relevant third-party APIs where appropriate (weather for outdoor activity planning, veterinary lookup, etc.)
- **Optional payment integration** — If PetSitter Companion expands into a full pet sitting service, integrate a payment layer (Stripe or similar) for booking and invoicing

---

## Long-Term Vision

The primary goal of PetSitter Companion is to give pet owners **peace of mind** — the confidence that while they are away, their pets are being cared for properly and that they can see it in real time.

The focus of this application is **communication, transparency, and care tracking**. It is not intended to become another pet sitting marketplace or booking platform. The value it offers is simple: a pet sitter documents their work, and the owner can see it. That connection — between the person who trusts and the person who is trusted — is what the application is built around.

Version 2 will build on the stable foundation established in Version 1, expanding the features that make that connection more complete, more reliable, and more useful for everyone involved.
