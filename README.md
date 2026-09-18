# Simatei Motorworld

Simatei Motorworld is a full-stack vehicle marketplace application. The project is split into:

- a Vite + React frontend under `client/`
- a Flask + SQLAlchemy backend under `server/`

The application supports car browsing, listing, saving favourites, submitting enquiries, booking test drives, and admin operations.

## Project structure

```text
.
├── client/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   ├── README.md
│   └── .gitignore
├── server/
│   ├── app/
│   ├── migrations/
│   ├── wsgi.py
│   ├── requirements.txt
│   ├── Pipfile
│   ├── docker-compose.yml
│   ├── README.md
│   └── .gitignore
├── .gitignore
├── README.md
└── .vscode/
```

## Technology stack

### Frontend

- React
- Vite
- TypeScript

### Backend

- Python
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-JWT-Extended
- PostgreSQL
- Redis (configured for Celery-related settings, but not fully active in the current codebase)

## How the client and server work together

The backend exposes REST API endpoints under `/api`.

The frontend runs separately from the backend and communicates with it over HTTP. The client reads the API base URL from an environment variable such as:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

The Flask app exposes the health check at:

```text
GET http://localhost:5000/health
```

The frontend calls this backend for:

- authentication
- user profile updates
- vehicle listing and filtering
- vehicle details
- favouriting
- enquiries
- test-drive bookings
- seller inventory management
- admin dashboards

## Prerequisites

### Required

- Node.js 18+
- npm
- Python 3.8+
- PostgreSQL running locally

### Optional for local development

- Redis for future Celery-based background tasks

## Backend setup

From the repository root:

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install Flask-Caching
```

Set environment variables:

```bash
export SECRET_KEY='local-secret-key'
export JWT_SECRET_KEY='local-jwt-secret-key'
export DATABASE_URL='postgresql://dev:car_db2026@localhost:5432/car_db'
```

Create the database if needed:

```sql
CREATE USER dev WITH PASSWORD 'car_db2026';
CREATE DATABASE car_db OWNER dev;
```

Run the backend:

```bash
python wsgi.py
```

The API listens on:

```text
http://localhost:5000
```

## Database migrations and seed data

Run migrations:

```bash
cd server
source .venv/bin/activate
export FLASK_APP=wsgi.py
flask db upgrade
```

Seed the database:

```bash
cd server
source .venv/bin/activate
python -m app.seeds.dev_seed
```

Seeded users:

- Admin: `admin@simat.com` / `Admin123!`
- Seller: `seller@simat.com` / `Seller123!`

> The seed script is destructive. It drops and recreates the tables.

## Frontend setup

From the repository root:

```bash
cd client
npm install
cp .env.example .env  # if you have a template; otherwise create .env manually
```

Create `.env` if needed:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Run the frontend:

```bash
npm run dev
```

The Vite app will run on the default local port, usually:

```text
http://localhost:5173
```

## Running the full stack

In separate terminals:

1. Start the backend:

```bash
cd server
source .venv/bin/activate
export SECRET_KEY='local-secret-key'
export JWT_SECRET_KEY='local-jwt-secret-key'
export DATABASE_URL='postgresql://dev:car_db2026@localhost:5432/car_db'
python wsgi.py
```

2. Start the frontend:

```bash
cd client
npm install
npm run dev
```

## Notes

- The backend uses Bearer JWTs for auth.
- The frontend must send the token in `Authorization: Bearer <token>` headers.
- The backend returns tokens under the field name `token`.
- Vehicle creation expects image URLs, not uploaded files.
- The API is mounted under `/api`, so the frontend should not prefix requests twice.
- The project has placeholder auth reset flows and an empty Celery worker; treat them as incomplete unless explicitly implemented later.

## Documentation

- Client docs: `client/README.md`
- Server docs: `server/README.md`
