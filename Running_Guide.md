# Running Guide
## Booking Platform REST API

This guide provides step-by-step instructions to run the Booking Platform REST API locally or via Docker, execute database migrations, and run the test suite.

---

### Prerequisites
- Node.js (v20 or higher)
- Docker & Docker Compose (Recommended)
- PostgreSQL 16 (If running locally without Docker)

---

### 1. Environment Setup

1. Clone the repository and navigate into the directory.
2. Create your environment variables file:
   ```bash
   cp .env.example .env
   ```
3. (Optional) Edit `.env` to configure custom database credentials or JWT secrets. The defaults will work out-of-the-box for local testing.

---

### 2. Running with Docker (Recommended)

The easiest way to start the application with its database is via Docker Compose.

1. Build and start the containers:
   ```bash
   docker compose up --build
   ```
2. The application will start and map to **Port 3001** on your host machine to avoid conflicts with existing local services.
3. Access the API documentation at: **`http://localhost:3001/api/docs`**

*Note: In development mode, `synchronize: true` is enabled, meaning TypeORM automatically creates the database tables. No manual migration step is required to start testing.*

---

### 3. Running Locally (Without Docker)

If you prefer to run the Node.js application directly on your host machine:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Ensure you have a local PostgreSQL instance running. Update the `.env` file to match your local database credentials (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`).
3. Start the application in development mode:
   ```bash
   npm run start:dev
   ```
4. Access the API documentation at: **`http://localhost:3000/api/docs`**

---

### 4. Database Migrations (Production Readiness)

For production environments, the schema should be managed via migrations rather than auto-synchronization. We have configured the TypeORM CLI for this purpose.

To run existing migrations against the database:
```bash
npm run migration:run
```

To revert the last applied migration:
```bash
npm run migration:revert
```

To generate a new migration after modifying an entity in the source code:
```bash
npm run migration:generate src/migrations/MigrationName
```

---

### 5. Running the Test Suite

The project includes 34 comprehensive unit tests covering the core business logic (Authentication, Services, Bookings).

To run all tests:
```bash
npm test
```

To run tests with a coverage report:
```bash
npm run test:cov
```

---

### 6. Quick Start API Test Flow

You can easily test the endpoints using the built-in Swagger UI (`/api/docs`):
1. **Register a User:** Execute `POST /api/auth/register`
2. **Login:** Execute `POST /api/auth/login` and copy the `accessToken`.
3. **Authorize:** Click the "Authorize" button at the top of Swagger and paste the token.
4. **Create a Service:** Execute `POST /api/services`
5. **Create a Booking:** Execute `POST /api/bookings` (Does not require auth token).
6. **View Bookings:** Execute `GET /api/bookings`
