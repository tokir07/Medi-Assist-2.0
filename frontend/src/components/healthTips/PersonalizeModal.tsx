import React, { useState } from 'react';
import { X, Sparkles, Check, Loader2 } from 'lucide-react';
import type { HealthTipItem, PersonalizePreferencesPayload } from '../../types/healthTips';
import { healthTipsService } from '../../services/healthTipsService';

interface PersonalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPersonalizedTips: (tips: HealthTipItem[]) => void;
}

const AVAILABLE_GOALS = [
  'Boost Energy & Vitality',
  'Improve Sleep Quality',
  'Strengthen Immunity',
  'Reduce Daily Stress',
  'Healthy Digestion & Gut',
  'Joint & Spine Mobility',
  'Cardiovascular Health',
];

const AVAILABLE_TOPICS = [
  'Nutrition',
  'Fitness',
  'Mental Health',
  'Lifestyle',
  'Disease Prevention',
];

export const PersonalizeModal: React.FC<PersonalizeModalProps> = ({
  isOpen,
  onClose,
  onApplyPersonalizedTips,
}) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Boost Energy & Vitality',
    'Healthy Digestion & Gut',
  ]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'Nutrition',
    'Lifestyle',
  ]);
  const [activityLevel, setActivityLevel] = useState<string>('Moderate');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoals.length === 0 && selectedTopics.length === 0) return;

    try {
      setLoading(true);
      const payload: PersonalizePreferencesPayload = {
        goals: selectedGoals,
        topics: selectedTopics,
        activity_level: activityLevel,
      };
      const tips = await healthTipsService.getPersonalizedTips(payload);
      onApplyPersonalizedTips(tips);
      onClose();
    } catch (err) {
      console.error('Failed to get personalized tips:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#102A56]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-[#D9E1EA] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7EDF4] flex items-center justify-between bg-[#F7FAFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#102A56]">
                Personalize Your Health Tips
              </h2>
              <p className="text-[11px] text-[#5F6F86]">
                Select your current focus areas and health goals
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#5F6F86] hover:text-[#102A56] hover:bg-[#E7EDF4] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Health Goals */}
          <div className="space-y-2.5">
            <label className="text-xs sm:text-sm font-bold text-[#102A56] block">
              1. What are your primary health goals?
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GOALS.map((goal) => {
                const active = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0FA3A3] text-white shadow-xs'
                        : 'bg-[#F7FAFF] text-[#102A56] border border-[#D9E1EA] hover:bg-[#EEF5FF]'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5" />}
                    <span>{goal}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topics of Interest */}
          <div className="space-y-2.5">
            <label className="text-xs sm:text-sm font-bold text-[#102A56] block">
              2. Which categories interest you most?
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TOPICS.map((topic) => {
                const active = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#102A56] text-white shadow-xs'
                        : 'bg-[#F7FAFF] text-[#102A56] border border-[#D9E1EA] hover:bg-[#EEF5FF]'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5" />}
                    <span>{topic}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Level */}
          <div className="space-y-2">
            <label htmlFor="activity-level-select" className="text-xs sm:text-sm font-bold text-[#102A56] block">
              3. Typical daily activity level
            </label>
            <select
              id="activity-level-select"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm font-semibold text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all cursor-pointer"
            >
              <option value="Sedentary">Mostly Sedentary (Desk job / minimal walking)</option>
              <option value="Moderate">Moderate (30+ min walking or light exercise)</option>
              <option value="Active">Highly Active (Daily workouts / physical work)</option>
            </select>
          </div>

          {/* Footer CTA */}
          <div className="pt-3 border-t border-[#E7EDF4] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (selectedGoals.length === 0 && selectedTopics.length === 0)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] active:bg-[#0A7373] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Tailoring Tips...</span>
                </>
              ) : (
                <span>Apply Personalized Feed</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
