# Eligo Leather E-Commerce Platform

Welcome to the **Eligo Leather** e-commerce repository. This project is a full-stack e-commerce system featuring a FastAPI backend, a Next.js customer storefront, and a Next.js admin control portal.

## 🏗️ Project Architecture

```
eligo-leather/
├── eligo-backend/     # Python FastAPI backend API & database models
├── eligo-frontend/    # Next.js customer-facing storefront web app
├── admin-frontend/    # Next.js admin management portal
└── TESTING_GUIDE.md   # Comprehensive step-by-step testing instructions
```

---

## 🧪 How to Test the Application

For a complete, step-by-step guide on how to set up, run, and test all features (including automated tests, manual E2E workflows, catalog management, checkout flow, Leopards courier integration, and edge cases), please refer to:

👉 **[Complete Testing Guide](file:///e:/eligo-leather/TESTING_GUIDE.md)** (`TESTING_GUIDE.md`)

---

## ⚡ Quick Start

### 1. Backend API (`http://localhost:8000`)
```bash
cd eligo-backend
pip install -r requirements.txt  # or uv sync
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 2. Customer Storefront (`http://localhost:3000`)
```bash
cd eligo-frontend
npm install
npm run dev
```

### 3. Admin Portal (`http://localhost:3001`)
```bash
cd admin-frontend
npm install
npm run dev -- -p 3001
```
