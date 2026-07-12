import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1720609200000 implements MigrationInterface {
  name = 'InitialSchema1720609200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create BookingStatus enum
    await queryRunner.query(`
      CREATE TYPE "public"."booking_status_enum" AS ENUM (
        'PENDING',
        'CONFIRMED',
        'CANCELLED',
        'COMPLETED'
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                 UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "email"              VARCHAR           NOT NULL,
        "name"               VARCHAR           NOT NULL,
        "password"           VARCHAR           NOT NULL,
        "hashedRefreshToken" VARCHAR,
        "createdAt"          TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"          TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id"      PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email"   UNIQUE ("email")
      )
    `);

    // Create services table
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id"            UUID             NOT NULL DEFAULT uuid_generate_v4(),
        "title"         VARCHAR          NOT NULL,
        "description"   TEXT,
        "duration"      INTEGER          NOT NULL,
        "price"         DECIMAL(10,2)    NOT NULL,
        "isActive"      BOOLEAN          NOT NULL DEFAULT true,
        "createdById"   UUID             NOT NULL,
        "createdAt"     TIMESTAMP        NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP        NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services_id"    PRIMARY KEY ("id"),
        CONSTRAINT "FK_services_user"  FOREIGN KEY ("createdById")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create bookings table
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id"            UUID                             NOT NULL DEFAULT uuid_generate_v4(),
        "customerName"  VARCHAR                          NOT NULL,
        "customerEmail" VARCHAR                          NOT NULL,
        "customerPhone" VARCHAR                          NOT NULL,
        "serviceId"     UUID                             NOT NULL,
        "bookingDate"   DATE                             NOT NULL,
        "bookingTime"   TIME                             NOT NULL,
        "status"        "public"."booking_status_enum"  NOT NULL DEFAULT 'PENDING',
        "notes"         TEXT,
        "createdAt"     TIMESTAMP                        NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP                        NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookings_id"           PRIMARY KEY ("id"),
        CONSTRAINT "UQ_BOOKING_SERVICE_DATE_TIME" UNIQUE ("serviceId", "bookingDate", "bookingTime"),
        CONSTRAINT "FK_bookings_service"      FOREIGN KEY ("serviceId")
          REFERENCES "services"("id") ON DELETE CASCADE
      )
    `);

    // Indexes for common query patterns
    await queryRunner.query(
      `CREATE INDEX "IDX_bookings_status"   ON "bookings" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bookings_serviceId" ON "bookings" ("serviceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_services_isActive"  ON "services" ("isActive")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_services_isActive"`);
    await queryRunner.query(`DROP INDEX "IDX_bookings_serviceId"`);
    await queryRunner.query(`DROP INDEX "IDX_bookings_status"`);

    // Drop tables in reverse dependency order
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "public"."booking_status_enum"`);
  }
}
