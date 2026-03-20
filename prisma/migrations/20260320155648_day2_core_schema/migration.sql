-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "DressUnitStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'LAUNDRY', 'RETIRED');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('RESERVED', 'RENTED', 'RETURNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentTarget" AS ENUM ('RENTAL', 'SALE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BlockReason" AS ENUM ('MAINTENANCE', 'LAUNDRY', 'REPAIR', 'OTHER');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "documentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dresses" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "brand" TEXT,
    "color" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "description" TEXT,
    "rentalPriceCents" INTEGER NOT NULL,
    "salePriceCents" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dress_units" (
    "id" TEXT NOT NULL,
    "dressId" TEXT NOT NULL,
    "inventoryCode" TEXT NOT NULL,
    "status" "DressUnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "conditionNotes" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dress_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdById" TEXT,
    "status" "RentalStatus" NOT NULL DEFAULT 'RESERVED',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "depositRequiredCents" INTEGER NOT NULL,
    "balanceDueCents" INTEGER NOT NULL,
    "totalPaidCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_items" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "dressUnitId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "createdById" TEXT,
    "dressId" TEXT NOT NULL,
    "dressUnitId" TEXT,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCents" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "target" "PaymentTarget" NOT NULL,
    "rentalId" TEXT,
    "saleId" TEXT,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "amountCents" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_blocks" (
    "id" TEXT NOT NULL,
    "dressUnitId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" "BlockReason" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_lastName_firstName_idx" ON "customers"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "dresses_modelName_idx" ON "dresses"("modelName");

-- CreateIndex
CREATE INDEX "dresses_size_idx" ON "dresses"("size");

-- CreateIndex
CREATE INDEX "dresses_color_idx" ON "dresses"("color");

-- CreateIndex
CREATE UNIQUE INDEX "dress_units_inventoryCode_key" ON "dress_units"("inventoryCode");

-- CreateIndex
CREATE INDEX "dress_units_dressId_idx" ON "dress_units"("dressId");

-- CreateIndex
CREATE INDEX "dress_units_status_idx" ON "dress_units"("status");

-- CreateIndex
CREATE INDEX "rentals_customerId_idx" ON "rentals"("customerId");

-- CreateIndex
CREATE INDEX "rentals_status_startDate_endDate_idx" ON "rentals"("status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "rental_items_rentalId_idx" ON "rental_items"("rentalId");

-- CreateIndex
CREATE INDEX "rental_items_dressUnitId_startsAt_endsAt_idx" ON "rental_items"("dressUnitId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "sales_saleDate_status_idx" ON "sales"("saleDate", "status");

-- CreateIndex
CREATE INDEX "sales_customerId_idx" ON "sales"("customerId");

-- CreateIndex
CREATE INDEX "sales_dressId_idx" ON "sales"("dressId");

-- CreateIndex
CREATE INDEX "payments_target_paidAt_idx" ON "payments"("target", "paidAt");

-- CreateIndex
CREATE INDEX "payments_rentalId_idx" ON "payments"("rentalId");

-- CreateIndex
CREATE INDEX "payments_saleId_idx" ON "payments"("saleId");

-- CreateIndex
CREATE INDEX "maintenance_blocks_dressUnitId_startAt_endAt_idx" ON "maintenance_blocks"("dressUnitId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "maintenance_blocks_reason_idx" ON "maintenance_blocks"("reason");

-- AddForeignKey
ALTER TABLE "dress_units" ADD CONSTRAINT "dress_units_dressId_fkey" FOREIGN KEY ("dressId") REFERENCES "dresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_items" ADD CONSTRAINT "rental_items_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_items" ADD CONSTRAINT "rental_items_dressUnitId_fkey" FOREIGN KEY ("dressUnitId") REFERENCES "dress_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_dressId_fkey" FOREIGN KEY ("dressId") REFERENCES "dresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_dressUnitId_fkey" FOREIGN KEY ("dressUnitId") REFERENCES "dress_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_blocks" ADD CONSTRAINT "maintenance_blocks_dressUnitId_fkey" FOREIGN KEY ("dressUnitId") REFERENCES "dress_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
