import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Pill,
  Lightbulb,
  ChevronRight,
  Shield,
  PhoneCall,
  ArrowRight,
} from 'lucide-react';
import type { AIQuickAction, HealthTopic } from '../../types/aiAssistant';

interface AIQuickActionsPanelProps {
  onSelectAction: (prompt: string) => void;
  onSelectTopic: (topic: string) => void;
  activeTopic?: string;
}

const quickActions: AIQuickAction[] = [
  {
    id: 'act-1',
    title: 'Summarize My Reports',
    subtitle: 'Get AI summary of your medical report',
    icon: 'file',
    prompt: 'Can you summarize my latest medical reports and lab results?',
  },
  {
    id: 'act-2',
    title: 'Check Symptoms',
    subtitle: 'Analyze your symptoms',
    icon: 'shield',
    prompt: "I'd like to check some symptoms I've been experiencing.",
  },
  {
    id: 'act-3',
    title: 'Medication Info',
    subtitle: 'Learn about your medicines',
    icon: 'pill',
    prompt: 'Can you provide information about my prescribed medications and timings?',
  },
  {
    id: 'act-4',
    title: 'Health Tips',
    subtitle: 'Personalized health advice',
    icon: 'lightbulb',
    prompt: 'Give me personalized health and nutrition tips based on my health profile.',
  },
];

const recentTopics: HealthTopic[] = [
  { id: 'top-1', name: 'Headache', prompt: 'I want to ask about remedies for frequent headaches.' },
  { id: 'top-2', name: 'Dizziness', prompt: 'What causes sudden dizziness when standing up?' },
  { id: 'top-3', name: 'Stress', prompt: 'What are effective ways to manage daily stress?' },
  { id: 'top-4', name: 'Sleep', prompt: 'How can I improve my sleep quality and circadian rhythm?' },
  { id: 'top-5', name: 'Immunity', prompt: 'What foods help strengthen the immune system naturally?' },
  { id: 'top-6', name: 'Nutrition', prompt: 'What is a balanced daily nutrition plan?' },
];

export const AIQuickActionsPanel: React.FC<AIQuickActionsPanelProps> = ({
  onSelectAction,
  onSelectTopic,
  activeTopic = 'Headache',
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'file':
        return <FileText className="w-4 h-4 text-[#2F80ED]" />;
      case 'shield':
        return <ShieldCheck className="w-4 h-4 text-[#0FA3A3]" />;
      case 'pill':
        return <Pill className="w-4 h-4 text-[#8B5CF6]" />;
      case 'lightbulb':
        return <Lightbulb className="w-4 h-4 text-[#D97706]" />;
      default:
        return <FileText className="w-4 h-4 text-[#0FA3A3]" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Quick Actions */}
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Quick Actions</h3>

        <div className="space-y-2">
          {quickActions.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => onSelectAction(act.prompt)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F7FAFF] hover:bg-[#EEF5FF] border border-[#E7EDF4] transition-all duration-150 cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-2xs">
                  {getIcon(act.icon)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#102A56] group-hover:text-[#0FA3A3] transition-colors leading-tight truncate">
                    {act.title}
                  </h4>
                  <p className="text-[10px] text-[#5F6F86] truncate mt-0.5">{act.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8A98AA] group-hover:text-[#0FA3A3] shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* 2. Recent Health Topics */}
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Recent Health Topics</h3>

        <div className="flex flex-wrap gap-2">
          {recentTopics.map((top) => {
            const isSelected = top.name.toLowerCase() === activeTopic.toLowerCase();
            return (
              <button
                key={top.id}
                type="button"
                onClick={() => onSelectTopic(top.prompt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#E6F4F4] text-[#0FA3A3] border border-[#0FA3A3] font-semibold'
                    : 'bg-[#F4F8FC] hover:bg-[#EEF5FF] text-[#5F6F86] hover:text-[#102A56] border border-[#E7EDF4]'
                }`}
              >
                {top.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Important Safety Note */}
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-2.5">
        <div className="flex items-center gap-2 text-[#0FA3A3]">
          <Shield className="w-4 h-4" />
          <h4 className="text-xs font-bold text-[#102A56]">Important Note</h4>
        </div>
        <p className="text-[11px] text-[#5F6F86] leading-relaxed">
          MediAssist AI provides general health information and guidance only. It is not a
          substitute for professional medical advice, diagnosis, or treatment.
        </p>
        <Link
          to="/privacy"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors"
        >
          <span>Learn More</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 4. Emergency Support */}
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-3">
        <div>
          <h4 className="text-xs font-bold text-[#102A56]">Need Emergency Help?</h4>
          <p className="text-[11px] text-[#5F6F86] mt-1 leading-relaxed">
            If you are experiencing a medical emergency, please contact emergency services.
          </p>
        </div>

        <a
          href="tel:112"
          className="w-full py-2.5 px-4 bg-[#FFF5F5] hover:bg-[#FED7D7]/40 text-[#D64545] border border-[#FED7D7] rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <PhoneCall className="w-4 h-4 text-[#D64545]" />
          <span>Call Emergency Services</span>
        </a>
      </div>
    </div>
  );
};
