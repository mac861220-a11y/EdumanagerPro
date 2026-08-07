import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  History,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Staff, StaffHistory, Subject } from '@/types';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate, getRoleInfo, getStaffStatusLabel, getInitials } from '@/lib/format';

export function StaffModule() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Staff | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
    const [staffRes, subjectsRes] = await Promise.all([
      supabase.from('staff').select('*, subject:subjects(*)').order('last_name'),
      supabase.from('subjects').select('*').order('name'),
    ]);
    setStaff((staffRes.data as Staff[]) || []);
    setSubjects(subjectsRes.data || []);
    } catch (err) {
      console.error('Staff load error:', err);
      setError('Impossible de charger les données du personnel.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      const matchSearch =
        !search ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || s.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [staff, search, roleFilter]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(s: Staff) {
    setEditing(s);
    setModalOpen(true);
  }

  async function handleSave(data: Partial<Staff>) {
    if (editing) {
      await supabase.from('staff').update(data).eq('id', editing.id);
    } else {
      await supabase.from('staff').insert(data);
    }
    setModalOpen(false);
    loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('staff').delete().eq('id', deleteTarget.id);
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
          <h1 className="text-2xl font-bold text-gray-900">Personnels</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} membre{filtered.length > 1 ? 's' : ''} du personnel
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nouveau personnel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select min-w-[160px]" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">Tous les rôles</option>
          <option value="admin">Administrateurs</option>
          <option value="secretary">Secrétaires</option>
          <option value="teacher">Professeurs</option>
        </select>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-sm text-gray-400">
            Aucun personnel trouvé
          </div>
        ) : (
          filtered.map((s) => {
            const roleInfo = getRoleInfo(s.role);
            const statusInfo = getStaffStatusLabel(s.status);
            return (
              <div key={s.id} className="card p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-sm font-semibold text-white">
                      {getInitials(s.first_name, s.last_name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.last_name} {s.first_name}</p>
                      <span className={`badge mt-0.5 ${roleInfo.color}`}>{roleInfo.label}</span>
                    </div>
                  </div>
                  <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  {s.subject && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span>{s.subject.name}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Prise de service: {formatDate(s.hire_date)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <button
                    onClick={() => setHistoryTarget(s)}
                    className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
                  >
                    <History className="h-3.5 w-3.5" />
                    Historique de carrière
                  </button>
                  <div className="flex items-center gap-1">
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
                </div>
              </div>
            );
          })
        )}
      </div>

      {modalOpen && (
        <StaffForm
          staff={editing}
          subjects={subjects}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {historyTarget && (
        <StaffHistoryModal staff={historyTarget} onClose={() => setHistoryTarget(null)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le personnel"
        message={`Voulez-vous vraiment supprimer ${deleteTarget?.first_name} ${deleteTarget?.last_name} ?`}
        confirmLabel="Supprimer"
      />
    </div>
  );
}

function StaffForm({
  staff,
  subjects,
  onClose,
  onSave,
}: {
  staff: Staff | null;
  subjects: Subject[];
  onClose: () => void;
  onSave: (data: Partial<Staff>) => void;
}) {
  const [form, setForm] = useState({
    first_name: staff?.first_name || '',
    last_name: staff?.last_name || '',
    role: staff?.role || 'teacher',
    phone: staff?.phone || '',
    email: staff?.email || '',
    address: staff?.address || '',
    hire_date: staff?.hire_date || new Date().toISOString().slice(0, 10),
    status: staff?.status || 'active',
    subject_id: staff?.subject_id || '',
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      role: form.role as Staff['role'],
      status: form.status as Staff['status'],
      subject_id: form.subject_id || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={staff ? 'Modifier le personnel' : 'Nouveau personnel'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nom *</label>
            <input className="input" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Prénom *</label>
            <input className="input" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Rôle *</label>
            <select className="select" value={form.role} onChange={(e) => update('role', e.target.value)}>
              <option value="admin">Administrateur</option>
              <option value="secretary">Secrétaire</option>
              <option value="teacher">Professeur</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Statut</label>
            <select className="select" value={form.status} onChange={(e) => update('status', e.target.value)}>
              <option value="active">En service</option>
              <option value="inactive">Cessé</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Date de prise de service *</label>
            <input type="date" className="input" value={form.hire_date} onChange={(e) => update('hire_date', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Matière enseignée</label>
            <select className="select" value={form.subject_id} onChange={(e) => update('subject_id', e.target.value)}>
              <option value="">— Aucune —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Téléphone</label>
            <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">Adresse</label>
            <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-primary">
            {staff ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function StaffHistoryModal({ staff, onClose }: { staff: Staff; onClose: () => void }) {
  const [history, setHistory] = useState<StaffHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('staff_history')
          .select('*')
          .eq('staff_id', staff.id)
          .order('start_date', { ascending: false });
        if (!cancelled) setHistory(data || []);
      } catch (err) {
        console.error('Staff history load error:', err);
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [staff.id]);

  return (
    <Modal
      open
      onClose={onClose}
      title="Historique de carrière"
      subtitle={`${staff.first_name} ${staff.last_name}`}
      size="lg"
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
        </div>
      ) : history.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Aucun historique enregistré</p>
      ) : (
        <div className="relative space-y-5 pl-6">
          <div className="absolute left-[7px] top-2 h-full w-px bg-gray-200" />
          {history.map((h, idx) => (
            <div key={h.id} className="relative">
              <div className={`absolute -left-[22px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${idx === 0 ? 'bg-teal-500' : 'bg-gray-300'}`} />
              <div className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{h.position}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatDate(h.start_date)} — {h.end_date ? formatDate(h.end_date) : 'En cours'}
                    </p>
                  </div>
                  {!h.end_date && (
                    <span className="badge bg-emerald-100 text-emerald-700">Actuel</span>
                  )}
                </div>
                {h.notes && <p className="mt-2 text-sm text-gray-600">{h.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
