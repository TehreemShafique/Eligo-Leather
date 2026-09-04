# Eligo Leather - Local Setup & Run Guide

> Quick reference for getting all 3 apps running locally.
> If anything breaks, this file is the source of truth.

---

## Prerequisites

- Python 3.14+ (`python --version`)
- Node.js 18+ (`node --version`)
- npm (`npm --version`)
- Git
- Neon database access (connection string in `eligo-backend/.env`)

---

## 1. Backend (`eligo-backend`)

### First-time setup

```powershell
cd C:\Projects\Eligo-Leather\eligo-backend

# Create virtual environment
python -m venv .venv

# Activate it
.venv\Scripts\Activate.ps1

# Install dependencies (pyproject.toml editable install has encoding issues on Windows,
# so install packages directly)
# NOTE: bcrypt MUST stay at ==4.0.1. passlib 1.7.4 crashes ("no attribute '__about__")
# with bcrypt >=5.0.0, which breaks admin login with a 500 "failed to fetch".
pip install aiosmtplib alembic asyncpg "bcrypt==4.0.1" cryptography faker fastapi httpx jinja2 "passlib[bcrypt]" psycopg2-binary "pydantic-settings" "pydantic[email]" pytest pytest-asyncio pytest-cov python-dotenv "python-jose[cryptography]" python-multipart redis sqlalchemy tzdata "uvicorn[standard]" boto3
```

### Every time you pull new code

```powershell
cd C:\Projects\Eligo-Leather\eligo-backend

# Activate venv
.venv\Scripts\Activate.ps1

# Re-install deps in case new packages were added
pip install aiosmtplib alembic asyncpg "bcrypt==4.0.1" cryptography faker fastapi httpx jinja2 "passlib[bcrypt]" psycopg2-binary "pydantic-settings" "pydantic[email]" pytest pytest-asyncio pytest-cov python-dotenv "python-jose[cryptography]" python-multipart redis sqlalchemy tzdata "uvicorn[standard]" boto3

# Check alembic is at head
alembic current
```

### Running

```powershell
.venv\Scripts\Activate.ps1
cd C:\Projects\Eligo-Leather\eligo-backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Known issues

- **`alembic current` shows wrong revision or errors**: The Neon DB may have a
  different head than the repo chain. If the app starts fine, ignore it.
- **`EnumNoShortcutAvailable`**: The DB enum `notification_event_type` may have
  values not in `app/modules/settings/notifications/model.py`. Add the missing
  value to the Python `NotificationEventType` enum.
- **`pyproject.toml` encoding error on Windows**: `pip install -e .` fails because
  the README has non-UTF-8 bytes. Use the direct `pip install` list above instead.
- **DB password > 72 bytes**: bcrypt truncates passwords. This causes 1 test
  failure in `test_public_create_order.py`. Known, pre-existing.
- **Admin login returns 500 "failed to fetch"**: Usually caused by `bcrypt` being
  upgraded past 4.0.1 (passlib 1.7.4 breaks with bcrypt >=5). Fix:
  ```powershell
  .venv\Scripts\pip install "bcrypt==4.0.1"
  ```

---

## 2. Admin Frontend (`admin-frontend`)

### First-time setup / Every time

```powershell
cd C:\Projects\Eligo-Leather\admin-frontend
npm install
```

### Running

```powershell
cd C:\Projects\Eligo-Leather\admin-frontend
npm run dev
```

Starts on `http://localhost:3000`.

### Verify types

```powershell
npx tsc --noEmit
```

---

## 3. Storefront (`eligo-frontend`)

### First-time setup / Every time

```powershell
cd C:\Projects\Eligo-Leather\eligo-frontend
npm install
```

### Running

```powershell
cd C:\Projects\Eligo-Leather\eligo-frontend
$env:PORT="3001"; npm run dev
```

Starts on `http://localhost:3001`.

> **Port conflict**: If you also run admin-frontend, eligo-frontend must use a
> different port. `PORT=3001` avoids the clash with admin's port 3000.

---

## 4. Quick Start (3 terminals)

**Terminal 1 - Backend:**
```powershell
cd C:\Projects\Eligo-Leather\eligo-backend
.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Admin:**
```powershell
cd C:\Projects\Eligo-Leather\admin-frontend
npm run dev
```

**Terminal 3 - Storefront:**
```powershell
cd C:\Projects\Eligo-Leather\eligo-frontend
$env:PORT="3001"; npm run dev
```

---

## 5. After Pulling New Code (full checklist)

1. `git pull origin stage-for-deploy`
2. **Backend**: activate venv, `pip install` deps (re-run to pick up new ones), `alembic current` to sanity-check
3. **Admin**: `npm install` in `admin-frontend/`
4. **Storefront**: `npm install` in `eligo-frontend/`
5. Start all 3 apps using the commands above

---

## File Locations

| File | Purpose |
|------|---------|
| `eligo-backend/.env` | DB URL, secrets (NEVER commit) |
| `eligo-backend/app/modules/settings/notifications/model.py` | `NotificationEventType` enum - must match DB enum values |
| `eligo-backend/app/modules/orders/model.py` | Order model with `shipping_email`, `confirmed_at` |
| `eligo-backend/app/modules/orders/leopard_service.py` | Leopard integration (uses order snapshots) |
| `eligo-backend/app/modules/settings/notifications/service.py` | Notification dispatch, payload builders |
| `eligo-backend/alembic/versions/` | Database migrations |
| Reports (repo root) | `opencode-order-confirmation-*.txt` - prior session reports |

---

## Git Branch

We are working on `stage-for-deploy`. Always confirm:
```powershell
git branch --show-current
```
