# FixTrack – Repair Shop Management System (Python / FastAPI / PostgreSQL)

FixTrack is a beginner-friendly full-stack student project built to help a small mobile phone and laptop repair shop manage customers, devices, repair requests, status updates, and USD payments.

## Implemented Features

1. **Staff Authentication (JWT)**: Simple login and registration with bcrypt password hashing and Bearer JWT tokens.
2. **Repair Dashboard**: KPI cards for total repairs, active in-shop count, ready-for-pickup count, collected revenue, unpaid balance, and pipeline status breakdown.
3. **Customer Management**: Add, edit, delete, and search customers by name, phone, or email.
4. **Customer Details & Repair History**: Slide-over detail drawer showing contact info, registered devices, total spent, and full repair history.
5. **Device Registry**: Register customer Phones and Laptops with brand, model, and serial/IMEI.
6. **Repair Status Workflow**: Track and update repair tickets across `Received` → `In Progress` → `Ready` → `Collected`.
7. **Cost & Payment Tracking**: Record estimated cost, final cost, and amount paid; payment status (`Unpaid`, `Partial`, `Paid`) updates automatically.
8. **Testing & Tooling**: Automated `pytest` suite, Postman collection, `Dockerfile`, and `docker-compose.yml`.

## Folder Structure

```text
fixtrack-python/
├── app/
│   ├── __init__.py
│   ├── auth.py               # Bcrypt hashing & JWT token utilities
│   ├── config.py             # Environment variable settings
│   ├── database.py           # SQLAlchemy engine & get_db dependency
│   ├── main.py               # FastAPI app, lifespan seeding, static frontend
│   ├── models.py             # PostgreSQL ORM models (User, Customer, Device, RepairRequest)
│   ├── schemas.py            # Pydantic request/response validation schemas
│   ├── seed.py               # Sample mobile/laptop repair shop seed data
│   └── routers/
│       ├── auth_router.py
│       ├── customers_router.py
│       ├── dashboard_router.py
│       ├── devices_router.py
│       └── repairs_router.py
├── frontend/
│   ├── index.html            # Single-page HTML interface
│   ├── css/styles.css        # Responsive sidebar dashboard styles
│   └── js/
│       ├── api.js            # Fetch wrapper with JWT Bearer header
│       └── app.js            # UI rendering and event handlers
├── postman/
│   └── FixTrack.postman_collection.json
├── tests/
│   ├── conftest.py
│   └── test_api.py
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Option 1: Run with Docker (Recommended)

1. Navigate to the `fixtrack-python` directory:
   ```bash
   cd fixtrack-python
   ```
2. Start PostgreSQL and the FastAPI server:
   ```bash
   docker-compose up --build
   ```
3. Open your browser at `http://localhost:8000` (FastAPI Swagger docs are at `http://localhost:8000/docs`).
4. Sign in with the demo account:
   - **Email**: `tech@fixtrack.local`
   - **Password**: `fixtrack123`

## Option 2: Run Locally Without Docker

### 1. PostgreSQL Setup
Create a local database and user in `psql`:
```sql
CREATE USER fixtrack WITH PASSWORD 'fixtrack_pass';
CREATE DATABASE fixtrack_db OWNER fixtrack;
```
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Python Virtual Environment & Server
```bash
cd fixtrack-python
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Tables and sample data are created automatically on first startup.

## Running Backend Tests (Pytest)

```bash
cd fixtrack-python
pytest -v
```
Tests run against an isolated temporary SQLite test database so your PostgreSQL data stays untouched.
