import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Trash2,
  CalendarX,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Absence, Student, SchoolClass } from '@/types';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate } from '@/lib/format';

export function Absences() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [justifiedFilter, setJustifiedFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Absence | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
    const [absencesRes, studentsRes, classesRes] = await Promise.all([
      supabase.from('absences').select('*, student:students(*, class:classes(*))').order('date', { ascending: false }),
      supabase.from('students').select('*, class:classes(*)').order('last_name'),
      supabase.from('classes').select('*').order('name'),
    ]);
    setAbsences((absencesRes.data as Absence[]) || []);
    setStudents((studentsRes.data as Student[]) || []);
    setClasses(classesRes.data || []);
    } catch (err) {
      console.error('Absences load error:', err);
      setError('Impossible de charger les absences.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return absences.filter((a) => {
      const matchSearch = !search || (a.student && `${a.student.first_name} ${a.student.last_name}`.toLowerCase().includes(search.toLowerCase()));
      const matchClass = classFilter === 'all' || (a.student && a.student.class_id === classFilter);
      const matchJustified = justifiedFilter === 'all' || (justifiedFilter === 'justified' && a.justified) || (justifiedFilter === 'unjustified' && !a.justified);
      return matchSearch && matchClass && matchJustified;
    });
  }, [absences, search, classFilter, justifiedFilter]);

  async function handleSave(data: Partial<Absence>) {
    await supabase.from('absences').insert(data);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('absences').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadData();
  }

  async function toggleJustified(a: Absence) {
    await supabase.from('absences').update({ justified: !a.justified }).eq('id', a.id);
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

  const justifiedCount = filtered.filter((a) => a.justified).length;
  const unjustifiedCount = filtered.length - justifiedCount;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Absences</h1>
          <p className="mt-1 text-sm text-gray-500">Suivi des absences des élèves</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Signaler une absence
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100">
              <CalendarX className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total absences</p>
              <p className="text-lg font-bold text-gray-900">{filtered.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Justifiées</p>
              <p className="text-lg font-bold text-emerald-700">{justifiedCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <XCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Non justifiées</p>
              <p className="text-lg font-bold text-amber-700">{unjustifiedCount}</p>
            </div>
          </div>
        </div>
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
        <select className="select min-w-[140px]" value={justifiedFilter} onChange={(e) => setJustifiedFilter(e.target.value)}>
          <option value="all">Toutes</option>
          <option value="justified">Justifiées</option>
          <option value="unjustified">Non justifiées</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Élève</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Classe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Motif</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Justifiée</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    Aucune absence trouvée
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {a.student ? `${a.student.last_name} ${a.student.first_name}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-teal-50 text-teal-700">{a.student?.class?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(a.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.reason || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleJustified(a)}
                        className={`badge transition-colors ${a.justified ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                      >
                        {a.justified ? 'Justifiée' : 'Non justifiée'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteTarget(a)}
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

      {modalOpen && (
        <AbsenceForm
          students={students}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'absence"
        message="Voulez-vous vraiment supprimer cette absence ?"
        confirmLabel="Supprimer"
      />
    </div>
  );
}

function AbsenceForm({
  students,
  onClose,
  onSave,
}: {
  students: Student[];
  onClose: () => void;
  onSave: (data: Partial<Absence>) => void;
}) {
  const [form, setForm] = useState({
    student_id: '',
    date: new Date().toISOString().slice(0, 10),
    term: '1',
    reason: '',
    justified: false,
  });

  const selectedStudent = students.find((s) => s.id === form.student_id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      student_id: form.student_id,
      class_id: selectedStudent?.class_id || null,
      date: form.date,
      term: parseInt(form.term) as 1 | 2 | 3,
      reason: form.reason || null,
      justified: form.justified,
    });
  }

  return (
    <Modal open onClose={onClose} title="Signaler une absence" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Élève *</label>
          <select className="select" value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))} required>
            <option value="">— Sélectionner —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.last_name} {s.first_name} ({s.class?.name || '—'})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Date *</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Trimestre</label>
            <select className="select" value={form.term} onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}>
              <option value="1">1er Trimestre</option>
              <option value="2">2ème Trimestre</option>
              <option value="3">3ème Trimestre</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Motif</label>
          <input className="input" placeholder="Maladie, retard, etc." value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              checked={form.justified}
              onChange={(e) => setForm((f) => ({ ...f, justified: e.target.checked }))}
            />
            Absence justifiée
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}
