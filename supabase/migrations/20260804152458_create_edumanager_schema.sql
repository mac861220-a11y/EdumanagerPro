/*
# EduManager Pro - School Management Schema

## Overview
Creates the complete database schema for a middle/high school management system (EduManager Pro).
This is a single-tenant app (no sign-in screen) so all policies allow anon + authenticated access.

## New Tables

### Establishment
- `levels` — Education levels from 6ème to Terminale (ordered by `order_index`).
- `classes` — Classes within each level (e.g. 6ème A, 6ème B).
- `subjects` — Subjects with coefficients for weighted grade calculation.

### Students
- `students` — Student profiles enriched with tutor information (tutor name, first name, phone).
  Links to a class.

### Staff
- `staff` — Personnel profiles with role (admin, secretary, teacher).
- `staff_history` — Career history for staff (service start/cessation dates, positions).

### Pedagogy
- `grades` — Coefficiented grades per student per subject per term.
- `absences` — Absence records per student with date and reason.
- `report_cards` — Term report cards (bulletins trimestriels) per student per term.

### Finance
- `payments` — CGDES fee tracking per student: total due, amount paid, balance, status.

## Security
- RLS enabled on ALL tables.
- All policies allow `anon, authenticated` CRUD (single-tenant, no-auth app, intentionally shared data).
*/

-- ============================================================
-- ESTABLISHMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_levels" ON levels;
CREATE POLICY "anon_crud_levels" ON levels FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_levels" ON levels;
CREATE POLICY "anon_insert_levels" ON levels FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_levels" ON levels;
CREATE POLICY "anon_update_levels" ON levels FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_levels" ON levels;
CREATE POLICY "anon_delete_levels" ON levels FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  capacity int DEFAULT 40,
  created_at timestamptz DEFAULT now(),
  UNIQUE (name, level_id)
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_classes" ON classes;
CREATE POLICY "anon_crud_classes" ON classes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_classes" ON classes;
CREATE POLICY "anon_insert_classes" ON classes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_classes" ON classes;
CREATE POLICY "anon_update_classes" ON classes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_classes" ON classes;
CREATE POLICY "anon_delete_classes" ON classes FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  coefficient numeric(4,2) NOT NULL DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_subjects" ON subjects;
CREATE POLICY "anon_crud_subjects" ON subjects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_subjects" ON subjects;
CREATE POLICY "anon_insert_subjects" ON subjects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_subjects" ON subjects;
CREATE POLICY "anon_update_subjects" ON subjects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_subjects" ON subjects;
CREATE POLICY "anon_delete_subjects" ON subjects FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- STAFF
-- ============================================================

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'secretary', 'teacher')),
  phone text,
  email text,
  address text,
  hire_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_staff" ON staff;
CREATE POLICY "anon_crud_staff" ON staff FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_staff" ON staff;
CREATE POLICY "anon_insert_staff" ON staff FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_staff" ON staff;
CREATE POLICY "anon_update_staff" ON staff FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_staff" ON staff;
CREATE POLICY "anon_delete_staff" ON staff FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS staff_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  position text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_staff_history" ON staff_history;
CREATE POLICY "anon_crud_staff_history" ON staff_history FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_staff_history" ON staff_history;
CREATE POLICY "anon_insert_staff_history" ON staff_history FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_staff_history" ON staff_history;
CREATE POLICY "anon_update_staff_history" ON staff_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_staff_history" ON staff_history;
CREATE POLICY "anon_delete_staff_history" ON staff_history FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- STUDENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date NOT NULL,
  birth_place text,
  gender text CHECK (gender IN ('M', 'F')),
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  -- Tutor information
  tutor_first_name text NOT NULL,
  tutor_last_name text NOT NULL,
  tutor_phone text NOT NULL,
  tutor_email text,
  tutor_relationship text,
  address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_students" ON students;
CREATE POLICY "anon_crud_students" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- PEDAGOGY
-- ============================================================

CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  term int NOT NULL CHECK (term IN (1, 2, 3)),
  grade_type text NOT NULL DEFAULT 'devoir' CHECK (grade_type IN ('devoir', 'composition', 'interrogation')),
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 20),
  max_score numeric(5,2) NOT NULL DEFAULT 20,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_grades" ON grades;
CREATE POLICY "anon_crud_grades" ON grades FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_grades" ON grades;
CREATE POLICY "anon_insert_grades" ON grades FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_grades" ON grades;
CREATE POLICY "anon_update_grades" ON grades FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_grades" ON grades;
CREATE POLICY "anon_delete_grades" ON grades FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  date date NOT NULL,
  term int NOT NULL CHECK (term IN (1, 2, 3)),
  reason text,
  justified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_absences" ON absences;
CREATE POLICY "anon_crud_absences" ON absences FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_absences" ON absences;
CREATE POLICY "anon_insert_absences" ON absences FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_absences" ON absences;
CREATE POLICY "anon_update_absences" ON absences FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_absences" ON absences;
CREATE POLICY "anon_delete_absences" ON absences FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term int NOT NULL CHECK (term IN (1, 2, 3)),
  general_average numeric(5,2),
  rank int,
  appreciation text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, term)
);

ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_report_cards" ON report_cards;
CREATE POLICY "anon_crud_report_cards" ON report_cards FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_report_cards" ON report_cards;
CREATE POLICY "anon_insert_report_cards" ON report_cards FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_report_cards" ON report_cards;
CREATE POLICY "anon_update_report_cards" ON report_cards FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_report_cards" ON report_cards;
CREATE POLICY "anon_delete_report_cards" ON report_cards FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- FINANCE (CGDES)
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  total_due numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  balance numeric(10,2) GENERATED ALWAYS AS (total_due - amount_paid) STORED,
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'in_progress', 'unpaid')),
  academic_year text NOT NULL DEFAULT '2024-2025',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_payments" ON payments;
CREATE POLICY "anon_crud_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments" ON payments FOR DELETE TO anon, authenticated USING (true);

-- Payment transactions (individual payment records for receipts)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'transfer', 'mobile_money')),
  receipt_number text UNIQUE,
  received_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_payment_txns" ON payment_transactions;
CREATE POLICY "anon_crud_payment_txns" ON payment_transactions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payment_txns" ON payment_transactions;
CREATE POLICY "anon_insert_payment_txns" ON payment_transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payment_txns" ON payment_transactions;
CREATE POLICY "anon_update_payment_txns" ON payment_transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_payment_txns" ON payment_transactions;
CREATE POLICY "anon_delete_payment_txns" ON payment_transactions FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(level_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_term ON grades(term);
CREATE INDEX IF NOT EXISTS idx_absences_student ON absences(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_staff_history_staff ON staff_history(staff_id);
CREATE INDEX IF NOT EXISTS idx_payment_txns_payment ON payment_transactions(payment_id);
