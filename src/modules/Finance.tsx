import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Wallet,
  Printer,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Payment, Student, SchoolClass, Level, PaymentTransaction } from '@/types';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatDate, formatDateLong, getPaymentStatusInfo, getInitials } from '@/lib/format';

export function Finance() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payModal, setPayModal] = useState<Payment | null>(null);
  const [receiptTxn, setReceiptTxn] = useState<PaymentTransaction | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
    const [paymentsRes, classesRes, levelsRes] = await Promise.all([
      supabase.from('payments').select('*, student:students(*, class:classes(*))').order('created_at', { ascending: false }),
      supabase.from('classes').select('*, level:levels(*)').order('name'),
      supabase.from('levels').select('*').order('order_index'),
    ]);
    setPayments((paymentsRes.data as Payment[]) || []);
    setClasses((classesRes.data as SchoolClass[]) || []);
    setLevels(levelsRes.data || []);
    } catch (err) {
      console.error('Finance load error:', err);
      setError('Impossible de charger les données de paiement.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const student = p.student;
      const matchSearch =
        !search ||
        (student && `${student.first_name} ${student.last_name}`.toLowerCase().includes(search.toLowerCase())) ||
        (student && student.tutor_last_name.toLowerCase().includes(search.toLowerCase()));
      const matchClass = classFilter === 'all' || (student && student.class_id === classFilter);
      const matchStatus = statusFilter === 'all' || p.payment_status === statusFilter;
      return matchSearch && matchClass && matchStatus;
    });
  }, [payments, search, classFilter, statusFilter]);

  const totals = useMemo(() => {
    const totalDue = filtered.reduce((s, p) => s + Number(p.total_due), 0);
    const totalPaid = filtered.reduce((s, p) => s + Number(p.amount_paid), 0);
    const totalBalance = filtered.reduce((s, p) => s + Number(p.balance), 0);
    return { totalDue, totalPaid, totalBalance };
  }, [filtered]);

  async function handlePayment(payment: Payment, amount: number, method: string, receivedBy: string) {
    const newAmountPaid = Number(payment.amount_paid) + amount;
    const newStatus = newAmountPaid >= Number(payment.total_due) ? 'paid' : 'in_progress';

    const receiptSeq = Date.now().toString().slice(-6);
    const receiptNumber = `REC-${receiptSeq}`;

    const { data: txn } = await supabase
      .from('payment_transactions')
      .insert({
        payment_id: payment.id,
        student_id: payment.student_id,
        amount,
        payment_method: method,
        receipt_number: receiptNumber,
        received_by: receivedBy,
      })
      .select('*, student:students(*)')
      .single();

    await supabase
      .from('payments')
      .update({
        amount_paid: newAmountPaid,
        payment_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    setPayModal(null);
    loadData();

    if (txn) {
      setReceiptTxn(txn as PaymentTransaction);
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finances — Frais CGDES</h1>
        <p className="mt-1 text-sm text-gray-500">Suivi des paiements des frais de scolarité — Année 2024-2025</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Wallet className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total dû</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totals.totalDue)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Encaissé</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totals.totalPaid)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Reste à recouvrer</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totals.totalBalance)}</p>
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
            placeholder="Rechercher par élève ou tuteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select min-w-[160px]" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="all">Toutes les classes</option>
          {levels.map((l) => (
            <optgroup key={l.id} label={l.name}>
              {classes.filter((c) => c.level_id === l.id).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <select className="select min-w-[140px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="paid">Soldé</option>
          <option value="in_progress">En cours</option>
          <option value="unpaid">Non payé</option>
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
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total dû</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Payé</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Reste</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                    Aucun paiement trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const statusInfo = getPaymentStatusInfo(p.payment_status);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${p.student?.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                            {p.student ? getInitials(p.student.first_name, p.student.last_name) : '—'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {p.student ? `${p.student.last_name} ${p.student.first_name}` : '—'}
                            </p>
                            <p className="text-xs text-gray-500">Tuteur: {p.student?.tutor_last_name} {p.student?.tutor_first_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-teal-50 text-teal-700">{p.student?.class?.name || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(Number(p.total_due))}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">{formatCurrency(Number(p.amount_paid))}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-amber-700">{formatCurrency(Number(p.balance))}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${statusInfo.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.payment_status !== 'paid' && (
                          <button
                            onClick={() => setPayModal(p)}
                            className="btn-primary text-xs px-3 py-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Enregistrer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {payModal && (
        <PaymentModal
          payment={payModal}
          onClose={() => setPayModal(null)}
          onSave={handlePayment}
        />
      )}

      {receiptTxn && (
        <ReceiptModal txn={receiptTxn} onClose={() => setReceiptTxn(null)} />
      )}
    </div>
  );
}

function PaymentModal({
  payment,
  onClose,
  onSave,
}: {
  payment: Payment;
  onClose: () => void;
  onSave: (payment: Payment, amount: number, method: string, receivedBy: string) => void;
}) {
  const balance = Number(payment.balance);
  const [amount, setAmount] = useState(balance.toString());
  const [method, setMethod] = useState('cash');
  const [receivedBy, setReceivedBy] = useState('Aminata Traoré');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    onSave(payment, amt, method, receivedBy);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Enregistrer un paiement"
      subtitle={`${payment.student?.last_name} ${payment.student?.first_name} — ${payment.student?.class?.name || ''}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total dû</span>
            <span className="font-medium text-gray-900">{formatCurrency(Number(payment.total_due))}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-gray-500">Déjà payé</span>
            <span className="font-medium text-emerald-700">{formatCurrency(Number(payment.amount_paid))}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm border-t border-gray-200 pt-1">
            <span className="text-gray-500">Reste à payer</span>
            <span className="font-bold text-amber-700">{formatCurrency(balance)}</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Montant du paiement (FCFA) *</label>
          <input
            type="number"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max={balance}
            required
          />
          <div className="mt-1.5 flex gap-2">
            <button type="button" className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200" onClick={() => setAmount(String(balance))}>
              Solder ({formatCurrency(balance)})
            </button>
            <button type="button" className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200" onClick={() => setAmount(String(Math.floor(balance / 2)))}>
              Moitié
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Mode de paiement</label>
          <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Espèces</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="transfer">Virement</option>
            <option value="check">Chèque</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Reçu par</label>
          <input className="input" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-primary">
            <Receipt className="h-4 w-4" />
            Enregistrer & Reçu
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReceiptModal({ txn, onClose }: { txn: PaymentTransaction; onClose: () => void }) {
  const student = txn.student;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl animate-slide-in">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 no-print">
            <h2 className="text-lg font-bold text-gray-900">Reçu de paiement</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto">
            <div className="print-area p-8">
              {/* Receipt content */}
              <div className="mx-auto max-w-sm">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700">
                    <Wallet className="h-7 w-7 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-gray-900">EduManager Pro</h1>
                  <p className="text-xs text-gray-500">Reçu de paiement CGDES</p>
                  <div className="mt-2 inline-block rounded-full bg-teal-50 px-3 py-0.5">
                    <p className="text-xs font-semibold text-teal-700">{txn.receipt_number}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-2 border-t border-b border-gray-200 py-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Élève</span>
                    <span className="font-medium text-gray-900">{student ? `${student.last_name} ${student.first_name}` : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Classe</span>
                    <span className="font-medium text-gray-900">{student?.class?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-gray-900">{formatDate(txn.payment_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mode</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {txn.payment_method === 'mobile_money' ? 'Mobile Money' : txn.payment_method === 'cash' ? 'Espèces' : txn.payment_method === 'transfer' ? 'Virement' : 'Chèque'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reçu par</span>
                    <span className="font-medium text-gray-900">{txn.received_by || '—'}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-teal-50 p-4 text-center">
                  <p className="text-xs text-teal-600">Montant payé</p>
                  <p className="mt-1 text-2xl font-bold text-teal-800">{formatCurrency(txn.amount)}</p>
                </div>

                <div className="mt-6 text-center">
                  <div className="mx-auto h-12 border-b border-gray-300 w-32" />
                  <p className="mt-1 text-xs text-gray-500">Signature & Cachet</p>
                </div>

                <p className="mt-6 text-center text-[10px] text-gray-400">
                  Ce reçu a été généré électroniquement le {formatDateLong(txn.payment_date)}.
                  EduManager Pro — Année académique 2024-2025.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 no-print">
            <button className="btn-secondary" onClick={onClose}>Fermer</button>
            <button className="btn-primary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
