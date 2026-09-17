from typing import Optional
from sqlalchemy.orm import Session

import models
import schemas


def get_trainers(db: Session, specialty: Optional[str] = None):
    query = db.query(models.Trainer)
    if specialty:
        query = query.filter(models.Trainer.specialty.ilike(f"%{specialty}%"))
    return query.all()


def get_trainer(db: Session, trainer_id: int):
    return db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()


def create_trainer(db: Session, trainer: schemas.TrainerCreate):
    db_trainer = models.Trainer(**trainer.model_dump())
    db.add(db_trainer)
    db.commit()
    db.refresh(db_trainer)
    return db_trainer


def update_trainer(db: Session, trainer_id: int, updates: schemas.TrainerUpdate):
    db_trainer = get_trainer(db, trainer_id)
    if not db_trainer:
        return None
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_trainer, field, value)
    db.commit()
    db.refresh(db_trainer)
    return db_trainer


def delete_trainer(db: Session, trainer_id: int):
    db_trainer = get_trainer(db, trainer_id)
    if not db_trainer:
        return None
    db.delete(db_trainer)
    db.commit()
    return db_trainer


def get_programs(db: Session, category: Optional[str] = None):
    query = db.query(models.Program)
    if category:
        query = query.filter(models.Program.category.ilike(f"%{category}%"))
    return query.all()


def get_program(db: Session, program_id: int):
    return db.query(models.Program).filter(models.Program.id == program_id).first()


def create_program(db: Session, program: schemas.ProgramCreate):
    db_program = models.Program(**program.model_dump())
    db.add(db_program)
    db.commit()
    db.refresh(db_program)
    return db_program


def update_program(db: Session, program_id: int, updates: schemas.ProgramUpdate):
    db_program = get_program(db, program_id)
    if not db_program:
        return None
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_program, field, value)
    db.commit()
    db.refresh(db_program)
    return db_program


def delete_program(db: Session, program_id: int):
    db_program = get_program(db, program_id)
    if not db_program:
        return None
    db.delete(db_program)
    db.commit()
    return db_program


def get_membership_plans(db: Session):
    return db.query(models.MembershipPlan).all()


def create_booking(db: Session, booking: schemas.BookingCreate):
    db_booking = models.Booking(**booking.model_dump())
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking


def get_bookings_by_email(db: Session, email: str):
    return (
        db.query(models.Booking)
        .filter(models.Booking.email == email)
        .order_by(models.Booking.created_at.desc())
        .all()
    )


def get_booking(db: Session, booking_id: int):
    return db.query(models.Booking).filter(models.Booking.id == booking_id).first()


def update_booking(db: Session, booking_id: int, updates: schemas.BookingUpdate):
    db_booking = get_booking(db, booking_id)
    if not db_booking:
        return None
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_booking, field, value)
    db.commit()
    db.refresh(db_booking)
    return db_booking


def delete_booking(db: Session, booking_id: int):
    db_booking = get_booking(db, booking_id)
    if not db_booking:
        return None
    db.delete(db_booking)
    db.commit()
    return db_booking


def create_contact_message(db: Session, contact: schemas.ContactCreate):
    db_contact = models.ContactMessage(**contact.model_dump())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


def get_membership_plan(db: Session, plan_id: int):
    return db.query(models.MembershipPlan).filter(models.MembershipPlan.id == plan_id).first()


def create_payment(db: Session, plan: models.MembershipPlan, customer_email: str, customer_name: Optional[str]):
    db_payment = models.Payment(
        plan_id=plan.id,
        plan_name=plan.name,
        customer_email=customer_email,
        customer_name=customer_name,
        amount=plan.price,
        currency="usd",
        status="pending",
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment


def set_payment_gateway_reference(db: Session, payment_id: int, reference: str):
    db_payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not db_payment:
        return None
    db_payment.gateway_reference = reference
    db.commit()
    db.refresh(db_payment)
    return db_payment


def get_payment(db: Session, payment_id: int):
    return db.query(models.Payment).filter(models.Payment.id == payment_id).first()


def mark_payment_status(db: Session, payment, new_status: str):
    payment.status = new_status
    db.commit()
    db.refresh(payment)
    return payment


def get_payments_by_email(db: Session, email: str):
    return (
        db.query(models.Payment)
        .filter(models.Payment.customer_email == email)
        .order_by(models.Payment.created_at.desc())
        .all()
    )
