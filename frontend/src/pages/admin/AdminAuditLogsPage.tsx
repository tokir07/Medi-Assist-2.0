import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import type { AuditLogItem } from '../../services/adminService';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Activity,
  User,
  Clock,
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs(
        actionFilter === 'ALL' ? undefined : actionFilter,
        undefined,
        searchTerm
      );
      setLogs(res.audit_logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-teal-600" />
            <span>Security & Audit Activity Trail</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable append-only system audit log tracking administrator actions, doctor onboarding & security events.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
            placeholder="Search audit trail by actor, action name, or details..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE_DOCTOR">CREATE_DOCTOR</option>
            <option value="VERIFY_DOCTOR">VERIFY_DOCTOR</option>
            <option value="SUSPEND_DOCTOR">SUSPEND_DOCTOR</option>
            <option value="SEND_NOTIFICATION">SEND_NOTIFICATION</option>
            <option value="ADMIN_LOGIN">ADMIN_LOGIN</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="text-xs font-medium text-slate-500">Querying security audit logs...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Audit Events Recorded</h3>
          <p className="text-xs text-slate-500">No audit events match your active search filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{log.created_at}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{log.actor_name}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{log.actor_role}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{log.action}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {log.resource} {log.resource_id ? `(${log.resource_id})` : ''}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
