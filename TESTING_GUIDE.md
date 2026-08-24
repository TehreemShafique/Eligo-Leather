# Complete Application Testing Guide for Eligo Leather

This document provides end-to-end instructions for testing the **Eligo Leather** e-commerce platform. It covers environment setup, running automated tests, and executing complete manual test workflows across the Admin Portal, Customer Storefront, and Backend API.

---

## 📐 Architecture Overview

| Component | Tech Stack | Local URL | Role |
| :--- | :--- | :--- | :--- |
| **Backend API** | Python / FastAPI / SQLAlchemy / Postgres | `http://localhost:8000` | Core API, Auth, Orders, Catalog, Discounts, Webhooks |
| **Customer Storefront** | Next.js 16 / React 19 / Tailwind CSS | `http://localhost:3000` | Public store for browsing, cart, and checkout |
| **Admin Portal** | Next.js 15 / React 19 / Tailwind CSS | `http://localhost:3001` | Store management dashboard for admin & staff |

---

## 🛠️ Step 1: Prerequisites & Environment Setup

Before starting tests, ensure all dependencies and environment configurations are set up.

### 1. Requirements
- **Node.js**: v18.x or v20.x (with `npm`)
- **Python**: v3.11+ or v3.13 (with `uv` or `pip`)
- **Git**: Installed and repository cloned

### 2. Environment Variables Setup

#### Backend (`eligo-backend/.env`)
Ensure `eligo-backend/.env` contains the required keys:
```env
DATABASE_URL=postgresql+asyncpg://your_db_user:your_db_password@your_db_host/your_db_name?ssl=require
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN-EXPIRE-MINUTES=1440

LEOPARDS_API_KEY=your_leopards_api_key
LEOPARDS_API_PASSWORD=your_leopards_api_password
LEOPARDS_API_BASE_URL=https://merchantapi.leopardscourier.com

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_email@example.com
```

#### Customer Storefront (`eligo-frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Admin Portal (`admin-frontend/.env.local`)
Create `.env.local` inside `admin-frontend/` if not present:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🚀 Step 2: Running the Applications Locally

Open 3 separate terminal windows to run all three services concurrently:

### Terminal 1: Backend API
```bash
cd eligo-backend
# Activate virtual environment if using one
# source .venv/bin/activate (Linux/Mac) or .venv\Scripts\activate (Windows)

# Install dependencies (if needed)
pip install -r requirements.txt # or uv sync / pip install -e .

# Run Database Migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- **API Swagger Docs**: Visit `http://localhost:8000/docs` to inspect and test raw endpoints.

### Terminal 2: Customer Storefront
```bash
cd eligo-frontend
npm install
npm run dev
```
- Access at: `http://localhost:3000`

### Terminal 3: Admin Portal
```bash
cd admin-frontend
npm install
npm run dev -- -p 3001
```
- Access at: `http://localhost:3001`

---

## 🧪 Step 3: Running Automated Test Suites

### 1. Backend Automated Tests (Pytest)
Runs pytest unit and integration tests for auth, catalog, orders, discounts, and database services.

```bash
cd eligo-backend
pytest
```
*To run with coverage report:*
```bash
pytest --cov=app
```

### 2. Customer Storefront Component & Unit Tests (Vitest)
Runs Vitest unit tests for components, stores, and utilities.

```bash
cd eligo-frontend
npm run test
```

### 3. Build & Type Checking Verification
Verify that both frontends compile without TypeScript or ESLint errors:

```bash
# Check Customer Storefront
cd eligo-frontend
npm run lint
npm run build

# Check Admin Portal
cd admin-frontend
npm run lint
npm run build
```

---

## 📋 Step 4: Step-by-Step Manual Test Checklist

Follow this scenario-based testing workflow to verify end-to-end functionality.

---

### 🟢 Scenario A: Admin Catalog & Inventory Setup (`http://localhost:3001`)

1. **Admin Authentication**
   - Navigate to `http://localhost:3001/login`
   - Log in using valid admin credentials.
   - **Pass Criteria**: Successfully redirects to the Admin Dashboard.

2. **Create New Product**
   - Navigate to **Products** (`/products`) -> Click **Add Product** (`/products/new`).
   - Enter title (e.g., *"Premium Leather Jacket"*), description, and price.
   - Upload product images.
   - Set inventory count (e.g., `10` units).
   - Assign to a collection/category (e.g., *"Outerwear"*).
   - Save the product and ensure status is **Active/Published**.
   - **Pass Criteria**: Product appears in product list with correct price and inventory count.

3. **Manage Collections & Categories**
   - Navigate to **Products -> Collections** (`/products/collections`).
   - Create a new collection (e.g., *"Winter Collection"*).
   - **Pass Criteria**: Collection created and editable.

4. **Create Discount Code**
   - Navigate to **Discounts** (`/discounts`) -> Click **Create Discount** (`/discounts/new`).
   - Create code `WELCOME10` for 10% off.
   - Save discount.
   - **Pass Criteria**: Code active in discount list.

---

### 🔵 Scenario B: Customer Storefront Shopping & Checkout (`http://localhost:3000`)

1. **Browse Catalog & Product Details**
   - Navigate to `http://localhost:3000`.
   - Verify home page banner, featured collections, and products.
   - Click on the newly created *"Premium Leather Jacket"*.
   - **Pass Criteria**: Product detail page displays accurate price, description, images, and "Add to Cart" button.

2. **Cart Management**
   - Select size/variant (if applicable) and click **Add to Cart**.
   - Verify cart drawer opens displaying item count and price.
   - Adjust quantity (e.g., increment to 2).
   - Navigate to `/cart`.
   - **Pass Criteria**: Subtotal updates correctly according to quantity.

3. **Checkout Process**
   - Click **Proceed to Checkout** (`/checkout`).
   - Enter shipping address details (Name, Address, City, Phone, Email).
   - Apply promo code `WELCOME10`.
   - **Pass Criteria**: 10% discount deduction is calculated and reflected in order total.
   - Select payment method (e.g., Cash on Delivery).
   - Click **Place Order**.
   - **Pass Criteria**: Redirects to Order Confirmation page showing Order ID.

---

### 🟡 Scenario C: Admin Order Fulfillment & Leopards Courier Tracking

1. **Verify Order Arrival in Admin**
   - Return to Admin Portal at `http://localhost:3001/orders`.
   - Check top of the order list for the newly placed order.
   - **Pass Criteria**: New order appears with status `Unfulfilled` / `Pending`.

2. **Inspect Order Details**
   - Click on the order ID to open details (`/orders/[id]`).
   - Check line items, shipping address, discount applied, and total amount.
   - **Pass Criteria**: Order items and address match customer input.

3. **Generate Leopards Courier Shipment**
   - Click on **Shipment / Leopards Courier** button (`/orders/[id]/leopard-shipment`).
   - Generate consignment tracking number (CN).
   - **Pass Criteria**: Valid CN number generated, shipment status updated.

4. **Fulfill Order & Stock Deduction**
   - Mark order as **Fulfilled**.
   - Navigate back to **Products -> Inventory** (`/products/inventory`).
   - **Pass Criteria**: Inventory count for the ordered product reduced by the purchased quantity.

---

### 🟣 Scenario D: Additional Feature Testing

| Module | Test Steps | Expected Outcome |
| :--- | :--- | :--- |
| **Customer Registration & Login** | Register at `/register`, log out, log in at `/login`. | User profile accessible, session persisted. |
| **Blog & Custom Pages** | Create blog post in Admin (`/content/blogs/new`). View at `/blog` on storefront. | Blog post visible and rendered in storefront. |
| **Customer Management** | View customer list in Admin (`/customers`). Check order history. | Customer email and total spent listed accurately. |
| **B2B Companies & Segments** | Add company in Admin (`/customers/companies/new`). Filter segments. | Company record saved and linked. |
| **Media File Manager** | Upload image in Admin (`/content/files`). | Image saved to backend `static/` directory and viewable. |

---

## 🚨 Step 5: Edge Cases & Error Handling Tests

1. **Out of Stock Purchase**:
   - Set product inventory to `0` in Admin.
   - Attempt to add to cart/checkout on storefront.
   - **Expected**: "Out of stock" badge displayed; checkout button disabled.

2. **Invalid Discount Code**:
   - Enter `EXPIRED999` at checkout.
   - **Expected**: Error message "Invalid or expired discount code" displayed without crashing.

3. **Form Validation Checks**:
   - Attempt checkout with invalid email format or missing shipping address fields.
   - **Expected**: Inline field validation errors displayed.

4. **Backend Disconnection Handling**:
   - Stop backend server (`Ctrl+C` in Terminal 1).
   - Refresh frontend pages.
   - **Expected**: Friendly error notification/toast without blank screen or unhandled exceptions.

---

## 📝 Step 6: How to Report Bugs

When reporting an issue found during testing, please include:
1. **Component**: (Admin / Storefront / Backend API)
2. **URL / Route**: (e.g., `/checkout` or `/orders/12`)
3. **Steps to Reproduce**: Detailed sequential steps
4. **Expected Behavior**: What should have happened
5. **Actual Behavior**: What actually happened (attach screenshot or console/terminal error logs)
