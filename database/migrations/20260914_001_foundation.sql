-- Non-destructive MariaDB/XAMPP migration for existing Self-Portrait Studio databases.
USE `selfportrait_studio`;

ALTER TABLE `studio_settings`
  ADD COLUMN IF NOT EXISTS `slot_interval_minutes` INT NOT NULL DEFAULT 60 AFTER `slot_capacity`;

CREATE INDEX IF NOT EXISTS `idx_appointments_date_time_status`
  ON `appointments` (`date`,`time`,`status`);

CREATE INDEX IF NOT EXISTS `idx_payments_reference`
  ON `payments` (`reference_number`);
