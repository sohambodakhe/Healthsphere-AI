from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional

class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ProfileIn(BaseModel):
    age: int = Field(ge=1, le=120)
    height_cm: float = Field(gt=50, le=250)
    weight_kg: float = Field(gt=10, le=500)
    goal: str = "general_wellness"
    activity_level: str = "moderate"
    dietary_preference: str = "no_preference"
    allergies: str = ""
    restrictions: str = ""
    experience_level: str = "beginner"
    equipment: str = "bodyweight"
    workout_days: int = Field(default=3, ge=1, le=7)

class ProfileOut(ProfileIn):
    model_config = ConfigDict(from_attributes=True)

class WeightIn(BaseModel):
    weight_kg: float = Field(gt=10, le=500)

class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)

class EventIn(BaseModel):
    event_key: str = Field(min_length=1, max_length=80)
    event_type: str = Field(pattern="^(workout|weight_log|challenge|streak)$")
