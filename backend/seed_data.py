from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

trainers = [
    models.Trainer(name="Amir Khan", specialty="Strength", experience_years=6,
                    bio="Powerlifting coach focused on safe, progressive strength gains."),
    models.Trainer(name="Sara Malik", specialty="Yoga", experience_years=4,
                    bio="RYT-200 certified instructor blending mobility and mindfulness."),
    models.Trainer(name="Bilal Ahmed", specialty="Cardio", experience_years=5,
                    bio="Runs HIIT and endurance sessions built around real event training."),
    models.Trainer(name="Hina Raza", specialty="Yoga", experience_years=3,
                    bio="Specializes in beginner-friendly flexibility and recovery flows."),
]

programs = [
    models.Program(name="Iron Foundations", category="Strength", duration_minutes=60,
                    difficulty="Beginner", description="Barbell fundamentals: squat, press, deadlift."),
    models.Program(name="Power Circuit", category="Strength", duration_minutes=50,
                    difficulty="Advanced", description="High-load circuit training for experienced lifters."),
    models.Program(name="Sunrise Flow", category="Yoga", duration_minutes=45,
                    difficulty="Beginner", description="Gentle morning flow to open up the whole body."),
    models.Program(name="Sprint Interval", category="Cardio", duration_minutes=30,
                    difficulty="Intermediate", description="Short, intense intervals for fat loss and endurance."),
    models.Program(name="HIIT Burn", category="HIIT", duration_minutes=40,
                    difficulty="Advanced", description="Full-body high-intensity intervals, minimal rest."),
]

plans = [
    models.MembershipPlan(name="Basic", price=19.99, billing_period="month",
                           features="Gym floor access,Locker room,Free fitness assessment",
                           is_featured=0),
    models.MembershipPlan(name="Standard", price=39.99, billing_period="month",
                           features="Everything in Basic,All group classes,2 trainer sessions/month",
                           is_featured=1),
    models.MembershipPlan(name="Premium", price=69.99, billing_period="month",
                           features="Everything in Standard,Unlimited trainer sessions,Nutrition plan,Guest passes",
                           is_featured=0),
]

db.add_all(trainers)
db.add_all(programs)
db.add_all(plans)
db.commit()
db.close()

print("Seed data inserted successfully.")
