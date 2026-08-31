import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopHeader } from './AdminTopHeader';
import { CreateDoctorModal } from '../doctors/CreateDoctorModal';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [createDoctorOpen, setCreateDoctorOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleDoctorCreated = (_newDoctorId: string) => {
    setCreateDoctorOpen(false);
    navigate('/admin/doctors');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-2xl">
            <AdminSidebar onCloseMobile={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <AdminTopHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          openCreateDoctor={() => setCreateDoctorOpen(true)}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ openCreateDoctor: () => setCreateDoctorOpen(true) }} />
        </main>
      </div>

      {/* Global Create Doctor Modal */}
      <CreateDoctorModal
        isOpen={createDoctorOpen}
        onClose={() => setCreateDoctorOpen(false)}
        onSuccess={handleDoctorCreated}
      />
    </div>
  );
};
