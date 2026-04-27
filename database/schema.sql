-- ============================================================
--  TALA — Palm Oil Purchasing System
--  PostgreSQL Schema v1.0
--  Generated for: tala app
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. FARMERS — ทะเบียนเกษตรกร
-- ============================================================
CREATE TABLE farmers (
    id                SERIAL PRIMARY KEY,
    farmer_code       VARCHAR(20)  NOT NULL UNIQUE,          -- รหัสเกษตรกร เช่น F-001
    full_name         VARCHAR(100) NOT NULL,
    national_id       VARCHAR(13)  UNIQUE,                   -- เลขบัตรประชาชน
    phone             VARCHAR(20),
    address           TEXT,
    province          VARCHAR(60),
    district          VARCHAR(60),
    subdistrict       VARCHAR(60),
    bank_account      VARCHAR(20),
    bank_name         VARCHAR(60),
    bank_branch       VARCHAR(100),
    line_id           VARCHAR(60),
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    note              TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE farmers IS 'ทะเบียนเกษตรกรที่นำส่งปาล์มน้ำมัน';

-- ============================================================
-- 2. FARM_PLOTS — แปลงที่ดิน
-- ============================================================
CREATE TABLE farm_plots (
    id                SERIAL PRIMARY KEY,
    farmer_id         INTEGER      NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    plot_code         VARCHAR(30)  NOT NULL UNIQUE,           -- รหัสแปลง
    title_deed_no     VARCHAR(50),                            -- เลขโฉนด / น.ส.3
    area_rai          NUMERIC(10,2),                          -- พื้นที่ (ไร่)
    province          VARCHAR(60),
    district          VARCHAR(60),
    subdistrict       VARCHAR(60),
    gps_lat           NUMERIC(10,7),
    gps_lng           NUMERIC(10,7),
    palm_age_years    INTEGER,                                -- อายุต้นปาล์ม
    note              TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE farm_plots IS 'ข้อมูลแปลงปาล์มของเกษตรกร';

-- ============================================================
-- 3. VEHICLES — ยานพาหนะ
-- ============================================================
CREATE TABLE vehicles (
    id                SERIAL PRIMARY KEY,
    license_plate     VARCHAR(20)  NOT NULL UNIQUE,           -- ทะเบียนรถ
    vehicle_type      VARCHAR(50),                            -- ประเภท เช่น รถ 10 ล้อ
    brand             VARCHAR(50),
    tare_weight_kg    NUMERIC(10,2) NOT NULL DEFAULT 0,       -- น้ำหนักรถเปล่า (กก.)
    driver_name       VARCHAR(100),
    driver_phone      VARCHAR(20),
    driver_license_no VARCHAR(30),
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    note              TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vehicles IS 'ทะเบียนรถที่ใช้ขนส่งปาล์มน้ำมัน';

-- ============================================================
-- 4. DAILY_PRICES — ราคารับซื้อประจำวัน
-- ============================================================
CREATE TABLE daily_prices (
    id                SERIAL PRIMARY KEY,
    price_date        DATE         NOT NULL UNIQUE,           -- วันที่ของราคา
    price_grade_a     NUMERIC(8,2) NOT NULL,                  -- ราคาเกรด A (฿/กก.)
    price_grade_b     NUMERIC(8,2) NOT NULL,                  -- ราคาเกรด B
    price_grade_c     NUMERIC(8,2) NOT NULL,                  -- ราคาเกรด C
    ffa_threshold_a   NUMERIC(5,2) NOT NULL DEFAULT 5.00,     -- FFA ขีดจำกัดเกรด A (%)
    ffa_threshold_b   NUMERIC(5,2) NOT NULL DEFAULT 7.00,     -- FFA ขีดจำกัดเกรด B (%)
    reference_source  VARCHAR(60)  DEFAULT 'MPOB',
    note              TEXT,
    created_by        VARCHAR(60),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE daily_prices IS 'ราคารับซื้อปาล์มน้ำมันแยกตามเกรดประจำวัน';

-- ============================================================
-- 5. WEIGH_TICKETS — ใบชั่งน้ำหนัก (หัวใจหลักของระบบ)
-- ============================================================
CREATE TYPE palm_grade AS ENUM ('A', 'B', 'C');
CREATE TYPE ticket_status AS ENUM ('draft', 'confirmed', 'paid', 'cancelled');

CREATE TABLE weigh_tickets (
    id                SERIAL PRIMARY KEY,
    ticket_no         VARCHAR(20)  NOT NULL UNIQUE,           -- เลขที่ใบชั่ง เช่น W-20251
    farmer_id         INTEGER      NOT NULL REFERENCES farmers(id),
    vehicle_id        INTEGER      REFERENCES vehicles(id),
    price_id          INTEGER      NOT NULL REFERENCES daily_prices(id),
    farm_plot_id      INTEGER      REFERENCES farm_plots(id),

    -- น้ำหนัก
    weigh_in_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),    -- เวลาชั่งเข้า
    weigh_out_at      TIMESTAMPTZ,                            -- เวลาชั่งออก
    gross_weight_kg   NUMERIC(10,2) NOT NULL,                 -- น้ำหนักรวม (รถ + ปาล์ม)
    tare_weight_kg    NUMERIC(10,2) NOT NULL,                 -- น้ำหนักรถเปล่า
    net_weight_kg     NUMERIC(10,2) GENERATED ALWAYS AS
                        (gross_weight_kg - tare_weight_kg) STORED,  -- น้ำหนักสุทธิ

    -- คุณภาพ
    ffa_percent       NUMERIC(5,2),                           -- % กรดไขมันอิสระ
    oil_percent       NUMERIC(5,2),                           -- % น้ำมัน
    moisture_percent  NUMERIC(5,2),                           -- % ความชื้น
    grade             palm_grade   NOT NULL DEFAULT 'A',

    -- การหักน้ำหนัก
    deduction_kg      NUMERIC(10,2) NOT NULL DEFAULT 0,       -- น้ำหนักที่หัก
    deduction_note    VARCHAR(200),                           -- เหตุผลที่หัก เช่น ก้าน, ดิน

    -- น้ำหนักและยอดสุดท้าย
    final_weight_kg   NUMERIC(10,2) GENERATED ALWAYS AS
                        (gross_weight_kg - tare_weight_kg - deduction_kg) STORED,
    price_per_kg      NUMERIC(8,2) NOT NULL,                  -- ราคา ณ เวลาชั่ง (snapshot)
    total_amount      NUMERIC(12,2) GENERATED ALWAYS AS
                        ((gross_weight_kg - tare_weight_kg - deduction_kg) * price_per_kg) STORED,

    status            ticket_status NOT NULL DEFAULT 'draft',
    photo_urls        TEXT[],                                  -- array ของ URL รูปภาพ
    note              TEXT,
    created_by        VARCHAR(60),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE weigh_tickets IS 'ใบชั่งน้ำหนักปาล์มน้ำมัน — ศูนย์กลางของข้อมูลการรับซื้อ';
COMMENT ON COLUMN weigh_tickets.price_per_kg IS 'snapshot ราคา ณ เวลาที่ชั่ง ป้องกันราคาเปลี่ยนย้อนหลัง';

-- ============================================================
-- 6. PAYMENTS — การจ่ายเงิน
-- ============================================================
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'cash', 'cheque');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'cancelled');

CREATE TABLE payments (
    id                SERIAL PRIMARY KEY,
    payment_ref       VARCHAR(30)  NOT NULL UNIQUE,           -- เลขอ้างอิงการจ่าย เช่น PAY-2025-001
    farmer_id         INTEGER      NOT NULL REFERENCES farmers(id),
    payment_date      DATE         NOT NULL DEFAULT CURRENT_DATE,
    amount            NUMERIC(12,2) NOT NULL,
    method            payment_method NOT NULL DEFAULT 'bank_transfer',
    bank_ref          VARCHAR(60),                            -- เลข ref จากธนาคาร
    status            payment_status NOT NULL DEFAULT 'pending',
    note              TEXT,
    created_by        VARCHAR(60),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payments IS 'บันทึกการจ่ายเงินให้เกษตรกร';

-- ============================================================
-- 7. PAYMENT_ITEMS — รายการใบชั่งที่อยู่ในการจ่าย
-- ============================================================
CREATE TABLE payment_items (
    id                SERIAL PRIMARY KEY,
    payment_id        INTEGER      NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    ticket_id         INTEGER      NOT NULL REFERENCES weigh_tickets(id),
    amount            NUMERIC(12,2) NOT NULL,
    UNIQUE (ticket_id)                                         -- ใบชั่งหนึ่งใบจ่ายได้แค่ครั้งเดียว
);

COMMENT ON TABLE payment_items IS 'ความสัมพันธ์ระหว่าง payment กับ weigh_tickets (Many-to-Many)';

-- ============================================================
-- 8. DEDUCTIONS — รายการหักหนี้ / ค่าใช้จ่าย
-- ============================================================
CREATE TYPE deduction_type AS ENUM ('loan', 'input_cost', 'transport', 'other');

CREATE TABLE deductions (
    id                SERIAL PRIMARY KEY,
    farmer_id         INTEGER      NOT NULL REFERENCES farmers(id),
    deduction_type    deduction_type NOT NULL DEFAULT 'other',
    description       VARCHAR(200) NOT NULL,
    amount            NUMERIC(12,2) NOT NULL,
    deduction_date    DATE         NOT NULL DEFAULT CURRENT_DATE,
    is_settled        BOOLEAN      NOT NULL DEFAULT FALSE,
    settled_payment_id INTEGER     REFERENCES payments(id),
    created_by        VARCHAR(60),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE deductions IS 'รายการหักหนี้หรือค่าใช้จ่ายที่หักออกจากค่าปาล์ม';

-- ============================================================
-- 9. USERS — ผู้ใช้งานระบบ
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'weigher', 'accountant', 'viewer');

CREATE TABLE users (
    id                SERIAL PRIMARY KEY,
    username          VARCHAR(60)  NOT NULL UNIQUE,
    full_name         VARCHAR(100) NOT NULL,
    email             VARCHAR(120) UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    role              user_role    NOT NULL DEFAULT 'viewer',
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'ผู้ใช้งานระบบ Tala';

-- ============================================================
-- INDEXES — เพิ่มประสิทธิภาพการค้นหา
-- ============================================================

-- Farmers
CREATE INDEX idx_farmers_farmer_code   ON farmers(farmer_code);
CREATE INDEX idx_farmers_national_id   ON farmers(national_id);
CREATE INDEX idx_farmers_is_active     ON farmers(is_active);

-- Farm Plots
CREATE INDEX idx_farm_plots_farmer_id  ON farm_plots(farmer_id);

-- Weigh Tickets
CREATE INDEX idx_tickets_farmer_id     ON weigh_tickets(farmer_id);
CREATE INDEX idx_tickets_vehicle_id    ON weigh_tickets(vehicle_id);
CREATE INDEX idx_tickets_price_id      ON weigh_tickets(price_id);
CREATE INDEX idx_tickets_weigh_in_at   ON weigh_tickets(weigh_in_at DESC);
CREATE INDEX idx_tickets_status        ON weigh_tickets(status);
CREATE INDEX idx_tickets_grade         ON weigh_tickets(grade);

-- Daily Prices
CREATE INDEX idx_daily_prices_date     ON daily_prices(price_date DESC);

-- Payments
CREATE INDEX idx_payments_farmer_id    ON payments(farmer_id);
CREATE INDEX idx_payments_date         ON payments(payment_date DESC);
CREATE INDEX idx_payments_status       ON payments(status);

-- Payment Items
CREATE INDEX idx_payment_items_payment ON payment_items(payment_id);
CREATE INDEX idx_payment_items_ticket  ON payment_items(ticket_id);

-- Deductions
CREATE INDEX idx_deductions_farmer_id  ON deductions(farmer_id);
CREATE INDEX idx_deductions_settled    ON deductions(is_settled);

-- ============================================================
-- VIEWS — สำหรับ query ที่ใช้บ่อย
-- ============================================================

-- สรุปยอดค้างจ่ายต่อเกษตรกร
CREATE VIEW v_farmer_outstanding AS
SELECT
    f.id              AS farmer_id,
    f.farmer_code,
    f.full_name,
    COUNT(wt.id)      AS pending_tickets,
    SUM(wt.total_amount) AS pending_amount
FROM farmers f
JOIN weigh_tickets wt ON wt.farmer_id = f.id
WHERE wt.status = 'confirmed'
  AND wt.id NOT IN (SELECT ticket_id FROM payment_items)
GROUP BY f.id, f.farmer_code, f.full_name;

COMMENT ON VIEW v_farmer_outstanding IS 'ยอดใบชั่งที่ยังไม่ได้จ่ายเงินแยกตามเกษตรกร';

-- สรุปรายวัน
CREATE VIEW v_daily_summary AS
SELECT
    DATE(wt.weigh_in_at)     AS summary_date,
    COUNT(wt.id)             AS total_tickets,
    SUM(wt.final_weight_kg)  AS total_weight_kg,
    SUM(wt.total_amount)     AS total_amount,
    AVG(wt.ffa_percent)      AS avg_ffa,
    COUNT(CASE WHEN wt.grade = 'A' THEN 1 END) AS grade_a_count,
    COUNT(CASE WHEN wt.grade = 'B' THEN 1 END) AS grade_b_count,
    COUNT(CASE WHEN wt.grade = 'C' THEN 1 END) AS grade_c_count
FROM weigh_tickets wt
WHERE wt.status != 'cancelled'
GROUP BY DATE(wt.weigh_in_at)
ORDER BY summary_date DESC;

COMMENT ON VIEW v_daily_summary IS 'สรุปการรับซื้อปาล์มน้ำมันรายวัน';

-- ============================================================
-- SEED DATA — ข้อมูลเริ่มต้น
-- ============================================================

-- Admin user (password: changeme — ต้อง hash ก่อนใช้จริง)
INSERT INTO users (username, full_name, email, password_hash, role)
VALUES ('admin', 'ผู้ดูแลระบบ', 'admin@tala.app',
        '$2b$12$placeholder_hash_replace_before_production', 'admin');

-- ราคาตัวอย่างวันนี้
INSERT INTO daily_prices (price_date, price_grade_a, price_grade_b, price_grade_c, reference_source)
VALUES (CURRENT_DATE, 6.85, 6.65, 6.15, 'MPOB');

-- ============================================================
-- END OF SCHEMA
-- ============================================================
