import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import type { PatientDashboardData } from '../types/dashboard';

import { GreetingBanner } from '../components/dashboard/GreetingBanner';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentRecordsCard } from '../components/dashboard/RecentRecordsCard';
import { UpcomingAppointmentsCard } from '../components/dashboard/UpcomingAppointmentsCard';
import { ContinueConversationCard } from '../components/dashboard/ContinueConversationCard';
import { VoiceInteractionCard } from '../components/dashboard/VoiceInteractionCard';
import { TodayRemindersCard } from '../components/dashboard/TodayRemindersCard';
import { HealthTipsCard } from '../components/dashboard/HealthTipsCard';
import { SecurityBanner } from '../components/dashboard/SecurityBanner';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PatientDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getDashboardData();
      setData(result);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const patientName = user?.name || data?.patient_name || 'Patient';

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="h-36 bg-slate-200/70 rounded-3xl w-full"></div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200/70 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200/70 rounded-3xl"></div>
            <div className="h-64 bg-slate-200/70 rounded-3xl"></div>
            <div className="h-48 bg-slate-200/70 rounded-3xl"></div>
            <div className="h-48 bg-slate-200/70 rounded-3xl"></div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-60 bg-slate-200/70 rounded-3xl"></div>
            <div className="h-44 bg-slate-200/70 rounded-3xl"></div>
            <div className="h-44 bg-slate-200/70 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 bg-white rounded-3xl border border-[#D9E1EA] shadow-sm my-12">
        <AlertCircle className="w-10 h-10 text-[#E53E3E] mx-auto" />
        <h3 className="text-base font-bold text-[#102A56]">Unable to load dashboard</h3>
        <p className="text-xs text-[#5F6F86]">{error}</p>
        <button
          type="button"
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0FA3A3] text-white text-xs font-bold hover:bg-[#0D8E8E] transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-7 pb-8">
      {/* 1. Top Greeting Banner */}
      <GreetingBanner patientName={patientName} />

      {/* 2. Quick Actions */}
      <QuickActions />

      {/* 3. Main Dashboard Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns on Desktop (Feeds & Actions) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top 2 Cards: Recent Records + Upcoming Appointments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <RecentRecordsCard records={data?.recent_records} />
            <UpcomingAppointmentsCard appointments={data?.upcoming_appointments} />
          </div>

          {/* Bottom 2 Cards: Continue Conversation + Voice Interaction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ContinueConversationCard conversation={data?.active_conversation} />
            <VoiceInteractionCard />
          </div>
        </div>

        {/* Right 4 Columns on Desktop (Reminders, Health Tips) */}
        <div className="lg:col-span-4 space-y-6">
          <TodayRemindersCard initialReminders={data?.reminders} />
          <HealthTipsCard tips={data?.health_tips} />
        </div>
      </div>

      {/* 4. Bottom Security & Privacy Assurance Banner */}
      <SecurityBanner />
    </div>
  );
};
