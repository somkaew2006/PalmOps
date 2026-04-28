-- CreateEnum
CREATE TYPE "palm_grade" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('draft', 'confirmed', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('bank_transfer', 'cash', 'cheque');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "deduction_type" AS ENUM ('loan', 'input_cost', 'transport', 'other');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'weigher', 'accountant', 'viewer');

-- CreateEnum
CREATE TYPE "sale_status" AS ENUM ('completed', 'cancelled');

-- CreateTable
CREATE TABLE "farmers" (
    "id" SERIAL NOT NULL,
    "farmer_code" VARCHAR(20) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "national_id" VARCHAR(13),
    "phone" VARCHAR(20),
    "address" TEXT,
    "province" VARCHAR(60),
    "district" VARCHAR(60),
    "subdistrict" VARCHAR(60),
    "bank_account" VARCHAR(20),
    "bank_name" VARCHAR(60),
    "bank_branch" VARCHAR(100),
    "line_id" VARCHAR(60),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_plots" (
    "id" SERIAL NOT NULL,
    "farmer_id" INTEGER NOT NULL,
    "plot_code" VARCHAR(30) NOT NULL,
    "title_deed_no" VARCHAR(50),
    "area_rai" DECIMAL(10,2),
    "province" VARCHAR(60),
    "district" VARCHAR(60),
    "subdistrict" VARCHAR(60),
    "gps_lat" DECIMAL(10,7),
    "gps_lng" DECIMAL(10,7),
    "palm_age_years" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farm_plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "license_plate" VARCHAR(20) NOT NULL,
    "vehicle_type" VARCHAR(50),
    "brand" VARCHAR(50),
    "tare_weight_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "driver_name" VARCHAR(100),
    "driver_phone" VARCHAR(20),
    "driver_license_no" VARCHAR(30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_prices" (
    "id" SERIAL NOT NULL,
    "price_date" DATE NOT NULL,
    "price_grade_a" DECIMAL(8,2) NOT NULL,
    "price_grade_b" DECIMAL(8,2) NOT NULL,
    "price_grade_c" DECIMAL(8,2) NOT NULL,
    "ffa_threshold_a" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "ffa_threshold_b" DECIMAL(5,2) NOT NULL DEFAULT 7.00,
    "reference_source" VARCHAR(60) DEFAULT 'MPOB',
    "note" TEXT,
    "created_by" VARCHAR(60),
    "branch_id" INTEGER NOT NULL,

    CONSTRAINT "daily_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weigh_tickets" (
    "id" SERIAL NOT NULL,
    "ticket_no" VARCHAR(20) NOT NULL,
    "farmer_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER,
    "price_id" INTEGER NOT NULL,
    "farm_plot_id" INTEGER,
    "weigh_in_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weigh_out_at" TIMESTAMPTZ(6),
    "gross_weight_kg" DECIMAL(10,2) NOT NULL,
    "tare_weight_kg" DECIMAL(10,2) NOT NULL,
    "net_weight_kg" DECIMAL(10,2),
    "ffa_percent" DECIMAL(5,2),
    "oil_percent" DECIMAL(5,2),
    "moisture_percent" DECIMAL(5,2),
    "grade" "palm_grade" NOT NULL DEFAULT 'A',
    "deduction_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deduction_note" VARCHAR(200),
    "final_weight_kg" DECIMAL(10,2),
    "price_per_kg" DECIMAL(8,2) NOT NULL,
    "total_amount" DECIMAL(12,2),
    "status" "ticket_status" NOT NULL DEFAULT 'draft',
    "photo_urls" TEXT[],
    "note" TEXT,
    "created_by" VARCHAR(60),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branch_id" INTEGER NOT NULL,

    CONSTRAINT "weigh_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "payment_ref" VARCHAR(30) NOT NULL,
    "farmer_id" INTEGER NOT NULL,
    "payment_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "payment_method" NOT NULL DEFAULT 'bank_transfer',
    "bank_ref" VARCHAR(60),
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "created_by" VARCHAR(60),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branch_id" INTEGER NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_items" (
    "id" SERIAL NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "payment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deductions" (
    "id" SERIAL NOT NULL,
    "farmer_id" INTEGER NOT NULL,
    "deduction_type" "deduction_type" NOT NULL DEFAULT 'other',
    "description" VARCHAR(200) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "deduction_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_settled" BOOLEAN NOT NULL DEFAULT false,
    "settled_payment_id" INTEGER,
    "created_by" VARCHAR(60),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branch_id" INTEGER NOT NULL,

    CONSTRAINT "deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(60) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(120),
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'viewer',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branch_id" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "branch_code" VARCHAR(20) NOT NULL,
    "branch_name" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "expense_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" VARCHAR(200) NOT NULL,
    "quantity" DECIMAL(12,2),
    "price_per_unit" DECIMAL(12,2),
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "branch_id" INTEGER NOT NULL,
    "product_id" INTEGER,
    "created_by" VARCHAR(60),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "note" TEXT,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "group_id" INTEGER NOT NULL,
    "unit" VARCHAR(20),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "grade" "palm_grade" NOT NULL,
    "quantity_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" SERIAL NOT NULL,
    "sale_no" VARCHAR(20) NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "customer_name" VARCHAR(100),
    "sale_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grade" "palm_grade" NOT NULL,
    "quantity_kg" DECIMAL(12,2) NOT NULL,
    "price_per_kg" DECIMAL(8,2) NOT NULL,
    "total_amount" DECIMAL(12,2),
    "note" TEXT,
    "status" "sale_status" NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "farmers_farmer_code_key" ON "farmers"("farmer_code");

-- CreateIndex
CREATE UNIQUE INDEX "farmers_national_id_key" ON "farmers"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "farm_plots_plot_code_key" ON "farm_plots"("plot_code");

-- CreateIndex
CREATE INDEX "idx_farm_plots_farmer_id" ON "farm_plots"("farmer_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_license_plate_key" ON "vehicles"("license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_prices_price_date_key" ON "daily_prices"("price_date");

-- CreateIndex
CREATE INDEX "idx_daily_prices_date" ON "daily_prices"("price_date" DESC);

-- CreateIndex
CREATE INDEX "idx_daily_prices_branch_id" ON "daily_prices"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_prices_price_date_branch_id_key" ON "daily_prices"("price_date", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "weigh_tickets_ticket_no_key" ON "weigh_tickets"("ticket_no");

-- CreateIndex
CREATE INDEX "idx_tickets_farmer_id" ON "weigh_tickets"("farmer_id");

-- CreateIndex
CREATE INDEX "idx_tickets_grade" ON "weigh_tickets"("grade");

-- CreateIndex
CREATE INDEX "idx_tickets_price_id" ON "weigh_tickets"("price_id");

-- CreateIndex
CREATE INDEX "idx_tickets_status" ON "weigh_tickets"("status");

-- CreateIndex
CREATE INDEX "idx_tickets_vehicle_id" ON "weigh_tickets"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_tickets_branch_id" ON "weigh_tickets"("branch_id");

-- CreateIndex
CREATE INDEX "idx_tickets_weigh_in_at" ON "weigh_tickets"("weigh_in_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_ref_key" ON "payments"("payment_ref");

-- CreateIndex
CREATE INDEX "idx_payments_date" ON "payments"("payment_date" DESC);

-- CreateIndex
CREATE INDEX "idx_payments_farmer_id" ON "payments"("farmer_id");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX "idx_payments_branch_id" ON "payments"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_items_ticket_id_key" ON "payment_items"("ticket_id");

-- CreateIndex
CREATE INDEX "idx_payment_items_payment" ON "payment_items"("payment_id");

-- CreateIndex
CREATE INDEX "idx_payment_items_ticket" ON "payment_items"("ticket_id");

-- CreateIndex
CREATE INDEX "idx_deductions_farmer_id" ON "deductions"("farmer_id");

-- CreateIndex
CREATE INDEX "idx_deductions_settled" ON "deductions"("is_settled");

-- CreateIndex
CREATE INDEX "idx_deductions_branch_id" ON "deductions"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "branches_branch_code_key" ON "branches"("branch_code");

-- CreateIndex
CREATE INDEX "idx_expenses_date" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "idx_expenses_branch_id" ON "expenses"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_groups_name_key" ON "product_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_group_id_key" ON "products"("name", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_branch_id_grade_key" ON "stocks"("branch_id", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "sales_sale_no_key" ON "sales"("sale_no");

-- CreateIndex
CREATE INDEX "idx_sales_branch_id" ON "sales"("branch_id");

-- CreateIndex
CREATE INDEX "idx_sales_date" ON "sales"("sale_date");

-- AddForeignKey
ALTER TABLE "farm_plots" ADD CONSTRAINT "farm_plots_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_prices" ADD CONSTRAINT "daily_prices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weigh_tickets" ADD CONSTRAINT "weigh_tickets_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weigh_tickets" ADD CONSTRAINT "weigh_tickets_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weigh_tickets" ADD CONSTRAINT "weigh_tickets_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "daily_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weigh_tickets" ADD CONSTRAINT "weigh_tickets_farm_plot_id_fkey" FOREIGN KEY ("farm_plot_id") REFERENCES "farm_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weigh_tickets" ADD CONSTRAINT "weigh_tickets_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deductions" ADD CONSTRAINT "deductions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "product_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
