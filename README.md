# 📅 Booking Platform API

A production-ready **REST API** for managing services and customer bookings, built as the technical assessment for **EN2H Software Engineer Intern (NestJS)** position.

---

## 🧑‍💻 Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS + TypeScript |
| Database | PostgreSQL 16 |
| ORM | TypeORM |
| Auth | JWT (Access + Refresh Tokens) |
| Validation | class-validator + class-transformer |
| Documentation | Swagger / OpenAPI 3.0 |
| Containerization | Docker + Docker Compose |
| Testing | Jest |

---

## 🚀 Features

### Core Features
- ✅ **JWT Authentication** — Register & Login
- ✅ **Refresh Token Rotation** — Secure token management with bcrypt-hashed storage
- ✅ **Service Management** — Full CRUD (authenticated users only)
- ✅ **Booking Management** — Create, view, update status, cancel

### All 10 Bonus Features Implemented
- ✅ **Pagination** — All list endpoints support `?page=1&limit=10`
- ✅ **Search** — Search bookings by customer name or email `?search=john`
- ✅ **Filter by status** — `?status=PENDING|CONFIRMED|CANCELLED|COMPLETED`
- ✅ **Swagger Documentation** — Full OpenAPI spec at `/api/docs`
- ✅ **Docker Support** — Multi-stage Dockerfile + docker-compose
- ✅ **Validation** — Global ValidationPipe with class-validator decorators
- ✅ **Global Exception Handling** — Standardised error responses
- ✅ **Refresh Token** — 7-day refresh with rotation and revocation on logout
- ✅ **Unit Testing** — 34 passing tests across Auth, Services, and Bookings
- ✅ **Prevent Duplicate Bookings** — DB-level unique constraint on `(serviceId, bookingDate, bookingTime)`

---

## 📁 Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── dto/                 # Register, Login, RefreshToken DTOs
│   ├── guards/              # JwtAuthGuard, JwtRefreshGuard
│   ├── strategies/          # JWT & Refresh token strategies
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/                   # Users module
│   ├── entities/user.entity.ts
│   ├── users.service.ts
│   └── users.module.ts
├── services/                # Services module
│   ├── dto/                 # CreateService, UpdateService DTOs
│   ├── entities/service.entity.ts
│   ├── services.controller.ts
│   ├── services.service.ts
│   └── services.module.ts
├── bookings/                # Bookings module
│   ├── dto/                 # CreateBooking, UpdateStatus, Query DTOs
│   ├── entities/booking.entity.ts
│   ├── bookings.controller.ts
│   ├── bookings.service.ts
│   └── bookings.module.ts
├── common/                  # Shared utilities
│   ├── decorators/          # @Public() decorator
│   ├── dto/                 # PaginationDto, PaginatedResponseDto
│   ├── enums/               # BookingStatus enum
│   ├── filters/             # AllExceptionsFilter
│   └── interceptors/        # TransformInterceptor
├── config/                  # Configuration factories
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── typeorm-cli.config.ts
├── migrations/              # Database migrations
│   └── 1720609200000-InitialSchema.ts
├── app.module.ts
└── main.ts
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_DATABASE` | Database name | `booking_platform` |
| `JWT_ACCESS_SECRET` | Access token signing secret | **required** |
| `JWT_ACCESS_EXPIRATION` | Access token TTL | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | **required** |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL | `7d` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |

---

## 🛠️ Installation

### Prerequisites
- Node.js v20+
- PostgreSQL 16 (or Docker)

### Local Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd booking-platform

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database and JWT secrets

# 4. Start the application (development)
npm run start:dev
```

---

## 🐳 Docker Setup (Recommended)

```bash
# Start PostgreSQL + API together
docker-compose up --build

# Or just start the database (for local dev)
docker-compose up -d postgres
```

The API will be available at:
- Local setup: `http://localhost:3000`
- Docker setup: `http://localhost:3001`

---

## 🗄️ Database Setup & Migrations

### With `synchronize: true` (development — default)
In `development` mode, TypeORM automatically syncs the schema. No migration step needed.

### With Migrations (production recommended)

```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate a new migration after entity changes
npm run migration:generate src/migrations/YourMigrationName
```

---

## 🚦 Running the Application

```bash
# Development (hot-reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

---

## 🧪 Running Tests

```bash
# Run all unit tests
npm test

# Run with coverage report
npm run test:cov

# Watch mode
npm run test:watch
```

**Current test results:** `34 tests passing` across 3 test suites (Auth, Services, Bookings).

---

## 📖 API Documentation

### Swagger UI
Once the application is running, visit:
- **Local setup:** `http://localhost:3000/api/docs`
- **Docker setup:** `http://localhost:3001/api/docs`

### Endpoints Summary

#### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive tokens |
| POST | `/api/auth/refresh` | Refresh Token | Rotate access + refresh tokens |
| POST | `/api/auth/logout` | JWT | Invalidate refresh token |

#### 🛠️ Services (`/api/services`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/services` | JWT | Create a new service |
| GET | `/api/services` | Public | List all active services (paginated) |
| GET | `/api/services/:id` | Public | Get a service by ID |
| PATCH | `/api/services/:id` | JWT | Update a service |
| DELETE | `/api/services/:id` | JWT | Delete a service |

#### 📅 Bookings (`/api/bookings`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings` | Public | Create a booking |
| GET | `/api/bookings` | JWT | List all bookings (paginated, filterable, searchable) |
| GET | `/api/bookings/:id` | JWT | Get a booking by ID |
| PATCH | `/api/bookings/:id/status` | JWT | Update booking status |
| PATCH | `/api/bookings/:id/cancel` | Public | Cancel a booking |

#### Query Parameters for `GET /api/bookings`

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 100) |
| `status` | enum | Filter: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` |
| `search` | string | Search by customer name or email |
| `serviceId` | UUID | Filter by service |

---

## 📐 Booking Status Flow

```
PENDING → CONFIRMED → COMPLETED
   ↓           ↓
CANCELLED   CANCELLED
```

**Business Rules:**
- Booking dates **cannot be in the past**
- Cancelled bookings **cannot be marked as completed**
- Duplicate bookings for the **same service + date + time** are rejected
- Only **authenticated users** can manage services
- **Customers can create bookings without authentication**

---

## 🏗️ Architecture Decisions & Assumptions

1. **JWT Strategy:** Global JWT guard with `@Public()` decorator — all routes are protected by default; public routes are explicitly opted out.
2. **Refresh Token Security:** Refresh tokens are stored as `bcrypt` hashes in the database. On each use, a new pair is issued (rotation), preventing token reuse attacks.
3. **Duplicate Booking Prevention:** Enforced at the database level using a `UNIQUE` composite constraint on `(serviceId, bookingDate, bookingTime)` — race-condition-proof.
4. **UUIDs:** All primary keys use UUIDs to prevent enumeration attacks.
5. **synchronize:** Set to `true` in development for convenience. Production deployments should use migrations.
6. **Public booking creation:** Customers can create bookings without an account, which reflects a typical walk-in or online booking scenario.

---

## 🔮 Future Improvements

- Email confirmation on booking (via Nodemailer or SendGrid)
- Rate limiting on public endpoints (via `@nestjs/throttler`)
- Redis caching for frequently accessed services
- Admin role with elevated permissions
- Webhook notifications for booking status changes
- Multi-timezone support for booking dates/times
- Soft deletes for services and bookings audit trail

---

## 📬 Submission

- **GitHub Repository:** `<your-repo-url>`
- **Swagger Docs:** `http://localhost:3000/api/docs` (local) or `http://localhost:3001/api/docs` (docker)
- **Contact:** Developed for EN2H technical assessment

---

*Built with ❤️ using NestJS + TypeScript + PostgreSQL*
