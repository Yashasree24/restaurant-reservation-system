# Restaurant Reservation Management System

A full-stack MERN application for managing restaurant table reservations, with
separate customer and administrator experiences.

**Stack:** React (Vite) · Node.js/Express · MongoDB (Mongoose) · JWT auth

---

## 1. Project Structure

```
restaurant-reservation-system/
├── server/     Express API (auth, reservations, tables, admin)
└── client/     React frontend (Vite)
```

## 2. Setup Instructions

### Prerequisites
- Node.js 18+
- A MongoDB instance (local install, Docker, or a free MongoDB Atlas cluster)

### Backend

```bash
cd server
cp .env.example .env      # then edit MONGO_URI / JWT_SECRET as needed
npm install
npm run seed               # populates 8 default tables (capacities 2–8)
npm run dev                 # starts on http://localhost:5000
```

### Frontend

```bash
cd client
cp .env.example .env      # VITE_API_BASE_URL should point at the backend
npm install
npm run dev                 # starts on http://localhost:5173
```

Open `http://localhost:5173`, register an account, and start booking. To try
the admin view, register again with the **"Register as administrator"**
checkbox ticked (see Assumptions below for why this exists).

### Production build (frontend)
```bash
npm run build   # outputs static files to client/dist
```

---

## 3. Assumptions Made

- **Single restaurant, fixed tables.** Tables are seeded via `npm run seed`
  (8 tables, capacities 2–8) but can also be managed live from the Admin →
  Manage Tables screen.
- **Fixed time slots instead of free-form times.** The restaurant operates on
  five fixed, non-overlapping slots (`12:00-13:30`, `13:30-15:00`,
  `19:00-20:30`, `20:30-22:00`, `22:00-23:30`). This turns "prevent
  overlapping reservations" into a simple, reliable equality check (see
  §4) instead of interval-overlap math, which is safer to get right in a
  time-boxed assignment while still fully satisfying the requirement.
- **Self-service admin registration for evaluation convenience.** In a real
  product, admin accounts would be provisioned separately (e.g. by a
  super-admin or seeded directly in the database), not self-registered.
  Here, the registration form has an "administrator" checkbox purely so a
  reviewer can create both a customer and an admin account without touching
  the database. This is called out explicitly as a shortcut, not a
  production pattern.
- **Automatic table assignment on booking.** When a customer requests a
  reservation, the system automatically assigns the *smallest available*
  table that fits the party size, rather than letting the customer pick a
  specific table. This reflects how most reservation systems behave
  (you book "a table for 4", not "table #7") and keeps the availability
  logic centralized in one place.
- **Admins can still hand-pick a specific table** when editing a reservation,
  since they need finer control (e.g. accommodating a VIP or fixing a
  mistaken booking).
- **Cancelled reservations don't block a slot.** A table can have many
  cancelled reservations for the same date/slot; only `confirmed`
  reservations count toward availability.
- **Dates are stored as plain `YYYY-MM-DD` strings**, not `Date` objects, to
  avoid timezone drift between browser and server when comparing "is this
  slot already booked."

## 4. Reservation & Availability Logic

This is the core of the assignment, so it's worth spelling out precisely.

**Booking flow (`POST /api/reservations`):**
1. Validate `date` (not in the past, valid format), `timeSlot` (must be one
   of the fixed slots), and `guests` (positive integer).
2. Query all **active** tables with `capacity >= guests`, sorted smallest
   first.
3. Query all **confirmed** reservations for that exact `date` + `timeSlot`
   among those candidate tables.
4. Pick the first candidate table that has no confirmed reservation for that
   date/slot. If none exists, return `409 Conflict` with a clear message —
   this is what prevents both **double bookings** (same table, same
   date/slot) and **capacity conflicts** (a party of 6 can never land on a
   2-seat table).

**Admin updates (`PATCH /api/admin/reservations/:id`):** any change to
date/time/table/guest count that keeps the reservation `confirmed` is
re-validated against the same conflict logic — the reservation being edited
is excluded from its own conflict check (so setting the same slot on the
same table doesn't falsely conflict with itself).

**Cancellation:** sets `status: 'cancelled'` (soft delete) rather than
removing the document, preserving history for the admin view and freeing
up the slot for the same or another table.

## 5. Role-Based Access (Customer vs Admin)

- Every protected route requires a valid JWT (`Authorization: Bearer <token>`),
  verified by the `protect` middleware, which loads the user onto `req.user`.
- Admin-only routes (`/api/admin/*`) are additionally wrapped in an
  `authorize('admin')` middleware that rejects any non-admin with `403`.
- **Customers** can only ever read/cancel reservations where
  `reservation.user === req.user._id` — enforced server-side in the
  controller, not just hidden in the UI.
- **Admins** can view/filter all reservations and cancel or update any of
  them, and manage the table inventory.
- The frontend mirrors this with a `ProtectedRoute` component that redirects
  unauthenticated users to `/login` and non-admins away from `/admin/*`, and
  the admin UI uses a visually distinct dark-red navbar with an "ADMIN"
  badge so the two experiences are never confused.

## 6. API Overview

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Log in, receive JWT |
| GET | `/api/auth/me` | Authenticated | Current user profile |
| GET | `/api/tables` | Authenticated | List tables |
| GET | `/api/tables/time-slots` | Authenticated | List valid time slots |
| POST | `/api/reservations` | Customer | Create a reservation |
| GET | `/api/reservations/mine` | Customer | View own reservations |
| DELETE | `/api/reservations/:id` | Customer (own) | Cancel own reservation |
| GET | `/api/admin/reservations` | Admin | View all (filter by `?date=`, `?status=`) |
| PATCH | `/api/admin/reservations/:id` | Admin | Update any reservation |
| DELETE | `/api/admin/reservations/:id` | Admin | Cancel any reservation |
| POST/PATCH/DELETE | `/api/admin/tables` | Admin | Manage tables |

## 7. Deployment

This submission focuses on a working, well-structured codebase; deploying it
is a matter of standard steps on any Node-friendly host:

- **Backend:** Deploy `server/` to Render/Railway (Web Service). Set
  `MONGO_URI` (e.g. a free MongoDB Atlas cluster), `JWT_SECRET`, and
  `CLIENT_ORIGIN` (your deployed frontend URL) as environment variables.
  Run `npm run seed` once against the production database (e.g. via the
  platform's shell) to create the initial tables.
- **Frontend:** Deploy `client/` to Vercel/Netlify. Set
  `VITE_API_BASE_URL` to your deployed backend's `/api` URL.
- No secrets are hard-coded anywhere; both `.env` files are git-ignored and
  only `.env.example` templates are committed.

## 8. Known Limitations

- Time slots are fixed rather than fully configurable per-restaurant.
- No email/SMS confirmation (explicitly out of scope per the assignment).
- No pagination on the admin reservations list — fine at demo scale, would
  need it for a real restaurant's history.
- Admin self-registration (see Assumptions) is a convenience for evaluation
  and would be removed/locked down in production.
- No automated test suite was included given the 48-hour scope; validation
  was done via manual testing and boot-time checks of the API.

## 9. Areas for Improvement With Additional Time

- Configurable time slots and table layouts per restaurant.
- Waitlist support when a slot is fully booked.
- Pagination/search on the admin reservations table.
- Automated tests (Jest/Supertest for the API, React Testing Library for
  the client).
- Optimistic concurrency handling for the rare race condition where two
  requests for the last available table land at the same instant.
