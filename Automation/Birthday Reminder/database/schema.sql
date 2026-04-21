-- ============================================================
-- Birthday Reminder Automation System — Database Schema
-- Run in MySQL client or phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS birthday_reminder
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE birthday_reminder;

-- ------------------------------------------------------------
-- Birthday entries
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS birthdays (
    id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(150)     NOT NULL,
    date_of_birth DATE             NOT NULL,
    email         VARCHAR(200)     NOT NULL,
    phone         VARCHAR(20)      DEFAULT NULL,
    custom_note   TEXT             DEFAULT NULL,
    is_active     TINYINT(1)       NOT NULL DEFAULT 1,
    created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_dob    (date_of_birth),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Reminder rules — one or more rules per birthday
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminder_rules (
    id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    birthday_id   INT UNSIGNED     NOT NULL,
    days_before   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=same day, 1,3,7=days before birthday',
    delivery_type ENUM('dashboard','email','sms') NOT NULL DEFAULT 'dashboard',
    is_recurring  TINYINT(1)       NOT NULL DEFAULT 1 COMMENT '1=repeat every year',
    is_active     TINYINT(1)       NOT NULL DEFAULT 1,
    created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_rules_birthday FOREIGN KEY (birthday_id)
        REFERENCES birthdays (id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_rule_birthday (birthday_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Generated reminder records (produced by cron)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminders (
    id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    birthday_id   INT UNSIGNED     NOT NULL,
    rule_id       INT UNSIGNED     NOT NULL,
    reminder_date DATE             NOT NULL COMMENT 'Exact date reminder fires',
    status        ENUM('pending','sent','failed','completed') NOT NULL DEFAULT 'pending',
    delivery_type ENUM('dashboard','email','sms') NOT NULL DEFAULT 'dashboard',
    message       TEXT             DEFAULT NULL,
    sent_at       TIMESTAMP        NULL DEFAULT NULL,
    created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- Prevent duplicates: one reminder per birthday/rule/date
    UNIQUE KEY uq_reminder (birthday_id, rule_id, reminder_date),
    CONSTRAINT fk_rem_birthday FOREIGN KEY (birthday_id)
        REFERENCES birthdays (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rem_rule FOREIGN KEY (rule_id)
        REFERENCES reminder_rules (id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_rem_status        (status),
    INDEX idx_rem_reminder_date (reminder_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Automation execution logs (one row per cron run)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_logs (
    id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    run_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    birthdays_checked   INT UNSIGNED NOT NULL DEFAULT 0,
    reminders_generated INT UNSIGNED NOT NULL DEFAULT 0,
    reminders_sent      INT UNSIGNED NOT NULL DEFAULT 0,
    errors              TEXT         DEFAULT NULL COMMENT 'JSON array of error messages',
    execution_ms        INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
