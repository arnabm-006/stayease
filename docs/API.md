# StayEase REST API Documentation

The StayEase REST API provides complete endpoints for hotel discovery, room availability, booking lifecycle management, payment integration, user authentication, and multi-role administrative workflows.

- **Base URL:** `http://localhost:5000/api`
- **Content Type:** `application/json`
- **Authentication:** HTTP-only cookie (`token`) or `Authorization: Bearer <token>` header.

---

## 1. Authentication Endpoints (`/api/auth`)

### Register Customer
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "password": "Password@123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "user": {
      "id": "uuid",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    },
    "token": "jwt_token_string"
  }
  ```

### Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "customer@stayease.com",
    "password": "Customer@123"
  }
  ```
- **Response:** `200 OK` (Sets HTTP-only `token` cookie)
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "email": "customer@stayease.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "assignedHotelId": null
    },
    "token": "jwt_token_string"
  }
  ```

### Logout
- **Endpoint:** `POST /api/auth/logout`
- **Access:** Authenticated
- **Response:** `200 OK` (Clears auth cookie)

### Current User Profile
- **Endpoint:** `GET /api/auth/me`
- **Access:** Authenticated
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "email": "user@stayease.com",
      "firstName": "First",
      "lastName": "Last",
      "role": "CUSTOMER"
    }
  }
  ```

### Forgot Password
- **Endpoint:** `POST /api/auth/forgot-password`
- **Access:** Public
- **Request Body:**
  ```json
  { "email": "customer@stayease.com" }
  ```
- **Response:** `200 OK`

### Reset Password
- **Endpoint:** `POST /api/auth/reset-password`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "token": "reset_token_from_email",
    "password": "NewPassword@123"
  }
  ```
- **Response:** `200 OK`

---

## 2. Hotels & Rooms Endpoints (`/api/hotels`)

### Search & List Hotels
- **Endpoint:** `GET /api/hotels`
- **Access:** Public
- **Query Parameters:**
  - `destination`: string (searches city, state, country, or name)
  - `checkIn`: YYYY-MM-DD
  - `checkOut`: YYYY-MM-DD
  - `guests`: integer (default 1)
  - `rooms`: integer (default 1)
  - `minPrice`: number
  - `maxPrice`: number
  - `starRating`: integer (1-5)
  - `amenities`: comma-separated amenity IDs
  - `roomType`: room type ID
  - `sort`: `price_asc` | `price_desc` | `rating_desc` | `popularity_desc`
  - `page`: integer (default 1)
  - `limit`: integer (default 10)
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "Grand Azure Haven",
        "slug": "grand-azure-haven",
        "starRating": 5,
        "city": "Miami",
        "startingPrice": 320.00,
        "images": [{ "url": "https://...", "isPrimary": true }],
        "amenities": [{ "name": "Infinity Pool" }],
        "avgRating": 4.9,
        "reviewCount": 128
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "pages": 1 }
  }
  ```

### Hotel Details
- **Endpoint:** `GET /api/hotels/:id`
- **Access:** Public
- **Response:** `200 OK` (Full hotel details, room types, policies, images, amenities, and reviews)

### Hotel Room Availability Engine
- **Endpoint:** `GET /api/hotels/:id/availability`
- **Access:** Public
- **Query Parameters:**
  - `checkIn`: YYYY-MM-DD (Required)
  - `checkOut`: YYYY-MM-DD (Required)
  - `guests`: integer (default 2)
  - `rooms`: integer (default 1)
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "hotelId": "uuid",
    "checkIn": "2026-11-01",
    "checkOut": "2026-11-05",
    "nights": 4,
    "roomTypes": [
      {
        "id": "uuid",
        "name": "Oceanfront Deluxe King",
        "maxOccupancy": 2,
        "availableInventory": 3,
        "basePricePerNight": 340.00,
        "calculatedTotalForStay": 1360.00,
        "isAvailable": true
      }
    ]
  }
  ```

---

## 3. Booking & Reservation Endpoints (`/api/bookings`)

### Create Hold / Booking
- **Endpoint:** `POST /api/bookings`
- **Access:** Authenticated (Customer)
- **Request Body:**
  ```json
  {
    "hotelId": "uuid",
    "checkInDate": "2026-11-01",
    "checkOutDate": "2026-11-05",
    "rooms": [
      {
        "roomTypeId": "uuid",
        "quantity": 1,
        "guests": [
          { "fullName": "John Doe", "email": "john@example.com", "isPrimary": true }
        ]
      }
    ],
    "couponCode": "WELCOME10",
    "specialRequests": "High floor room preferred"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "success": true,
    "booking": {
      "id": "uuid",
      "bookingReference": "SE-202611-ABC123",
      "status": "PENDING",
      "paymentStatus": "UNPAID",
      "holdExpiresAt": "2026-10-26T22:35:00.000Z",
      "subtotal": 1360.00,
      "discountAmount": 136.00,
      "taxAmount": 122.40,
      "totalAmount": 1346.40
    }
  }
  ```

### Customer Bookings
- **Endpoint:** `GET /api/bookings/my`
- **Access:** Authenticated (Customer)
- **Response:** `200 OK` (List of user's personal bookings with room & hotel details)

### Booking Details by ID
- **Endpoint:** `GET /api/bookings/:id`
- **Access:** Authenticated (Booking owner or Authorized staff)
- **Response:** `200 OK`

### Cancel Booking
- **Endpoint:** `POST /api/bookings/:id/cancel`
- **Access:** Authenticated (Booking owner or Staff)
- **Request Body:**
  ```json
  { "cancellationReason": "Change of travel plans" }
  ```
- **Response:** `200 OK` (Releases held inventory immediately)

---

## 4. Payment Endpoints (`/api/payments`)

### Create Payment Order
- **Endpoint:** `POST /api/payments/create-order`
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "bookingId": "uuid",
    "paymentMethod": "RAZORPAY"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "orderId": "order_sim_12345678",
    "amount": 134640,
    "currency": "INR",
    "mode": "DEVELOPMENT_SIMULATED",
    "keyId": "rzp_test_placeholder_key_id"
  }
  ```

### Verify Payment
- **Endpoint:** `POST /api/payments/verify`
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "bookingId": "uuid",
    "orderId": "order_sim_12345678",
    "paymentId": "pay_sim_98765432",
    "signature": "simulated_valid_signature_hash"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Payment verified and booking confirmed",
    "bookingReference": "SE-202611-ABC123"
  }
  ```

### Payment Webhook
- **Endpoint:** `POST /api/payments/webhook`
- **Access:** Public (Verified via `X-Razorpay-Signature` HMAC header)
- **Response:** `200 OK` (Idempotent confirmation)

### Refund Payment
- **Endpoint:** `POST /api/payments/:id/refund`
- **Access:** Authenticated (Admin / Hotel Manager)
- **Request Body:**
  ```json
  {
    "amount": 1346.40,
    "reason": "Customer cancellation within refundable window"
  }
  ```
- **Response:** `200 OK`

---

## 5. Administration Endpoints (`/api/admin`)

- **Role Guard:** `SUPER_ADMIN`, `HOTEL_MANAGER`, `RECEPTIONIST`
- **Hotel-level Access Control:** Automatically filters and scopes queries for hotel managers and receptionists to their assigned hotel.

### Dashboard Analytics
- **Endpoint:** `GET /api/admin/dashboard`
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "metrics": {
      "totalBookings": 42,
      "arrivalsToday": 4,
      "departuresToday": 3,
      "occupiedRooms": 15,
      "availableRooms": 35,
      "occupancyRate": 30.0,
      "grossBookingValue": 24800.00,
      "confirmedRevenue": 21500.00,
      "cancellations": 2
    },
    "revenueTrends": [
      { "date": "2026-10-20", "revenue": 3400.00, "bookings": 3 }
    ],
    "recentBookings": [...]
  }
  ```

### Manage Hotels
- `POST /api/admin/hotels`: Create new hotel (Super Admin)
- `PATCH /api/admin/hotels/:id`: Update hotel info & policies (Admin / Assigned Manager)
- `DELETE /api/admin/hotels/:id`: Soft delete / unpublish hotel (Super Admin)

### Manage Rooms & Room Types
- `POST /api/admin/rooms/types`: Create room type with occupancy & pricing
- `POST /api/admin/rooms`: Create physical room with room number & floor
- `PATCH /api/admin/rooms/:id/status`: Update status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `DIRTY`, `CLEANING`)

### Check-in / Check-out Operations
- `PATCH /api/admin/bookings/:id/checkin`: Validate payment & perform guest check-in
- `PATCH /api/admin/bookings/:id/checkout`: Complete stay, release room, flag for housekeeping

### Manage Staff & Coupons
- `GET /api/admin/staff`: List staff members with roles and assignments
- `POST /api/admin/coupons`: Create promotion codes with discount type, min spend, and usage limits
