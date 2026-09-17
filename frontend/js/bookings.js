document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bookingForm");
  const contextLine = document.getElementById("bookingContext");
  const programIdInput = document.getElementById("programId");
  const trainerIdInput = document.getElementById("trainerId");

  const fields = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    date: document.getElementById("date"),
    time: document.getElementById("time"),
  };
  const errors = {
    name: document.getElementById("nameError"),
    email: document.getElementById("emailError"),
    phone: document.getElementById("phoneError"),
    date: document.getElementById("dateError"),
    time: document.getElementById("timeError"),
  };
  const statusBox = document.getElementById("bookingStatus");

  const lookupEmail = document.getElementById("lookupEmail");
  const lookupBtn = document.getElementById("lookupBtn");
  const bookingList = document.getElementById("bookingList");

  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const id = params.get("id");
  const name = params.get("name");

  if (type && id) {
    if (type === "program") programIdInput.value = id;
    if (type === "trainer") trainerIdInput.value = id;
    contextLine.textContent = `Booking: ${name || "selected session"}. Pick a date and time below.`;
  }

  fields.date.min = new Date().toISOString().split("T")[0];

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9+()\-\s]{7,20}$/;

  function setError(field, message) {
    errors[field].textContent = message;
    fields[field].closest(".field").classList.toggle("has-error", Boolean(message));
  }

  function validateForm() {
    let valid = true;

    if (fields.name.value.trim().length < 2) {
      setError("name", "Enter your full name (at least 2 characters).");
      valid = false;
    } else setError("name", "");

    if (!emailPattern.test(fields.email.value.trim())) {
      setError("email", "Enter a valid email address.");
      valid = false;
    } else setError("email", "");

    if (fields.phone.value.trim() && !phonePattern.test(fields.phone.value.trim())) {
      setError("phone", "Enter a valid phone number, or leave this blank.");
      valid = false;
    } else setError("phone", "");

    if (!fields.date.value) {
      setError("date", "Choose a preferred date.");
      valid = false;
    } else setError("date", "");

    if (!fields.time.value) {
      setError("time", "Choose a preferred time.");
      valid = false;
    } else setError("time", "");

    return valid;
  }

  function showStatus(message, isError) {
    statusBox.textContent = message;
    statusBox.className = `form-status show ${isError ? "error" : "success"}`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim() || null,
      program_id: programIdInput.value ? Number(programIdInput.value) : null,
      trainer_id: trainerIdInput.value ? Number(trainerIdInput.value) : null,
      preferred_date: fields.date.value,
      preferred_time: fields.time.value,
    };

    try {
      await api.createBooking(payload);
      showStatus("Booking confirmed! Look it up below using your email.", false);
      form.reset();
      lookupEmail.value = payload.email;
      loadBookings(payload.email);
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  async function loadBookings(email) {
    if (!email) return;
    bookingList.innerHTML = "<p class=\"empty-state\">Loading…</p>";
    try {
      const bookings = await api.getBookingsByEmail(email);
      renderBookings(bookings);
    } catch (err) {
      bookingList.innerHTML = emptyState(err.message);
    }
  }

  function renderBookings(bookings) {
    if (!bookings.length) {
      bookingList.innerHTML = emptyState("No bookings found for that email yet.");
      return;
    }
    bookingList.innerHTML = bookings.map(bookingRow).join("");
  }

  lookupBtn.addEventListener("click", () => loadBookings(lookupEmail.value.trim()));

  bookingList.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = btn.closest(".booking-row");
    const bookingId = row.dataset.bookingId;

    if (btn.dataset.action === "cancel") {
      if (!confirm("Cancel this booking?")) return;
      try {
        await api.deleteBooking(bookingId);
        row.remove();
      } catch (err) {
        alert(err.message);
      }
      return;
    }

    if (btn.dataset.action === "reschedule") {
      openRescheduleForm(row, bookingId);
    }
  });

  function openRescheduleForm(row, bookingId) {
    if (row.querySelector(".reschedule-form")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "reschedule-form form-grid";
    wrapper.style.marginTop = "0.75rem";
    wrapper.innerHTML = `
      <div class="field">
        <label>New date</label>
        <input type="date" class="new-date" min="${new Date().toISOString().split("T")[0]}" required />
      </div>
      <div class="field">
        <label>New time</label>
        <input type="time" class="new-time" required />
      </div>
      <div class="row-actions">
        <button class="btn btn-sm" data-action="save-reschedule">Save</button>
        <button class="btn btn-outline btn-sm" data-action="cancel-reschedule">Cancel</button>
      </div>
      <p class="error-msg reschedule-error"></p>
    `;
    row.appendChild(wrapper);

    wrapper.querySelector('[data-action="cancel-reschedule"]').addEventListener("click", () => {
      wrapper.remove();
    });

    wrapper.querySelector('[data-action="save-reschedule"]').addEventListener("click", async () => {
      const newDate = wrapper.querySelector(".new-date").value;
      const newTime = wrapper.querySelector(".new-time").value;
      const errBox = wrapper.querySelector(".reschedule-error");

      if (!newDate || !newTime) {
        errBox.textContent = "Choose both a new date and time.";
        return;
      }

      try {
        await api.updateBooking(bookingId, { preferred_date: newDate, preferred_time: newTime, status: "confirmed" });
        loadBookings(lookupEmail.value.trim());
      } catch (err) {
        errBox.textContent = err.message;
      }
    });
  }
});
