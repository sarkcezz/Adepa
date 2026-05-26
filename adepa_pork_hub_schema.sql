-- ============================================================
--  ADEPA PORK HUB — Complete MySQL 8.0 Database Schema
--  Database:  adepaporkhub_db
--  Charset:   utf8mb4 / utf8mb4_unicode_ci
--  Created:   2026-05-26
--  Notes:     All monetary values stored as INTEGER pesewas (GHS × 100)
--             All primary keys use CHAR(36) UUID
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`                     CHAR(36)     NOT NULL,
  `name`                   VARCHAR(255) NOT NULL,
  `email`                  VARCHAR(255)          DEFAULT NULL,
  `phone`                  VARCHAR(20)  NOT NULL,
  `password`               VARCHAR(255) NOT NULL,
  `role`                   ENUM('customer','admin','employee') NOT NULL DEFAULT 'customer',
  `employee_id`            VARCHAR(10)           DEFAULT NULL COMMENT 'APH-XXXX format',
  `is_active`              TINYINT(1)   NOT NULL DEFAULT 1,
  `force_password_change`  TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique`       (`email`),
  UNIQUE KEY `users_phone_unique`       (`phone`),
  UNIQUE KEY `users_employee_id_unique` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. PERSONAL ACCESS TOKENS  (Laravel Sanctum)
-- ============================================================
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id`           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `tokenable_type` VARCHAR(255)   NOT NULL,
  `tokenable_id`   CHAR(36)       NOT NULL,
  `name`           VARCHAR(255)   NOT NULL,
  `token`          VARCHAR(64)    NOT NULL,
  `abilities`      TEXT                    DEFAULT NULL,
  `last_used_at`   TIMESTAMP               DEFAULT NULL,
  `expires_at`     TIMESTAMP               DEFAULT NULL,
  `created_at`     TIMESTAMP               DEFAULT NULL,
  `updated_at`     TIMESTAMP               DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`, `tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. PASSWORD RESET TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email`       VARCHAR(255) NOT NULL,
  `token`       VARCHAR(255) NOT NULL,
  `created_at`  TIMESTAMP             DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. SESSIONS  (SESSION_DRIVER=database)
-- ============================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`            VARCHAR(255)   NOT NULL,
  `user_id`       CHAR(36)               DEFAULT NULL,
  `ip_address`    VARCHAR(45)            DEFAULT NULL,
  `user_agent`    TEXT                   DEFAULT NULL,
  `payload`       LONGTEXT       NOT NULL,
  `last_activity` INT            NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index`       (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. CACHE  (CACHE_DRIVER=database  — optional but good practice)
-- ============================================================
CREATE TABLE IF NOT EXISTS `cache` (
  `key`         VARCHAR(255) NOT NULL,
  `value`       MEDIUMTEXT   NOT NULL,
  `expiration`  INT          NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key`        VARCHAR(255) NOT NULL,
  `owner`      VARCHAR(255) NOT NULL,
  `expiration` INT          NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS `addresses` (
  `id`          CHAR(36)     NOT NULL,
  `user_id`     CHAR(36)     NOT NULL,
  `label`       VARCHAR(50)           DEFAULT 'Home' COMMENT 'Home, Office, etc.',
  `recipient`   VARCHAR(255) NOT NULL,
  `phone`       VARCHAR(20)  NOT NULL,
  `area`        VARCHAR(255) NOT NULL,
  `district`    VARCHAR(255) NOT NULL,
  `landmark`    TEXT                  DEFAULT NULL,
  `is_default`  TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `addresses_user_id_index` (`user_id`),
  CONSTRAINT `addresses_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `products` (
  `id`                     CHAR(36)     NOT NULL,
  `name`                   VARCHAR(255) NOT NULL,
  `product_line`           ENUM('RAW','SPICED','READY_TO_EAT') NOT NULL,
  `variant`                ENUM('PLAIN','MILD','SPICY','NONE') NOT NULL DEFAULT 'NONE',
  `weight_grams`           INT                   DEFAULT NULL,
  `price_kobo`             INT          NOT NULL COMMENT 'GHS × 100 in pesewas',
  `description`            TEXT         NOT NULL,
  `ingredients`            TEXT                  DEFAULT NULL,
  `storage_instructions`   TEXT                  DEFAULT NULL,
  `heat_level`             TINYINT      NOT NULL DEFAULT 0 COMMENT '0 = none, 5 = very hot',
  `image_url`              VARCHAR(500)          DEFAULT NULL,
  `stock_qty`              INT          NOT NULL DEFAULT 0,
  `is_active`              TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `products_line_variant_index` (`product_line`, `variant`),
  KEY `products_is_active_index`    (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. STAND ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `stand_announcements` (
  `id`           CHAR(36)     NOT NULL,
  `title`        VARCHAR(255) NOT NULL,
  `description`  TEXT         NOT NULL,
  `locations`    JSON         NOT NULL COMMENT '[{name, area, days, hours, map_link}]',
  `start_date`   DATE         NOT NULL,
  `end_date`     DATE         NOT NULL,
  `is_published` TINYINT(1)   NOT NULL DEFAULT 0,
  `created_by`   CHAR(36)     NOT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stand_announcements_dates_index`     (`start_date`, `end_date`),
  KEY `stand_announcements_published_index` (`is_published`),
  KEY `stand_announcements_created_by_fk`   (`created_by`),
  CONSTRAINT `stand_announcements_created_by_foreign`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. PORK EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `pork_events` (
  `id`               CHAR(36)     NOT NULL,
  `name`             VARCHAR(255) NOT NULL,
  `event_date`       DATE         NOT NULL,
  `event_time`       TIME         NOT NULL,
  `venue_name`       VARCHAR(255) NOT NULL,
  `venue_address`    TEXT         NOT NULL,
  `flat_rate_kobo`   INT          NOT NULL COMMENT 'GHS × 100',
  `capacity`         INT          NOT NULL,
  `registered_count` INT          NOT NULL DEFAULT 0,
  `description`      TEXT         NOT NULL,
  `image_url`        VARCHAR(500)          DEFAULT NULL,
  `status`           ENUM('DRAFT','PUBLISHED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `created_by`       CHAR(36)     NOT NULL,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pork_events_date_status_index` (`event_date`, `status`),
  KEY `pork_events_created_by_fk`     (`created_by`),
  CONSTRAINT `pork_events_created_by_foreign`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. CAMPAIGNS (Promo Codes)
-- ============================================================
CREATE TABLE IF NOT EXISTS `campaigns` (
  `id`                CHAR(36)     NOT NULL,
  `name`              VARCHAR(255) NOT NULL,
  `code`              VARCHAR(50)  NOT NULL,
  `discount_type`     ENUM('PERCENT','FIXED','FREE_DELIVERY') NOT NULL,
  `discount_value`    INT          NOT NULL COMMENT '0-100 for PERCENT; pesewas for FIXED',
  `min_order_kobo`    INT          NOT NULL DEFAULT 0,
  `max_usage`         INT                   DEFAULT NULL COMMENT 'NULL = unlimited',
  `usage_count`       INT          NOT NULL DEFAULT 0,
  `valid_from`        DATETIME     NOT NULL,
  `valid_to`          DATETIME     NOT NULL,
  `applicable_lines`  JSON                  DEFAULT NULL COMMENT 'NULL = all lines',
  `is_active`         TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `campaigns_code_unique`    (`code`),
  KEY `campaigns_validity_index`        (`valid_from`, `valid_to`),
  KEY `campaigns_is_active_index`       (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id`                   CHAR(36)      NOT NULL,
  `order_number`         VARCHAR(20)   NOT NULL COMMENT 'APH-XXXXXX auto-generated',
  `customer_id`          CHAR(36)      NOT NULL,
  `employee_id`          CHAR(36)               DEFAULT NULL,
  `status`               ENUM('PENDING','CONFIRMED','PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')
                                       NOT NULL DEFAULT 'PENDING',
  `delivery_method`      ENUM('HOME','PICKUP','EVENT') NOT NULL,
  `address_id`           CHAR(36)               DEFAULT NULL,
  `event_id`             CHAR(36)               DEFAULT NULL,
  `pickup_location_name` VARCHAR(255)           DEFAULT NULL,
  `subtotal_kobo`        INT           NOT NULL,
  `delivery_fee_kobo`    INT           NOT NULL DEFAULT 0,
  `discount_kobo`        INT           NOT NULL DEFAULT 0,
  `total_kobo`           INT           NOT NULL,
  `payment_method`       ENUM('MOMO','CARD','CASH','BANK') NOT NULL DEFAULT 'MOMO',
  `payment_reference`    VARCHAR(255)           DEFAULT NULL,
  `payment_status`       ENUM('PENDING','PAID','FAILED') NOT NULL DEFAULT 'PENDING',
  `paystack_reference`   VARCHAR(255)           DEFAULT NULL,
  `source`               ENUM('ONLINE','EMPLOYEE_SALE') NOT NULL DEFAULT 'ONLINE',
  `campaign_id`          CHAR(36)               DEFAULT NULL,
  `notes`                TEXT                   DEFAULT NULL,
  `created_at`           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_number_unique`      (`order_number`),
  KEY `orders_customer_id_index`               (`customer_id`),
  KEY `orders_employee_id_index`               (`employee_id`),
  KEY `orders_status_index`                    (`status`),
  KEY `orders_payment_status_index`            (`payment_status`),
  KEY `orders_created_at_index`                (`created_at`),
  KEY `orders_address_id_fk`                   (`address_id`),
  KEY `orders_event_id_fk`                     (`event_id`),
  KEY `orders_campaign_id_fk`                  (`campaign_id`),
  CONSTRAINT `orders_customer_id_foreign`
    FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `orders_employee_id_foreign`
    FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_address_id_foreign`
    FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_event_id_foreign`
    FOREIGN KEY (`event_id`) REFERENCES `pork_events` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_campaign_id_foreign`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`               CHAR(36)     NOT NULL,
  `order_id`         CHAR(36)     NOT NULL,
  `product_id`       CHAR(36)     NOT NULL,
  `product_name`     VARCHAR(255) NOT NULL COMMENT 'Snapshot at time of order',
  `product_variant`  VARCHAR(50)           DEFAULT NULL,
  `weight_grams`     INT                   DEFAULT NULL,
  `quantity`         INT          NOT NULL,
  `unit_price_kobo`  INT          NOT NULL COMMENT 'GHS × 100',
  `subtotal_kobo`    INT          NOT NULL,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_index`   (`order_id`),
  KEY `order_items_product_id_index` (`product_id`),
  CONSTRAINT `order_items_order_id_foreign`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_product_id_foreign`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. ORDER STATUS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id`          CHAR(36)    NOT NULL,
  `order_id`    CHAR(36)    NOT NULL,
  `status`      VARCHAR(50) NOT NULL,
  `changed_by`  CHAR(36)             DEFAULT NULL,
  `note`        TEXT                 DEFAULT NULL,
  `created_at`  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_status_history_order_id_index`  (`order_id`),
  KEY `order_status_history_changed_by_index` (`changed_by`),
  CONSTRAINT `order_status_history_order_id_foreign`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_status_history_changed_by_foreign`
    FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. EVENT REGISTRATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `event_registrations` (
  `id`                  CHAR(36)  NOT NULL,
  `event_id`            CHAR(36)  NOT NULL,
  `customer_id`         CHAR(36)  NOT NULL,
  `payment_status`      ENUM('PENDING','PAID','FAILED') NOT NULL DEFAULT 'PENDING',
  `paystack_reference`  VARCHAR(255)          DEFAULT NULL,
  `checked_in`          TINYINT(1) NOT NULL DEFAULT 0,
  `checked_in_at`       TIMESTAMP             DEFAULT NULL,
  `created_at`          TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_registrations_event_customer_unique` (`event_id`, `customer_id`),
  KEY `event_registrations_customer_id_index` (`customer_id`),
  CONSTRAINT `event_registrations_event_id_foreign`
    FOREIGN KEY (`event_id`) REFERENCES `pork_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_registrations_customer_id_foreign`
    FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. CAMPAIGN USAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS `campaign_usages` (
  `id`                    CHAR(36) NOT NULL,
  `campaign_id`           CHAR(36) NOT NULL,
  `order_id`              CHAR(36) NOT NULL,
  `customer_id`           CHAR(36) NOT NULL,
  `discount_applied_kobo` INT      NOT NULL,
  `created_at`            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `campaign_usages_campaign_id_index`  (`campaign_id`),
  KEY `campaign_usages_order_id_index`     (`order_id`),
  KEY `campaign_usages_customer_id_index`  (`customer_id`),
  CONSTRAINT `campaign_usages_campaign_id_foreign`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `campaign_usages_order_id_foreign`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `campaign_usages_customer_id_foreign`
    FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. JOBS  (Laravel Queue — QUEUE_CONNECTION=database)
-- ============================================================
CREATE TABLE IF NOT EXISTS `jobs` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue`        VARCHAR(255)    NOT NULL,
  `payload`      LONGTEXT        NOT NULL,
  `attempts`     TINYINT UNSIGNED NOT NULL,
  `reserved_at`  INT UNSIGNED             DEFAULT NULL,
  `available_at` INT UNSIGNED    NOT NULL,
  `created_at`   INT UNSIGNED    NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. JOB BATCHES  (Laravel batch jobs support)
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id`             VARCHAR(255) NOT NULL,
  `name`           VARCHAR(255) NOT NULL,
  `total_jobs`     INT          NOT NULL,
  `pending_jobs`   INT          NOT NULL,
  `failed_jobs`    INT          NOT NULL,
  `failed_job_ids` LONGTEXT     NOT NULL,
  `options`        MEDIUMTEXT            DEFAULT NULL,
  `cancelled_at`   INT                   DEFAULT NULL,
  `created_at`     INT          NOT NULL,
  `finished_at`    INT                   DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. FAILED JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid`        VARCHAR(255)    NOT NULL,
  `connection`  TEXT            NOT NULL,
  `queue`       TEXT            NOT NULL,
  `payload`     LONGTEXT        NOT NULL,
  `exception`   LONGTEXT        NOT NULL,
  `failed_at`   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. NOTIFICATIONS  (in-app bell notifications)
-- ============================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`          CHAR(36)     NOT NULL,
  `user_id`     CHAR(36)     NOT NULL,
  `type`        VARCHAR(100) NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `message`     TEXT         NOT NULL,
  `is_read`     TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_index`    (`user_id`),
  KEY `notifications_is_read_index`    (`is_read`),
  CONSTRAINT `notifications_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- RE-ENABLE FK CHECKS
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user  (password: ChangeMe@2025!  — bcrypt hash below)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `is_active`, `force_password_change`)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Adepa Admin',
  'admin@adepaporkhub.shop',
  '0200000001',
  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
  'admin',
  1,
  0
);

-- Employees
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `employee_id`, `is_active`, `force_password_change`)
VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'Kwame Asante',
  'kwame@adepaporkhub.shop',
  '0244000001',
  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
  'employee',
  'APH-0001',
  1,
  1
),
(
  'b0000000-0000-0000-0000-000000000002',
  'Abena Mensah',
  'abena@adepaporkhub.shop',
  '0244000002',
  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
  'employee',
  'APH-0002',
  1,
  1
);

-- Sample Customers
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`)
VALUES
  ('c0000000-0000-0000-0000-000000000001','Kofi Boateng','kofi.boateng@gmail.com','0244111001','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','customer'),
  ('c0000000-0000-0000-0000-000000000002','Ama Owusu','ama.owusu@gmail.com','0244111002','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','customer'),
  ('c0000000-0000-0000-0000-000000000003','Yaw Darko','yaw.darko@gmail.com','0244111003','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','customer'),
  ('c0000000-0000-0000-0000-000000000004','Akosua Ampah','akosua.ampah@gmail.com','0244111004','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','customer'),
  ('c0000000-0000-0000-0000-000000000005','Nana Adjei','nana.adjei@gmail.com','0244111005','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','customer');

-- ============================================================
-- PRODUCTS SEED  (price_kobo = GHS × 100)
-- ============================================================

-- RAW — Plain pork cuts
INSERT INTO `products` (`id`, `name`, `product_line`, `variant`, `weight_grams`, `price_kobo`, `description`, `heat_level`, `stock_qty`)
VALUES
  ('p0100000-0000-0000-0000-000000000001','Plain Pork Cuts','RAW','PLAIN',200,  900,'Fresh plain pork cuts, butcher-clean and ready to cook.',0,100),
  ('p0100000-0000-0000-0000-000000000002','Plain Pork Cuts','RAW','PLAIN',500, 2100,'Fresh plain pork cuts, butcher-clean and ready to cook.',0,80),
  ('p0100000-0000-0000-0000-000000000003','Plain Pork Cuts','RAW','PLAIN',1000,4000,'Fresh plain pork cuts, butcher-clean and ready to cook.',0,60),
  ('p0100000-0000-0000-0000-000000000004','Plain Pork Cuts','RAW','PLAIN',2000,7800,'Fresh plain pork cuts, butcher-clean and ready to cook.',0,40),
  ('p0100000-0000-0000-0000-000000000005','Plain Pork Cuts','RAW','PLAIN',5000,18500,'Fresh plain pork cuts, butcher-clean and ready to cook.',0,20),
  ('p0100000-0000-0000-0000-000000000006','Plain Pork Cuts','RAW','PLAIN',10000,36000,'Fresh plain pork cuts, butcher-clean and ready to cook.',0,10);

-- SPICED — Mild
INSERT INTO `products` (`id`, `name`, `product_line`, `variant`, `weight_grams`, `price_kobo`, `description`, `heat_level`, `stock_qty`)
VALUES
  ('p0200000-0000-0000-0000-000000000001','Mild Seasoned Pork','SPICED','MILD',200,  1000,'Premium pork marinated in our signature mild spice blend.',1,100),
  ('p0200000-0000-0000-0000-000000000002','Mild Seasoned Pork','SPICED','MILD',500,  2300,'Premium pork marinated in our signature mild spice blend.',1,80),
  ('p0200000-0000-0000-0000-000000000003','Mild Seasoned Pork','SPICED','MILD',1000, 4600,'Premium pork marinated in our signature mild spice blend.',1,60),
  ('p0200000-0000-0000-0000-000000000004','Mild Seasoned Pork','SPICED','MILD',2000, 8800,'Premium pork marinated in our signature mild spice blend.',1,40),
  ('p0200000-0000-0000-0000-000000000005','Mild Seasoned Pork','SPICED','MILD',5000, 21000,'Premium pork marinated in our signature mild spice blend.',1,20),
  ('p0200000-0000-0000-0000-000000000006','Mild Seasoned Pork','SPICED','MILD',10000,40000,'Premium pork marinated in our signature mild spice blend.',1,10);

-- SPICED — Spicy
INSERT INTO `products` (`id`, `name`, `product_line`, `variant`, `weight_grams`, `price_kobo`, `description`, `heat_level`, `stock_qty`)
VALUES
  ('p0300000-0000-0000-0000-000000000001','Spicy Seasoned Pork','SPICED','SPICY',200,  1100,'Bold Ghanaian pork seasoned with fiery chilli and spices.',3,100),
  ('p0300000-0000-0000-0000-000000000002','Spicy Seasoned Pork','SPICED','SPICY',500,  2500,'Bold Ghanaian pork seasoned with fiery chilli and spices.',3,80),
  ('p0300000-0000-0000-0000-000000000003','Spicy Seasoned Pork','SPICED','SPICY',1000, 5000,'Bold Ghanaian pork seasoned with fiery chilli and spices.',3,60),
  ('p0300000-0000-0000-0000-000000000004','Spicy Seasoned Pork','SPICED','SPICY',2000, 9600,'Bold Ghanaian pork seasoned with fiery chilli and spices.',3,40),
  ('p0300000-0000-0000-0000-000000000005','Spicy Seasoned Pork','SPICED','SPICY',5000, 23000,'Bold Ghanaian pork seasoned with fiery chilli and spices.',3,20),
  ('p0300000-0000-0000-0000-000000000006','Spicy Seasoned Pork','SPICED','SPICY',10000,44000,'Bold Ghanaian pork seasoned with fiery chilli and spices.',3,10);

-- READY_TO_EAT
INSERT INTO `products` (`id`, `name`, `product_line`, `variant`, `weight_grams`, `price_kobo`, `description`, `heat_level`, `stock_qty`)
VALUES
  ('p0400000-0000-0000-0000-000000000001','Single Serving','READY_TO_EAT','NONE',NULL, 2000,'Grilled or fried pork — freshly prepared and ready to eat.',2,50),
  ('p0400000-0000-0000-0000-000000000002','Lunch Box','READY_TO_EAT','NONE',NULL, 3500,'Juicy pork served with rice and Adepa signature sauce.',2,30),
  ('p0400000-0000-0000-0000-000000000003','Family Pack','READY_TO_EAT','NONE',800, 9000,'Generous grilled pork platter — feeds a family of 4.',2,20),
  ('p0400000-0000-0000-0000-000000000004','Event Pack','READY_TO_EAT','NONE',NULL,24000,'Bulk grilled pork 3–5 kg. Perfect for events and parties.',2,10),
  ('p0400000-0000-0000-0000-000000000005','Pork Soup','READY_TO_EAT','NONE',NULL, 2400,'Richly spiced pork broth — 500 ml, warming and hearty.',2,40),
  ('p0400000-0000-0000-0000-000000000006','Mixed Box','READY_TO_EAT','NONE',NULL, 6200,'Grilled + fried + soup sampler. The full Adepa experience.',2,25);

-- ============================================================
-- STAND ANNOUNCEMENTS SEED
-- ============================================================
INSERT INTO `stand_announcements`
  (`id`, `title`, `description`, `locations`, `start_date`, `end_date`, `is_published`, `created_by`)
VALUES (
  'sa000000-0000-0000-0000-000000000001',
  'Stand Locations — Week of 26 May 2026',
  'Find us at your nearest Adepa Pork Hub stand this week. Fresh cuts and ready-to-eat available!',
  '[
    {"name":"Accra Central Market Stand","area":"Accra Central","days":"Mon–Sat","hours":"07:00–18:00","map_link":"https://maps.google.com/?q=Accra+Central+Market"},
    {"name":"Tema Community 5 Stand","area":"Tema","days":"Tue, Thu, Sat","hours":"08:00–17:00","map_link":"https://maps.google.com/?q=Tema+Community+5"},
    {"name":"Kumasi Kejetia Market Stand","area":"Kumasi","days":"Mon–Fri","hours":"07:00–16:00","map_link":"https://maps.google.com/?q=Kejetia+Market+Kumasi"}
  ]',
  '2026-05-26',
  '2026-06-01',
  1,
  'a0000000-0000-0000-0000-000000000001'
);

-- ============================================================
-- PORK EVENTS SEED
-- ============================================================
INSERT INTO `pork_events`
  (`id`, `name`, `event_date`, `event_time`, `venue_name`, `venue_address`, `flat_rate_kobo`, `capacity`, `description`, `status`, `created_by`)
VALUES (
  'pe000000-0000-0000-0000-000000000001',
  'Adepa Pork Night — June Edition',
  '2026-06-28',
  '18:00:00',
  'La Palm Beach Hotel',
  'La Palm Beach Hotel, La Road, Accra, Ghana',
  8000,
  50,
  'Join us for an unforgettable evening of premium grilled pork, chilled drinks, and great vibes. Flat rate GHS 80 covers entry, pork platter, and one drink. Limited seats — book early!',
  'PUBLISHED',
  'a0000000-0000-0000-0000-000000000001'
);

-- ============================================================
-- CAMPAIGNS SEED
-- ============================================================
INSERT INTO `campaigns`
  (`id`, `name`, `code`, `discount_type`, `discount_value`, `min_order_kobo`, `max_usage`, `valid_from`, `valid_to`, `is_active`)
VALUES (
  'ca000000-0000-0000-0000-000000000001',
  'Welcome 10% Off',
  'WELCOME10',
  'PERCENT',
  10,
  2000,
  1,
  '2026-01-01 00:00:00',
  '2026-12-31 23:59:59',
  1
);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
