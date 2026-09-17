# IronLine Fitness — Gym & Fitness Website

A gym website built with **HTML, CSS, and vanilla JavaScript** on the frontend,
and a **Python (FastAPI) + MySQL** backend for real data persistence — built
for the Front-End Development internship assignment.

## Features

- **Programs** page — browse workout programs with live search + category filter
- **Trainers** page — browse trainers with live search + specialty filter
- **Membership** page — plan comparison pulled from the database
- **BMI calculator** — interactive, unit-switching, client-side validated
- **Bookings** page — full CRUD: create a booking, look bookings up by email,
  reschedule (update), or cancel (delete) — all persisted in MySQL
- **Contact/registration form** — validated, saved to the database
- **Favorites** — save programs/trainers with a heart button; stored in
  `localStorage` and viewable on a dedicated Favorites page
- **Dark/light mode** — toggle in the nav, preference remembered via `localStorage`
- **Testimonials** section on the Home page
- **About** page — story, mission, facilities, stats
- **Admin dashboard** (`admin.html`) — full CRUD for programs and trainers,
  gated behind a shared admin key (see "Admin access" below)
- Fully responsive layout (mobile, tablet, desktop) with a mobile nav menu
- No console errors, no external UI framework — plain HTML/CSS/JS calling a REST API

## Project structure

```
gym-fitness-app/
├── .vscode/               # editor config — extensions, debug config, settings
├── .gitignore
├── backend/
│   ├── main.py           # FastAPI app + all routes
│   ├── models.py         # SQLAlchemy table models
│   ├── schemas.py        # Pydantic request/response validation
│   ├── crud.py           # Database read/write functions
│   ├── database.py       # DB connection setup
│   ├── seed_data.py      # Populates sample trainers/programs/plans
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html, programs.html, trainers.html, membership.html,
│   │   bmi.html, bookings.html, contact.html, about.html,
│   │   favorites.html, admin.html
│   ├── css/style.css        # includes dark mode + admin dashboard styles
│   └── js/
│       ├── api.js           # fetch wrapper for the backend
│       ├── nav.js           # mobile nav toggle
│       ├── theme.js         # dark/light mode toggle (localStorage)
│       ├── favorites.js     # shared favorites logic (localStorage)
│       ├── components.js    # reusable card-rendering functions
│       ├── programs.js, trainers.js, bmi.js, bookings.js, contact.js
│       ├── home.js          # testimonials
│       ├── favorites-page.js
│       └── admin.js         # admin dashboard CRUD
└── README.md
```

## Running this in VS Code

This repo includes a `.vscode/` folder (recommended extensions, a debug
config for the backend, and workspace settings) so it works with minimal
setup. Open the **project root folder** (`gym-fitness-app/`) in VS Code —
not the `backend/` or `frontend/` subfolder — so both configs apply.

### 1. Install the recommended extensions

VS Code will prompt "This workspace has extension recommendations" — click
**Install All**. If it doesn't prompt, open the Extensions panel and
install manually:
- **Live Server** (ritwickdey.LiveServer) — serves the frontend with live reload
- **Python** (ms-python.python) — Python support + debugging

### 2. Set up MySQL

Create the database (using MySQL Workbench, the `mysql` CLI, or any client):
```sql
CREATE DATABASE gym_fitness_db;
```

### 3. Set up the backend

Open a VS Code integrated terminal (`` Ctrl+` `` / `` Cmd+` ``) and run:
```bash
cd backend
python -m venv venv
```
Activate it — `venv\Scripts\activate` on Windows, `source venv/bin/activate`
on macOS/Linux — then:
```bash
pip install -r requirements.txt
cp .env.example .env
```
Open the new `.env` and fill in your real MySQL username/password and your
own `ADMIN_KEY` value.

**Select the interpreter:** press `Ctrl+Shift+P` / `Cmd+Shift+P` → "Python:
Select Interpreter" → choose the one inside `backend/venv`. This is what
makes the debug config and inline linting work correctly.

Populate sample data, then start the server — either run
```bash
python seed_data.py
uvicorn main:app --reload
```
in the terminal, **or** press `F5` and pick "Backend: FastAPI (uvicorn)"
from the included launch config to run it under the debugger (breakpoints
work here). Confirm it's running at http://127.0.0.1:8000/docs.

### 4. Run the frontend

In the VS Code file explorer, right-click `frontend/index.html` → **Open
with Live Server**. It opens in your browser with live reload — edit any
HTML/CSS/JS file and it refreshes automatically. The included workspace
settings already point Live Server at the `frontend/` folder.

`frontend/js/api.js` already points at `http://127.0.0.1:8000`, matching
the backend above, so no further configuration is needed for local use.

### 5. Try the admin dashboard

Open `admin.html` from the site nav (or its footer link), enter the
`ADMIN_KEY` you set in `.env`, and you can add/edit/delete programs and
trainers — changes save straight to MySQL.

## Deployment

- **Backend + MySQL**: deploy to [Railway](https://railway.app) or
  [Render](https://render.com) — both offer a managed MySQL add-on and can
  run a FastAPI app directly from this repo. Set the same environment
  variables from `.env.example` in their dashboard.
- **Frontend**: deploy the `frontend/` folder to Vercel or Netlify as a
  static site. After the backend is deployed, update `API_BASE_URL` in
  `frontend/js/api.js` to the live backend URL, and add your deployed
  frontend URL to `CORS_ORIGINS` in the backend's environment variables.

## Admin access

The admin dashboard (`admin.html`) manages programs and trainers directly in
the database. It's gated by a shared key, not a real login system:

1. Set `ADMIN_KEY` in the backend's `.env` to your own value.
2. Open `admin.html`, enter that same key, and click "Unlock dashboard."
3. The key is kept in `sessionStorage` (cleared when the tab closes) and
   sent as an `X-Admin-Key` header on every create/update/delete request.

This is intentionally lightweight — enough to keep the admin routes from
being wide open, but **not** production-grade authentication (no hashing,
no per-user accounts, no rate limiting). Don't reuse this pattern for a
site handling real user data without adding proper auth.

## Notes

- Bookings are looked up by email instead of a login system, to keep the
  scope focused on CRUD + validation rather than authentication.
- Trainer/program images use CSS avatar blocks as placeholders — swap in
  real photos by adding `image_url` values in `seed_data.py`.
- Favorites and theme preference are personal, device-local settings, so
  they're stored in `localStorage` rather than the database — everything
  else (bookings, contact messages, programs, trainers) lives in MySQL.
