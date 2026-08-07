import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/modules/Dashboard';
import { Students } from '@/modules/Students';
import { StaffModule } from '@/modules/Staff';
import { Finance } from '@/modules/Finance';
import { Grades } from '@/modules/Grades';
import { Absences } from '@/modules/Absences';
import { Documents } from '@/modules/Documents';
import type { ViewKey } from '@/types';

function App() {
  const [view, setView] = useState<ViewKey>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const viewTitles: Record<ViewKey, string> = {
    dashboard: 'Tableau de bord',
    students: 'Élèves',
    staff: 'Personnels',
    finance: 'Finances (CGDES)',
    grades: 'Notes & Moyennes',
    absences: 'Absences',
    documents: 'Documents officiels',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        current={view}
        onNavigate={setView}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-base font-semibold text-gray-900">{viewTitles[view]}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">Année 2024-2025</p>
              <p className="text-xs text-gray-500">EduManager Pro</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-xs font-semibold text-white">
              JK
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {view === 'dashboard' && <Dashboard />}
          {view === 'students' && <Students />}
          {view === 'staff' && <StaffModule />}
          {view === 'finance' && <Finance />}
          {view === 'grades' && <Grades />}
          {view === 'absences' && <Absences />}
          {view === 'documents' && <Documents />}
        </main>
      </div>
    </div>
  );
}

export default App;
