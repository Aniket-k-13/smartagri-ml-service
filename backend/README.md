# SmartAgri Advisor — Backend

Shared Django REST Framework backend for the SmartAgri Advisor platform.
This service is consumed by the **React website**, the **Flutter mobile
app**, and the **FastAPI ML service** — and it is the **only** application
that connects to PostgreSQL.

```text
React Website ──────┐
                     │
Flutter App ─────────┼────► Django REST API ────► PostgreSQL
                     │              │
                     │              │ HTTP
                     │              ▼
                     └────────► FastAPI ML Service
```

## Architecture rules (do not break these)

- React, Flutter, and the ML service **never** access PostgreSQL directly.
- Django is the **only** owner of the database.
- ML inference stays in the separate FastAPI service — Django only calls it
  over HTTP (see `apps/recommendations/ml_client.py`).
- No Node.js backend. No extra microservices beyond Django + FastAPI.

## Tech stack

| Concern            | Choice                          |
|---------------------|----------------------------------|
| Backend framework   | Django + Django REST Framework  |
| Database            | PostgreSQL                      |
| Auth                | JWT (`djangorestframework-simplejwt`) |
| ORM                 | Django ORM                      |
| API docs            | drf-spectacular (OpenAPI/Swagger/Redoc) |
| ML service          | Hugging Face Space (Gradio app on ZeroGPU), called via `gradio_client` |

## Project layout

```text
smartagri-backend/
├── manage.py
├── requirements.txt
├── .env.example
├── config/                  # Django project package
│   ├── settings/
│   │   ├── base.py          # shared settings
│   │   ├── dev.py           # local development
│   │   └── prod.py          # production
│   ├── urls.py              # root URL config, mounts every app under /api/
│   ├── wsgi.py
│   └── asgi.py
└── apps/
    ├── accounts/             # custom User model, JWT auth, roles/permissions
    ├── farmers/               # farmer & farm profile data (scaffolded)
    ├── crops/                 # crop master data (scaffolded)
    ├── surveys/                # survey officer field surveys (scaffolded)
    ├── recommendations/         # calls the FastAPI ML service (scaffolded)
    ├── notifications/            # in-app / push / SMS notifications (scaffolded)
    └── reports/                   # aggregated reports (scaffolded)
```

Each app follows the same internal shape:
`models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py`, `tests/`.

## User roles

Defined once in `apps/accounts/roles.py` and reused everywhere via
`apps.accounts.roles.Roles`:

- `farmer` — manages their own farm/crop data, submits/reads own surveys.
- `survey_officer` — conducts and manages farmer surveys.
- `admin` — manages users and platform-wide data. **Cannot be created via
  public registration** — only via `createsuperuser` or the Django admin.

Reusable DRF permission classes live in `apps/accounts/permissions.py`
(`IsFarmer`, `IsSurveyOfficer`, `IsAdminRole`, `IsSurveyOfficerOrAdmin`,
`IsOwnerOrSurveyOfficerOrAdmin`).

## Local setup

1. **Create and activate a virtualenv, install dependencies:**

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Install PostgreSQL locally** (or point at an existing instance) and
   create a database + user:

   ```sql
   CREATE USER smartagri WITH PASSWORD 'smartagri_dev_pw' CREATEDB;
   CREATE DATABASE smartagri_db OWNER smartagri;
   ```

3. **Copy the env file and adjust as needed:**

   ```bash
   cp .env.example .env
   ```

4. **Run migrations and start the server:**

   ```bash
   python manage.py migrate
   python manage.py createsuperuser   # to get your first admin account
   python manage.py runserver
   ```

5. **API docs:** once running, visit:
   - `/api/schema/` — raw OpenAPI schema
   - `/api/docs/` — Swagger UI
   - `/api/docs/redoc/` — Redoc UI

## Key endpoints (accounts)

| Method | Path                                | Purpose                                  |
|--------|--------------------------------------|-------------------------------------------|
| POST   | `/api/accounts/register/`            | Public sign-up (farmer / survey_officer only) |
| POST   | `/api/accounts/login/`               | Obtain JWT access + refresh tokens        |
| POST   | `/api/accounts/login/refresh/`       | Refresh an access token                   |
| POST   | `/api/accounts/login/verify/`        | Verify a token is valid                   |
| GET/PATCH | `/api/accounts/me/`               | View/update the logged-in user's profile  |
| POST   | `/api/accounts/change-password/`     | Change the logged-in user's password      |

Send the access token as `Authorization: Bearer <token>` on subsequent
requests.

## Running tests

```bash
python manage.py test
```

Tests run against a throwaway `test_<DB_NAME>` PostgreSQL database created
automatically by Django (the `DB_USER` needs `CREATEDB` privileges, as set
up above).

## Calling the ML service

The ML service is a **Hugging Face Space** (a Gradio app running on
ZeroGPU), not a plain HTTP/JSON API. ZeroGPU assigns GPUs through a
queue, so we use the official `gradio_client` library, which handles the
queueing and file upload for us.

Django never proxies raw DB access to the ML service. The survey upload
workflow calls it through `apps/recommendations/ml_client.py`'s
`MLServiceClient`, using the `ML_SPACE_ID` / `HF_TOKEN` /
`ML_SERVICE_TIMEOUT_SECONDS` settings, and stores the result as an
`MLPrediction`.

Configure it in `.env`:

```bash
ML_SPACE_ID=aniketkhandare/smartagri-ml-backend
HF_TOKEN=hf_your_token_here      # REQUIRED if the Space is private
ML_SERVICE_TIMEOUT_SECONDS=120   # ZeroGPU cold starts can be slow
```

**Never commit a real `HF_TOKEN`.** `.env` is gitignored; only
`.env.example` (with a blank token) is tracked.

The Space's `/predict` endpoint is called with:
`image_path`, `crop`, `lat`, `lng`, `ph`, `n`, `p`, `k`,
`base_schedule_str` (a JSON string). See
`apps/surveys/services.py::build_ml_request_payload`.

If the Space is unreachable, times out, or errors, the `SurveySubmission`
is still saved and the `MLPrediction` is recorded as `failed` — the API
returns a generic message and never leaks internal detail. Django tests
mock this call, so no real Space or token is needed to run the suite.
