from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Trainer(Base):
    __tablename__ = "trainers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False, index=True)
    bio = Column(Text, nullable=True)
    experience_years = Column(Integer, default=0)
    image_url = Column(String(255), nullable=True)

    bookings = relationship("Booking", back_populates="trainer")


class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=45)
    difficulty = Column(String(20), default="Beginner")
    image_url = Column(String(255), nullable=True)

    bookings = relationship("Booking", back_populates="program")


class MembershipPlan(Base):
    __tablename__ = "membership_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    billing_period = Column(String(20), default="month")
    features = Column(Text, nullable=False)
    is_featured = Column(Integer, default=0)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, index=True)
    phone = Column(String(30), nullable=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=True)
    preferred_date = Column(String(20), nullable=False)
    preferred_time = Column(String(20), nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    program = relationship("Program", back_populates="bookings")
    trainer = relationship("Trainer", back_populates="bookings")


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)
    subject = Column(String(150), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("membership_plans.id"), nullable=True)
    plan_name = Column(String(50), nullable=False)
    customer_email = Column(String(150), nullable=False, index=True)
    customer_name = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="usd")
    gateway_reference = Column(String(255), nullable=True, unique=True, index=True)  # Safepay tracker token
    status = Column(String(20), default="pending")  # pending | paid | failed | cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plan = relationship("MembershipPlan")
