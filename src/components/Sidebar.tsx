import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Wallet,
  ClipboardList,
  CalendarX,
  FileText,
  GraduationCap as Logo,
  X,
} from 'lucide-react';
import type { ViewKey } from '@/types';

interface SidebarProps {
  current: ViewKey;
  onNavigate: (view: ViewKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems: { key: ViewKey; label: string; icon: React.ElementType; group: string }[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, group: 'Vue d\'ensemble' },
  { key: 'students', label: 'Élèves', icon: GraduationCap, group: 'Personnes' },
  { key: 'staff', label: 'Personnels', icon: Users, group: 'Personnes' },
  { key: 'finance', label: 'Finances (CGDES)', icon: Wallet, group: 'Gestion' },
  { key: 'grades', label: 'Notes & Moyennes', icon: ClipboardList, group: 'Pédagogie' },
  { key: 'absences', label: 'Absences', icon: CalendarX, group: 'Pédagogie' },
  { key: 'documents', label: 'Documents officiels', icon: FileText, group: 'Administratif' },
];

export function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  const groups = [...new Set(navItems.map((i) => i.group))];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-gray-900 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo header */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg">
              <Logo className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">EduManager</h1>
              <p className="text-xs font-medium text-teal-400">Pro</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {groups.map((group) => (
            <div key={group} className="mb-4">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {group}
              </p>
              {navItems
                .filter((i) => i.group === group)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = current === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onNavigate(item.key);
                        onCloseMobile();
                      }}
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 transition-transform ${
                          isActive ? '' : 'group-hover:scale-110'
                        }`}
                      />
                      {item.label}
                    </button>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-sm font-semibold text-white">
              JK
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">Jean-Marc Kouassi</p>
              <p className="truncate text-xs text-gray-500">Directeur</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
