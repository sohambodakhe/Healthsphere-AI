from datetime import datetime, date
from sqlalchemy import String, Integer, Float, DateTime, Date, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    profile = relationship("HealthProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    weights = relationship("WeightEntry", back_populates="user", cascade="all, delete-orphan")
    plans = relationship("Plan", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    events = relationship("GamificationEvent", back_populates="user", cascade="all, delete-orphan")

class HealthProfile(Base):
    __tablename__ = "health_profiles"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    age: Mapped[int] = mapped_column(Integer, default=18)
    height_cm: Mapped[float] = mapped_column(Float, default=170)
    weight_kg: Mapped[float] = mapped_column(Float, default=65)
    goal: Mapped[str] = mapped_column(String(40), default="general_wellness")
    activity_level: Mapped[str] = mapped_column(String(40), default="moderate")
    dietary_preference: Mapped[str] = mapped_column(String(40), default="no_preference")
    allergies: Mapped[str] = mapped_column(Text, default="")
    restrictions: Mapped[str] = mapped_column(Text, default="")
    experience_level: Mapped[str] = mapped_column(String(30), default="beginner")
    equipment: Mapped[str] = mapped_column(Text, default="bodyweight")
    workout_days: Mapped[int] = mapped_column(Integer, default=3)
    user = relationship("User", back_populates="profile")

class WeightEntry(Base):
    __tablename__ = "weight_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    weight_kg: Mapped[float] = mapped_column(Float)
    bmi: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="weights")

class Plan(Base):
    __tablename__ = "plans"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="plans")

class ChatMessage(Base):
    __tablename__ = "chat_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="messages")

class GamificationEvent(Base):
    __tablename__ = "gamification_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    event_key: Mapped[str] = mapped_column(String(80))
    xp: Mapped[int] = mapped_column(Integer)
    event_date: Mapped[date] = mapped_column(Date, default=date.today)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="events")
    __table_args__ = (UniqueConstraint("user_id", "event_key", "event_date", name="uq_daily_event"),)
