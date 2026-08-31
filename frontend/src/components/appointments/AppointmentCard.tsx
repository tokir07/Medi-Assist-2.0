import React, { useState, useRef, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Calendar,
  MoreVertical,
  Eye,
  CalendarClock,
  XCircle,
  Video,
} from 'lucide-react';
import type { AppointmentItem } from '../../types/appointments';

interface AppointmentCardProps {
  appointment: AppointmentItem;
  viewMode: 'list' | 'grid';
  onViewDetails: (apt: AppointmentItem) => void;
  onReschedule: (apt: AppointmentItem) => void;
  onCancel: (apt: AppointmentItem) => void;
  onDateClick?: (dateStr: string) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  viewMode,
  onViewDetails,
  onReschedule,
  onCancel,
  onDateClick,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse Date Parts (e.g. 2026-08-29)
  const parseDateParts = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) {
        return { month: 'AUG', day: '29', weekday: 'Thu' };
      }
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const day = d.getDate().toString().padStart(2, '0');
      const weekday = d.toLocaleString('en-US', { weekday: 'short' });
      return { month, day, weekday };
    } catch {
      return { month: 'AUG', day: '29', weekday: 'Thu' };
    }
  };

  const { month, day, weekday } = parseDateParts(appointment.appointment_date);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F8F5] text-[#1FA774] border border-[#1FA774]/20">
          Confirmed
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D99500] border border-[#D99500]/20">
          Pending
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EEF5FF] text-[#2F80ED] border border-[#2F80ED]/20">
          Completed
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#D64545] border border-[#D64545]/20">
          Cancelled
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F4F8FC] text-[#5F6F86] border border-[#D9E1EA]">
        {status}
      </span>
    );
  };

  const isUpcoming = ['confirmed', 'pending', 'rescheduled'].includes(
    (appointment.status || '').toLowerCase()
  );

  // LIST VIEW LAYOUT
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-4 sm:p-5 shadow-[0_2px_12px_rgba(16,42,86,0.02)] hover:border-[#0FA3A3]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Section: Date Badge + Doctor Photo + Doctor & Appointment Details */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          {/* Date Badge */}
          <button
            type="button"
            onClick={() => onDateClick && onDateClick(appointment.appointment_date)}
            className="w-14 h-16 rounded-xl bg-[#E8F8F5] border border-[#0FA3A3]/25 flex flex-col items-center justify-center shrink-0 text-[#0FA3A3] hover:bg-[#D8F3EE] transition-colors cursor-pointer"
            title="Filter by this date"
          >
            <span className="text-[10px] font-bold tracking-wider leading-none uppercase text-[#0FA3A3]">
              {month}
            </span>
            <span className="text-lg font-extrabold text-[#102A56] leading-none my-0.5">
              {day}
            </span>
            <span className="text-[10px] font-medium text-[#5F6F86] leading-none">
              {weekday}
            </span>
          </button>

          {/* Doctor Image */}
          <div className="relative shrink-0">
            {appointment.doctor_image ? (
              <img
                src={appointment.doctor_image}
                alt={appointment.doctor_name}
                className="w-12 h-12 rounded-full object-cover border border-[#D9E1EA]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#EEF5FF] text-[#0FA3A3] font-bold text-sm flex items-center justify-center border border-[#D9E1EA]">
                {appointment.doctor_name.replace('Dr.', '').trim().charAt(0) || 'D'}
              </div>
            )}
          </div>

          {/* Appointment & Doctor Text */}
          <div className="min-w-0 flex-1">
            <h3
              onClick={() => onViewDetails(appointment)}
              className="text-sm sm:text-base font-bold text-[#102A56] hover:text-[#0FA3A3] transition-colors cursor-pointer truncate"
            >
              {appointment.appointment_type}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-[#102A56] mt-0.5 truncate">
              {appointment.doctor_name}
            </p>
            <p className="text-[11px] sm:text-xs text-[#5F6F86] truncate">
              {appointment.doctor_specialty}
            </p>
          </div>
        </div>

        {/* Middle Section: Time & Location */}
        <div className="flex flex-wrap md:flex-col items-start md:items-start gap-2 sm:gap-1.5 text-xs text-[#5F6F86] min-w-[200px]">
          <div className="flex items-center gap-1.5 text-[#102A56] font-medium">
            <Clock className="w-3.5 h-3.5 text-[#8A98AA]" />
            <span>{appointment.appointment_time}</span>
            {appointment.mode === 'Video Call' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#2F80ED] bg-[#EEF5FF] px-1.5 py-0.5 rounded-md">
                <Video className="w-3 h-3" />
                <span>Video</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[#5F6F86]">
            <MapPin className="w-3.5 h-3.5 text-[#8A98AA] shrink-0" />
            <span className="truncate">
              {appointment.hospital}
              {appointment.hospital_address ? `, ${appointment.hospital_address}` : ''}
            </span>
          </div>
        </div>

        {/* Right Section: Status Badge + Action Buttons */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F4F8FC]">
          <div>{getStatusBadge(appointment.status)}</div>

          <div className="flex items-center gap-1.5 relative" ref={menuRef}>
            {/* View Date / Details Quick Button */}
            <button
              type="button"
              onClick={() => onViewDetails(appointment)}
              className="p-2 rounded-xl text-[#5F6F86] hover:text-[#0FA3A3] hover:bg-[#F4F8FC] border border-[#D9E1EA]/80 transition-colors cursor-pointer"
              title="View Appointment Details"
              aria-label="View Details"
            >
              <Calendar className="w-4 h-4" />
            </button>

            {/* More Menu Toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-[#5F6F86] hover:text-[#102A56] hover:bg-[#F4F8FC] border border-[#D9E1EA]/80 transition-colors cursor-pointer"
              aria-label="More Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 top-11 w-44 bg-white border border-[#D9E1EA] rounded-xl shadow-lg py-1.5 z-30 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onViewDetails(appointment);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#5F6F86] hover:bg-[#F4F8FC] hover:text-[#102A56] transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#8A98AA]" />
                  <span>View Details</span>
                </button>

                {isUpcoming && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onReschedule(appointment);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#5F6F86] hover:bg-[#F4F8FC] hover:text-[#102A56] transition-colors cursor-pointer"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-[#0FA3A3]" />
                      <span>Reschedule</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onCancel(appointment);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#D64545] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-[#D64545]" />
                      <span>Cancel Appointment</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // GRID VIEW LAYOUT
  return (
    <div className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-5 shadow-[0_2px_12px_rgba(16,42,86,0.02)] hover:border-[#0FA3A3]/40 transition-all flex flex-col justify-between space-y-4">
      {/* Top: Date & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-11 rounded-lg bg-[#E8F8F5] border border-[#0FA3A3]/25 flex flex-col items-center justify-center shrink-0 text-[#0FA3A3]">
            <span className="text-[9px] font-bold uppercase leading-none">{month}</span>
            <span className="text-sm font-extrabold text-[#102A56] leading-none my-0.5">{day}</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#102A56]">{weekday}</p>
            <p className="text-[11px] text-[#5F6F86]">{appointment.appointment_time}</p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      {/* Doctor Info */}
      <div className="flex items-center gap-3">
        {appointment.doctor_image ? (
          <img
            src={appointment.doctor_image}
            alt={appointment.doctor_name}
            className="w-11 h-11 rounded-full object-cover border border-[#D9E1EA]"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#EEF5FF] text-[#0FA3A3] font-bold text-sm flex items-center justify-center border border-[#D9E1EA]">
            {appointment.doctor_name.replace('Dr.', '').trim().charAt(0) || 'D'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-[#0FA3A3] uppercase tracking-wide truncate">
            {appointment.appointment_type}
          </h4>
          <p className="text-sm font-bold text-[#102A56] truncate mt-0.5">
            {appointment.doctor_name}
          </p>
          <p className="text-xs text-[#5F6F86] truncate">{appointment.doctor_specialty}</p>
        </div>
      </div>

      {/* Hospital Location */}
      <div className="flex items-center gap-1.5 text-xs text-[#5F6F86] bg-[#F4F8FC] p-2.5 rounded-xl">
        <MapPin className="w-3.5 h-3.5 text-[#8A98AA] shrink-0" />
        <span className="truncate">
          {appointment.hospital}
          {appointment.hospital_address ? `, ${appointment.hospital_address}` : ''}
        </span>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#F4F8FC]">
        <button
          type="button"
          onClick={() => onViewDetails(appointment)}
          className="flex-1 py-1.5 px-3 rounded-xl bg-[#F4F8FC] hover:bg-[#EEF5FF] text-xs font-semibold text-[#102A56] hover:text-[#0FA3A3] transition-colors cursor-pointer text-center"
        >
          View Details
        </button>
        {isUpcoming && (
          <button
            type="button"
            onClick={() => onReschedule(appointment)}
            className="py-1.5 px-3 rounded-xl border border-[#D9E1EA] hover:bg-[#F4F8FC] text-xs font-medium text-[#5F6F86] transition-colors cursor-pointer"
          >
            Reschedule
          </button>
        )}
      </div>
    </div>
  );
};
