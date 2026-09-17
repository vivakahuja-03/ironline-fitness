# Weekly Report — Week 2

**Intern:** Vivak Ahuja
**Project:** IronLine Fitness — Gym & Fitness Website
**Topic:** API Integration, Search/Filtering, Booking CRUD & BMI Calculator
**Week dates:** _fill in your actual start–end date_

---

## 1. Objective for the week

Turn the static pages into a fully interactive application: connect the
frontend to the FastAPI backend, add search and filtering, build the full
booking CRUD flow with MySQL persistence, and implement the BMI calculator
and validated contact form.

## 2. Tasks completed

- [ ] Built the FastAPI routes (`main.py`, `crud.py`) for programs, trainers,
      membership plans, bookings, and contact messages
- [ ] Built `api.js`, a shared fetch wrapper connecting the frontend to the API
- [ ] Wired the Programs and Trainers pages to live data from the API
- [ ] Implemented live search + category/specialty filtering on both pages
- [ ] Implemented the booking system: create a booking (Create), look up
      bookings by email (Read), reschedule (Update), and cancel (Delete) —
      all persisted in MySQL
- [ ] Implemented the BMI calculator with metric/imperial unit switching and
      input validation
- [ ] Implemented the contact/registration form with client-side and
      server-side validation
- [ ] Added reusable rendering functions (`components.js`) used across
      multiple pages (program cards, trainer cards, plan cards, booking rows)

## 3. Technologies & tools used

JavaScript (Fetch API, DOM manipulation, event delegation), Python, FastAPI,
Pydantic (server-side validation), SQLAlchemy, MySQL.

## 4. Key files/components built

`backend/main.py`, `backend/crud.py`, `backend/schemas.py`,
`frontend/js/api.js`, `frontend/js/components.js`, `frontend/js/programs.js`,
`frontend/js/trainers.js`, `frontend/js/bookings.js`, `frontend/js/bmi.js`,
`frontend/js/contact.js`, `frontend/bookings.html`, `frontend/bmi.html`,
`frontend/contact.html`

## 5. Challenges faced

_Fill in anything that actually gave you trouble this week — e.g. CORS
errors between frontend and backend, handling async fetch errors, form
validation edge cases — and how you resolved it._

## 6. What I learned

_Fill in — e.g. what you learned about REST APIs, CRUD design, or
client-side vs. server-side validation._

## 7. Plan for next week

Full responsive design pass across all breakpoints, cross-browser/device
testing, bug fixes, documentation, deployment, and preparing the submission
materials (screenshots, README, demo recording).
