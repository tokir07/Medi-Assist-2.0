import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  Activity,
  Calendar,
  FileText,
  ClipboardList,
  Users,
  History,
  Settings
} from 'lucide-react';
import type { UserRole } from '../types/auth';

interface DashboardPlaceholderProps {
  forcedRole?: UserRole;
}

export const DashboardPlaceholder: React.FC<DashboardPlaceholderProps> = ({ forcedRole }) => {
  const { user, role: contextRole } = useAuth();
  const role = forcedRole || contextRole;

  const [testResult, setTestResult] = useState<{
    endpoint: string;
    status: number | null;
    success: boolean;
    data: any;
  } | null>(null);

  const [loadingTest, setLoadingTest] = useState<string | null>(null);

  const runRbacTest = async (endpointName: string, testFn: () => Promise<any>) => {
    setLoadingTest(endpointName);
    setTestResult(null);
    try {
      const data = await testFn();
      setTestResult({
        endpoint: endpointName,
        status: 200,
        success: true,
        data
      });
    } catch (err: any) {
      const status = err.response?.status || 500;
      const message = err.response?.data?.message || err.message || 'Request failed';
      setTestResult({
        endpoint: endpointName,
        status,
        success: false,
        data: { status, message }
      });
    } finally {
      setLoadingTest(null);
    }
  };

  const renderRoleOverview = () => {
    switch (role) {
      case 'PATIENT':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/30 border border-teal-400/40 text-teal-200 uppercase">
                  Patient Portal
                </span>
              </div>
              <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Patient'}</h1>
              <p className="text-sm text-teal-100/90 mt-1 max-w-2xl">
                Prepare structured medical history, symptom reports, and clinical questionnaires for your upcoming consultations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <ClipboardList className="w-6 h-6 text-teal-600 mb-2" />
                <h3 className="font-semibold text-slate-800 text-base">Pre-Consultations</h3>
                <p className="text-xs text-slate-500 mt-1">Complete AI-guided symptom intake prior to clinical visit.</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <Calendar className="w-6 h-6 text-teal-600 mb-2" />
                <h3 className="font-semibold text-slate-800 text-base">Upcoming Appointments</h3>
                <p className="text-xs text-slate-500 mt-1">Schedule and view confirmed clinic & virtual appointments.</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <FileText className="w-6 h-6 text-teal-600 mb-2" />
                <h3 className="font-semibold text-slate-800 text-base">Medical Records</h3>
                <p className="text-xs text-slate-500 mt-1">Access clinical summaries, lab results, and prescriptions.</p>
              </div>
            </div>
          </div>
        );

      case 'DOCTOR':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-800 to-blue-950 text-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/30 border border-blue-400/40 text-blue-200 uppercase">
                  Clinical Desk
                </span>
              </div>
              <h1 className="text-2xl font-bold">Good day, {user?.name || 'Doctor'}</h1>
              <p className="text-sm text-blue-100/90 mt-1 max-w-2xl">
                Review structured AI pre-consultation summaries, patient queues, and clinical diagnostic reports.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <Activity className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-semibold text-slate-800 text-base">Active Patient Queue</h3>
                <p className="text-xs text-slate-500 mt-1">Real-time list of waiting patients with AI risk triage.</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <ClipboardList className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-semibold text-slate-800 text-base">Pre-Consultation Summaries</h3>
                <p className="text-xs text-slate-500 mt-1">Structured history of present illness & chief complaints.</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <Users className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-semibold text-slate-800 text-base">Patient Directory</h3>
                <p className="text-xs text-slate-500 mt-1">Comprehensive longitudinal medical histories and EHR notes.</p>
              </div>
            </div>
          </div>
        );

      case 'ADMIN':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/30 border border-purple-400/40 text-purple-200 uppercase">
                  System Administration
                </span>
              </div>
              <h1 className="text-2xl font-bold">Administrator Console — {user?.name || 'Admin'}</h1>
              <p className="text-sm text-purple-100/90 mt-1 max-w-2xl">
                Manage system users, doctor credentials, RBAC permissions, audit logs, and security policies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <Users className="w-6 h-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-slate-800 text-base">User Management</h3>
                <p className="text-xs text-slate-500 mt-1">Provision doctor/admin accounts and manage access state.</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <History className="w-6 h-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-slate-800 text-base">Audit Logs</h3>
                <p className="text-xs text-slate-500 mt-1">HIPAA security access logs and authentication events.</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <Settings className="w-6 h-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-slate-800 text-base">System Settings</h3>
                <p className="text-xs text-slate-500 mt-1">Configure JWT algorithms, token expiry, and security policies.</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Role Overview */}
      {renderRoleOverview()}

      {/* Interactive RBAC API Verification Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900">Live RBAC Security Tester</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            Active Token Role: <strong className="text-slate-800 uppercase">{role}</strong>
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Test real-time backend FastAPI authorization filters. Clicking below will send your current Bearer JWT token to protected endpoints.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Patient Test Button */}
          <button
            onClick={() => runRbacTest('/api/patient/test', authService.testPatientEndpoint)}
            disabled={loadingTest !== null}
            className="flex items-center justify-between p-3 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-teal-900 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
              <span>Test Patient Endpoint</span>
            </div>
            {loadingTest === '/api/patient/test' && (
              <div className="w-3.5 h-3.5 border-2 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>

          {/* Doctor Test Button */}
          <button
            onClick={() => runRbacTest('/api/doctor/test', authService.testDoctorEndpoint)}
            disabled={loadingTest !== null}
            className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
              <span>Test Doctor Endpoint</span>
            </div>
            {loadingTest === '/api/doctor/test' && (
              <div className="w-3.5 h-3.5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>

          {/* Admin Test Button */}
          <button
            onClick={() => runRbacTest('/api/admin/test', authService.testAdminEndpoint)}
            disabled={loadingTest !== null}
            className="flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-900 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
              <span>Test Admin Endpoint</span>
            </div>
            {loadingTest === '/api/admin/test' && (
              <div className="w-3.5 h-3.5 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>
        </div>

        {/* Live Response Result Box */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 animate-fade-in ${
              testResult.success
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-red-50/90 border-red-300 text-red-950'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span>Endpoint: {testResult.endpoint}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold uppercase ${
                  testResult.success
                    ? 'bg-emerald-200 text-emerald-800'
                    : 'bg-red-200 text-red-800'
                }`}
              >
                HTTP {testResult.status} {testResult.success ? 'OK' : 'FORBIDDEN'}
              </span>
            </div>

            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
              <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
