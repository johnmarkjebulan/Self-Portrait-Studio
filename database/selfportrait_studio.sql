-- Self-Portrait Studio
-- XAMPP / MySQL / MariaDB fresh-install database
-- WARNING: Re-importing this file DROPS and recreates the application tables.
-- Development demo accounts:
-- Admin:  admin@selfportrait.studio / admin2026
-- Client: maria@gmail.com / client2026

CREATE DATABASE IF NOT EXISTS `selfportrait_studio`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `selfportrait_studio`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `feedback`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `addons`;
DROP TABLE IF EXISTS `packages`;
DROP TABLE IF EXISTS `studio_settings`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(200) NOT NULL,
  `mobile` VARCHAR(20) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('client','admin') NOT NULL DEFAULT 'client',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `studio_settings` (
  `id` INT NOT NULL DEFAULT 1,
  `studio_name` VARCHAR(200) NOT NULL DEFAULT 'Self-Portrait Studio',
  `studio_address` TEXT NULL,
  `studio_lat` DOUBLE NOT NULL DEFAULT 13.9371,
  `studio_lng` DOUBLE NOT NULL DEFAULT 120.7276,
  `studio_phone` VARCHAR(30) NULL,
  `studio_email` VARCHAR(200) NULL,
  `business_hours` JSON NULL,
  `daily_capacity` INT NOT NULL DEFAULT 10,
  `slot_capacity` INT NOT NULL DEFAULT 3,
  `slot_interval_minutes` INT NOT NULL DEFAULT 60,
  `down_payment_type` ENUM('fixed','percentage') NOT NULL DEFAULT 'fixed',
  `down_payment_value` DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  `cancellation_hours` INT NOT NULL DEFAULT 24,
  `reschedule_hours` INT NOT NULL DEFAULT 48,
  `grace_period_minutes` INT NOT NULL DEFAULT 15,
  `no_show_forfeits_downpayment` TINYINT(1) NOT NULL DEFAULT 1,
  `qr_gcash_number` VARCHAR(20) NULL,
  `qr_paymaya_number` VARCHAR(20) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `packages` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `duration` INT NOT NULL COMMENT 'minutes',
  `max_people` INT NOT NULL DEFAULT 1,
  `edited_photos` INT NOT NULL DEFAULT 0,
  `printed_photos` INT NOT NULL DEFAULT 0,
  `services` JSON NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_packages_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `addons` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_addons_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `schedules` (
  `id` CHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `time` VARCHAR(10) NOT NULL,
  `max_capacity` INT NOT NULL DEFAULT 3,
  `blocked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_schedules_date_time` (`date`,`time`),
  KEY `idx_schedules_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `appointments` (
  `id` CHAR(36) NOT NULL,
  `tracking_number` VARCHAR(30) NOT NULL,
  `client_id` CHAR(36) NOT NULL,
  `package_id` CHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `time` VARCHAR(10) NOT NULL,
  `num_people` INT NOT NULL DEFAULT 1,
  `special_requests` TEXT NULL,
  `cancellation_reason` TEXT NULL,
  `reschedule_reason` TEXT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  `down_payment` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `amount_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `remaining_balance` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM(
    'payment_required','payment_submitted','under_verification',
    'verified','rejected','partially_paid','fully_paid'
  ) NOT NULL DEFAULT 'payment_required',
  `status` ENUM(
    'pending','confirmed','cancellation_requested','cancelled',
    'reschedule_requested','rescheduled','checked_in','waiting',
    'now_serving','completed','no_show','rejected'
  ) NOT NULL DEFAULT 'pending',
  `queue_number` INT NULL,
  `addon_ids` JSON NULL,
  `checked_in_at` DATETIME NULL,
  `arrival_time` VARCHAR(10) NULL,
  `queue_entry_at` DATETIME NULL,
  `service_start_at` DATETIME NULL,
  `service_end_at` DATETIME NULL,
  `checked_in_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_appointments_tracking_number` (`tracking_number`),
  KEY `idx_appointments_client` (`client_id`),
  KEY `idx_appointments_package` (`package_id`),
  KEY `idx_appointments_date_status` (`date`,`status`),
  KEY `idx_appointments_date_time_status` (`date`,`time`,`status`),
  KEY `idx_appointments_queue` (`date`,`queue_number`),
  CONSTRAINT `fk_appointments_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_appointments_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_appointments_checked_in_by` FOREIGN KEY (`checked_in_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payments` (
  `id` CHAR(36) NOT NULL,
  `appointment_id` CHAR(36) NOT NULL,
  `client_id` CHAR(36) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `type` ENUM('down_payment','partial','full','additional') NOT NULL,
  `reference_number` VARCHAR(100) NULL,
  `payment_date` DATE NOT NULL,
  `proof_url` TEXT NULL,
  `proof_filename` VARCHAR(255) NULL,
  `proof_data` MEDIUMTEXT NULL,
  `status` ENUM(
    'payment_required','payment_submitted','under_verification',
    'verified','rejected','partially_paid','fully_paid'
  ) NOT NULL DEFAULT 'payment_submitted',
  `verified_by` CHAR(36) NULL,
  `verified_at` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payments_appointment` (`appointment_id`),
  KEY `idx_payments_client` (`client_id`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_reference` (`reference_number`),
  CONSTRAINT `fk_payments_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_payments_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_payments_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('booking','payment','queue','system','feedback') NOT NULL DEFAULT 'system',
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  `related_id` CHAR(36) NULL,
  `related_type` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_read_created` (`user_id`,`read`,`created_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `feedback` (
  `id` CHAR(36) NOT NULL,
  `appointment_id` CHAR(36) NOT NULL,
  `client_id` CHAR(36) NOT NULL,
  `rating` TINYINT NOT NULL,
  `comment` TEXT NULL,
  `booking_experience` TINYINT NULL,
  `staff_service` TINYINT NULL,
  `studio_experience` TINYINT NULL,
  `cleanliness` TINYINT NULL,
  `overall_satisfaction` TINYINT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feedback_appointment` (`appointment_id`),
  KEY `idx_feedback_client` (`client_id`),
  CONSTRAINT `fk_feedback_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `chk_feedback_rating` CHECK (`rating` BETWEEN 1 AND 5),
  CONSTRAINT `chk_feedback_booking` CHECK (`booking_experience` IS NULL OR `booking_experience` BETWEEN 1 AND 5),
  CONSTRAINT `chk_feedback_staff` CHECK (`staff_service` IS NULL OR `staff_service` BETWEEN 1 AND 5),
  CONSTRAINT `chk_feedback_studio` CHECK (`studio_experience` IS NULL OR `studio_experience` BETWEEN 1 AND 5),
  CONSTRAINT `chk_feedback_cleanliness` CHECK (`cleanliness` IS NULL OR `cleanliness` BETWEEN 1 AND 5),
  CONSTRAINT `chk_feedback_overall` CHECK (`overall_satisfaction` IS NULL OR `overall_satisfaction` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `activity_logs` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` CHAR(36) NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_logs_created` (`created_at`),
  KEY `idx_activity_logs_user` (`user_id`),
  KEY `idx_activity_logs_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Initial data
-- -------------------------------------------------------------------------

INSERT INTO `users` (`id`,`name`,`email`,`mobile`,`password_hash`,`role`) VALUES
('11111111-1111-4111-8111-111111111111','Studio Admin','admin@selfportrait.studio','09170000001','$2a$12$h8Qidi0oQaVa2SKRFktUc.WA0et5yxeV/WU4ZhgDYEDvLVrxsIzLW','admin'),
('11111111-1111-4111-8111-111111111112','Maria Santos','maria@gmail.com','09171112222','$2a$12$SVBix089YK2/NuSM.6olr./Za7m14Mu2R7UN.4UhEjmPoOXvnajVK','client');

INSERT INTO `studio_settings` (
  `id`,`studio_name`,`studio_address`,`studio_lat`,`studio_lng`,`studio_phone`,`studio_email`,
  `business_hours`,`daily_capacity`,`slot_capacity`,`slot_interval_minutes`,`down_payment_type`,`down_payment_value`,
  `cancellation_hours`,`reschedule_hours`,`grace_period_minutes`,`no_show_forfeits_downpayment`,
  `qr_gcash_number`,`qr_paymaya_number`
) VALUES (
  1,'Self-Portrait Studio','Baclaran, Balayan, Batangas',13.9371,120.7276,
  '09171234567','hello@selfportrait.studio',
  '{"Mon":{"open":"09:00","close":"17:00","closed":false},"Tue":{"open":"09:00","close":"17:00","closed":false},"Wed":{"open":"09:00","close":"17:00","closed":false},"Thu":{"open":"09:00","close":"17:00","closed":false},"Fri":{"open":"09:00","close":"17:00","closed":false},"Sat":{"open":"09:00","close":"17:00","closed":false},"Sun":{"open":"09:00","close":"17:00","closed":true}}',
  10,3,60,'fixed',500.00,24,48,15,1,'09171234567','09171234567'
);

INSERT INTO `packages` (`id`,`name`,`description`,`price`,`duration`,`max_people`,`edited_photos`,`printed_photos`,`services`,`active`) VALUES
('22222222-2222-4222-8222-222222222221','Solo Package','Perfect for individual portraits.',1500.00,45,1,10,0,'["Digital copies","Basic retouching"]',1),
('22222222-2222-4222-8222-222222222222','Couple Package','A romantic session for two.',2500.00,60,2,15,2,'["Digital copies","Premium retouching","Online gallery"]',1),
('22222222-2222-4222-8222-222222222223','Family Package','Capture the whole family together.',3500.00,90,6,20,5,'["Digital copies","Premium retouching","Printed 8x10","Online gallery"]',1);

INSERT INTO `addons` (`id`,`name`,`description`,`price`,`active`) VALUES
('33333333-3333-4333-8333-333333333331','Extra Outfit Change','Add one more outfit change to your session.',300.00,1),
('33333333-3333-4333-8333-333333333332','Printed 4R Photos (5 pcs)','5 additional printed 4R photos.',250.00,1),
('33333333-3333-4333-8333-333333333333','Rush Editing (24hrs)','Get your edited photos within 24 hours.',500.00,1);

INSERT INTO `activity_logs` (`id`,`user_id`,`user_name`,`action`,`description`,`entity_type`,`entity_id`,`ip_address`) VALUES
('44444444-4444-4444-8444-444444444441','11111111-1111-4111-8111-111111111111','Studio Admin','DATABASE_INITIALIZED','XAMPP database initialized from selfportrait_studio.sql','system',NULL,'127.0.0.1');

SET FOREIGN_KEY_CHECKS = 1;
