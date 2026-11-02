# StayEase Setup & Installation Guide

This guide covers running StayEase locally for development, configuring the PostgreSQL database, executing migrations, seeding demo records, running automated tests, and building for production.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (Tested on Node v20 & v26)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Either local PostgreSQL or the bundled zero-config `embedded-postgres`

---

## 2. Quick Start (Zero-Config Development Mode)

### Step 1: Clone and Configure Environment
Copy the example environment configuration into the root `.env`:
```bash
cp .env.example .env
```
The default values in `.env.example` are pre-configured to work out of the box with the bundled embedded PostgreSQL on port `5433` and local test-mode payments.

### Step 2: Install Dependencies
Run the installation script to set up root, server, and client packages:
```bash
npm run install:all
```
Or individually:
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### Step 3: Start the Embedded PostgreSQL Database
StayEase includes an embedded PostgreSQL runtime so you don't need Docker or a manual PostgreSQL installation on your machine:
```bash
npm run db:start
```
*Note: This starts PostgreSQL 18 on `127.0.0.1:5433` with data stored in `./pgdata`.*

### Step 4: Run Database Migrations & Seed Data
Initialize the database tables and populate sample luxury hotels, rooms, coupons, and demo accounts:
```bash
npm run db:migrate
npm run db:seed
```

### Step 5: Start Development Servers
Start both the Express backend and Vite frontend concurrently:
```bash
npm run dev
```
Or run them separately in distinct terminal windows:
```bash
# Terminal 1: Backend Server (http://localhost:5000)
npm run dev:server

# Terminal 2: Frontend Client (http://localhost:5173)
npm run dev:client
```

---

## 3. Demo User Accounts

When seeded, the following accounts are available for testing:

| Role | Email | Password | Permissions & Features |
|---|---|---|---|
| **Super Admin** | `admin@stayease.com` | `Admin@123` | System-wide analytics, all hotels, rooms, coupons, user management |
| **Hotel Manager** | `manager@stayease.com` | `Manager@123` | Assigned to Grand Azure Haven; manages rooms, rates, reservations |
| **Receptionist** | `receptionist@stayease.com` | `Staff@123` | Front-desk operations: check-in, check-out, room readiness, search |
| **Customer** | `customer@stayease.com` | `Customer@123` | Search, real-time availability, hold & booking, payments, invoice |

*Convenience feature:* The login page includes one-click demo login buttons to instantly switch between roles without typing credentials.

---

## 4. Payment Gateway Configuration (Razorpay)

StayEase supports both **Live Razorpay Test Mode** and **Local Development Simulated Mode**:

### Simulated Development Mode (Default)
When `RAZORPAY_KEY_ID` is left empty or as placeholder:
- Checkout presents an interactive **"Simulated Test Payment Modal"**.
- Allows choosing between **"Simulate Successful Payment"** and **"Simulate Failed Payment"**.
- Generates valid HMAC-SHA256 signatures server-side to execute realistic state transitions.
- Clearly displays a warning banner stating simulated test mode is active.

### Live Razorpay Test Mode
To connect to real Razorpay test servers:
1. Obtain your test API keys from [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Set in `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_YourKeyHere
   RAZORPAY_KEY_SECRET=YourSecretHere
   RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretHere
   ```
3. Restart the server.

---

## 5. Running Automated Tests

StayEase includes an automated test suite verifying core business logic, availability half-open intervals, price calculations, booking state machines, and API security.

Run all tests via:
```bash
npm test
```
Or directly within the `server` directory:
```bash
cd server
npm run test
```

---

## 6. Building for Production

To build the client and server production bundles:
```bash
npm run build
```
- **Backend output:** `server/dist/`
- **Frontend output:** `client/dist/`

To start the production server:
```bash
cd server
npm start
```
