# Weekly Report — Week 1

**Intern:** Vivak Ahuja
**Project:** IronLine Fitness — Gym & Fitness Website
**Topic:** Project Setup, Database Design & Static Pages
**Week dates:** _fill in your actual start–end date_

---

## 1. Objective for the week

Set up the project's foundation: repository structure, database schema, backend
skeleton, and the static (non-interactive) pages of the site — Home, Programs,
Trainers, and Membership — with a consistent, responsive layout.

## 2. Tasks completed

- [ ] Created the GitHub repository and pushed the initial project structure
- [ ] Set up a MySQL database (`gym_fitness_db`) and designed the schema:
      `trainers`, `programs`, `membership_plans`, `bookings`, `contact_messages`
- [ ] Built the FastAPI backend skeleton (`database.py`, `models.py`,
      `schemas.py`) and confirmed the app connects to MySQL
- [ ] Wrote `seed_data.py` and populated sample trainers, programs, and plans
- [ ] Built the shared design system (`style.css`) — colors, typography,
      buttons, navigation, card grid, responsive breakpoints
- [ ] Built the responsive navbar with a mobile hamburger menu (`nav.js`)
- [ ] Built the Home page (`index.html`) with hero section and feature highlights
- [ ] Built the Programs, Trainers, and Membership pages (static layout,
      not yet wired to live data)

## 3. Technologies & tools used

HTML5, CSS3 (custom properties, Flexbox/Grid, media queries), Python, FastAPI,
SQLAlchemy, MySQL, Git & GitHub.

## 4. Key files/components built

`backend/database.py`, `backend/models.py`, `backend/schemas.py`,
`backend/seed_data.py`, `frontend/css/style.css`, `frontend/js/nav.js`,
`frontend/index.html`, `frontend/programs.html`, `frontend/trainers.html`,
`frontend/membership.html`

## 5. Challenges faced

_Fill in anything that actually gave you trouble this week — e.g. MySQL
connection errors, environment setup, CSS layout issues — and how you
resolved it._

## 6. What I learned

_Fill in — e.g. what you learned about SQLAlchemy models, responsive CSS,
or structuring a multi-page site._

## 7. Plan for next week

Wire the static pages to live backend data, and build the interactive
features: search/filtering, the booking CRUD system, and the BMI calculator.
