# beetle-black-shop

Beetle Black Shop is a full-stack demo marketplace that combines a PHP backend with a modern React + Vite frontend. It was built to demonstrate end-to-end product management, promo code handling, and a Stripe-powered checkout flow for the Beetle Black Media graduate program brief.

## Features and requirement coverage

| Brief requirement | Implementation highlights |
| --- | --- |
| **Login system for admins and shoppers** | Session-based authentication stored in SQLite with seeded admin (`admin@example.com` / `admin123`) and shopper (`user@example.com` / `user123`) accounts. Login, logout, and `me` endpoints live in `backend/api/auth.php`. |
| **Create & edit shops (must include a photo)** | Admin dashboard provides drag-and-drop uploads for shop photos. Shops are stored in the `shops` table with an optional photo path and managed through `backend/api/shops.php`. |
| **Create & edit products (each product must include a photo)** | Admins can create products with pricing, descriptions, and required photos. Media is persisted under `backend/uploads/` and exposed through `backend/api/products.php`. |
| **Each shop can list multiple products** | Products reference their parent shop through a foreign key (`shop_id`). The shop picker on the public catalogue loads all items for the selected shop. |
| **Promo codes for shopping products** | Admins can configure percentage or fixed discounts, scheduling windows, and product-specific promos through `backend/api/promo.php`. Promos are validated both client-side (`frontend/src/hooks/usePromoManager.ts`) and during checkout. |
| **Saved carts that survive logout and device changes** | Cart contents are persisted in the `cart_items` table keyed to the authenticated user, so items reappear after logging in on another device. |
| **Stripe checkout with React Stripe** | The checkout page uses `@stripe/react-stripe-js` with a test publishable key, while `backend/api/stripe.php` creates PaymentIntents via the Stripe PHP SDK. |
| **Use PHP for the backend and React for the frontend** | PHP 8 + SQLite powers the API layer; React 19 with Vite provides the SPA frontend. |
| **Integrate at least three external UI/UX libraries** | Material UI (`@mui/material`) delivers the design system, `react-slick` powers product image carousels, `react-google-autocomplete` & Google Places offer location search, and `@stripe/react-stripe-js` handles payment UI. |

Additional niceties include multi-currency price display via live exchange rates, promo code feedback, persistent carts, and an address autocomplete widget constrained to Australian addresses.

## Architecture overview

```
.
├── backend/        # PHP API, SQLite database, Stripe integration, media uploads
│   ├── api/        # Individual route handlers (auth, shops, products, cart, promos, stripe)
│   ├── bbm.sqlite  # SQLite database file (auto-created on first run)
│   └── uploads/    # Uploaded shop and product photos
└── frontend/       # React + Vite SPA with Material UI
    ├── src/        # Pages, components, hooks, and TypeScript types
    └── .env        # Frontend environment variables (API base URL, Stripe key, Google Maps key)
```

## Prerequisites

Install the following tooling before starting:

- **Node.js 20+** (includes `npm`)
- **PHP 8.1+** with the SQLite extension enabled
- **Composer** for PHP package management

If you plan to edit addresses or payments, keep valid Google Maps Places and Stripe test keys handy. Default test credentials are already present in `frontend/.env` for local development.

## Getting started (from zero)

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/beetle-black-shop.git
   cd beetle-black-shop
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   composer install
   cd ..
   ```

   The first request to the API automatically creates `backend/bbm.sqlite` with seed data and tables.

3. **Install frontend dependencies**

   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configure environment variables**

   - `frontend/.env` already contains sensible defaults for local development:
     ```ini
     VITE_API=http://localhost:8000/api
     VITE_STRIPE_PK="pk_test_..."
     VITE_GOOGLE_MAPS_API_KEY="..."
     ```
   - Update these values if your backend runs on a different host/port or if you have your own Stripe/Google credentials.

   The PHP backend uses embedded configuration (`backend/api/config.php`) and does not require a separate `.env` file. Stripe’s secret key is set inside `backend/api/stripe.php`; replace it with your own test key before accepting payments.

5. **Start the PHP API**

   From the project root:

   ```bash
   php -S localhost:8000 -t backend
   ```

   The built-in server serves every file under `/backend`. Visiting `http://localhost:8000/api/debug.php` confirms the API is reachable, and image uploads are stored in `backend/uploads/`.

6. **Start the React development server**

   In a new terminal window:

   ```bash
   cd frontend
   npm run dev
   ```

   Vite proxies API calls starting with `/api` to `http://localhost:8000`, so the frontend and backend communicate seamlessly. Open the printed URL (typically `http://localhost:5173`) in your browser.

## Default accounts & sample data

- **Admin:** `admin@example.com` / `admin123`
- **Shopper:** `user@example.com` / `user123`

