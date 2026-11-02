# StayEase — Hotel Reservation & Management System

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)]()
[![React](https://img.shields.io/badge/React-18-61dafb)]()
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791)]()
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)]()

**StayEase** is a full-stack hotel reservation and property management system designed with an elegant hospitality aesthetic, robust transactional integrity, and comprehensive role-based access control.

---

## 🌟 Key Highlights

- **Dual-Interface System**:
  1. **Customer-Facing Portal**: Destination search, date & guest filters, real-time room availability calculation, multi-room booking holds, secure checkout, coupon discounts, booking management, and verified review submissions.
  2. **Hotel Management Dashboard**: KPI analytics (Occupancy rate, RevPAR trends, arrivals/departures), inventory management, room readiness tracking, housekeeping status, coupon administration, and front-desk check-in/out workflows.
- **Reliable Availability Engine**: Uses strict half-open date intervals `[checkIn, checkOut)` with blocking booking query filters and room maintenance exclusions to eliminate double-booking.
- **Transactional Booking Lifecycle**: 15-minute pending inventory holds with automatic expiration and cleanup jobs.
- **Server-Side Pricing Engine**: Nightly base rates, weekend surcharges, coupon validations (minimum spend, usage limits), 10% hospitality tax, and service fees calculated exclusively on the server.
- **Hybrid Payment Gateway**: Supports **Razorpay Test Mode** with HMAC-SHA256 signature verification and an interactive **Simulated Development Mode** with clear UI indicators for testing without credentials.
- **Enterprise-Grade Security**: Passwords hashed with bcrypt, JWT stored in secure HTTP-only cookies, role-based authorization middleware, rate limiting, and parameter sanitization.

---

## 🏗️ Architecture & Technology Stack

```
stayease/
├── client/                     # Frontend Application (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Footer, Modals, Cards)
│   │   ├── contexts/           # AuthContext with secure session management
│   │   ├── layouts/            # PublicLayout and responsive AdminLayout with sidebar
│   │   ├── pages/              # Customer & Admin pages
│   │   ├── routes/             # AppRoutes with role-protected route guards
│   │   ├── services/           # Axios API service clients
│   │   ├── styles/             # Design system tokens and custom CSS
│   │   └── types/              # TypeScript interfaces and enums
├── server/                     # Backend API (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma       # 20 relational models and enums
│   │   └── seed.ts             # Deterministic seed data script
│   ├── src/
│   │   ├── config/             # DB singleton, embedded PostgreSQL, Zod env validation
│   │   ├── controllers/        # Request handlers (auth, hotels, bookings, admin, etc.)
│   │   ├── jobs/               # Asynchronous hold expiration background cleaners
│   │   ├── middleware/         # Auth, Role, Validation, RateLimit, Error handling
│   │   ├── routes/             # REST endpoint routing
│   │   ├── services/           # Availability engine, Pricing engine, Payments, Emails
│   │   ├── utils/              # Password hashing, JWT, Reference generators, Loggers
│   │   └── validators/         # Zod request payload schemas
│   └── tests/                  # Automated integration tests (Vitest + Supertest)
└── docs/                       # Project Documentation (API, Database, Setup)
```

---

## 🚀 Quick Start Guide

### 1. Requirements
- Node.js (v18+)
- npm (v9+)

### 2. Environment Setup
```bash
# Copy sample configuration
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm run install:all
```

### 4. Database Initialization & Seeding
StayEase features an embedded PostgreSQL instance that runs without requiring local DB services or Docker:
```bash
# Start embedded PostgreSQL database (port 5433)
npm run db:start

# In a new terminal: Push schema and seed development dataset
npm run db:migrate
npm run db:seed
```

### 5. Launch Development Servers
```bash
# Starts both Backend (http://localhost:5000) and Frontend (http://localhost:5173)
npm run dev
```

---

## 👥 Seeded Demo Accounts

You can log in manually or use the **Quick Demo Login buttons** on the `/login` page:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin@stayease.com` | `Admin@123` | System-wide access, all hotels & analytics |
| **Hotel Manager** | `manager@stayease.com` | `Manager@123` | Grand Azure Haven (Rooms, rates, reservations) |
| **Receptionist** | `receptionist@stayease.com` | `Staff@123` | Grand Azure Haven (Front desk, check-in/out) |
| **Customer** | `customer@stayease.com` | `Customer@123` | Customer reservations & profile |

---

## 🧪 Testing

Run the automated test suites covering authentication, price calculation, availability engine, and booking state transitions:
```bash
npm test
```

---

## 📖 Detailed Documentation

- [API Specification (docs/API.md)](file:///c:/Users/zihad/OneDrive/Desktop/project/docs/API.md)
- [Database Schema (docs/DATABASE.md)](file:///c:/Users/zihad/OneDrive/Desktop/project/docs/DATABASE.md)
- [Setup & Deployment Guide (docs/SETUP.md)](file:///c:/Users/zihad/OneDrive/Desktop/project/docs/SETUP.md)
