import React from 'react';
import { Calendar, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { AppointmentCard } from './AppointmentCard';
import type { AppointmentItem, AppointmentTab } from '../../types/appointments';

interface AppointmentListProps {
  appointments: AppointmentItem[];
  loading: boolean;
  error: string | null;
  activeTab: AppointmentTab;
  viewMode: 'list' | 'grid';
  onRetry: () => void;
  onBookAppointment: () => void;
  onViewDetails: (apt: AppointmentItem) => void;
  onReschedule: (apt: AppointmentItem) => void;
  onCancel: (apt: AppointmentItem) => void;
  onDateClick?: (dateStr: string) => void;
  onViewAll?: () => void;
  totalCount: number;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  loading,
  error,
  activeTab,
  viewMode,
  onRetry,
  onBookAppointment,
  onViewDetails,
  onReschedule,
  onCancel,
  onDateClick,
  onViewAll,
}) => {
  // ERROR STATE
  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#102A56]">Unable to load appointments</h3>
        <p className="text-xs sm:text-sm text-[#5F6F86] max-w-md mx-auto">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0FA3A3] text-white text-xs font-semibold rounded-xl hover:bg-[#0D8E8E] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // LOADING SKELETON
  if (loading && appointments.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-5 animate-pulse flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-16 bg-slate-100 rounded-xl"></div>
              <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/5"></div>
              </div>
            </div>
            <div className="h-8 bg-slate-100 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  // EMPTY STATE
  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-8 sm:p-12 text-center space-y-3.5 shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-[#E8F8F5] text-[#0FA3A3] flex items-center justify-center mx-auto shadow-xs">
          <Calendar className="w-7 h-7" />
        </div>

        {activeTab === 'Upcoming' ? (
          <>
            <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
              No Upcoming Appointments
            </h3>
            <p className="text-xs sm:text-sm text-[#5F6F86] max-w-sm mx-auto">
              You don't have any upcoming medical appointments scheduled.
            </p>
            <button
              type="button"
              onClick={onBookAppointment}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0FA3A3] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#0D8E8E] transition-colors cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </>
        ) : activeTab === 'Past' ? (
          <>
            <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
              No Past Appointments
            </h3>
            <p className="text-xs sm:text-sm text-[#5F6F86] max-w-sm mx-auto">
              Your completed appointment history and consultation logs will appear here.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
              No Cancelled Appointments
            </h3>
            <p className="text-xs sm:text-sm text-[#5F6F86] max-w-sm mx-auto">
              Any cancelled or rescheduled appointments will appear here for your records.
            </p>
          </>
        )}
      </div>
    );
  }

  // APPOINTMENTS LIST / GRID
  return (
    <div className="space-y-4">
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
            : 'space-y-3'
        }
      >
        {appointments.map((apt) => (
          <AppointmentCard
            key={apt.id}
            appointment={apt}
            viewMode={viewMode}
            onViewDetails={onViewDetails}
            onReschedule={onReschedule}
            onCancel={onCancel}
            onDateClick={onDateClick}
          />
        ))}
      </div>

      {/* View All Button below list matching reference screenshot */}
      {onViewAll && appointments.length > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="w-full py-2.5 rounded-xl border border-[#D9E1EA] bg-white hover:bg-[#F4F8FC] text-xs sm:text-sm font-bold text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors text-center cursor-pointer shadow-2xs"
        >
          View All {activeTab} Appointments
        </button>
      )}
    </div>
  );
};
