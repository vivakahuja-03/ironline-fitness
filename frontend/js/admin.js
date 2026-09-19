document.addEventListener("DOMContentLoaded", () => {
  const ADMIN_KEY_STORAGE = "ironline-admin-key";

  const gate = document.getElementById("adminGate");
  const dashboard = document.getElementById("adminDashboard");
  const gateError = document.getElementById("gateError");

  function getAdminKey() {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE);
  }

  function showDashboard() {
    gate.style.display = "none";
    dashboard.style.display = "block";
    loadPrograms();
    loadTrainers();
  }

  if (getAdminKey()) showDashboard();

  document.getElementById("unlockBtn").addEventListener("click", () => {
    const key = document.getElementById("adminKeyInput").value.trim();
    if (!key) {
      gateError.textContent = "Enter the admin key.";
      return;
    }
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
    gateError.textContent = "";
    showDashboard();
  });

  document.getElementById("lockBtn").addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    dashboard.style.display = "none";
    gate.style.display = "block";
    document.getElementById("adminKeyInput").value = "";
  });

  const tabs = document.querySelectorAll(".chip[data-tab]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-pressed", "false"));
      tab.setAttribute("aria-pressed", "true");
      document.getElementById("programsTab").style.display = tab.dataset.tab === "programs" ? "block" : "none";
      document.getElementById("trainersTab").style.display = tab.dataset.tab === "trainers" ? "block" : "none";
      document.getElementById("bookingsTab").style.display = tab.dataset.tab === "bookings" ? "block" : "none";
      if (tab.dataset.tab === "bookings") loadBookings();
    });
  });

  function handleAuthError(err, errorBox) {
    if (err.message.toLowerCase().includes("admin key")) {
      errorBox.textContent = "Admin key was rejected. Click Lock and re-enter the correct key.";
    } else {
      errorBox.textContent = err.message;
    }
  }

  const programForm = document.getElementById("programForm");
  const programFormError = document.getElementById("programFormError");

  function programRow(p) {
    return `
      <tr data-id="${p.id}">
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${p.difficulty}</td>
        <td>${p.duration_minutes} min</td>
        <td class="admin-actions">
          <button class="btn btn-outline btn-sm" data-action="edit-program">Edit</button>
          <button class="btn btn-outline btn-sm" data-action="delete-program">Delete</button>
        </td>
      </tr>
    `;
  }

  let programsCache = [];

  async function loadPrograms() {
    try {
      programsCache = await api.getPrograms();
      document.getElementById("programsTableBody").innerHTML = programsCache.map(programRow).join("");
    } catch (err) {
      document.getElementById("programsTableBody").innerHTML = `<tr><td colspan="5">${err.message}</td></tr>`;
    }
  }

  document.getElementById("addProgramBtn").addEventListener("click", () => {
    programForm.reset();
    document.getElementById("programId").value = "";
    programForm.classList.add("open");
  });
  document.getElementById("cancelProgramForm").addEventListener("click", () => {
    programForm.classList.remove("open");
  });

  document.getElementById("programsTableBody").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = btn.closest("tr");
    const id = Number(row.dataset.id);
    const program = programsCache.find((p) => p.id === id);

    if (btn.dataset.action === "edit-program") {
      document.getElementById("programId").value = program.id;
      document.getElementById("programName").value = program.name;
      document.getElementById("programCategory").value = program.category;
      document.getElementById("programDifficulty").value = program.difficulty;
      document.getElementById("programDuration").value = program.duration_minutes;
      document.getElementById("programDescription").value = program.description || "";
      programForm.classList.add("open");
    }

    if (btn.dataset.action === "delete-program") {
      if (!confirm(`Delete "${program.name}"?`)) return;
      api.deleteProgram(id, getAdminKey())
        .then(loadPrograms)
        .catch((err) => handleAuthError(err, programFormError));
    }
  });

  programForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    programFormError.textContent = "";

    const payload = {
      name: document.getElementById("programName").value.trim(),
      category: document.getElementById("programCategory").value,
      difficulty: document.getElementById("programDifficulty").value,
      duration_minutes: Number(document.getElementById("programDuration").value),
      description: document.getElementById("programDescription").value.trim() || null,
    };

    if (payload.name.length < 2) {
      programFormError.textContent = "Enter a program name (at least 2 characters).";
      return;
    }

    const id = document.getElementById("programId").value;
    try {
      if (id) {
        await api.updateProgram(id, payload, getAdminKey());
      } else {
        await api.createProgram(payload, getAdminKey());
      }
      programForm.classList.remove("open");
      programForm.reset();
      loadPrograms();
    } catch (err) {
      handleAuthError(err, programFormError);
    }
  });

  const trainerForm = document.getElementById("trainerForm");
  const trainerFormError = document.getElementById("trainerFormError");

  function trainerRow(t) {
    return `
      <tr data-id="${t.id}">
        <td>${t.name}</td>
        <td>${t.specialty}</td>
        <td>${t.experience_years} yrs</td>
        <td class="admin-actions">
          <button class="btn btn-outline btn-sm" data-action="edit-trainer">Edit</button>
          <button class="btn btn-outline btn-sm" data-action="delete-trainer">Delete</button>
        </td>
      </tr>
    `;
  }

  let trainersCache = [];

  async function loadTrainers() {
    try {
      trainersCache = await api.getTrainers();
      document.getElementById("trainersTableBody").innerHTML = trainersCache.map(trainerRow).join("");
    } catch (err) {
      document.getElementById("trainersTableBody").innerHTML = `<tr><td colspan="4">${err.message}</td></tr>`;
    }
  }

  document.getElementById("addTrainerBtn").addEventListener("click", () => {
    trainerForm.reset();
    document.getElementById("trainerId").value = "";
    trainerForm.classList.add("open");
  });
  document.getElementById("cancelTrainerForm").addEventListener("click", () => {
    trainerForm.classList.remove("open");
  });

  document.getElementById("trainersTableBody").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = btn.closest("tr");
    const id = Number(row.dataset.id);
    const trainer = trainersCache.find((t) => t.id === id);

    if (btn.dataset.action === "edit-trainer") {
      document.getElementById("trainerId").value = trainer.id;
      document.getElementById("trainerName").value = trainer.name;
      document.getElementById("trainerSpecialty").value = trainer.specialty;
      document.getElementById("trainerExperience").value = trainer.experience_years;
      document.getElementById("trainerBio").value = trainer.bio || "";
      trainerForm.classList.add("open");
    }

    if (btn.dataset.action === "delete-trainer") {
      if (!confirm(`Delete "${trainer.name}"?`)) return;
      api.deleteTrainer(id, getAdminKey())
        .then(loadTrainers)
        .catch((err) => handleAuthError(err, trainerFormError));
    }
  });

  trainerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    trainerFormError.textContent = "";

    const payload = {
      name: document.getElementById("trainerName").value.trim(),
      specialty: document.getElementById("trainerSpecialty").value,
      experience_years: Number(document.getElementById("trainerExperience").value),
      bio: document.getElementById("trainerBio").value.trim() || null,
    };

    if (payload.name.length < 2) {
      trainerFormError.textContent = "Enter a trainer name (at least 2 characters).";
      return;
    }

    const id = document.getElementById("trainerId").value;
    try {
      if (id) {
        await api.updateTrainer(id, payload, getAdminKey());
      } else {
        await api.createTrainer(payload, getAdminKey());
      }
      trainerForm.classList.remove("open");
      trainerForm.reset();
      loadTrainers();
    } catch (err) {
      handleAuthError(err, trainerFormError);
    }
  });

  // ---- Bookings: confirm or cancel what customers submitted ----

  const bookingsTableBody = document.getElementById("bookingsTableBody");
  let bookingsCache = [];

  function bookingAdminRow(b) {
    const target = b.program_id ? `Program #${b.program_id}` : b.trainer_id ? `Trainer #${b.trainer_id}` : "Session";
    const canAct = b.status === "pending";
    return `
      <tr data-id="${b.id}">
        <td>${b.name}<br><small>${b.email}</small></td>
        <td>${target}</td>
        <td>${b.preferred_date} at ${b.preferred_time}</td>
        <td><span class="status-pill status-${b.status}">${b.status}</span></td>
        <td class="admin-actions">
          ${canAct ? `<button class="btn btn-sm" data-action="confirm-booking">Confirm</button>` : ""}
          ${canAct ? `<button class="btn btn-outline btn-sm" data-action="cancel-booking">Cancel</button>` : ""}
          ${!canAct ? "—" : ""}
        </td>
      </tr>
    `;
  }

  async function loadBookings() {
    try {
      bookingsCache = await api.getAllBookings(getAdminKey());
      bookingsTableBody.innerHTML = bookingsCache.length
        ? bookingsCache.map(bookingAdminRow).join("")
        : `<tr><td colspan="5">No bookings yet.</td></tr>`;
    } catch (err) {
      bookingsTableBody.innerHTML = `<tr><td colspan="5">${err.message}</td></tr>`;
    }
  }

  bookingsTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = btn.closest("tr");
    const id = Number(row.dataset.id);

    if (btn.dataset.action === "confirm-booking") {
      try {
        await api.updateBooking(id, { status: "confirmed" });
        loadBookings();
      } catch (err) {
        alert(err.message);
      }
    }

    if (btn.dataset.action === "cancel-booking") {
      if (!confirm("Cancel this booking?")) return;
      try {
        await api.updateBooking(id, { status: "cancelled" });
        loadBookings();
      } catch (err) {
        alert(err.message);
      }
    }
  });
});