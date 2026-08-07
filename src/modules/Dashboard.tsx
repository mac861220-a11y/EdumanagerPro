import { useEffect, useState } from 'react';
import {
  GraduationCap,
  Users,
  Wallet,
  ClipboardList,
  TrendingUp,
  CalendarX,
  ArrowUpRight,
  ArrowDownRight,
  School,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, getPaymentStatusInfo } from '@/lib/format';

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalCollected: number;
  totalOutstanding: number;
  paidCount: number;
  inProgressCount: number;
  unpaidCount: number;
  totalGrades: number;
  totalAbsences: number;
  recentPayments: Array<{
    id: string;
    amount: number;
    payment_date: string;
    receipt_number: string | null;
    student?: { first_name: string; last_name: string };
  }>;
  classDistribution: Array<{ class_name: string; count: number }>;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
    const [students, staff, payments, grades, absences, recentTxns, classCounts] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('staff').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('amount_paid, balance, payment_status'),
      supabase.from('grades').select('id', { count: 'exact', head: true }),
      supabase.from('absences').select('id', { count: 'exact', head: true }),
      supabase
        .from('payment_transactions')
        .select('id, amount, payment_date, receipt_number, student:students(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('students')
        .select('class:classes(name)')
        .not('class_id', 'is', null),
    ]);

    const paymentData = payments.data || [];
    const totalCollected = paymentData.reduce((sum, p) => sum + Number(p.amount_paid), 0);
    const totalOutstanding = paymentData.reduce((sum, p) => sum + Number(p.balance), 0);
    const paidCount = paymentData.filter((p) => p.payment_status === 'paid').length;
    const inProgressCount = paymentData.filter((p) => p.payment_status === 'in_progress').length;
    const unpaidCount = paymentData.filter((p) => p.payment_status === 'unpaid').length;

    const classData = (classCounts.data || []) as Array<{ class: { name: string } | null }>;
    const classMap = new Map<string, number>();
    classData.forEach((s) => {
      const name = s.class?.name || 'Non assigné';
      classMap.set(name, (classMap.get(name) || 0) + 1);
    });
    const classDistribution = Array.from(classMap.entries())
      .map(([class_name, count]) => ({ class_name, count }))
      .sort((a, b) => a.class_name.localeCompare(b.class_name));

    setStats({
      totalStudents: students.count || 0,
      totalStaff: staff.count || 0,
      totalCollected,
      totalOutstanding,
      paidCount,
      inProgressCount,
      unpaidCount,
      totalGrades: grades.count || 0,
      totalAbsences: absences.count || 0,
      recentPayments: recentTxns.data || [],
      classDistribution,
    });
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Impossible de charger les données. Vérifiez la connexion.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-rose-600">{error || 'Aucune donnée disponible'}</p>
          <button className="btn-secondary mt-4" onClick={() => loadStats()}>Réessayer</button>
        </div>
      </div>
    );
  }

  const maxClassCount = Math.max(...stats!.classDistribution.map((c) => c.count), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d'ensemble de l'établissement — Année académique 2024-2025
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Élèves inscrits"
          value={stats!.totalStudents.toString()}
          icon={GraduationCap}
          color="teal"
          trend="+3 ce mois"
          trendUp
        />
        <StatCard
          label="Personnels actifs"
          value={stats!.totalStaff.toString()}
          icon={Users}
          color="blue"
          trend="7 en service"
        />
        <StatCard
          label="Frais CGDES encaissés"
          value={formatCurrency(stats!.totalCollected)}
          icon={Wallet}
          color="emerald"
          trend={`${stats!.paidCount} soldés`}
          trendUp
        />
        <StatCard
          label="Reste à recouvrer"
          value={formatCurrency(stats!.totalOutstanding)}
          icon={TrendingUp}
          color="amber"
          trend={`${stats!.unpaidCount} non payés`}
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Payment status breakdown */}
        <div className="card p-6 lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-900">Statut des paiements CGDES</h3>
          <p className="mt-1 text-xs text-gray-500">Répartition par statut</p>
          <div className="mt-5 space-y-4">
            <PaymentStatusRow
              label="Soldé"
              count={stats!.paidCount}
              total={stats!.totalStudents}
              color="bg-emerald-500"
            />
            <PaymentStatusRow
              label="En cours"
              count={stats!.inProgressCount}
              total={stats!.totalStudents}
              color="bg-amber-500"
            />
            <PaymentStatusRow
              label="Non payé"
              count={stats!.unpaidCount}
              total={stats!.totalStudents}
              color="bg-rose-500"
            />
          </div>
        </div>

        {/* Class distribution */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900">Effectifs par classe</h3>
          <p className="mt-1 text-xs text-gray-500">Nombre d'élèves inscrits</p>
          <div className="mt-5 space-y-2.5">
            {stats!.classDistribution.map((c) => (
              <div key={c.class_name} className="flex items-center gap-3">
                <span className="w-20 text-xs font-medium text-gray-600">{c.class_name}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-7 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-500"
                    style={{ width: `${(c.count / maxClassCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-semibold text-gray-900">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent payments + quick stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Derniers paiements encaissés</h3>
              <p className="mt-1 text-xs text-gray-500">Transactions récentes</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs font-medium text-gray-500">Élève</th>
                  <th className="pb-2 text-left text-xs font-medium text-gray-500">Reçu</th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-500">Montant</th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats!.recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-gray-400">
                      Aucun paiement enregistré
                    </td>
                  </tr>
                ) : (
                  stats!.recentPayments.map((txn) => (
                    <tr key={txn.id} className="group">
                      <td className="py-3 text-sm font-medium text-gray-900">
                        {txn.student ? `${txn.student.first_name} ${txn.student.last_name}` : '—'}
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {txn.receipt_number || '—'}
                      </td>
                      <td className="py-3 text-right text-sm font-semibold text-teal-700">
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="py-3 text-right text-sm text-gray-500">
                        {new Date(txn.payment_date).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900">Activité pédagogique</h3>
          <p className="mt-1 text-xs text-gray-500">Notes et absences</p>
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-4 rounded-lg bg-teal-50 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-100">
                <ClipboardList className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats!.totalGrades}</p>
                <p className="text-xs text-gray-500">Notes saisies (T1)</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg bg-rose-50 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-100">
                <CalendarX className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats!.totalAbsences}</p>
                <p className="text-xs text-gray-500">Absences enregistrées</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg bg-blue-50 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100">
                <School className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">14</p>
                <p className="text-xs text-gray-500">Classes actives</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  trendUp,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: 'teal' | 'blue' | 'emerald' | 'amber';
  trend?: string;
  trendUp?: boolean;
}) {
  const colorMap = {
    teal: 'bg-teal-100 text-teal-700',
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendUp === false ? 'text-rose-600' : 'text-emerald-600'}`}>
            {trendUp === false ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            {trend}
          </div>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-500">{label}</p>
    </div>
  );
}

function PaymentStatusRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{count} ({pct}%)</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
