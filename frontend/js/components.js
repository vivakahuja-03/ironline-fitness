function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function programCard(program) {
  return `
    <article class="card">
      <div class="card-top-row">
        <span class="card-tag">${program.category}</span>
        <button class="favorite-btn" data-fav-type="program" data-fav-id="${program.id}"
                aria-pressed="false" aria-label="Save to favorites" title="Save to favorites">&#9825;</button>
      </div>
      <h3>${program.name}</h3>
      <p>${program.description || ""}</p>
      <div class="card-meta">
        <span>${program.duration_minutes} min</span>
        <span>${program.difficulty}</span>
      </div>
      <div class="card-actions">
        <a class="btn btn-outline" href="bookings.html?type=program&id=${program.id}&name=${encodeURIComponent(program.name)}">Book this program</a>
      </div>
    </article>
  `;
}

function trainerCard(trainer) {
  return `
    <article class="card">
      <div class="card-top-row">
        <div class="avatar-block" aria-hidden="true">${initials(trainer.name)}</div>
        <button class="favorite-btn" data-fav-type="trainer" data-fav-id="${trainer.id}"
                aria-pressed="false" aria-label="Save to favorites" title="Save to favorites">&#9825;</button>
      </div>
      <span class="card-tag">${trainer.specialty}</span>
      <h3>${trainer.name}</h3>
      <p>${trainer.bio || ""}</p>
      <div class="card-meta">
        <span>${trainer.experience_years} yrs experience</span>
      </div>
      <div class="card-actions">
        <a class="btn btn-outline" href="bookings.html?type=trainer&id=${trainer.id}&name=${encodeURIComponent(trainer.name)}">Book a session</a>
      </div>
    </article>
  `;
}

function testimonialCard(t) {
  return `
    <article class="testimonial">
      <div class="stars" aria-hidden="true">${"\u2605".repeat(t.rating)}${"\u2606".repeat(5 - t.rating)}</div>
      <p class="quote">&ldquo;${t.quote}&rdquo;</p>
      <p class="author">${t.name}</p>
    </article>
  `;
}

function planCard(plan) {
  const features = plan.features
    .split(",")
    .map((f) => `<li>${f.trim()}</li>`)
    .join("");

  return `
    <article class="plan ${plan.is_featured ? "featured" : ""}">
      ${plan.is_featured ? '<span class="card-tag">Most popular</span>' : ""}
      <h3>${plan.name}</h3>
      <p class="price">Rs ${plan.price.toLocaleString("en-PK", {maximumFractionDigits: 0})} <small>/ ${plan.billing_period}</small></p>
      <ul>${features}</ul>
      <button type="button" class="btn btn-block" data-action="pay-now" data-plan-id="${plan.id}" data-plan-name="${plan.name}" data-plan-price="${plan.price.toLocaleString('en-PK', {maximumFractionDigits: 0})}">
        Pay &amp; join now
      </button>
    </article>
  `;
}

function bookingRow(booking) {
  const statusClass = `status-${booking.status}`;
  const target = booking.program_id ? "Program" : booking.trainer_id ? "Trainer" : "Session";

  return `
    <div class="booking-row" data-booking-id="${booking.id}">
      <div>
        <span class="status-pill ${statusClass}">${booking.status}</span>
        <h3>${target} booking</h3>
        <p>${booking.preferred_date} at ${booking.preferred_time}</p>
      </div>
      <div class="row-actions">
        <button class="btn btn-outline btn-sm" data-action="reschedule">Reschedule</button>
        <button class="btn btn-outline btn-sm" data-action="cancel">Cancel</button>
      </div>
    </div>
  `;
}

function emptyState(message) {
  return `<p class="empty-state">${message}</p>`;
}