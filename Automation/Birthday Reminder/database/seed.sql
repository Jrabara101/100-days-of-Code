-- ============================================================
-- Birthday Reminder — Sample Seed Data
-- Run AFTER schema.sql
-- ============================================================

USE birthday_reminder;

-- ------------------------------------------------------------
-- Sample birthdays (mix of past/future months for variety)
-- ------------------------------------------------------------
INSERT INTO birthdays (full_name, date_of_birth, email, phone, custom_note) VALUES
('Alice Johnson',    '1990-04-25', 'alice@example.com',     '+1-555-0101', 'Loves chocolate cake — order from La Patisserie!'),
('Bob Martinez',     '1985-05-10', 'bob@example.com',       '+1-555-0102', 'Office birthday — buy card from team'),
('Carol Williams',   '1992-04-21', 'carol@example.com',     NULL,          'Send flowers — prefers white lilies'),
('David Chen',       '1988-07-15', 'david@example.com',     '+1-555-0103', 'Big gaming fan, consider a game gift card'),
('Emma Davis',       '1995-08-30', 'emma@example.com',      '+1-555-0104', 'Vegan — no dairy cake, contact Bloom Bakery'),
('Frank Wilson',     '1980-12-05', 'frank@example.com',     NULL,          'Prefers experiences over gifts'),
('Grace Lee',        '1998-01-20', 'grace@example.com',     '+1-555-0105', 'Loves surprise parties — coordinate with team'),
('Henry Brown',      '1975-06-08', 'henry@example.com',     '+1-555-0106', 'Senior manager — formal card appropriate'),
('Isabella Taylor',  '2000-09-14', 'isabella@example.com',  NULL,          'Pizza party! Pepperoni is her favorite'),
('James Anderson',   '1993-03-22', 'james@example.com',     '+1-555-0107', 'Outdoor/hiking enthusiast — gear gifts work well');

-- ------------------------------------------------------------
-- Sample reminder rules per birthday
-- ------------------------------------------------------------
INSERT INTO reminder_rules (birthday_id, days_before, delivery_type, is_recurring) VALUES
-- Alice: 7-day email + same-day dashboard
(1,  7, 'email',     1),
(1,  0, 'dashboard', 1),
-- Bob: 3-day email + same-day dashboard
(2,  3, 'email',     1),
(2,  0, 'dashboard', 1),
-- Carol: 1-day dashboard
(3,  1, 'dashboard', 1),
-- David: 7-day email
(4,  7, 'email',     1),
-- Emma: 3-day dashboard
(5,  3, 'dashboard', 1),
-- Frank: same-day email
(6,  0, 'email',     1),
-- Grace: 1-day email + same-day dashboard
(7,  1, 'email',     1),
(7,  0, 'dashboard', 1),
-- Henry: 7-day dashboard
(8,  7, 'dashboard', 1),
-- Isabella: same-day dashboard
(9,  0, 'dashboard', 1),
-- James: 3-day email
(10, 3, 'email',     1);

-- ------------------------------------------------------------
-- Sample automation logs (simulating past cron runs)
-- ------------------------------------------------------------
INSERT INTO automation_logs (birthdays_checked, reminders_generated, reminders_sent, errors, execution_ms) VALUES
(10, 3, 2, NULL, 245),
(10, 1, 1, NULL, 189),
(10, 0, 0, NULL, 102),
(10, 2, 1, '["Email send failed for bob@example.com: SMTP timeout"]', 310);
