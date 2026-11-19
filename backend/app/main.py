import json
from datetime import date, datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from .config import settings
from .database import Base, engine, get_db
from . import models, schemas
from .security import hash_password, verify_password, create_access_token, get_current_user
from .ai import generate

Base.metadata.create_all(bind=engine)
app = FastAPI(title=settings.app_name, version="1.0.0", description="HealthSphere AI prototype API")
origins = ["*"] if settings.cors_origins == "*" else [x.strip() for x in settings.cors_origins.split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root():
    return {"name": settings.app_name, "status": "online", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok", "ai_provider": settings.ai_provider}

@app.post("/auth/register")
def register(data: schemas.RegisterIn, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(409, "An account with this email already exists")
    user = models.User(name=data.name.strip(), email=email, password_hash=hash_password(data.password))
    db.add(user); db.flush()
    db.add(models.HealthProfile(user_id=user.id))
    db.commit(); db.refresh(user)
    return {"access_token": create_access_token(user.id), "token_type": "bearer", "user": {"id": user.id, "name": user.name, "email": user.email}}

@app.post("/auth/login")
def login(data: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return {"access_token": create_access_token(user.id), "token_type": "bearer", "user": {"id": user.id, "name": user.name, "email": user.email}}

@app.get("/users/me")
def me(user: models.User = Depends(get_current_user)):
    return {"id": user.id, "name": user.name, "email": user.email}

@app.get("/profile")
def get_profile(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(models.HealthProfile).filter_by(user_id=user.id).first()
    return p

@app.put("/profile")
def update_profile(data: schemas.ProfileIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(models.HealthProfile).filter_by(user_id=user.id).first()
    if not p:
        p = models.HealthProfile(user_id=user.id); db.add(p)
    for key, value in data.model_dump().items():
        setattr(p, key, value)
    db.commit(); db.refresh(p)
    return p

def bmi_value(weight, height_cm):
    return round(weight / ((height_cm / 100) ** 2), 1)

@app.post("/health/bmi")
def bmi(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(models.HealthProfile).filter_by(user_id=user.id).first()
    if not p: raise HTTPException(404, "Complete your profile first")
    value = bmi_value(p.weight_kg, p.height_cm)
    if p.age < 18:
        assessment = "BMI-for-age assessment requires age- and sex-specific growth references; this app does not assign a category for people under 18."
        category = None
    else:
        category = "below typical adult range" if value < 18.5 else "typical adult range" if value < 25 else "above typical adult range" if value < 30 else "well above typical adult range"
        assessment = f"This falls in the {category} for adult BMI screening. BMI is a screening measure, not a diagnosis, and does not account for every aspect of health."
    return {"bmi": value, "category": category, "interpretation": assessment, "age_aware": p.age < 18}

@app.post("/progress/weight")
def log_weight(data: schemas.WeightIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(models.HealthProfile).filter_by(user_id=user.id).first()
    if not p: raise HTTPException(404, "Complete your profile first")
    p.weight_kg = data.weight_kg
    entry = models.WeightEntry(user_id=user.id, weight_kg=data.weight_kg, bmi=bmi_value(data.weight_kg, p.height_cm))
    db.add(entry)
    db.commit(); db.refresh(entry)
    return {"id": entry.id, "weight_kg": entry.weight_kg, "bmi": entry.bmi, "recorded_at": entry.recorded_at}

@app.get("/progress")
def progress(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    entries = db.query(models.WeightEntry).filter_by(user_id=user.id).order_by(models.WeightEntry.recorded_at.asc()).all()
    activities = db.query(models.GamificationEvent).filter_by(user_id=user.id).order_by(models.GamificationEvent.created_at.desc()).limit(20).all()
    return {"weights": [{"weight_kg": x.weight_kg, "bmi": x.bmi, "recorded_at": x.recorded_at.isoformat()} for x in entries],
            "activities": [{"event_key": x.event_key, "xp": x.xp, "event_date": x.event_date.isoformat()} for x in activities]}

@app.post("/plans/diet")
def diet_plan(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(models.HealthProfile).filter_by(user_id=user.id).first()
    if not p: raise HTTPException(404, "Complete your profile first")
    context = {"age": p.age, "height_cm": p.height_cm, "weight_kg": p.weight_kg, "bmi": bmi_value(p.weight_kg, p.height_cm), "goal": p.goal, "diet": p.dietary_preference, "allergies": p.allergies, "restrictions": p.restrictions, "activity": p.activity_level}
    prompt = ("Create a practical, balanced one-day meal inspiration plan with breakfast, lunch, evening snack and dinner. "
              "Respect allergies and dietary preferences. Avoid calorie targets, restrictive eating and weight-loss prescriptions. "
              "For minors, focus on nourishing variety and do not discuss weight change. Return JSON with meals array; each item has meal, title, description, nutrition_note. "
              "User context: " + json.dumps(context))
    answer, demo = generate(prompt, context)
    plan = models.Plan(user_id=user.id, kind="diet", content=answer)
    db.add(plan); db.commit()
    return {"plan": answer, "demo_mode": demo, "created_at": plan.created_at.isoformat()}

@app.post("/plans/workout")
def workout_plan(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(models.HealthProfile).filter_by(user_id=user.id).first()
    if not p: raise HTTPException(404, "Complete your profile first")
    context = {"goal": p.goal, "experience": p.experience_level, "activity": p.activity_level, "equipment": p.equipment, "days": p.workout_days, "age": p.age}
    prompt = ("Create a gentle, adaptable weekly movement plan appropriate to the person's activity level, experience and equipment. "
              "Include exercise, sets/reps or duration, rest, and simple form cues. Include warm-up, recovery and stop-if-pain guidance. "
              "For minors, emphasize enjoyable age-appropriate movement, avoid maximal lifting and body-transformation promises. "
              "Return readable JSON with days array. Context: " + json.dumps(context))
    answer, demo = generate(prompt, context)
    plan = models.Plan(user_id=user.id, kind="workout", content=answer)
    db.add(plan); db.commit()
    return {"plan": answer, "demo_mode": demo, "created_at": plan.created_at.isoformat()}

@app.post("/assistant/chat")
def chat(data: schemas.ChatIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(models.HealthProfile).filter_by(user_id=user.id).first()
    context = {"age": p.age, "goal": p.goal, "diet": p.dietary_preference} if p else {}
    db.add(models.ChatMessage(user_id=user.id, role="user", content=data.message))
    answer, demo = generate(data.message, context)
    db.add(models.ChatMessage(user_id=user.id, role="assistant", content=answer))
    db.commit()
    return {"reply": answer, "demo_mode": demo}

@app.get("/assistant/history")
def chat_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.ChatMessage).filter_by(user_id=user.id).order_by(models.ChatMessage.created_at.asc()).limit(100).all()
    return [{"role": x.role, "content": x.content, "created_at": x.created_at.isoformat()} for x in rows]

@app.get("/gamification")
def gamification(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    events = db.query(models.GamificationEvent).filter_by(user_id=user.id).all()
    xp = sum(x.xp for x in events)
    days = sorted({x.event_date for x in events})
    streak = 0
    cursor = date.today()
    dayset = set(days)
    if cursor not in dayset: cursor -= timedelta(days=1)
    while cursor in dayset:
        streak += 1; cursor -= timedelta(days=1)
    badges = []
    if xp >= 50: badges.append("Getting Started")
    if xp >= 200: badges.append("Consistency Builder")
    if streak >= 3: badges.append("Three-day Rhythm")
    if xp >= 500: badges.append("Wellness Champion")
    return {"xp": xp, "level": xp // 100 + 1, "streak": streak, "badges": badges, "events_today": sum(1 for x in events if x.event_date == date.today()), "next_milestone_xp": (xp // 100 + 1) * 100}

@app.post("/gamification/events")
def add_event(data: schemas.EventIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    points = {"workout": 20, "weight_log": 5, "challenge": 15, "streak": 10}
    xp = points[data.event_type]
    existing = db.query(models.GamificationEvent).filter_by(user_id=user.id, event_key=data.event_key, event_date=date.today()).first()
    if existing:
        raise HTTPException(409, "This activity has already earned points today")
    last_event = db.query(models.GamificationEvent).filter_by(user_id=user.id).order_by(models.GamificationEvent.event_date.desc()).first()
    streak_key = f"daily-streak-{date.today().isoformat()}"
    has_streak_bonus = db.query(models.GamificationEvent).filter_by(user_id=user.id, event_key=streak_key, event_date=date.today()).first()
    if last_event and last_event.event_date == date.today() - timedelta(days=1) and not has_streak_bonus:
        event = models.GamificationEvent(user_id=user.id, event_key=streak_key, xp=10)
        db.add(event)
    db.add(models.GamificationEvent(user_id=user.id, event_key=data.event_key, xp=xp))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "This activity has already earned points today")
    return {"awarded_xp": xp, "message": "Nice work — points added!"}

@app.delete("/account")
def delete_account(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(user); db.commit()
    return {"message": "Account and associated prototype data deleted"}
