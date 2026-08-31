import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { remindersService } from '../../services/remindersService';
import type { ReminderCalendarDay } from '../../types/reminders';

interface ReminderCalendarPanelProps {
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
}

export const ReminderCalendarPanel: React.FC<ReminderCalendarPanelProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 1-12 (August)
  const [dayEvents, setDayEvents] = useState<Record<string, ReminderCalendarDay>>({});

  useEffect(() => {
    const d = new Date();
    const y = d.getFullYear() >= 2026 ? d.getFullYear() : 2026;
    const m = d.getFullYear() >= 2026 ? d.getMonth() + 1 : 8;
    setCurrentYear(y);
    setCurrentMonth(m);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchCal = async () => {
      try {
        const data = await remindersService.getCalendarEvents(currentYear, currentMonth);
        if (isMounted && data?.days) {
          const map: Record<string, ReminderCalendarDay> = {};
          data.days.forEach((day) => {
            map[day.date] = day;
          });
          setDayEvents(map);
        }
      } catch (err) {
        console.error('Failed to load reminder calendar:', err);
      }
    };
    fetchCal();
    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handlePrevYear = () => setCurrentYear((y) => y - 1);
  const handleNextYear = () => setCurrentYear((y) => y + 1);

  // Generate calendar grid dates
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

  const calendarCells = [];

  // Prev month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const pMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const pYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const dateStr = `${pYear}-${String(pMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dayNumber: d, isCurrentMonth: false, dateStr });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dayNumber: d, isCurrentMonth: true, dateStr });
  }

  // Next month padding to fill 35 or 42 grid cells
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const dateStr = `${nYear}-${String(nMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dayNumber: d, isCurrentMonth: false, dateStr });
  }

  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Calendar</h3>

        {/* Month Year Nav */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevYear}
            className="p-1 rounded-lg text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            title="Previous Year"
            aria-label="Previous Year"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs font-bold text-[#102A56] px-1 min-w-[90px] text-center">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextYear}
            className="p-1 rounded-lg text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            title="Next Year"
            aria-label="Next Year"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
          <span key={w} className="text-[11px] font-semibold text-[#8A98AA]">
            {w}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell, idx) => {
          const events = dayEvents[cell.dateStr];
          const isSelected = selectedDate === cell.dateStr;
          const isToday = cell.dateStr === '2026-08-29' || cell.dateStr === new Date().toISOString().split('T')[0];

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (isSelected) {
                  onSelectDate(null);
                } else {
                  onSelectDate(cell.dateStr);
                }
              }}
              className={`h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-full flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#0FA3A3] text-white font-bold shadow-xs'
                  : isToday && !isSelected
                  ? 'bg-[#0FA3A3] text-white font-bold'
                  : cell.isCurrentMonth
                  ? 'text-[#102A56] hover:bg-[#F4F8FC]'
                  : 'text-[#C5D0DE] hover:bg-[#F4F8FC]'
              }`}
            >
              <span className="text-[11px] sm:text-xs">{cell.dayNumber}</span>

              {/* Status Colored Dots */}
              {events && !isSelected && !isToday && (
                <div className="absolute bottom-1 flex items-center gap-0.5">
                  {events.has_medication && <span className="w-1 h-1 rounded-full bg-[#8B5CF6]" />}
                  {events.has_appointment && <span className="w-1 h-1 rounded-full bg-[#2F80ED]" />}
                  {events.has_task && <span className="w-1 h-1 rounded-full bg-[#D97706]" />}
                  {events.has_completed && <span className="w-1 h-1 rounded-full bg-[#1FA774]" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="pt-3 border-t border-[#F0F4F8] flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-[#5F6F86]">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
          <span>Medication</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F80ED]" />
          <span>Appointment</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
          <span>Task</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1FA774]" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
};
