# HealthSphere AI — Full-stack prototype

A mobile-first wellness prototype with an Expo/React Native TypeScript app and a FastAPI backend.

## Included
- Expo mobile app with login/register, dashboard, diet, workout, AI assistant, progress and profile tabs
- FastAPI REST backend with JWT authentication and password hashing
- SQLAlchemy models; SQLite by default and PostgreSQL via `DATABASE_URL`
- Profile, BMI, weight history, diet/workout plans, chat and gamification endpoints
- Optional OpenAI or Gemini integration, called only by the backend
- Demo mode when no AI key is configured
- Swagger docs at `/docs`

## 1. Backend setup

Python 3.11+ recommended.

```bash
cd backend
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows PowerShell:
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The default database is a local SQLite file at `backend/healthsphere.db`.
For PostgreSQL, set `DATABASE_URL` in `.env`, for example:

```env
DATABASE_URL=postgresql+psycopg://healthsphere:yourpassword@localhost:5432/healthsphere
```

Open `http://127.0.0.1:8000/docs`.

## 2. Mobile app setup

Install Node.js LTS and the Expo Go app on your Android phone.

```bash
cd mobile
npm install
```

Set the API URL in `mobile/.env`:
- Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`
- Physical phone: use your computer's LAN IP, e.g. `http://192.168.1.5:8000`
- iOS simulator: `http://127.0.0.1:8000`

Then run:

```bash
npx expo start --clear
```

Scan the QR code with Expo Go. Ensure the phone and computer are on the same Wi-Fi network and allow port 8000 through your firewall.

## 3. AI configuration

AI calls are made by FastAPI, never directly by the mobile app.

Set one provider in `backend/.env`:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

or:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
```

With no key, the backend returns labelled demo responses so the prototype remains testable.

## 4. Important API routes

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `GET|PUT /profile`
- `POST /health/bmi`
- `POST /plans/diet`
- `POST /plans/workout`
- `POST /assistant/chat`
- `GET /assistant/history`
- `POST /progress/weight`
- `GET /progress`
- `GET /gamification`
- `POST /gamification/events`
- `GET /health`

## 5. Android build

For a cloud Android build with EAS:

```bash
cd mobile
npm install
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

The preview profile is configured for an installable APK. EAS account access is required.

## Notes
- This is a prototype, not a medical device or diagnostic service.
- BMI is a limited screening measure. For people under 18, interpretation requires age- and sex-specific clinical growth references; this prototype deliberately avoids assigning adult BMI categories.
- AI output is informational and must not be used for diagnosis, medication decisions, or emergency care.
- Before production: add email verification, refresh-token rotation, rate limiting, migrations, tests, stronger audit controls, privacy/legal review, and managed secrets.
- Never commit `.env` files or real API keys.
