document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const contextLine = document.getElementById("contactContext");
  const statusBox = document.getElementById("contactStatus");

  const fields = {
    name: document.getElementById("cName"),
    email: document.getElementById("cEmail"),
    phone: document.getElementById("cPhone"),
    subject: document.getElementById("cSubject"),
    message: document.getElementById("cMessage"),
  };
  const errors = {
    name: document.getElementById("cNameError"),
    email: document.getElementById("cEmailError"),
    phone: document.getElementById("cPhoneError"),
    message: document.getElementById("cMessageError"),
  };

  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan");
  if (plan) {
    fields.subject.value = `${plan} membership — sign me up`;
    contextLine.textContent = `Tell us a bit about yourself and we'll follow up about the ${plan} plan.`;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9+()\-\s]{7,20}$/;

  function setError(field, message) {
    errors[field].textContent = message;
    fields[field].closest(".field").classList.toggle("has-error", Boolean(message));
  }

  function validate() {
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

    if (fields.message.value.trim().length < 5) {
      setError("message", "Message should be at least 5 characters.");
      valid = false;
    } else setError("message", "");

    return valid;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim() || null,
      subject: fields.subject.value.trim() || null,
      message: fields.message.value.trim(),
    };

    try {
      await api.submitContact(payload);
      statusBox.textContent = "Message sent — we'll get back to you soon.";
      statusBox.className = "form-status show success";
      form.reset();
    } catch (err) {
      statusBox.textContent = err.message;
      statusBox.className = "form-status show error";
    }
  });
});
