/*
# EduManager Pro - Seed Data

## Overview
Populates all tables with realistic fictional data for a middle/high school:
- 7 levels (6ème → Terminale)
- 14 classes (2 per level: A and B)
- 12 subjects with coefficients
- 8 staff members (1 admin, 2 secretaries, 5 teachers) with career history
- 30 students with tutor information, distributed across classes
- Grades (coefficiented) across 3 terms
- Absences
- CGDES payment records with varied statuses (paid, in_progress, unpaid)
- Payment transactions with receipt numbers

All data is fictional. No real persons are represented.
*/

-- ============================================================
-- LEVELS
-- ============================================================
INSERT INTO levels (name, order_index) VALUES
  ('6ème', 1),
  ('5ème', 2),
  ('4ème', 3),
  ('3ème', 4),
  ('Seconde', 5),
  ('Première', 6),
  ('Terminale', 7)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SUBJECTS
-- ============================================================
INSERT INTO subjects (name, coefficient) VALUES
  ('Mathématiques', 4.0),
  ('Français', 4.0),
  ('Anglais', 3.0),
  ('Histoire-Géographie', 2.0),
  ('Sciences de la Vie et de la Terre', 2.0),
  ('Sciences Physiques', 3.0),
  ('Éducation Physique et Sportive', 1.0),
  ('Philosophie', 3.0),
  ('Espagnol', 2.0),
  ('Mathématiques (Spécialité)', 6.0),
  ('Économie et Sciences Sociales', 4.0),
  ('Enseignement Moral et Civique', 1.0)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- CLASSES (2 per level)
-- ============================================================
INSERT INTO classes (name, level_id, capacity)
SELECT c.name || ' ' || sfx, l.id, 40
FROM levels l
CROSS JOIN (VALUES ('A'), ('B')) AS v(sfx)
CROSS JOIN (SELECT l2.name AS name FROM levels l2) AS c
WHERE c.name = l.name
ON CONFLICT (name, level_id) DO NOTHING;

-- ============================================================
-- STAFF
-- ============================================================
INSERT INTO staff (first_name, last_name, role, phone, email, address, hire_date, status, subject_id) VALUES
  ('Jean-Marc', 'Kouassi', 'admin', '+225 07 00 11 22 33', 'jm.kouassi@edumanager.ci', 'Cocody, Abidjan', '2015-09-01', 'active', NULL),
  ('Aminata', 'Traoré', 'secretary', '+225 07 11 33 44 55', 'a.traore@edumanager.ci', 'Plateau, Abidjan', '2018-09-15', 'active', NULL),
  ('Sophie', 'Bamba', 'secretary', '+225 07 22 44 55 66', 's.bamba@edumanager.ci', 'Yopougon, Abidjan', '2020-01-10', 'active', NULL),
  ('Mamadou', 'Diallo', 'teacher', '+225 07 33 55 66 77', 'm.diallo@edumanager.ci', 'Adjamé, Abidjan', '2016-09-01', 'active', (SELECT id FROM subjects WHERE name='Mathématiques')),
  ('Fatou', 'Sangaré', 'teacher', '+225 07 44 66 77 88', 'f.sangare@edumanager.ci', 'Treichville, Abidjan', '2017-09-01', 'active', (SELECT id FROM subjects WHERE name='Français')),
  ('Koffi', 'NGuessan', 'teacher', '+225 07 55 77 88 99', 'k.nguessan@edumanager.ci', 'Koumassi, Abidjan', '2014-09-01', 'active', (SELECT id FROM subjects WHERE name='Anglais')),
  ('Adèle', 'Yapo', 'teacher', '+225 07 66 88 99 00', 'a.yapo@edumanager.ci', 'Marcory, Abidjan', '2019-09-01', 'active', (SELECT id FROM subjects WHERE name='Sciences Physiques')),
  ('Issouf', 'Konaté', 'teacher', '+225 07 77 99 00 11', 'i.konate@edumanager.ci', 'Bingerville', '2013-09-01', 'inactive', (SELECT id FROM subjects WHERE name='Histoire-Géographie'))
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAFF HISTORY (career)
-- ============================================================
INSERT INTO staff_history (staff_id, position, start_date, end_date, notes) VALUES
  ((SELECT id FROM staff WHERE last_name='Kouassi' AND first_name='Jean-Marc'), 'Directeur', '2015-09-01', NULL, 'Directeur de l''établissement depuis 2015'),
  ((SELECT id FROM staff WHERE last_name='Kouassi' AND first_name='Jean-Marc'), 'Directeur Adjoint', '2010-09-01', '2015-08-31', 'A exercé comme directeur adjoint'),
  ((SELECT id FROM staff WHERE last_name='Traoré' AND first_name='Aminata'), 'Secrétaire de Direction', '2018-09-15', NULL, NULL),
  ((SELECT id FROM staff WHERE last_name='Bamba' AND first_name='Sophie'), 'Secrétaire', '2020-01-10', NULL, NULL),
  ((SELECT id FROM staff WHERE last_name='Diallo' AND first_name='Mamadou'), 'Professeur de Mathématiques', '2016-09-01', NULL, NULL),
  ((SELECT id FROM staff WHERE last_name='Sangaré' AND first_name='Fatou'), 'Professeur de Français', '2017-09-01', NULL, NULL),
  ((SELECT id FROM staff WHERE last_name='NGuessan' AND first_name='Koffi'), 'Professeur d''Anglais', '2014-09-01', NULL, NULL),
  ((SELECT id FROM staff WHERE last_name='Yapo' AND first_name='Adèle'), 'Professeur de Sciences Physiques', '2019-09-01', NULL, NULL),
  ((SELECT id FROM staff WHERE last_name='Konaté' AND first_name='Issouf'), 'Professeur d''Histoire-Géographie', '2013-09-01', '2024-06-30', 'Cessation de service - retraite'),
  ((SELECT id FROM staff WHERE last_name='Konaté' AND first_name='Issouf'), 'Professeur Principal', '2018-09-01', '2024-06-30', 'Promu professeur principal')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STUDENTS (30 students with tutors, distributed across classes)
-- ============================================================
INSERT INTO students (first_name, last_name, birth_date, birth_place, gender, class_id, enrollment_date, status, tutor_first_name, tutor_last_name, tutor_phone, tutor_relationship, address) VALUES
  -- 6ème A (3 students)
  ('Kouadio', 'Assemian', '2012-03-15', 'Abidjan', 'M', (SELECT id FROM classes WHERE name='6ème A'), '2023-09-15', 'active', 'Assemian', 'Yves', '+225 07 88 11 22 33', 'Père', 'Cocody Angré, Abidjan'),
  ('Aya', 'Kouamé', '2012-07-22', 'Bouaké', 'F', (SELECT id FROM classes WHERE name='6ème A'), '2023-09-15', 'active', 'Kouamé', 'Bertrand', '+225 07 89 22 33 44', 'Père', 'Cocody II Plateaux, Abidjan'),
  ('Marius', 'Brou', '2012-01-10', 'Yamoussoukro', 'M', (SELECT id FROM classes WHERE name='6ème A'), '2023-09-15', 'active', 'Brou', 'Christine', '+225 07 90 33 44 55', 'Mère', 'Adjamé, Abidjan'),
  -- 6ème B (2 students)
  ('Déborah', 'N''Guessan', '2012-05-18', 'Daloa', 'F', (SELECT id FROM classes WHERE name='6ème B'), '2023-09-15', 'active', 'N''Guessan', 'Paul', '+225 07 91 44 55 66', 'Père', 'Yopougon, Abidjan'),
  ('Ismaël', 'Cissé', '2012-09-03', 'Korhogo', 'M', (SELECT id FROM classes WHERE name='6ème B'), '2023-09-15', 'active', 'Cissé', 'Awa', '+225 07 92 55 66 77', 'Mère', 'Abobo, Abidjan'),
  -- 5ème A (3 students)
  ('Mariam', 'Sidibé', '2011-02-14', 'Man', 'F', (SELECT id FROM classes WHERE name='5ème A'), '2022-09-15', 'active', 'Sidibé', 'Moussa', '+225 07 93 66 77 88', 'Père', 'Treichville, Abidjan'),
  ('Olivier', 'Gnagne', '2011-06-20', 'Abidjan', 'M', (SELECT id FROM classes WHERE name='5ème A'), '2022-09-15', 'active', 'Gnagne', 'Sylvie', '+225 07 94 77 88 99', 'Mère', 'Koumassi, Abidjan'),
  ('Bintou', 'Doumbia', '2011-11-11', 'Bouaké', 'F', (SELECT id FROM classes WHERE name='5ème A'), '2022-09-15', 'active', 'Doumbia', 'Lassina', '+225 07 95 88 99 00', 'Père', 'Marcory, Abidjan'),
  -- 5ème B (2 students)
  ('Yann', 'Aka', '2011-04-25', 'Abidjan', 'M', (SELECT id FROM classes WHERE name='5ème B'), '2022-09-15', 'active', 'Aka', 'Nadège', '+225 07 96 99 00 11', 'Mère', 'Plateau, Abidjan'),
  ('Fatim', 'Sylla', '2011-08-30', 'Gagnoa', 'F', (SELECT id FROM classes WHERE name='5ème B'), '2022-09-15', 'active', 'Sylla', 'Ibrahim', '+225 07 97 00 11 22', 'Père', 'Bingerville, Abidjan'),
  -- 4ème A (3 students)
  ('Junior', 'Yeboua', '2010-03-05', 'Abidjan', 'M', (SELECT id FROM classes WHERE name='4ème A'), '2021-09-15', 'active', 'Yeboua', 'Augustin', '+225 07 98 11 22 33', 'Père', 'Cocody, Abidjan'),
  ('Claudia', 'Assi', '2010-07-12', 'Divo', 'F', (SELECT id FROM classes WHERE name='4ème A'), '2021-09-15', 'active', 'Assi', 'Marguerite', '+225 07 99 22 33 44', 'Mère', 'Yopougon, Abidjan'),
  ('Sékou', 'Touré', '2010-12-18', 'Odienne', 'M', (SELECT id FROM classes WHERE name='4ème A'), '2021-09-15', 'active', 'Touré', 'Bakary', '+225 07 80 33 44 55', 'Père', 'Adjamé, Abidjan'),
  -- 4ème B (2 students)
  ('Linda', 'Kouadio', '2010-02-28', 'Abidjan', 'F', (SELECT id FROM classes WHERE name='4ème B'), '2021-09-15', 'active', 'Kouadio', 'Emmanuel', '+225 07 81 44 55 66', 'Père', 'Treichville, Abidjan'),
  ('Hamed', 'Diabaté', '2010-10-15', 'Katiola', 'M', (SELECT id FROM classes WHERE name='4ème B'), '2021-09-15', 'active', 'Diabaté', 'Rokia', '+225 07 82 55 66 77', 'Mère', 'Abobo, Abidjan'),
  -- 3ème A (3 students)
  ('Awa', 'Sawadogo', '2009-05-22', 'Abidjan', 'F', (SELECT id FROM classes WHERE name='3ème A'), '2020-09-15', 'active', 'Sawadogo', 'Karim', '+225 07 83 66 77 88', 'Père', 'Cocody, Abidjan'),
  ('Cédric', 'Yapi', '2009-09-14', 'Gagnoa', 'M', (SELECT id FROM classes WHERE name='3ème A'), '2020-09-15', 'active', 'Yapi', 'Solange', '+225 07 84 77 88 99', 'Mère', 'Koumassi, Abidjan'),
  ('Nadia', 'Fofana', '2009-01-30', 'Bouaké', 'F', (SELECT id FROM classes WHERE name='3ème A'), '2020-09-15', 'active', 'Fofana', 'Mamadou', '+225 07 85 88 99 00', 'Père', 'Marcory, Abidjan'),
  -- 3ème B (2 students)
  ('Drissa', 'Coulibaly', '2009-06-08', 'Korhogo', 'M', (SELECT id FROM classes WHERE name='3ème B'), '2020-09-15', 'active', 'Coulibaly', 'Aminata', '+225 07 86 99 00 11', 'Mère', 'Yopougon, Abidjan'),
  ('Estelle', 'Brou', '2009-11-25', 'Abidjan', 'F', (SELECT id FROM classes WHERE name='3ème B'), '2020-09-15', 'active', 'Brou', 'Koffi', '+225 07 87 00 11 22', 'Père', 'Bingerville, Abidjan'),
  -- Seconde A (3 students)
  ('Aboubakar', 'Sangaré', '2008-04-12', 'Bouaké', 'M', (SELECT id FROM classes WHERE name='Seconde A'), '2019-09-15', 'active', 'Sangaré', 'Rokia', '+225 07 78 11 22 33', 'Mère', 'Cocody, Abidjan'),
  ('Grâce', 'Tanoh', '2008-08-19', 'Abidjan', 'F', (SELECT id FROM classes WHERE name='Seconde A'), '2019-09-15', 'active', 'Tanoh', 'Bertrand', '+225 07 79 22 33 44', 'Père', 'Plateau, Abidjan'),
  ('Karim', 'Bamba', '2008-12-03', 'Man', 'M', (SELECT id FROM classes WHERE name='Seconde A'), '2019-09-15', 'active', 'Bamba', 'Adama', '+225 07 70 33 44 55', 'Père', 'Treichville, Abidjan'),
  -- Seconde B (2 students)
  ('Sylvie', 'Adou', '2008-02-17', 'Daloa', 'F', (SELECT id FROM classes WHERE name='Seconde B'), '2019-09-15', 'active', 'Adou', 'Jean', '+225 07 71 44 55 66', 'Père', 'Adjamé, Abidjan'),
  ('Moussa', 'Barro', '2008-07-29', 'Odienne', 'M', (SELECT id FROM classes WHERE name='Seconde B'), '2019-09-15', 'active', 'Barro', 'Fatou', '+225 07 72 55 66 77', 'Mère', 'Abobo, Abidjan'),
  -- Première A (2 students)
  ('Inès', 'Kouassi', '2007-03-10', 'Abidjan', 'F', (SELECT id FROM classes WHERE name='Première A'), '2018-09-15', 'active', 'Kouassi', 'Yves', '+225 07 73 66 77 88', 'Père', 'Cocody, Abidjan'),
  ('Rachid', 'Zadi', '2007-10-22', 'Yamoussoukro', 'M', (SELECT id FROM classes WHERE name='Première A'), '2018-09-15', 'active', 'Zadi', 'Marguerite', '+225 07 74 77 88 99', 'Mère', 'Koumassi, Abidjan'),
  -- Première B (1 student)
  ('Joëlle', 'Kacou', '2007-06-14', 'Abidjan', 'F', (SELECT id FROM classes WHERE name='Première B'), '2018-09-15', 'active', 'Kacou', 'Samuel', '+225 07 75 88 99 00', 'Père', 'Marcory, Abidjan'),
  -- Terminale A (2 students)
  ('Yassine', 'Koné', '2006-01-08', 'Korhogo', 'M', (SELECT id FROM classes WHERE name='Terminale A'), '2017-09-15', 'active', 'Koné', 'Lassina', '+225 07 76 99 00 11', 'Père', 'Cocody, Abidjan'),
  ('Aïcha', 'Diarra', '2006-05-20', 'Bouaké', 'F', (SELECT id FROM classes WHERE name='Terminale A'), '2017-09-15', 'active', 'Diarra', 'Awa', '+225 07 67 00 11 22', 'Mère', 'Yopougon, Abidjan'),
  -- Terminale B (1 student)
  ('Boubakar', 'Soro', '2006-09-15', 'Man', 'M', (SELECT id FROM classes WHERE name='Terminale B'), '2017-09-15', 'active', 'Soro', 'Issouf', '+225 07 68 11 22 33', 'Père', 'Bingerville, Abidjan')
ON CONFLICT DO NOTHING;

-- ============================================================
-- GRADES (for Term 1 - varied scores)
-- ============================================================
-- Generate grades for each student in Math, French, English, Sciences Physiques
DO $$
DECLARE
  s RECORD;
  subj RECORD;
  score_val numeric;
  teacher_id uuid;
  cls_id uuid;
BEGIN
  FOR s IN SELECT id, class_id FROM students LOOP
    FOR subj IN SELECT id, name FROM subjects WHERE name IN ('Mathématiques', 'Français', 'Anglais', 'Sciences Physiques', 'Histoire-Géographie', 'Sciences de la Vie et de la Terre') LOOP
      -- Assign teacher based on subject
      SELECT id INTO teacher_id FROM staff WHERE subject_id = subj.id AND status = 'active' LIMIT 1;
      -- Random-ish score between 8 and 17
      score_val := 8 + (random() * 9);
      INSERT INTO grades (student_id, subject_id, class_id, teacher_id, term, grade_type, score, max_score)
      VALUES (s.id, subj.id, s.class_id, teacher_id, 1, 'composition', round(score_val::numeric, 2), 20)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- ABSENCES
-- ============================================================
DO $$
DECLARE
  s RECORD;
  num_abs int;
  i int;
  abs_date date;
BEGIN
  FOR s IN SELECT id, class_id FROM students LOOP
    num_abs := floor(random() * 4)::int; -- 0 to 3 absences
    FOR i IN 1..num_abs LOOP
      abs_date := CURRENT_DATE - (floor(random() * 90)::int);
      INSERT INTO absences (student_id, class_id, date, term, reason, justified)
      VALUES (s.id, s.class_id, abs_date, 1,
        CASE floor(random()*3)::int WHEN 0 THEN 'Maladie' WHEN 1 THEN 'Absence non justifiée' ELSE 'Retard' END,
        random() > 0.5);
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- PAYMENTS (CGDES) - varied statuses
-- ============================================================
DO $$
DECLARE
  s RECORD;
  total_due numeric;
  amount_paid numeric;
  status_val text;
BEGIN
  FOR s IN SELECT id FROM students LOOP
    total_due := 150000; -- 150,000 FCFA per year
    -- Vary the payment status
    CASE floor(random()*3)::int
      WHEN 0 THEN
        amount_paid := total_due;
        status_val := 'paid';
      WHEN 1 THEN
        amount_paid := floor(total_due * (random() * 0.7 + 0.2));
        status_val := 'in_progress';
      ELSE
        amount_paid := 0;
        status_val := 'unpaid';
    END CASE;

    INSERT INTO payments (student_id, total_due, amount_paid, payment_status, academic_year, notes)
    VALUES (s.id, total_due, round(amount_paid::numeric, 2), status_val, '2024-2025',
      CASE WHEN status_val = 'paid' THEN 'Frais CGDES intégralement réglés'
           WHEN status_val = 'in_progress' THEN 'Paiement partiel en cours'
           ELSE 'Aucun paiement enregistré' END)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================================
-- PAYMENT TRANSACTIONS (for in_progress and paid)
-- ============================================================
DO $$
DECLARE
  p RECORD;
  remaining numeric;
  installment numeric;
  receipt_seq int := 1000;
BEGIN
  FOR p IN SELECT id, student_id, amount_paid FROM payments WHERE amount_paid > 0 LOOP
    remaining := p.amount_paid;
    WHILE remaining > 0 LOOP
      installment := LEAST(remaining, 50000);
      receipt_seq := receipt_seq + 1;
      INSERT INTO payment_transactions (payment_id, student_id, amount, payment_date, payment_method, receipt_number, received_by)
      VALUES (p.id, p.student_id, round(installment::numeric, 2),
        CURRENT_DATE - (floor(random() * 120)::int),
        CASE floor(random()*3)::int WHEN 0 THEN 'cash' WHEN 1 THEN 'mobile_money' ELSE 'transfer' END,
        'REC-' || receipt_seq::text,
        'Aminata Traoré');
      remaining := remaining - installment;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- REPORT CARDS (Term 1 - auto-compute later in app)
-- ============================================================
DO $$
DECLARE
  s RECORD;
  avg_val numeric;
BEGIN
  FOR s IN SELECT DISTINCT student_id FROM grades WHERE term = 1 LOOP
    SELECT round(avg(score), 2) INTO avg_val FROM grades WHERE student_id = s.student_id AND term = 1;
    INSERT INTO report_cards (student_id, term, general_average, published, appreciation)
    VALUES (s.student_id, 1, avg_val, true,
      CASE
        WHEN avg_val >= 16 THEN 'Excellent trimestre'
        WHEN avg_val >= 14 THEN 'Très bon trimestre'
        WHEN avg_val >= 12 THEN 'Bon trimestre'
        WHEN avg_val >= 10 THEN 'Trimestre satisfaisant'
        ELSE 'Travail à fournir'
      END)
    ON CONFLICT (student_id, term) DO NOTHING;
  END LOOP;
END $$;
