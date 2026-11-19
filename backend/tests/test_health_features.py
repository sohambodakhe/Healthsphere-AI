from datetime import date, timedelta

from fastapi.testclient import TestClient

from app import models
from app.database import Base, get_db
from app.main import app
from app.security import hash_password
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


def build_test_client(email: str, age: int = 18):
    test_engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=test_engine)
    TestSession = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    db = TestSession()
    user = models.User(name="Feature Test", email=email, password_hash=hash_password("test-password"))
    db.add(user)
    db.flush()
    db.add(models.HealthProfile(user_id=user.id, age=age, height_cm=170, weight_kg=65))
    db.commit()
    db.close()
    return TestClient(app), test_engine


def test_bmi_returns_age_appropriate_assessment():
    client, test_engine = build_test_client("bmi-test@example.com", age=16)
    token = client.post("/auth/login", json={"email": "bmi-test@example.com", "password": "test-password"}).json()["access_token"]
    response = client.post("/health/bmi", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["age_aware"] is True
    assert response.json()["category"] is None
    client.close()
    app.dependency_overrides.clear()
    test_engine.dispose()


def test_gamification_daily_event_and_streak_bonus():
    client, test_engine = build_test_client("reward-test@example.com")
    db = sessionmaker(bind=test_engine)()
    user = db.query(models.User).filter_by(email="reward-test@example.com").one()
    db.add(models.GamificationEvent(user_id=user.id, event_key="yesterday", xp=5, event_date=date.today() - timedelta(days=1)))
    db.commit()
    db.close()
    token = client.post("/auth/login", json={"email": "reward-test@example.com", "password": "test-password"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    event = {"event_key": "movement-test", "event_type": "workout"}
    assert client.post("/gamification/events", headers=headers, json=event).status_code == 200
    assert client.post("/gamification/events", headers=headers, json=event).status_code == 409
    result = client.get("/gamification", headers=headers).json()
    assert result["xp"] == 35
    assert result["streak"] == 2
    client.close()
    app.dependency_overrides.clear()
    test_engine.dispose()
