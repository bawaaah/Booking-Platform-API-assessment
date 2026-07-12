# Software Requirements Specification (SRS)
## Booking Platform REST API

---

### 1. Project Overview
This project is a backend REST API developed for the EN2H Software Engineer Intern technical assessment. The system enables users to manage salon services and allows customers to create and manage bookings. 

### 2. Tech Stack
- **Framework:** NestJS + TypeScript
- **Database:** PostgreSQL 16
- **ORM:** TypeORM
- **Authentication:** JWT (Access and Refresh Tokens)
- **Validation:** class-validator & class-transformer
- **Documentation:** Swagger (OpenAPI)
- **Containerization:** Docker & Docker Compose
- **Testing:** Jest

---

### 3. Functional Requirements

#### 3.1 Authentication
- Users can register with an email, name, and password.
- Users can log in to receive an access token (15m expiry) and a refresh token (7d expiry).
- Refresh tokens are securely hashed and stored in the database.
- Users can refresh their access token using a valid refresh token.
- Users can log out, which revokes their active refresh token.

#### 3.2 Service Management (Admin Only)
- Authenticated users can create, update, and delete services.
- A service includes a title, description, duration (minutes), price, and an `isActive` status.
- Public users can view all active services (paginated) and view individual service details.

#### 3.3 Booking Management
- Public users (customers) can create bookings without authentication.
- A booking requires customer details (name, email, phone), a valid `serviceId`, date, and time.
- Authenticated users can view all bookings (with pagination, search, and status filtering).
- Authenticated users can update a booking's status.
- Public users can cancel their bookings.

---

### 4. Business Rules & Constraints
1. **Service Existence:** A booking must belong to an existing and active service.
2. **Past Dates:** Booking dates cannot be in the past.
3. **Status Flow:** Bookings flow from `PENDING` -> `CONFIRMED` -> `COMPLETED`. 
4. **Cancellation Restrictions:** Cancelled bookings cannot be marked as completed.
5. **Duplicate Prevention:** A composite database-level unique constraint on `(serviceId, bookingDate, bookingTime)` prevents double-booking for the exact same slot.

---

### 5. Database Schema (Entities)

#### User Entity
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `name` (String)
- `password` (String, Hashed)
- `hashedRefreshToken` (String, Nullable)

#### Service Entity
- `id` (UUID, Primary Key)
- `title` (String)
- `description` (Text)
- `duration` (Integer)
- `price` (Decimal)
- `isActive` (Boolean)
- `createdById` (UUID, Foreign Key to User)

#### Booking Entity
- `id` (UUID, Primary Key)
- `customerName` (String)
- `customerEmail` (String)
- `customerPhone` (String)
- `serviceId` (UUID, Foreign Key to Service)
- `bookingDate` (Date)
- `bookingTime` (Time)
- `status` (Enum: PENDING, CONFIRMED, CANCELLED, COMPLETED)
- `notes` (Text)

---

### 6. Architecture Decisions
- **Global Auth Guard:** The `JwtAuthGuard` is applied globally. Public endpoints explicitly use a `@Public()` decorator.
- **Error Handling:** A global `AllExceptionsFilter` ensures consistent, standardized error responses across all endpoints.
- **Validation:** `ValidationPipe` is used globally with `whitelist: true` to strip malicious properties from payloads.

---
*Document prepared for EN2H Assessment Submission.*
