import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  GraduationCap,
  Phone,
  MapPin,
  Calendar,
  User,
  Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Student, SchoolClass, Level } from '@/types';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate, calculateAge, getInitials } from '@/lib/format';

export function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
    const [studentsRes, classesRes, levelsRes] = await Promise.all([
      supabase.from('students').select('*, class:classes(*, level:levels(*))').order('last_name'),
      supabase.from('classes').select('*, level:levels(*)').order('name'),
      supabase.from('levels').select('*').order('order_index'),
    ]);
    setStudents((studentsRes.data as Student[]) || []);
    setClasses((classesRes.data as SchoolClass[]) || []);
    setLevels(levelsRes.data || []);
    } catch (err) {
      console.error('Students load error:', err);
      setError('Impossible de charger les données des élèves.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !search ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        s.tutor_last_name.toLowerCase().includes(search.toLowerCase()) ||
        s.tutor_phone.includes(search);
      const matchClass = classFilter === 'all' || s.class_id === classFilter;
      return matchSearch && matchClass;
    });
  }, [students, search, classFilter]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setModalOpen(true);
  }

  async function handleSave(data: Partial<Student>) {
    if (editing) {
      await supabase.from('students').update(data).eq('id', editing.id);
    } else {
      await supabase.from('students').insert(data);
    }
    setModalOpen(false);
    loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('students').delete().eq('id', deleteTarget.id);
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
          <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} élève{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nouvel élève
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Rechercher par nom, tuteur ou téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            className="select min-w-[160px]"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="all">Toutes les classes</option>
            {levels.map((l) => (
              <optgroup key={l.id} label={l.name}>
                {classes
                  .filter((c) => c.level_id === l.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Élève</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Matricule</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Classe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Naissance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tuteur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone tuteur</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                    Aucun élève trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${s.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                          {getInitials(s.first_name, s.last_name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.last_name} {s.first_name}</p>
                          <p className="text-xs text-gray-500">{s.gender === 'F' ? 'Fille' : 'Garçon'} · {calculateAge(s.birth_date)} ans</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-gray-700">{s.matricule || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-teal-50 text-teal-700">{s.class?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(s.birth_date)}
                      {s.birth_place && <span className="block text-xs text-gray-400">{s.birth_place}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.tutor_last_name} {s.tutor_first_name}
                      {s.tutor_relationship && <span className="block text-xs text-gray-400">{s.tutor_relationship}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.tutor_phone}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <StudentForm
          student={editing}
          classes={classes}
          levels={levels}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'élève"
        message={`Voulez-vous vraiment supprimer ${deleteTarget?.first_name} ${deleteTarget?.last_name} ? Cette action supprimera aussi ses notes, absences et paiements associés.`}
        confirmLabel="Supprimer"
      />
    </div>
  );
}

function StudentForm({
  student,
  classes,
  levels,
  onClose,
  onSave,
}: {
  student: Student | null;
  classes: SchoolClass[];
  levels: Level[];
  onClose: () => void;
  onSave: (data: Partial<Student>) => void;
}) {
  const [form, setForm] = useState({
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    matricule: student?.matricule || '',
    birth_date: student?.birth_date || '',
    birth_place: student?.birth_place || '',
    gender: student?.gender || 'M',
    class_id: student?.class_id || '',
    enrollment_date: student?.enrollment_date || new Date().toISOString().slice(0, 10),
    status: student?.status || 'active',
    tutor_first_name: student?.tutor_first_name || '',
    tutor_last_name: student?.tutor_last_name || '',
    tutor_phone: student?.tutor_phone || '',
    tutor_email: student?.tutor_email || '',
    tutor_relationship: student?.tutor_relationship || '',
    address: student?.address || '',
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      gender: form.gender as 'M' | 'F',
      class_id: form.class_id || null,
      matricule: form.matricule.trim() || null,
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={student ? 'Modifier l\'élève' : 'Nouvel élève'}
      subtitle="Informations de l'élève et du tuteur"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Student info */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-900">Informations de l'élève</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nom" required>
              <input className="input" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} required />
            </Field>
            <Field label="Prénom" required>
              <input className="input" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} required />
            </Field>
            <Field label="Numéro Matricule" hint="Auto-généré si vide">
              <input className="input font-mono" placeholder="MAT-2026-XXXX" value={form.matricule} onChange={(e) => update('matricule', e.target.value)} />
            </Field>
            <Field label="Sexe">
              <select className="select" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                <option value="M">Garçon</option>
                <option value="F">Fille</option>
              </select>
            </Field>
            <Field label="Date de naissance" required>
              <input type="date" className="input" value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} required />
            </Field>
            <Field label="Lieu de naissance">
              <input className="input" value={form.birth_place} onChange={(e) => update('birth_place', e.target.value)} />
            </Field>
            <Field label="Classe">
              <select className="select" value={form.class_id} onChange={(e) => update('class_id', e.target.value)}>
                <option value="">— Non assigné —</option>
                {levels.map((l) => (
                  <optgroup key={l.id} label={l.name}>
                    {classes.filter((c) => c.level_id === l.id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Date d'inscription">
              <input type="date" className="input" value={form.enrollment_date} onChange={(e) => update('enrollment_date', e.target.value)} />
            </Field>
            <Field label="Statut">
              <select className="select" value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="transferred">Transféré</option>
              </select>
            </Field>
            <Field label="Adresse">
              <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Tutor info */}
        <div className="border-t border-gray-100 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-900">Informations du tuteur</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nom du tuteur" required>
              <input className="input" value={form.tutor_last_name} onChange={(e) => update('tutor_last_name', e.target.value)} required />
            </Field>
            <Field label="Prénom du tuteur" required>
              <input className="input" value={form.tutor_first_name} onChange={(e) => update('tutor_first_name', e.target.value)} required />
            </Field>
            <Field label="Téléphone du tuteur" required>
              <input className="input" value={form.tutor_phone} onChange={(e) => update('tutor_phone', e.target.value)} required />
            </Field>
            <Field label="Email du tuteur">
              <input type="email" className="input" value={form.tutor_email} onChange={(e) => update('tutor_email', e.target.value)} />
            </Field>
            <Field label="Lien de parenté">
              <input className="input" placeholder="Père, Mère, Tuteur..." value={form.tutor_relationship} onChange={(e) => update('tutor_relationship', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-primary">
            {student ? 'Enregistrer' : 'Créer l\'élève'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label} {required && <span className="text-rose-500">*</span>}
        {hint && <span className="ml-1 font-normal text-gray-400">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
