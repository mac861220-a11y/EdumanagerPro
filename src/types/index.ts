export interface Level {
  id: string;
  name: string;
  order_index: number;
  created_at?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  level_id: string;
  capacity: number;
  created_at?: string;
  level?: Level;
}

export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  created_at?: string;
}

export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'secretary' | 'teacher';
  phone: string | null;
  email: string | null;
  address: string | null;
  hire_date: string;
  status: 'active' | 'inactive';
  subject_id: string | null;
  created_at?: string;
  subject?: Subject | null;
}

export interface StaffHistory {
  id: string;
  staff_id: string;
  position: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at?: string;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string | null;
  gender: 'M' | 'F' | null;
  class_id: string | null;
  enrollment_date: string;
  status: 'active' | 'inactive' | 'transferred';
  tutor_first_name: string;
  tutor_last_name: string;
  tutor_phone: string;
  tutor_email: string | null;
  tutor_relationship: string | null;
  address: string | null;
  matricule: string | null;
  created_at?: string;
  class?: SchoolClass | null;
}

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string | null;
  teacher_id: string | null;
  term: 1 | 2 | 3;
  grade_type: 'devoir' | 'composition' | 'interrogation';
  score: number;
  max_score: number;
  created_at?: string;
  subject?: Subject;
  student?: Student;
  teacher?: Staff | null;
}

export interface Absence {
  id: string;
  student_id: string;
  class_id: string | null;
  date: string;
  term: 1 | 2 | 3;
  reason: string | null;
  justified: boolean;
  created_at?: string;
  student?: Student;
}

export interface ReportCard {
  id: string;
  student_id: string;
  term: 1 | 2 | 3;
  general_average: number | null;
  rank: number | null;
  appreciation: string | null;
  published: boolean;
  created_at?: string;
  student?: Student;
}

export interface Payment {
  id: string;
  student_id: string;
  total_due: number;
  amount_paid: number;
  balance: number;
  payment_status: 'paid' | 'in_progress' | 'unpaid';
  academic_year: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  student?: Student;
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'check' | 'transfer' | 'mobile_money';
  receipt_number: string | null;
  received_by: string | null;
  created_at?: string;
  student?: Student;
}

export type ViewKey =
  | 'dashboard'
  | 'students'
  | 'staff'
  | 'finance'
  | 'grades'
  | 'absences'
  | 'documents';
