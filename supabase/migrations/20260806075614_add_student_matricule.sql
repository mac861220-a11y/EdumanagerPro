/*
# Add matricule column to students

## Overview
Adds a "Numéro Matricule" (student registration number) to every student record.
The matricule follows the format `MAT-YYYY-XXXX` (e.g. MAT-2026-0001) and is
auto-generated when a new student is created, but remains manually editable.

## Changes
### Modified Tables
- `students`
  - New column: `matricule` (text, unique, nullable for backward compatibility)
    - Format: `MAT-<year>-<4-digit sequence>`
    - Auto-generated via a trigger `generate_student_matricule` on INSERT
      when the caller does not supply a value.
    - The sequence `student_matricule_seq` ensures incrementing 4-digit numbers.

## Security
- No RLS policy changes. The existing anon/authenticated CRUD policies on
  `students` already cover the new column (column-level privileges are not
  restricted; the table-level policies govern access).

## Important Notes
1. The trigger only fires when `NEW.matricule IS NULL`, so manual values
   supplied by the application are always preserved.
2. Existing rows are backfilled with a generated matricule so the column is
   never empty for current students.
3. The matricule column has a UNIQUE constraint to prevent duplicates.
*/

-- Add the matricule column (nullable so existing rows don't break)
ALTER TABLE students ADD COLUMN IF NOT EXISTS matricule text;

-- Backfill existing rows with a generated matricule
DO $$
DECLARE
  rec RECORD;
  counter int := 1;
  year_part text := to_char(now(), 'YYYY');
BEGIN
  FOR rec IN SELECT id FROM students WHERE matricule IS NULL ORDER BY created_at LOOP
    UPDATE students
      SET matricule = 'MAT-' || year_part || '-' || lpad(counter::text, 4, '0')
    WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_matricule_key'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_matricule_key UNIQUE (matricule);
  END IF;
END $$;

-- Create a sequence for auto-generating the 4-digit part
CREATE SEQUENCE IF NOT EXISTS student_matricule_seq START 1;

-- Function to auto-generate matricule on insert when not provided
CREATE OR REPLACE FUNCTION generate_student_matricule()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  next_num int;
  year_part text;
BEGIN
  IF NEW.matricule IS NOT NULL AND NEW.matricule <> '' THEN
    RETURN NEW;
  END IF;

  year_part := to_char(now(), 'YYYY');
  next_num := nextval('student_matricule_seq');
  NEW.matricule := 'MAT-' || year_part || '-' || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger (idempotent)
DROP TRIGGER IF EXISTS trg_generate_student_matricule ON students;
CREATE TRIGGER trg_generate_student_matricule
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION generate_student_matricule();
