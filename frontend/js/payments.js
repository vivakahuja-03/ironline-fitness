// Handles the "Pay & join now" flow on the membership page:
// clicking a plan's button opens a tiny modal asking for name/email,
// then redirects to JazzCash's hosted checkout page.

function buildCheckoutModal() {
  if (document.getElementById("checkoutModal")) return;

  const modal = document.createElement("div");
  modal.id = "checkoutModal";
  modal.className = "modal-overlay";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="modal-box">
      <h3 id="checkoutModalTitle">Join a plan</h3>
      <p id="checkoutModalPrice"></p>
      <form id="checkoutForm" class="field-group">
        <div class="field">
          <label for="checkoutName">Full name</label>
          <input type="text" id="checkoutName" name="customer_name" required minlength="2" />
        </div>
        <div class="field">
          <label for="checkoutEmail">Email</label>
          <input type="email" id="checkoutEmail" name="customer_email" required />
        </div>
        <p id="checkoutError" class="error-msg" style="display:none;"></p>
        <div class="row-actions">
          <button type="submit" class="btn">Continue to payment</button>
          <button type="button" class="btn btn-outline" id="checkoutCancelBtn">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector("#checkoutCancelBtn").addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.querySelector("#checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const errorEl = modal.querySelector("#checkoutError");
    errorEl.style.display = "none";

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Redirecting…";

    try {
      const { checkout_url } = await api.createCheckoutSession({
        plan_id: Number(modal.dataset.planId),
        customer_name: form.customer_name.value.trim(),
        customer_email: form.customer_email.value.trim(),
      });
      window.location.href = checkout_url;
    } catch (err) {
      errorEl.textContent = err.message || "Couldn't start checkout. Please try again.";
      errorEl.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "Continue to payment";
    }
  });
}

function openCheckoutModal(planId, planName, planPrice) {
  buildCheckoutModal();
  const modal = document.getElementById("checkoutModal");
  modal.dataset.planId = planId;
  modal.querySelector("#checkoutModalTitle").textContent = `Join ${planName}`;
  modal.querySelector("#checkoutModalPrice").textContent = `You'll be charged Rs ${planPrice} via JazzCash's secure checkout.`;
  modal.style.display = "flex";
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest('[data-action="pay-now"]');
  if (!btn) return;
  openCheckoutModal(btn.dataset.planId, btn.dataset.planName, btn.dataset.planPrice);
});