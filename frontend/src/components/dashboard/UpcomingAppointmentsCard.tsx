import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Video, ArrowRight, Calendar } from 'lucide-react';
import type { AppointmentItem } from '../../types/dashboard';

interface UpcomingAppointmentsCardProps {
  appointments?: AppointmentItem[];
}

export const UpcomingAppointmentsCard: React.FC<UpcomingAppointmentsCardProps> = ({
  appointments = [],
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
        <h3 className="text-sm sm:text-base font-bold text-slate-900">Upcoming Appointments</h3>
        <Link
          to="/patient/appointments"
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 transition"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      {appointments.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-900">No upcoming appointments</p>
          <Link
            to="/patient/appointments"
            className="inline-block mt-2 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Book Appointment
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {appointments.slice(0, 3).map((apt) => (
            <div key={apt.id} className="flex items-center justify-between py-2.5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Date Badge */}
                <div className="w-10 h-11 rounded-lg bg-teal-50 border border-teal-200 flex flex-col items-center justify-center shrink-0 text-teal-700">
                  <span className="text-[9px] font-bold uppercase tracking-wider">{apt.month}</span>
                  <span className="text-xs font-extrabold leading-none">{apt.day}</span>
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                    {apt.doctor_name}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate">{apt.specialty}</p>
                </div>
              </div>

              {/* Time & Mode */}
              <div className="flex items-center gap-3 shrink-0 text-xs">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end gap-1 font-semibold text-slate-900">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{apt.time}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 mt-0.5">
                    {apt.mode === 'Video Call' ? (
                      <Video className="w-3 h-3 text-blue-600" />
                    ) : (
                      <MapPin className="w-3 h-3 text-teal-600" />
                    )}
                    <span>{apt.mode}</span>
                  </div>
                </div>

                <Link
                  to="/patient/appointments"
                  className="px-2.5 py-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
                >
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
