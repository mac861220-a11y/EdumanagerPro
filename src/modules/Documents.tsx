import { useEffect, useState } from 'react';
import {
  GraduationCap,
  UserCheck,
  UserX,
  Printer,
  Search,
  FileText,
  School,
  Upload,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Student, Staff, StaffHistory } from '@/types';
import { formatDate, formatDateLong } from '@/lib/format';

type DocType = 'school_certificate' | 'service_record' | 'cessation_certificate';

interface ActiveDoc {
  type: DocType;
  student?: Student | null;
  staff?: Staff | null;
  history?: StaffHistory[];
}

// Editable official header info — persisted in localStorage so the director
// can customize the establishment mentions once and see them on every document.
const HEADER_FIELDS = {
  republic: 'République de Côte d\'Ivoire',
  ministry: 'Ministère de l\'Éducation Nationale et de l\'Alphabétisation',
  region: 'Direction Régionale de l\'Éducation Nationale',
  schoolName: 'Collège & Lycée EduManager Pro',
  schoolAddress: 'Cocody, Abidjan — Côte d\'Ivoire',
  schoolPhone: 'Tél : +225 27 22 00 00 00',
  academicYear: 'Année académique 2024-2025',
  directorName: 'Jean-Marc Kouassi',
  city: 'Abidjan',
};

export function Documents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState<DocType>('school_certificate');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffHistory, setStaffHistory] = useState<StaffHistory[]>([]);

  // Simple state: null = no modal, object = show modal
  const [activeDoc, setActiveDoc] = useState<ActiveDoc | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, staffRes] = await Promise.all([
        supabase.from('students').select('*, class:classes(*, level:levels(*))').order('last_name'),
        supabase.from('staff').select('*, subject:subjects(*)').order('last_name'),
      ]);
      setStudents((studentsRes.data as Student[]) || []);
      setStaff((staffRes.data as Staff[]) || []);
    } catch (err) {
      console.error('Documents load error:', err);
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }

  async function selectStaff(s: Staff) {
    setSelectedStaff(s);
    try {
      const { data } = await supabase
        .from('staff_history')
        .select('*')
        .eq('staff_id', s.id)
        .order('start_date', { ascending: true });
      setStaffHistory(data || []);
    } catch (err) {
      console.error('Staff history load error:', err);
      setStaffHistory([]);
    }
  }

  function handleGenerate() {
    setActiveDoc({
      type: docType,
      student: selectedStudent,
      staff: selectedStaff,
      history: staffHistory,
    });
  }

  function handleClose() {
    setActiveDoc(null);
  }

  function handlePrint() {
    window.print();
  }

  const docTypes: { key: DocType; label: string; icon: typeof GraduationCap; color: string; desc: string }[] = [
    { key: 'school_certificate', label: 'Certificat de scolarité', icon: GraduationCap, color: 'teal', desc: "Atteste qu'un élève est régulièrement inscrit" },
    { key: 'service_record', label: 'PV de prise de service', icon: UserCheck, color: 'blue', desc: 'Procès-verbal de prise de service du personnel' },
    { key: 'cessation_certificate', label: 'Certificat de cessation', icon: UserX, color: 'amber', desc: 'Certificat de cessation de service' },
  ];

  const colorMap: Record<string, string> = {
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  const canGenerate =
    (docType === 'school_certificate' && selectedStudent) ||
    (docType !== 'school_certificate' && selectedStaff);

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

  const filteredStudents = students.filter(
    (s) => !search || `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredStaff = staff.filter(
    (s) => !search || `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents officiels</h1>
          <p className="mt-1 text-sm text-gray-500">Générez des documents officiels au format A4 prêts à imprimer</p>
        </div>

        {/* Document type selector */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {docTypes.map((dt) => {
            const Icon = dt.icon;
            const isActive = docType === dt.key;
            return (
              <button
                key={dt.key}
                onClick={() => {
                  setDocType(dt.key);
                  setSelectedStudent(null);
                  setSelectedStaff(null);
                  setStaffHistory([]);
                }}
                className={`card p-5 text-left transition-all ${isActive ? 'ring-2 ring-teal-500 border-teal-300' : 'hover:shadow-md'}`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${isActive ? 'bg-teal-600 text-white' : colorMap[dt.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className={`mt-3 text-sm font-semibold ${isActive ? 'text-teal-900' : 'text-gray-900'}`}>{dt.label}</h3>
                <p className="mt-1 text-xs text-gray-500">{dt.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Search and selection */}
        <div className="card p-5">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-10"
              placeholder={docType === 'school_certificate' ? 'Rechercher un élève...' : 'Rechercher un membre du personnel...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {docType === 'school_certificate' ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-gray-400">Aucun élève trouvé</p>
              ) : (
                filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      selectedStudent?.id === s.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${s.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                      {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{s.last_name} {s.first_name}</p>
                      <p className="text-xs text-gray-500">{s.class?.name || '—'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto">
              {filteredStaff.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-gray-400">Aucun personnel trouvé</p>
              ) : (
                filteredStaff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectStaff(s)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      selectedStaff?.id === s.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-white">
                      {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{s.last_name} {s.first_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{s.role === 'admin' ? 'Administrateur' : s.role === 'secretary' ? 'Secrétaire' : 'Professeur'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Generate button */}
        {canGenerate && (
          <div className="flex justify-center">
            <button className="btn-primary" onClick={handleGenerate}>
              <FileText className="h-4 w-4" />
              Générer l'aperçu du document
            </button>
          </div>
        )}
      </div>

      {/* Modal preview — shown only when activeDoc is not null */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto no-print">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative w-full max-w-4xl my-4 animate-slide-in">
            {/* Modal header */}
            <div className="flex items-center justify-between rounded-t-2xl bg-white px-6 py-4 shadow-lg border-b border-gray-200 no-print">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {activeDoc.type === 'school_certificate'
                    ? 'Certificat de scolarité'
                    : activeDoc.type === 'service_record'
                    ? 'Procès-verbal de prise de service'
                    : 'Certificat de cessation de service'}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">Aperçu du document au format A4</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-primary" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Imprimer / Exporter PDF
                </button>
                <button
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* A4 document preview */}
            <div className="rounded-b-2xl bg-gray-100 p-4 sm:p-8 shadow-lg">
              <div
                className="print-area mx-auto bg-white shadow-md"
                style={{ width: '210mm', minHeight: '297mm', padding: '20mm 15mm' }}
              >
                {activeDoc.type === 'school_certificate' && activeDoc.student && (
                  <SchoolCertificate student={activeDoc.student} />
                )}
                {activeDoc.type === 'service_record' && activeDoc.staff && (
                  <ServiceRecord staff={activeDoc.staff} history={activeDoc.history || []} />
                )}
                {activeDoc.type === 'cessation_certificate' && activeDoc.staff && (
                  <CessationCertificate staff={activeDoc.staff} history={activeDoc.history || []} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Official document header (shared by all three documents) ── */
function DocumentHeader() {
  return (
    <div className="border-b-2 border-gray-800 pb-4">
      <div className="flex items-start gap-4">
        {/* Logo placeholder — replace with real logo later */}
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 shrink-0">
          <School className="h-7 w-7 text-gray-400" />
          <span className="mt-1 text-[8px] font-medium uppercase tracking-wider text-gray-400">Logo</span>
        </div>

        {/* Official mentions */}
        <div className="flex-1 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">{HEADER_FIELDS.republic}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">{HEADER_FIELDS.ministry}</p>
          <p className="text-[10px] text-gray-600">{HEADER_FIELDS.region}</p>
          <div className="mx-auto mt-1 h-px w-3/4 bg-gray-300" />
          <p className="mt-1 text-base font-bold uppercase text-gray-900">{HEADER_FIELDS.schoolName}</p>
          <p className="text-[10px] text-gray-600">{HEADER_FIELDS.schoolAddress}</p>
          <p className="text-[10px] text-gray-600">{HEADER_FIELDS.schoolPhone}</p>
        </div>

        {/* Right spacer to balance the logo */}
        <div className="h-20 w-20 shrink-0" />
      </div>
    </div>
  );
}

/* ── School certificate ── */
function SchoolCertificate({ student }: { student: Student }) {
  return (
    <div className="flex h-full flex-col" style={{ fontFamily: 'Georgia, serif' }}>
      <DocumentHeader />

      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold uppercase text-gray-900" style={{ textDecoration: 'underline', textUnderlineOffset: '6px' }}>
          Certificat de Scolarité
        </h2>
      </div>

      <div className="mt-8 flex-1">
        <p className="text-sm leading-relaxed text-gray-800">
          Le soussigné, Directeur de {HEADER_FIELDS.schoolName}, certifie que :
        </p>

        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600 w-44">Numéro Matricule :</td>
                <td className="py-1.5 font-mono font-bold text-teal-700">{student.matricule || '—'}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Nom de l'élève :</td>
                <td className="py-1.5 text-gray-900">{student.last_name}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Prénom :</td>
                <td className="py-1.5 text-gray-900">{student.first_name}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Date de naissance :</td>
                <td className="py-1.5 text-gray-900">{formatDateLong(student.birth_date)} à {student.birth_place || '—'}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Sexe :</td>
                <td className="py-1.5 text-gray-900">{student.gender === 'F' ? 'Féminin' : 'Masculin'}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Classe :</td>
                <td className="py-1.5 text-gray-900">{student.class?.name || '—'}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Date d'inscription :</td>
                <td className="py-1.5 text-gray-900">{formatDate(student.enrollment_date)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-gray-800">
          est régulièrement inscrit(e) pour l'année académique <strong>{HEADER_FIELDS.academicYear}</strong> au sein de notre établissement.
        </p>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700">Informations du tuteur :</h3>
          <table className="mt-2 w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-semibold text-gray-600 w-44">Nom et prénom du tuteur :</td>
                <td className="py-1 text-gray-900">{student.tutor_last_name} {student.tutor_first_name}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold text-gray-600">Téléphone :</td>
                <td className="py-1 text-gray-900">{student.tutor_phone}</td>
              </tr>
              {student.tutor_relationship && (
                <tr>
                  <td className="py-1 font-semibold text-gray-600">Lien de parenté :</td>
                  <td className="py-1 text-gray-900">{student.tutor_relationship}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-gray-800">
          En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.
        </p>
      </div>

      <div className="mt-auto flex justify-end pt-12">
        <div className="text-center">
          <p className="text-sm text-gray-600">Fait à {HEADER_FIELDS.city}, le {formatDateLong(new Date().toISOString())}</p>
          <div className="mt-2 h-16 border-b border-gray-400 w-48 mx-auto" />
          <p className="mt-1 text-sm font-semibold text-gray-900">Le Directeur</p>
          <p className="text-xs text-gray-500">{HEADER_FIELDS.directorName}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Service record (PV de prise de service) ── */
function ServiceRecord({ staff, history }: { staff: Staff; history: StaffHistory[] }) {
  const firstPosition = history.length > 0 ? history[history.length - 1] : null;
  const currentPosition = history.find((h) => !h.end_date) || history[0];

  return (
    <div className="flex h-full flex-col" style={{ fontFamily: 'Georgia, serif' }}>
      <DocumentHeader />

      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold uppercase text-gray-900" style={{ textDecoration: 'underline', textUnderlineOffset: '6px' }}>
          Procès-Verbal de Prise de Service
        </h2>
      </div>

      <div className="mt-8 flex-1">
        <p className="text-sm leading-relaxed text-gray-800">
          L'année deux mille {new Date(staff.hire_date).getFullYear() - 2000}, le {formatDateLong(staff.hire_date)},
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-800">
          Nous, soussignés, Directeur de {HEADER_FIELDS.schoolName}, avons procédé à la prise de service de :
        </p>

        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600 w-44">Nom :</td>
                <td className="py-1.5 text-gray-900">{staff.last_name}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Prénom :</td>
                <td className="py-1.5 text-gray-900">{staff.first_name}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Fonction :</td>
                <td className="py-1.5 text-gray-900">
                  {currentPosition?.position || (staff.role === 'admin' ? 'Administrateur' : staff.role === 'secretary' ? 'Secrétaire' : 'Professeur')}
                  {staff.subject ? ` (${staff.subject.name})` : ''}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Date de prise de service :</td>
                <td className="py-1.5 text-gray-900">{formatDateLong(staff.hire_date)}</td>
              </tr>
              {staff.phone && (
                <tr>
                  <td className="py-1.5 font-semibold text-gray-600">Téléphone :</td>
                  <td className="py-1.5 text-gray-900">{staff.phone}</td>
                </tr>
              )}
              {staff.email && (
                <tr>
                  <td className="py-1.5 font-semibold text-gray-600">Email :</td>
                  <td className="py-1.5 text-gray-900">{staff.email}</td>
                </tr>
              )}
              {staff.address && (
                <tr>
                  <td className="py-1.5 font-semibold text-gray-600">Adresse :</td>
                  <td className="py-1.5 text-gray-900">{staff.address}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-gray-800">
          {firstPosition && firstPosition.notes ? firstPosition.notes + '. ' : ''}
          En foi de quoi, le présent procès-verbal est dressé pour servir et valoir ce que de droit.
        </p>

        {history.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-700">Historique de carrière :</h3>
            <table className="mt-3 w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">Fonction</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">Début</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">Fin</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="border-b border-gray-100 px-3 py-2 text-gray-900">{h.position}</td>
                    <td className="border-b border-gray-100 px-3 py-2 text-gray-600">{formatDate(h.start_date)}</td>
                    <td className="border-b border-gray-100 px-3 py-2 text-gray-600">{h.end_date ? formatDate(h.end_date) : 'En cours'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-auto flex justify-between pt-12">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">L'intéressé(e)</p>
          <div className="mt-2 h-16 border-b border-gray-400 w-40" />
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Fait à {HEADER_FIELDS.city}, le {formatDateLong(new Date().toISOString())}</p>
          <div className="mt-2 h-16 border-b border-gray-400 w-40 mx-auto" />
          <p className="mt-1 text-sm font-semibold text-gray-900">Le Directeur</p>
          <p className="text-xs text-gray-500">{HEADER_FIELDS.directorName}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Cessation certificate ── */
function CessationCertificate({ staff, history }: { staff: Staff; history: StaffHistory[] }) {
  const cessationDate = history.find((h) => h.end_date)?.end_date || null;
  const lastPosition = history.find((h) => h.end_date) || history[history.length - 1] || null;

  return (
    <div className="flex h-full flex-col" style={{ fontFamily: 'Georgia, serif' }}>
      <DocumentHeader />

      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold uppercase text-gray-900" style={{ textDecoration: 'underline', textUnderlineOffset: '6px' }}>
          Certificat de Cessation de Service
        </h2>
      </div>

      <div className="mt-8 flex-1">
        <p className="text-sm leading-relaxed text-gray-800">
          Le soussigné, Directeur de {HEADER_FIELDS.schoolName}, certifie par la présente que :
        </p>

        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600 w-44">Nom :</td>
                <td className="py-1.5 text-gray-900">{staff.last_name}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Prénom :</td>
                <td className="py-1.5 text-gray-900">{staff.first_name}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Dernière fonction occupée :</td>
                <td className="py-1.5 text-gray-900">
                  {lastPosition?.position || (staff.role === 'admin' ? 'Administrateur' : staff.role === 'secretary' ? 'Secrétaire' : 'Professeur')}
                  {staff.subject ? ` (${staff.subject.name})` : ''}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Date de prise de service :</td>
                <td className="py-1.5 text-gray-900">{formatDate(staff.hire_date)}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold text-gray-600">Date de cessation :</td>
                <td className="py-1.5 text-gray-900">{cessationDate ? formatDateLong(cessationDate) : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-gray-800">
          a cessé ses fonctions au sein de notre établissement {cessationDate ? `en date du ${formatDate(cessationDate)}` : 'à ce jour'}.
        </p>

        {lastPosition?.notes && (
          <p className="mt-3 text-sm leading-relaxed text-gray-800">
            Motif : {lastPosition.notes}.
          </p>
        )}

        <p className="mt-6 text-sm leading-relaxed text-gray-800">
          Le présent certificat lui est délivré pour servir et valoir ce que de droit.
        </p>
      </div>

      <div className="mt-auto flex justify-end pt-12">
        <div className="text-center">
          <p className="text-sm text-gray-600">Fait à {HEADER_FIELDS.city}, le {formatDateLong(new Date().toISOString())}</p>
          <div className="mt-2 h-16 border-b border-gray-400 w-48 mx-auto" />
          <p className="mt-1 text-sm font-semibold text-gray-900">Le Directeur</p>
          <p className="text-xs text-gray-500">{HEADER_FIELDS.directorName}</p>
        </div>
      </div>
    </div>
  );
}
