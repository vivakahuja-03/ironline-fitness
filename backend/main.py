import os
import html
from typing import List, Optional
from urllib.parse import quote

from fastapi import FastAPI, Depends, HTTPException, status, Header, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models
import schemas
import crud
import email_service
import payment_service
from database import engine, get_db

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gym & Fitness API", version="1.0.0")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Gym & Fitness API is running"}


def verify_admin_key(x_admin_key: str = Header(default="")):
    expected = os.getenv("ADMIN_KEY", "")
    if not expected or x_admin_key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing admin key")
    return True


@app.get("/api/trainers", response_model=List[schemas.TrainerOut])
def list_trainers(specialty: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_trainers(db, specialty)


@app.post("/api/trainers", response_model=schemas.TrainerOut, status_code=status.HTTP_201_CREATED)
def create_trainer(trainer: schemas.TrainerCreate, db: Session = Depends(get_db), _=Depends(verify_admin_key)):
    return crud.create_trainer(db, trainer)


@app.put("/api/trainers/{trainer_id}", response_model=schemas.TrainerOut)
def update_trainer(trainer_id: int, updates: schemas.TrainerUpdate, db: Session = Depends(get_db), _=Depends(verify_admin_key)):
    updated = crud.update_trainer(db, trainer_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return updated


@app.delete("/api/trainers/{trainer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trainer(trainer_id: int, db: Session = Depends(get_db), _=Depends(verify_admin_key)):
    deleted = crud.delete_trainer(db, trainer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return None


@app.get("/api/programs", response_model=List[schemas.ProgramOut])
def list_programs(category: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_programs(db, category)


@app.post("/api/programs", response_model=schemas.ProgramOut, status_code=status.HTTP_201_CREATED)
def create_program(program: schemas.ProgramCreate, db: Session = Depends(get_db), _=Depends(verify_admin_key)):
    return crud.create_program(db, program)


@app.put("/api/programs/{program_id}", response_model=schemas.ProgramOut)
def update_program(program_id: int, updates: schemas.ProgramUpdate, db: Session = Depends(get_db), _=Depends(verify_admin_key)):
    updated = crud.update_program(db, program_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Program not found")
    return updated


@app.delete("/api/programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_program(program_id: int, db: Session = Depends(get_db), _=Depends(verify_admin_key)):
    deleted = crud.delete_program(db, program_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Program not found")
    return None


@app.get("/api/membership-plans", response_model=List[schemas.MembershipPlanOut])
def list_membership_plans(db: Session = Depends(get_db)):
    return crud.get_membership_plans(db)


@app.post("/api/bookings", response_model=schemas.BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(booking: schemas.BookingCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_booking = crud.create_booking(db, booking)
    background_tasks.add_task(email_service.notify_new_booking, db_booking)
    return db_booking


@app.get("/api/bookings", response_model=List[schemas.BookingOut])
def read_bookings(email: str, db: Session = Depends(get_db)):
    return crud.get_bookings_by_email(db, email)

@app.get("/api/admin/bookings", response_model=List[schemas.BookingOut])
def read_all_bookings(db: Session = Depends(get_db), _=Depends(verify_admin_key)):
    return crud.get_all_bookings(db)

@app.put("/api/bookings/{booking_id}", response_model=schemas.BookingOut)
def update_booking(booking_id: int, updates: schemas.BookingUpdate, db: Session = Depends(get_db)):
    updated = crud.update_booking(db, booking_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Booking not found")
    return updated


@app.delete("/api/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_booking(db, booking_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Booking not found")
    return None


@app.post("/api/contact", response_model=schemas.ContactOut, status_code=status.HTTP_201_CREATED)
def submit_contact(contact: schemas.ContactCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_contact = crud.create_contact_message(db, contact)
    background_tasks.add_task(email_service.notify_new_contact_message, db_contact)
    return db_contact


# ------------------------------------------------------------------
# Payments (JazzCash Hosted Checkout, HTTP POST v1.1)
#
# Flow:
#  1. Frontend POSTs /api/create-checkout-session -> we create a pending
#     payment row and return a checkout_url pointing at step 2.
#  2. Browser loads /api/jazzcash-redirect/{payment_id}, which returns a
#     tiny auto-submitting HTML form. JazzCash requires a form POST (not a
#     plain redirect), so this page performs that POST for the customer.
#  3. Customer pays on JazzCash's hosted page.
#  4. JazzCash POSTs the signed result back to /api/jazzcash-return. We
#     recompute the HMAC-SHA256 hash to prove it is authentic before
#     trusting it, update the DB, then send the browser to the frontend.
# ------------------------------------------------------------------

@app.post("/api/create-checkout-session", response_model=schemas.CheckoutSessionOut)
def create_checkout_session(payload: schemas.CheckoutSessionCreate, db: Session = Depends(get_db)):
    plan = crud.get_membership_plan(db, payload.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found")

    if not payment_service._configured():
        raise HTTPException(
            status_code=503,
            detail=(
                "JazzCash is not configured. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD "
                "and JAZZCASH_INTEGRITY_SALT in backend/.env — free from your JazzCash "
                "sandbox dashboard at https://sandbox.jazzcash.com.pk."
            ),
        )

    db_payment = crud.create_payment(db, plan, payload.customer_email, payload.customer_name)
    backend_url = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
    return schemas.CheckoutSessionOut(
        checkout_url=f"{backend_url}/api/jazzcash-redirect/{db_payment.id}",
        payment_id=db_payment.id,
    )


@app.get("/api/jazzcash-redirect/{payment_id}", response_class=HTMLResponse)
def jazzcash_redirect(payment_id: int, db: Session = Depends(get_db)):
    """Returns a self-submitting form that POSTs the signed fields to JazzCash."""
    db_payment = crud.get_payment(db, payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if db_payment.status == "paid":
        frontend_url = os.getenv("FRONTEND_URL", "http://127.0.0.1:5500")
        return RedirectResponse(url=f"{frontend_url}/payment-success.html?payment_id={payment_id}")

    try:
        fields = payment_service.build_payment_fields(
            amount_pkr=db_payment.amount,
            payment_id=db_payment.id,
            customer_email=db_payment.customer_email,
            description=f"{db_payment.plan_name} membership",
        )
    except RuntimeError as exc:
        crud.mark_payment_status(db, db_payment, "failed")
        raise HTTPException(status_code=503, detail=str(exc))

    crud.set_payment_gateway_reference(db, db_payment.id, fields["pp_TxnRefNo"])

    inputs = "\n".join(
        f'<input type="hidden" name="{html.escape(str(k))}" value="{html.escape(str(v))}" />'
        for k, v in fields.items()
    )
    post_url = payment_service.get_post_url()

    return HTMLResponse(f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Redirecting to JazzCash…</title></head>
<body style="font-family:sans-serif;text-align:center;padding:3rem;">
  <p>Redirecting you to JazzCash to complete payment…</p>
  <form id="jazzcashForm" method="POST" action="{html.escape(post_url)}">
    {inputs}
    <noscript><button type="submit">Continue to JazzCash</button></noscript>
  </form>
  <script>document.getElementById("jazzcashForm").submit();</script>
</body></html>""")


@app.api_route("/api/jazzcash-return", methods=["GET", "POST"])
async def jazzcash_return(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """JazzCash sends the signed transaction result here after payment."""
    frontend_url = os.getenv("FRONTEND_URL", "http://127.0.0.1:5500")

    if request.method == "POST":
        form = await request.form()
        params = dict(form)
    else:
        params = dict(request.query_params)

    # ppmpf_1 carries our payment id; fall back to parsing the ref number.
    payment_id = params.get("ppmpf_1")
    if not payment_id:
        return RedirectResponse(url=f"{frontend_url}/payment-cancel.html?reason=missing_reference")

    try:
        db_payment = crud.get_payment(db, int(payment_id))
    except (TypeError, ValueError):
        return RedirectResponse(url=f"{frontend_url}/payment-cancel.html?reason=bad_reference")

    if not db_payment:
        return RedirectResponse(url=f"{frontend_url}/payment-cancel.html?reason=not_found")

    try:
        authentic = payment_service.verify_response(params)
    except RuntimeError as exc:
        print(f"[jazzcash_return] {exc}")
        return RedirectResponse(url=f"{frontend_url}/payment-cancel.html?reason=config_error")

    if not authentic:
        # Someone forged or tampered with the callback. Never trust it, and
        # never downgrade a payment that was already legitimately confirmed.
        print(f"[jazzcash_return] REJECTED: invalid signature for payment {payment_id}")
        if db_payment.status != "paid":
            crud.mark_payment_status(db, db_payment, "failed")
        return RedirectResponse(url=f"{frontend_url}/payment-cancel.html?reason=signature_invalid")

    if payment_service.is_successful(params):
        if db_payment.status != "paid":
            db_payment = crud.mark_payment_status(db, db_payment, "paid")
            background_tasks.add_task(email_service.notify_payment_success, db_payment)
        return RedirectResponse(url=f"{frontend_url}/payment-success.html?payment_id={db_payment.id}")

    # Authentic, but the transaction did not succeed (declined, cancelled, expired).
    reason = params.get("pp_ResponseMessage", "declined")
    if db_payment.status != "paid":
        crud.mark_payment_status(db, db_payment, "failed")
    return RedirectResponse(
        url=f"{frontend_url}/payment-cancel.html?reason={quote(str(reason))}"
    )


@app.get("/api/payments/{payment_id}", response_model=schemas.PaymentOut)
def read_payment(payment_id: int, db: Session = Depends(get_db)):
    """Used by payment-success.html to display the confirmed status — the
    actual verification already happened in /api/jazzcash-return above."""
    db_payment = crud.get_payment(db, payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment


@app.get("/api/payments", response_model=List[schemas.PaymentOut])
def read_payments(email: str, db: Session = Depends(get_db)):
    return crud.get_payments_by_email(db, email)