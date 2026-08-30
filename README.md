# Smart Shoppy Cart

A smart retail shopping and vendor management application built with React, TypeScript, Vite, Express, and MySQL. The project combines a customer-facing storefront with an admin dashboard, vendor-specific product inventory, JWT-secured admin access, and database-backed cart and order flows.

## P.S.

This project is not a static mockup. It is a working full-stack retail application with real database-backed product data, vendor login, inventory management, CSV import, and checkout logic that writes to MySQL tables.

## Overview

Smart Shoppy Cart is designed for modern retail operations where vendors need:

- a customer-ready product browsing experience
- a kiosk-style cart and checkout flow
- secure vendor/admin login with JWT authentication
- real inventory data kept in MySQL
- separate per-vendor product and order management
- CSV/Excel import for bulk product entries

## Solution

The app solves the common issue of demo data and disconnected workflows by connecting the frontend to a real backend and database.

### Core capabilities

- RFID-inspired shopping experience
- Live cart summary and budget tracking
- Vendor-scoped product inventory
- Admin login and registration with JWT protection
- MySQL integration for product, cart, order, and vendor data
- CSV/Excel product import
- Multi-vendor design with vendor_id-based isolation
- Dashboard for inventory, carts, and orders
- Checkout that writes to carts and orders tables

## Tech stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Express.js
- MySQL 8 / mysql2
- JWT authentication
- bcryptjs
- XLSX for CSV/Excel imports
- Vitest
- Framer Motion
- React Router

## Prerequisites

Before running the project, install:

- Node.js 18+
- npm
- MySQL Server 8+
- Git

## Required modules / dependencies

The project depends on these major packages:

- react
- react-dom
- react-router-dom
- express
- mysql2
- jsonwebtoken
- bcryptjs
- cors
- dotenv
- xlsx
- tailwindcss
- framer-motion
- recharts
- @tanstack/react-query
- vitest

## Database setup

Create a MySQL database named smartcart_db and make sure your local MySQL user has access.

```sql
CREATE DATABASE smartcart_db;
```

Then configure your environment values in a .env file at the project root:

```env
VITE_API_BASE=http://localhost:4000
PORT=4000
JWT_SECRET=smartshop-super-secret-key
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YourNewPassword123!
DB_NAME=smartcart_db
```

The backend creates tables automatically when it starts, including:

- vendors
- products
- carts
- orders
- order_items

## Default admin account

If no vendor account exists, the backend automatically creates a default admin vendor on startup.

- Email: admin@smartshop.local
- Password: admin123

You can log in from the admin page using those values.

## Project structure

```text
smart-shoppy-cart-main/
├── public/
│   └── robots.txt
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   ├── AppHeader.tsx
│   │   ├── AppShell.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── BudgetBar.tsx
│   │   ├── BudgetDialog.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── CartItemCard.tsx
│   │   ├── ProductImage.tsx
│   │   ├── Recommendations.tsx
│   │   ├── ScanSimulator.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── useCart.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── cart-store.ts
│   │   ├── demo-products.ts
│   │   ├── product-import.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Admin.tsx
│   │   ├── AdminLogin.tsx
│   │   ├── AdminSignup.tsx
│   │   ├── Checkout.tsx
│   │   ├── Confirmation.tsx
│   │   ├── Index.tsx
│   │   ├── NotFound.tsx
│   │   ├── Offers.tsx
│   │   ├── Orders.tsx
│   │   └── ...
│   ├── test/
│   │   ├── example.test.ts
│   │   ├── product-import.test.ts
│   │   └── setup.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── server.js
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── README.md
├── bun.lockb
└── public/
```

## How to run the project

### Option 1: run both frontend and backend together

```bash
npm install
npm run dev:full
```

This starts:

- Vite frontend on http://localhost:8080
- Express API on http://localhost:4000

### Option 2: run separately

Start backend:

```bash
npm run server
```

Start frontend:

```bash
npm run dev
```

## Important runtime notes

- The frontend runs on port 8080 as configured in vite.config.ts
- The backend listens on port 4000 via the PORT value in .env or default fallback
- The frontend fetches product data from http://localhost:4000/api/products?vendorId=...
- The cart and checkout flows call the backend cart and order APIs and write into MySQL tables

## Admin workflow

### Register a new vendor

Use the admin signup page to create a vendor account. Required vendor information is stored in the vendors table.

### Login

Use the admin login page to sign in with a JWT-secured session.

### Vendor-scoped access

Each admin is tied to a vendor_id. Product, cart, and order data is scoped to that vendor, preventing cross-vendor access.

## API summary

### Public product route

```http
GET /api/products?vendorId=1
```

Returns product rows for a given vendor.

### Vendor product routes

```http
GET /api/vendor/:vendorId/products
POST /api/vendor/:vendorId/products
POST /api/vendor/:vendorId/products/bulk
```

### Cart and order routes

```http
POST /api/carts
POST /api/orders
GET /api/vendor/:vendorId/carts
GET /api/vendor/:vendorId/orders
POST /api/vendor/:vendorId/carts
POST /api/vendor/:vendorId/orders
```

## Product import

The app supports CSV and Excel-style import for bulk product entries.

Typical import fields include:

- name
- category
- price
- stock_quantity
- rfid_tag
- aisle
- shelf
- reorder_level

The import logic normalizes common aliases and removes duplicates before inserting.

## Build and testing

### Build the app

```bash
npm run build
```

### Run tests

```bash
npm run test
```

### Watch tests

```bash
npm run test:watch
```

### Lint the project

```bash
npm run lint
```

## Troubleshooting

### Connection refused

If the browser shows ERR_CONNECTION_REFUSED, make sure the backend is running on port 4000 and the frontend is running on port 8080.

```bash
npm run dev:full
```

### MySQL connection errors

Check the values in .env and confirm the database exists:

```sql
SHOW DATABASES;
```

If needed, create the correct database:

```sql
CREATE DATABASE smartcart_db;
```

### Product data not showing

Confirm that the vendor_id in the request matches the vendor whose products exist in the products table.

### Checkout fails

Checkout uses either the admin-protected cart APIs or public fallback cart APIs. Make sure the backend is running and the MySQL tables are present.

## Notes

- The storefront reads from the database instead of using demo-only fallback data.
- Vendor-level access is enforced through JWT and vendor_id checks.
- Orders and carts are persisted in MySQL and update the respective tables after transaction completion.
- The app is structured for a real retail workflow and can be extended with authentication, reports, and analytics.

## Final takeaway

Smart Shoppy Cart is a polished, user-friendly retail prototype that blends scanning, budget control, recommendation logic, and a smooth checkout flow into one cohesive shopping experience. It is ideal for demos, product concept validation, and frontend experimentation for smart commerce experiences.

---

Built for a modern, frictionless shopping journey.
