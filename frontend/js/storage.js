// storage.js — Local Storage data layer.
//
// This is the PRIMARY data store for the site (per the project's Local
// Storage requirement). It seeds itself once with the same sample data
// used in the optional backend/MySQL version, then supports full CRUD.
//
// api.js is the only file that talks to this one directly — every page
// (programs.js, trainers.js, bookings.js, etc.) goes through api.js, so
// none of them need to know whether data is coming from here or from the
// optional backend.

const STORAGE_PREFIX = "ironline_";
const ADMIN_KEY_DEFAULT = "admin123"; // used only in Local Storage mode

const SEED_TRAINERS = [
  { id: 1, name: "Amir Khan", specialty: "Strength", bio: "Powerlifting coach focused on safe, progressive strength gains.", experience_years: 6 },
  { id: 2, name: "Sara Malik", specialty: "Yoga", bio: "RYT-200 certified instructor blending mobility and mindfulness.", experience_years: 4 },
  { id: 3, name: "Bilal Ahmed", specialty: "Cardio", bio: "Runs HIIT and endurance sessions built around real event training.", experience_years: 5 },
  { id: 4, name: "Hina Raza", specialty: "Yoga", bio: "Specializes in beginner-friendly flexibility and recovery flows.", experience_years: 3 },
];

const SEED_PROGRAMS = [
  { id: 1, name: "Iron Foundations", category: "Strength", description: "Barbell fundamentals: squat, press, deadlift.", duration_minutes: 60, difficulty: "Beginner" },
  { id: 2, name: "Power Circuit", category: "Strength", description: "High-load circuit training for experienced lifters.", duration_minutes: 50, difficulty: "Advanced" },
  { id: 3, name: "Sunrise Flow", category: "Yoga", description: "Gentle morning flow to open up the whole body.", duration_minutes: 45, difficulty: "Beginner" },
  { id: 4, name: "Sprint Interval", category: "Cardio", description: "Short, intense intervals for fat loss and endurance.", duration_minutes: 30, difficulty: "Intermediate" },
  { id: 5, name: "HIIT Burn", category: "HIIT", description: "Full-body high-intensity intervals, minimal rest.", duration_minutes: 40, difficulty: "Advanced" },
];

const SEED_PLANS = [
  { id: 1, name: "Basic", price: 2500, billing_period: "month", features: "Gym floor access,Locker room,Free fitness assessment", is_featured: 0 },
  { id: 2, name: "Standard", price: 5000, billing_period: "month", features: "Everything in Basic,All group classes,2 trainer sessions/month", is_featured: 1 },
  { id: 3, name: "Premium", price: 9000, billing_period: "month", features: "Everything in Standard,Unlimited trainer sessions,Nutrition plan,Guest passes", is_featured: 0 },
];

function readCollection(name) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + name);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function writeCollection(name, list) {
  localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(list));
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function ensureSeeded() {
  if (localStorage.getItem(STORAGE_PREFIX + "seeded")) return;
  writeCollection("trainers", SEED_TRAINERS);
  writeCollection("programs", SEED_PROGRAMS);
  writeCollection("plans", SEED_PLANS);
  writeCollection("bookings", []);
  writeCollection("contacts", []);
  writeCollection("payments", []);
  localStorage.setItem(STORAGE_PREFIX + "seeded", "1");
}

// ---- Validation helpers (mirrors the backend's Pydantic checks closely
// enough to give the same user-facing behavior in both modes) ----

function requireMinLength(value, min, fieldLabel) {
  if (!value || String(value).trim().length < min) {
    throw new Error(`${fieldLabel} must be at least ${min} characters.`);
  }
}

function requireEmail(value) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(String(value || "").trim())) {
    throw new Error("Enter a valid email address.");
  }
}

// ---- Trainers ----

const storage = {
  ADMIN_KEY_DEFAULT,

  init() {
    ensureSeeded();
  },

  checkAdminKey(key) {
    const expected = localStorage.getItem(STORAGE_PREFIX + "admin_key") || ADMIN_KEY_DEFAULT;
    if (!key || key !== expected) {
      throw new Error("Invalid or missing admin key");
    }
    return true;
  },

  getTrainers(specialty) {
    ensureSeeded();
    let list = readCollection("trainers");
    if (specialty) list = list.filter((t) => t.specialty === specialty);
    return list;
  },

  createTrainer(data, adminKey) {
    this.checkAdminKey(adminKey);
    requireMinLength(data.name, 2, "Trainer name");
    const list = readCollection("trainers");
    const record = { id: nextId(list), experience_years: 0, bio: null, ...data };
    list.push(record);
    writeCollection("trainers", list);
    return record;
  },

  updateTrainer(id, updates, adminKey) {
    this.checkAdminKey(adminKey);
    const list = readCollection("trainers");
    const idx = list.findIndex((t) => Number(t.id) === Number(id));
    if (idx === -1) throw new Error("Trainer not found");
    list[idx] = { ...list[idx], ...updates };
    writeCollection("trainers", list);
    return list[idx];
  },

  deleteTrainer(id, adminKey) {
    this.checkAdminKey(adminKey);
    const list = readCollection("trainers");
    const next = list.filter((t) => Number(t.id) !== Number(id));
    if (next.length === list.length) throw new Error("Trainer not found");
    writeCollection("trainers", next);
    return true;
  },

  // ---- Programs ----

  getPrograms(category) {
    ensureSeeded();
    let list = readCollection("programs");
    if (category) list = list.filter((p) => p.category === category);
    return list;
  },

  createProgram(data, adminKey) {
    this.checkAdminKey(adminKey);
    requireMinLength(data.name, 2, "Program name");
    const list = readCollection("programs");
    const record = { id: nextId(list), description: null, ...data };
    list.push(record);
    writeCollection("programs", list);
    return record;
  },

  updateProgram(id, updates, adminKey) {
    this.checkAdminKey(adminKey);
    const list = readCollection("programs");
    const idx = list.findIndex((p) => Number(p.id) === Number(id));
    if (idx === -1) throw new Error("Program not found");
    list[idx] = { ...list[idx], ...updates };
    writeCollection("programs", list);
    return list[idx];
  },

  deleteProgram(id, adminKey) {
    this.checkAdminKey(adminKey);
    const list = readCollection("programs");
    const next = list.filter((p) => Number(p.id) !== Number(id));
    if (next.length === list.length) throw new Error("Program not found");
    writeCollection("programs", next);
    return true;
  },

  // ---- Membership plans (read-only from the public site) ----

  getMembershipPlans() {
    ensureSeeded();
    return readCollection("plans");
  },

  getMembershipPlan(id) {
    ensureSeeded();
    return readCollection("plans").find((p) => Number(p.id) === Number(id)) || null;
  },

  // ---- Bookings ----

  createBooking(data) {
    requireMinLength(data.name, 2, "Name");
    requireEmail(data.email);
    if (!data.preferred_date) throw new Error("Choose a preferred date.");
    if (!data.preferred_time) throw new Error("Choose a preferred time.");

    const list = readCollection("bookings");
    const record = {
      id: nextId(list),
      phone: null,
      program_id: null,
      trainer_id: null,
      status: "pending",
      created_at: new Date().toISOString(),
      ...data,
    };
    list.push(record);
    writeCollection("bookings", list);
    return record;
  },

  getBookingsByEmail(email) {
    return readCollection("bookings").filter(
      (b) => b.email.toLowerCase() === String(email || "").toLowerCase()
    );
  },

  getAllBookings() {
    return readCollection("bookings");
  },

  updateBooking(id, updates) {
    const list = readCollection("bookings");
    const idx = list.findIndex((b) => Number(b.id) === Number(id));
    if (idx === -1) throw new Error("Booking not found");
    list[idx] = { ...list[idx], ...updates };
    writeCollection("bookings", list);
    return list[idx];
  },

  deleteBooking(id) {
    const list = readCollection("bookings");
    const next = list.filter((b) => Number(b.id) !== Number(id));
    if (next.length === list.length) throw new Error("Booking not found");
    writeCollection("bookings", next);
    return true;
  },

  // ---- Contact messages ----

  createContactMessage(data) {
    requireMinLength(data.name, 2, "Name");
    requireEmail(data.email);
    requireMinLength(data.message, 5, "Message");

    const list = readCollection("contacts");
    const record = {
      id: nextId(list),
      phone: null,
      subject: null,
      created_at: new Date().toISOString(),
      ...data,
    };
    list.push(record);
    writeCollection("contacts", list);
    return record;
  },

  // ---- Payments (simulated checkout — see payments.js for why) ----

  createPayment(plan, customerEmail, customerName) {
    const list = readCollection("payments");
    const record = {
      id: nextId(list),
      plan_id: plan.id,
      plan_name: plan.name,
      customer_email: customerEmail,
      customer_name: customerName || null,
      amount: plan.price,
      currency: "PKR",
      status: "pending",
      created_at: new Date().toISOString(),
    };
    list.push(record);
    writeCollection("payments", list);
    return record;
  },

  markPaymentPaid(id) {
    const list = readCollection("payments");
    const idx = list.findIndex((p) => Number(p.id) === Number(id));
    if (idx === -1) throw new Error("Payment not found");
    list[idx].status = "paid";
    writeCollection("payments", list);
    return list[idx];
  },

  getPayment(id) {
    return readCollection("payments").find((p) => Number(p.id) === Number(id)) || null;
  },

  getPaymentsByEmail(email) {
    return readCollection("payments").filter(
      (p) => p.customer_email.toLowerCase() === String(email || "").toLowerCase()
    );
  },
};