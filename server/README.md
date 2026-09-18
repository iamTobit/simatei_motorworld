# Server API

This directory contains the Flask backend for Simatei Motorworld.

## Stack

- Python 3.8+
- Flask 2.3
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-JWT-Extended
- PostgreSQL
- Redis (configured for Celery-related settings, but the current worker file is empty)

## Main app entry

The Flask application factory is created in `app/__init__.py`, and the server is launched from `wsgi.py`.

```bash
python wsgi.py
```

The app binds to:

```text
0.0.0.0:5000
```

Health check:

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{ "status": "ok" }
```

## Prerequisites

1. Install Python dependencies:

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install Flask-Caching
```

2. Make sure PostgreSQL is running locally.

3. Create the development database expected by the app:

```sql
CREATE USER dev WITH PASSWORD 'car_db2026';
CREATE DATABASE car_db OWNER dev;
```

4. Set environment variables before running the app:

```bash
export SECRET_KEY='local-secret-key'
export JWT_SECRET_KEY='local-jwt-secret-key'
export DATABASE_URL='postgresql://dev:car_db2026@localhost:5432/car_db'
```

## Run the backend

```bash
cd server
source .venv/bin/activate
export SECRET_KEY='local-secret-key'
export JWT_SECRET_KEY='local-jwt-secret-key'
export DATABASE_URL='postgresql://dev:car_db2026@localhost:5432/car_db'
python wsgi.py
```

## Database migrations

If the database is empty, run:

```bash
cd server
source .venv/bin/activate
export FLASK_APP=wsgi.py
flask db upgrade
```

## Seed data

The app includes a development seed script that drops all tables and recreates the schema:

```bash
cd server
source .venv/bin/activate
python -m app.seeds.dev_seed
```

Seeded credentials:

- Admin: `admin@simat.com` / `Admin123!`
- Seller: `seller@simat.com` / `Seller123!`

## Important API notes

- The app mounts all API routes under `/api`.
- User registration and login return a JWT in a field named `token`.
- Vehicle creation expects a JSON array of image URLs, not uploaded files.
- Auth-protected endpoints require the `Authorization: Bearer <token>` header.
- The project currently has an empty `celery_worker.py`, so Celery is not fully wired up yet.

## Key folders

```text
server/
├── app/
├── migrations/
├── wsgi.py
├── requirements.txt
├── Pipfile
├── docker-compose.yml
├── celery_worker.py
├── README.md
└── .gitignore
```

For the full-stack setup, see the root README.
