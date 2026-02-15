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

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** and proxies `/api` to the backend.

Open **http://localhost:5173** in the browser. Use the **→** button or dots to switch products in the 3D showcase; move the mouse to see the cursor bee and the flying bee on the page.
