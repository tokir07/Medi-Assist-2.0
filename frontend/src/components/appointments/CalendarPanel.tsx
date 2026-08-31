import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { appointmentsService } from '../../services/appointmentsService';
import type { CalendarDayEvent } from '../../types/appointments';

interface CalendarPanelProps {
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
}

export const CalendarPanel: React.FC<CalendarPanelProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 1-12 (August)
  const [dayEvents, setDayEvents] = useState<Record<string, CalendarDayEvent>>({});

  // Set initial to current date or August 2026
  useEffect(() => {
    const d = new Date();
    // Default to current year & month or 2026 August
    const y = d.getFullYear() >= 2026 ? d.getFullYear() : 2026;
    const m = d.getFullYear() >= 2026 ? d.getMonth() + 1 : 8;
    setCurrentYear(y);
    setCurrentMonth(m);
  }, []);

  // Fetch calendar events whenever month or year changes
  useEffect(() => {
    let isMounted = true;
    const fetchCalendar = async () => {
      try {
        const data = await appointmentsService.getCalendarData(currentYear, currentMonth);
        if (isMounted && data?.days) {
          const map: Record<string, CalendarDayEvent> = {};
          data.days.forEach((day) => {
            map[day.date] = day;
          });
          setDayEvents(map);
        }
      } catch (err) {
        console.error('Failed to load calendar events:', err);
      }
    };

    fetchCalendar();
    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth]);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Generate calendar grid
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sun
  const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    calendarCells.push({
      dayNum,
      isCurrentMonth: false,
      dateStr: '',
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dayNum: d,
      isCurrentMonth: true,
      dateStr,
    });
  }

  // Next month leading days to complete 35 or 42 cells
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let n = 1; n <= remaining; n++) {
    calendarCells.push({
      dayNum: n,
      isCurrentMonth: false,
      dateStr: '',
    });
  }

  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-29`; // default focus to 29th for visual parity

  return (
    <div className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-5 shadow-[0_2px_12px_rgba(16,42,86,0.02)] space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Calendar</h3>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-[#5F6F86] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs sm:text-sm font-bold text-[#102A56] min-w-[100px] text-center">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-[#5F6F86] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-[11px] font-semibold text-[#8A98AA] py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Dates Grid */}
      <div className="grid grid-cols-7 text-center gap-1">
        {calendarCells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={idx}
                className="h-8 flex items-center justify-center text-xs text-[#CBD5E1] select-none"
              >
                {cell.dayNum}
              </div>
            );
          }

          const isSelected = selectedDate === cell.dateStr;
          const isToday = cell.dateStr === todayStr && !selectedDate;
          const event = dayEvents[cell.dateStr];

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (isSelected) {
                  onSelectDate(null); // toggle off
                } else {
                  onSelectDate(cell.dateStr);
                }
              }}
              className={`h-8 w-8 mx-auto rounded-full text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                isSelected || isToday
                  ? 'bg-[#0FA3A3] text-white shadow-xs'
                  : 'text-[#102A56] hover:bg-[#EEF5FF] hover:text-[#0FA3A3]'
              }`}
            >
              <span>{cell.dayNum}</span>

              {/* Status Dot Indicator */}
              {event && (
                <div className="absolute bottom-0.5 flex items-center gap-0.5">
                  {event.has_upcoming && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected || isToday ? 'bg-white' : 'bg-[#1FA774]'
                      }`}
                    />
                  )}
                  {event.has_completed && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected || isToday ? 'bg-white' : 'bg-[#8B5CF6]'
                      }`}
                    />
                  )}
                  {event.has_cancelled && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected || isToday ? 'bg-white' : 'bg-[#EF4444]'
                      }`}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2 border-t border-[#F4F8FC] text-[11px] text-[#5F6F86]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1FA774]" />
          <span>Upcoming</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
          <span>Cancelled</span>
        </div>
      </div>

      {/* Clear Selected Date indicator if filtered */}
      {selectedDate && (
        <div className="flex items-center justify-between bg-[#E8F8F5] px-3 py-1.5 rounded-xl text-xs text-[#0FA3A3]">
          <span className="font-semibold">Filtered by: {selectedDate}</span>
          <button
            type="button"
            onClick={() => onSelectDate(null)}
            className="text-[11px] font-bold underline cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
