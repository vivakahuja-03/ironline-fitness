// api.js — single facade every page talks to.
//
// Local Storage (storage.js) is the PRIMARY data layer, matching the
// project's requirement to store data in Local Storage and deploy as a
// static site with no server needed.
//
// The FastAPI backend (backend/) is an OPTIONAL enhancement: if it happens
// to be running at API_BASE_URL, this file uses it instead — automatically,
// with no manual switch. On a static host (Vercel/Netlify) the backend is
// simply unreachable, so every call falls straight through to storage.js.

const API_BASE_URL = "http://127.0.0.1:8000";
const BACKEND_CHECK_TIMEOUT_MS = 1200;

let backendAvailablePromise = null;

async function isBackendAvailable() {
  if (backendAvailablePromise) return backendAvailablePromise;
  backendAvailablePromise = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), BACKEND_CHECK_TIMEOUT_MS);
      const res = await fetch(`${API_BASE_URL}/`, { signal: controller.signal });
      clearTimeout(timer);
      return res.ok;
    } catch (_) {
      return false;
    }
  })();
  return backendAvailablePromise;
}

async function apiRequest(path, options = {}, adminKey = null) {
  const headers = { "Content-Type": "application/json" };
  if (adminKey) headers["X-Admin-Key"] = adminKey;

  const res = await fetch(`${API_BASE_URL}${path}`, { headers, ...options });

  if (!res.ok) {
    let detail = "Something went wrong. Please try again.";
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {}
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  if (res.status === 204) return null;
  return res.json();
}

/**
 * Runs backendFn() if the backend is reachable, otherwise (or if backendFn
 * throws) falls back to localFn(). localFn is always synchronous storage.js
 * code, so it's wrapped to behave like the async backend calls.
 */
async function withFallback(backendFn, localFn) {
  if (await isBackendAvailable()) {
    try {
      return await backendFn();
    } catch (_) {
      // backend flaked mid-session — fall back rather than failing the request
    }
  }
  return localFn();
}

const api = {
  getPrograms: (category) =>
    withFallback(
      () => apiRequest(`/api/programs${category ? `?category=${encodeURIComponent(category)}` : ""}`),
      () => storage.getPrograms(category)
    ),

  getTrainers: (specialty) =>
    withFallback(
      () => apiRequest(`/api/trainers${specialty ? `?specialty=${encodeURIComponent(specialty)}` : ""}`),
      () => storage.getTrainers(specialty)
    ),

  getMembershipPlans: () =>
    withFallback(
      () => apiRequest("/api/membership-plans"),
      () => storage.getMembershipPlans()
    ),

  createBooking: (data) =>
    withFallback(
      () => apiRequest("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
      () => storage.createBooking(data)
    ),

  getBookingsByEmail: (email) =>
    withFallback(
      () => apiRequest(`/api/bookings?email=${encodeURIComponent(email)}`),
      () => storage.getBookingsByEmail(email)
    ),

  updateBooking: (id, data) =>
    withFallback(
      () => apiRequest(`/api/bookings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      () => storage.updateBooking(id, data)
    ),

  deleteBooking: (id) =>
    withFallback(
      () => apiRequest(`/api/bookings/${id}`, { method: "DELETE" }),
      () => storage.deleteBooking(id)
    ),

  submitContact: (data) =>
    withFallback(
      () => apiRequest("/api/contact", { method: "POST", body: JSON.stringify(data) }),
      () => storage.createContactMessage(data)
    ),

  createProgram: (data, key) =>
    withFallback(
      () => apiRequest("/api/programs", { method: "POST", body: JSON.stringify(data) }, key),
      () => storage.createProgram(data, key)
    ),

  updateProgram: (id, data, key) =>
    withFallback(
      () => apiRequest(`/api/programs/${id}`, { method: "PUT", body: JSON.stringify(data) }, key),
      () => storage.updateProgram(id, data, key)
    ),

  deleteProgram: (id, key) =>
    withFallback(
      () => apiRequest(`/api/programs/${id}`, { method: "DELETE" }, key),
      () => storage.deleteProgram(id, key)
    ),

  createTrainer: (data, key) =>
    withFallback(
      () => apiRequest("/api/trainers", { method: "POST", body: JSON.stringify(data) }, key),
      () => storage.createTrainer(data, key)
    ),

  updateTrainer: (id, data, key) =>
    withFallback(
      () => apiRequest(`/api/trainers/${id}`, { method: "PUT", body: JSON.stringify(data) }, key),
      () => storage.updateTrainer(id, data, key)
    ),

  deleteTrainer: (id, key) =>
    withFallback(
      () => apiRequest(`/api/trainers/${id}`, { method: "DELETE" }, key),
      () => storage.deleteTrainer(id, key)
    ),

  createCheckoutSession: (data) =>
    withFallback(
      () => apiRequest("/api/create-checkout-session", { method: "POST", body: JSON.stringify(data) }),
      () => {
        const plan = storage.getMembershipPlan(data.plan_id);
        if (!plan) throw new Error("Membership plan not found");
        const payment = storage.createPayment(plan, data.customer_email, data.customer_name);
        // No real backend to run a payment gateway against — simulate an
        // instant successful checkout so the CRUD/demo flow stays whole in
        // pure-frontend mode. See payments.js for the disclosure shown to
        // the user before this fires.
        storage.markPaymentPaid(payment.id);
        return { checkout_url: `payment-success.html?payment_id=${payment.id}&simulated=1`, payment_id: payment.id };
      }
    ),

  getPayment: (paymentId) =>
    withFallback(
      () => apiRequest(`/api/payments/${encodeURIComponent(paymentId)}`),
      () => {
        const payment = storage.getPayment(paymentId);
        if (!payment) throw new Error("Payment not found");
        return payment;
      }
    ),
};