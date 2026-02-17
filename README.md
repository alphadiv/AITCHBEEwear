# AITCHBEE — E-commerce Website

Professional e-commerce site for **AITCHBEE** branding clothes. Built with **React** (Vite) and **Node.js** (Express). Color palette: **black**, **yellow**, and **white**.

## Features

- **3D product showcase**: Switch products with arrows (right/left); 3D animated carousel with React Three Fiber.
- **Flying bee**: A small bee flies around the page with wing animation.
- **Cursor bee**: A bee follows the mouse cursor (hidden on touch devices).
- **Shop**: Product grid, product detail, and cart (stored in `localStorage`).

## Run the project

### Backend (API)

```bash
cd backend
npm install
npm start
```

API runs at **http://localhost:3001**.

Copy `backend/.env.example` to `backend/.env` and set `JWT_SECRET`. To use **Supabase** as the database, also set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (see [Database (Supabase)](#database-supabase) below). If you omit them, the API uses an in-memory store.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** and proxies `/api` to the backend.

Open **http://localhost:5173** in the browser. Use the **→** button or dots to switch products in the 3D showcase; move the mouse to see the cursor bee and the flying bee on the page.

**Production (e.g. Vercel) – login/auth:**  
- Deploy the **backend** somewhere (e.g. [Render](https://render.com), Railway).  
- **Render:** In the dashboard, set **Branch** to **`main`** (not `master`). Set **Root Directory** to **`backend`**, **Build Command** to **`npm install`**, **Start Command** to **`npm start`**. Add env vars: `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Or deploy from repo root: the root `package.json` has `start` and `postinstall` so `yarn install` then `yarn start` runs the backend.  
- In **Vercel** → Project → Settings → Environment Variables, add **`BACKEND_URL`** = your backend URL (e.g. `https://your-app.onrender.com`).  
- The frontend includes an API proxy (`frontend/api/[[...path]].js`) that forwards `/api/*` to `BACKEND_URL`, so login and auth work without CORS. Redeploy the frontend after setting `BACKEND_URL`.  
- Alternatively, set **`VITE_API_URL`** to your backend URL so the frontend calls the backend directly (no proxy).

## Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com) and get your project URL and the **service_role** key (Project Settings → API).
2. In the Supabase **SQL Editor**, run the migration file **`supabase/migrations/20250216000000_initial_schema.sql`** (creates tables: `users`, `products`, `product_ratings`, `orders`, `order_items`, `verification_codes`, and seeds the initial products).
3. In `backend/.env` set:
   - `SUPABASE_URL=https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`
4. Restart the backend. It will use Supabase for all data and seed the default admin (`admin@aitchbee.com` / `admin123`) and test user (`buyer@test.com` / `buyer123`) if they don’t exist.

## Deploy on Vercel

1. **Default branch (GitHub)**  
   In your repo: **Settings → General → Default branch** → set to **`main`** so Vercel deploys from `main`.

2. **Vercel project**  
   - **Option A (recommended):** Leave **Root Directory** empty. The root `vercel.json` will run `npm install` and `npm run build` inside `frontend` and use `frontend/dist` as output.  
   - **Option B:** Set **Root Directory** to **`frontend`**. Then `frontend/vercel.json` is used and the build runs from the `frontend` folder.

   In both cases, rewrites are set so that `/favicon.ico`, `/bee.svg`, and `/assets/*` are served as files, and all other paths fall back to `index.html` (SPA routing).
