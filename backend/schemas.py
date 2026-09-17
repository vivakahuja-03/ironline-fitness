from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class TrainerBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    specialty: str = Field(min_length=2, max_length=100)
    bio: Optional[str] = None
    experience_years: int = Field(ge=0, le=60)
    image_url: Optional[str] = None


class TrainerCreate(TrainerBase):
    pass


class TrainerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    specialty: Optional[str] = Field(default=None, min_length=2, max_length=100)
    bio: Optional[str] = None
    experience_years: Optional[int] = Field(default=None, ge=0, le=60)
    image_url: Optional[str] = None


class TrainerOut(TrainerBase):
    id: int

    class Config:
        from_attributes = True


class ProgramBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=50)
    description: Optional[str] = None
    duration_minutes: int = Field(gt=0, le=300)
    difficulty: str = Field(min_length=2, max_length=20)
    image_url: Optional[str] = None


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    category: Optional[str] = Field(default=None, min_length=2, max_length=50)
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, gt=0, le=300)
    difficulty: Optional[str] = Field(default=None, min_length=2, max_length=20)
    image_url: Optional[str] = None


class ProgramOut(ProgramBase):
    id: int

    class Config:
        from_attributes = True


class MembershipPlanOut(BaseModel):
    id: int
    name: str
    price: float
    billing_period: str
    features: str
    is_featured: int

    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=30)
    program_id: Optional[int] = None
    trainer_id: Optional[int] = None
    preferred_date: str
    preferred_time: str

    @field_validator("preferred_date")
    @classmethod
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("preferred_date must be in YYYY-MM-DD format")
        return v

    @field_validator("preferred_time")
    @classmethod
    def validate_time_format(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("preferred_time must be in HH:MM format")
        return v


class BookingUpdate(BaseModel):
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    status: Optional[str] = None


class BookingOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    program_id: Optional[int] = None
    trainer_id: Optional[int] = None
    preferred_date: str
    preferred_time: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=30)
    subject: Optional[str] = Field(default=None, max_length=150)
    message: str = Field(min_length=5)


class ContactOut(ContactCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CheckoutSessionCreate(BaseModel):
    plan_id: int
    customer_email: EmailStr
    customer_name: Optional[str] = Field(default=None, max_length=100)


class CheckoutSessionOut(BaseModel):
    checkout_url: str
    payment_id: int


class PaymentOut(BaseModel):
    id: int
    plan_id: Optional[int] = None
    plan_name: str
    customer_email: EmailStr
    customer_name: Optional[str] = None
    amount: float
    currency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
