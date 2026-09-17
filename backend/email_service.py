"""
Simple SMTP-based email notifications.

Sends:
  - a notification to the gym admin whenever a booking or contact message is submitted
  - a confirmation email back to the customer

Controlled entirely via environment variables (see .env.example):
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, ADMIN_EMAIL

If SMTP_USER / SMTP_PASSWORD are not set, email sending is silently skipped
(so the app still works locally without email configured) and a note is
printed to the console instead.
"""
import os
import smtplib
import ssl
from email.message import EmailMessage


def _smtp_configured() -> bool:
    return bool(os.getenv("SMTP_USER")) and bool(os.getenv("SMTP_PASSWORD"))


def _send(to_address: str, subject: str, body: str) -> bool:
    if not _smtp_configured():
        print(f"[email_service] SMTP not configured — skipping email to {to_address} ({subject})")
        return False

    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    from_addr = os.getenv("SMTP_FROM", user)

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_address
    msg.set_content(body)

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(host, port, timeout=10) as server:
            server.starttls(context=context)
            server.login(user, password)
            server.send_message(msg)
        return True
    except Exception as exc:
        print(f"[email_service] Failed to send email to {to_address}: {exc}")
        return False


def notify_new_booking(booking) -> None:
    admin_email = os.getenv("ADMIN_EMAIL")
    subject_admin = f"New booking from {booking.name}"
    body_admin = (
        f"A new booking was submitted.\n\n"
        f"Name: {booking.name}\n"
        f"Email: {booking.email}\n"
        f"Phone: {booking.phone or '-'}\n"
        f"Program ID: {booking.program_id}\n"
        f"Trainer ID: {booking.trainer_id}\n"
        f"Preferred date/time: {booking.preferred_date} {booking.preferred_time}\n"
        f"Status: {booking.status}\n"
    )
    if admin_email:
        _send(admin_email, subject_admin, body_admin)

    subject_customer = "We received your booking request"
    body_customer = (
        f"Hi {booking.name},\n\n"
        f"Thanks for booking with us! We received your request for "
        f"{booking.preferred_date} at {booking.preferred_time}. "
        f"Our team will confirm shortly.\n\n"
        f"— The Gym Team"
    )
    _send(booking.email, subject_customer, body_customer)


def notify_new_contact_message(contact) -> None:
    admin_email = os.getenv("ADMIN_EMAIL")
    subject_admin = f"New contact message from {contact.name}"
    body_admin = (
        f"Name: {contact.name}\n"
        f"Email: {contact.email}\n"
        f"Phone: {contact.phone or '-'}\n"
        f"Subject: {contact.subject or '-'}\n\n"
        f"Message:\n{contact.message}\n"
    )
    if admin_email:
        _send(admin_email, subject_admin, body_admin)

    subject_customer = "We received your message"
    body_customer = (
        f"Hi {contact.name},\n\n"
        f"Thanks for reaching out — we've received your message and will "
        f"get back to you soon.\n\n"
        f"— The Gym Team"
    )
    _send(contact.email, subject_customer, body_customer)


def notify_payment_success(payment) -> None:
    admin_email = os.getenv("ADMIN_EMAIL")
    subject_admin = f"Payment received from {payment.customer_email}"
    body_admin = (
        f"A membership payment succeeded.\n\n"
        f"Customer email: {payment.customer_email}\n"
        f"Plan: {payment.plan_name}\n"
        f"Amount: {payment.amount:.2f} {payment.currency.upper()}\n"
        f"Payment reference: {payment.gateway_reference}\n"
    )
    if admin_email:
        _send(admin_email, subject_admin, body_admin)

    subject_customer = "Your membership payment was successful"
    body_customer = (
        f"Hi,\n\n"
        f"We've confirmed your payment of {payment.amount:.2f} {payment.currency.upper()} "
        f"for the {payment.plan_name} plan. Welcome aboard!\n\n"
        f"— The Gym Team"
    )
    _send(payment.customer_email, subject_customer, body_customer)
