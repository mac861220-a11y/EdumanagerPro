import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Trash2,
  ClipboardList,
  Filter,
  TrendingUp,
  Award,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Grade, Student, SchoolClass, Subject, Staff } from '@/types';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function Grades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('1');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Grade | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
    const [gradesRes, studentsRes, classesRes, subjectsRes, staffRes] = await Promise.all([
      supabase.from('grades').select('*, subject:subjects(*), student:students(*), teacher:staff(*)').order('created_at', { ascending: false }),
      supabase.from('students').select('*, class:classes(*)').order('last_name'),
      supabase.from('classes').select('*').order('name'),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('staff').select('*').eq('role', 'teacher').order('last_name'),
    ]);
    setGrades((gradesRes.data as Grade[]) || []);
    setStudents((studentsRes.data as Student[]) || []);
    setClasses(classesRes.data || []);
    setSubjects(subjectsRes.data || []);
    setStaff((staffRes.data as Staff[]) || []);
    } catch (err) {
      console.error('Grades load error:', err);
      setError('Impossible de charger les notes.');
    } finally {
      setLoading(false);
    }
  }

  // Compute weighted averages per student for the filtered term
  const studentAverages = useMemo(() => {
    const termGrades = grades.filter((g) => String(g.term) === termFilter);
    const byStudent = new Map<string, { student: Student; grades: Grade[] }>();

    termGrades.forEach((g) => {
      if (!g.student) return;
      const key = g.student_id;
      if (!byStudent.has(key)) {
        byStudent.set(key, { student: g.student, grades: [] });
      }
      byStudent.get(key)!.grades.push(g);
    });

    const results = Array.from(byStudent.values()).map(({ student, grades: studentGrades }) => {
      let totalPoints = 0;
      let totalCoeff = 0;
      const subjectAverages = new Map<string, { name: string; coefficient: number; average: number }>();

      studentGrades.forEach((g) => {
        const coeff = g.subject?.coefficient || 1;
        totalPoints += Number(g.score) * coeff;
        totalCoeff += coeff;

        const subjKey = g.subject_id;
        if (!subjectAverages.has(subjKey)) {
          subjectAverages.set(subjKey, { name: g.subject?.name || '', coefficient: coeff, average: 0 });
        }
        const sa = subjectAverages.get(subjKey)!;
        sa.average = (sa.average + Number(g.score)) / (sa.average > 0 ? 2 : 1);
      });

      const generalAverage = totalCoeff > 0 ? totalPoints / totalCoeff : 0;
      return {
        student,
        generalAverage: Math.round(generalAverage * 100) / 100,
        subjectAverages: Array.from(subjectAverages.values()).sort((a, b) => b.coefficient - a.coefficient),
      };
    });

    return results.sort((a, b) => b.generalAverage - a.generalAverage);
  }, [grades, termFilter]);

  const filteredGrades = useMemo(() => {
    return grades.filter((g) => {
      const matchSearch = !search || (g.student && `${g.student.first_name} ${g.student.last_name}`.toLowerCase().includes(search.toLowerCase()));
      const matchClass = classFilter === 'all' || g.class_id === classFilter;
      const matchTerm = String(g.term) === termFilter;
      return matchSearch && matchClass && matchTerm;
    });
  }, [grades, search, classFilter, termFilter]);

  async function handleSave(data: Partial<Grade>) {
    await supabase.from('grades').insert(data);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('grades').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadData();
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-rose-600">{error}</p>
          <button className="btn-secondary mt-4" onClick={() => loadData()}>Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes & Moyennes</h1>
          <p className="mt-1 text-sm text-gray-500">Saisie des notes et calcul automatique des moyennes pondérées par coefficient</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Saisir une note
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Rechercher un élève..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select min-w-[160px]" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="all">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="select min-w-[140px]" value={termFilter} onChange={(e) => setTermFilter(e.target.value)}>
          <option value="1">1er Trimestre</option>
          <option value="2">2ème Trimestre</option>
          <option value="3">3ème Trimestre</option>
        </select>
      </div>

      {/* Ranking / averages */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Classement (Trimestre {termFilter})</h3>
          </div>
          <p className="mt-1 text-xs text-gray-500">Moyennes pondérées générales</p>
          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {studentAverages.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Aucune note pour ce trimestre</p>
            ) : (
              studentAverages.slice(0, 15).map((r, idx) => (
                <div key={r.student.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{r.student.last_name} {r.student.first_name}</p>
                    <p className="text-xs text-gray-500">{r.student.class?.name || '—'}</p>
                  </div>
                  <span className={`text-sm font-bold ${r.generalAverage >= 10 ? 'text-teal-700' : 'text-rose-600'}`}>
                    {r.generalAverage.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grades table */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-gray-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notes saisies — Trimestre {termFilter}</h3>
          </div>
          <div className="overflow-x-auto max-h-[450px]">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Élève</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Matière</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Coef.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGrades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                      Aucune note trouvée
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {g.student ? `${g.student.last_name} ${g.student.first_name}` : '—'}
                        <span className="block text-xs text-gray-500">{g.student?.class?.name || ''}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{g.subject?.name || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge bg-gray-100 text-gray-600">{g.subject?.coefficient || 1}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${Number(g.score) >= 10 ? 'text-teal-700' : 'text-rose-600'}`}>
                          {Number(g.score).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400">/20</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 capitalize">{g.grade_type}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(g)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <GradeForm
          students={students}
          classes={classes}
          subjects={subjects}
          staff={staff}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la note"
        message="Voulez-vous vraiment supprimer cette note ?"
        confirmLabel="Supprimer"
      />
    </div>
  );
}

function GradeForm({
  students,
  classes,
  subjects,
  staff,
  onClose,
  onSave,
}: {
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  staff: Staff[];
  onClose: () => void;
  onSave: (data: Partial<Grade>) => void;
}) {
  const [form, setForm] = useState({
    student_id: '',
    subject_id: '',
    class_id: '',
    teacher_id: '',
    term: '1',
    grade_type: 'composition',
    score: '',
  });

  const selectedStudent = students.find((s) => s.id === form.student_id);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      student_id: form.student_id,
      subject_id: form.subject_id,
      class_id: selectedStudent?.class_id || form.class_id || null,
      teacher_id: form.teacher_id || null,
      term: parseInt(form.term) as 1 | 2 | 3,
      grade_type: form.grade_type as Grade['grade_type'],
      score: parseFloat(form.score),
      max_score: 20,
    });
  }

  return (
    <Modal open onClose={onClose} title="Saisir une note" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Élève *</label>
          <select className="select" value={form.student_id} onChange={(e) => update('student_id', e.target.value)} required>
            <option value="">— Sélectionner —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.last_name} {s.first_name} ({s.class?.name || '—'})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Matière *</label>
          <select className="select" value={form.subject_id} onChange={(e) => update('subject_id', e.target.value)} required>
            <option value="">— Sélectionner —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} (Coef. {s.coefficient})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Trimestre *</label>
            <select className="select" value={form.term} onChange={(e) => update('term', e.target.value)}>
              <option value="1">1er Trimestre</option>
              <option value="2">2ème Trimestre</option>
              <option value="3">3ème Trimestre</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Type d'évaluation</label>
            <select className="select" value={form.grade_type} onChange={(e) => update('grade_type', e.target.value)}>
              <option value="composition">Composition</option>
              <option value="devoir">Devoir</option>
              <option value="interrogation">Interrogation</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Professeur</label>
          <select className="select" value={form.teacher_id} onChange={(e) => update('teacher_id', e.target.value)}>
            <option value="">— Aucun —</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Note (sur 20) *</label>
          <input
            type="number"
            className="input"
            value={form.score}
            onChange={(e) => update('score', e.target.value)}
            min="0"
            max="20"
            step="0.25"
            required
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-primary">Enregistrer la note</button>
        </div>
      </form>
    </Modal>
  );
}
