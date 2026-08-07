export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateLong(date: string | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getPaymentStatusInfo(status: 'paid' | 'in_progress' | 'unpaid') {
  switch (status) {
    case 'paid':
      return { label: 'Soldé', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
    case 'in_progress':
      return { label: 'En cours', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' };
    case 'unpaid':
      return { label: 'Non payé', color: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' };
  }
}

export function getRoleInfo(role: 'admin' | 'secretary' | 'teacher') {
  switch (role) {
    case 'admin':
      return { label: 'Administrateur', color: 'bg-blue-100 text-blue-700' };
    case 'secretary':
      return { label: 'Secrétaire', color: 'bg-teal-100 text-teal-700' };
    case 'teacher':
      return { label: 'Professeur', color: 'bg-violet-100 text-violet-700' };
  }
}

export function getStaffStatusLabel(status: 'active' | 'inactive') {
  return status === 'active'
    ? { label: 'En service', color: 'bg-emerald-100 text-emerald-700' }
    : { label: 'Cessé', color: 'bg-gray-200 text-gray-600' };
}
