import React from 'react';
import { Bell, Check, Plus } from 'lucide-react';
import type { MedicationReminderItem } from '../../types/prescriptions';

interface MedicationRemindersCardProps {
  reminders: MedicationReminderItem[];
  onToggleReminder: (id: string) => void;
  onAddReminder: () => void;
  onViewAll?: () => void;
}

export const MedicationRemindersCard: React.FC<MedicationRemindersCardProps> = ({
  reminders,
  onToggleReminder,
  onAddReminder,
  onViewAll,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#102A56]">Medication Reminders</h3>
        <button
          type="button"
          onClick={onViewAll || onAddReminder}
          className="text-xs font-semibold text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Reminder List */}
      <div className="space-y-2.5">
        {reminders.map((rem) => (
          <div
            key={rem.id}
            onClick={() => onToggleReminder(rem.id)}
            className={`flex items-start justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer group ${
              rem.is_taken
                ? 'bg-[#F4F8FC] border-[#E7EDF4] opacity-75'
                : 'bg-white hover:bg-[#F7FAFF] border-[#E7EDF4] shadow-2xs'
            }`}
          >
            {/* Checkbox and Info */}
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  rem.is_taken
                    ? 'bg-[#0FA3A3] border-[#0FA3A3] text-white'
                    : 'border-[#D9E1EA] group-hover:border-[#0FA3A3] bg-white'
                }`}
              >
                {rem.is_taken && <Check className="w-3 h-3 stroke-[3]" />}
              </div>

              <div className="min-w-0">
                <h4
                  className={`text-xs font-bold transition-colors leading-tight ${
                    rem.is_taken ? 'line-through text-[#8A98AA]' : 'text-[#102A56] group-hover:text-[#0FA3A3]'
                  }`}
                >
                  {rem.medication_name}
                </h4>
                <p className="text-[10px] text-[#8A98AA] font-medium mt-0.5">
                  {rem.dosage_instruction}
                </p>
              </div>
            </div>

            {/* Time badge */}
            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-[#102A56] block">
                {rem.time_str.includes('Every') ? rem.time_str.split('Every')[0].trim() : rem.time_str}
              </span>
              {rem.time_str.includes('Every') && (
                <span className="text-[9px] text-[#8A98AA] block mt-0.5">
                  Every {rem.time_str.split('Every')[1].trim()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Reminder CTA */}
      <button
        type="button"
        onClick={onAddReminder}
        className="w-full py-2.5 px-4 bg-[#E6F7F7] hover:bg-[#D3F3F3] text-[#0FA3A3] rounded-2xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98"
      >
        <Bell className="w-3.5 h-3.5 text-[#0FA3A3]" />
        <span>Add Reminder</span>
      </button>
    </div>
  );
};
