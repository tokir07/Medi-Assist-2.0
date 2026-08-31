import { api } from '../services/api';
import type { MedicalRecordItem, ExtractedParameter } from '../types/records';

interface GeneratePdfOptions {
  record: MedicalRecordItem;
  summaryDetailed: string;
  summaryQuick: string;
  plainExp?: any;
  rawParams: ExtractedParameter[];
  summaryVersion?: number;
}

export const generateMedicalReportPdf = async ({
  record,
  summaryDetailed,
  summaryQuick,
  plainExp,
  rawParams,
  summaryVersion = 1
}: GeneratePdfOptions) => {
  const sanitizeTitle = (record.title || 'Medical_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `MediAssist_AI_Summary_${sanitizeTitle}.pdf`;

  try {
    // 1. Fetch High-Definition Native Vector PDF from Backend
    const response = await api.get(`/records/${record.id}/summary/pdf`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  } catch (error) {
    console.warn('Backend PDF endpoint failed, using client print fallback:', error);

    // Fallback: Open printable document window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const flaggedParams = rawParams.filter(p => p.status !== 'NORMAL');
      const normalParams = rawParams.filter(p => p.status === 'NORMAL');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${filename}</title>
            <style>
              @page { size: A4; margin: 12mm; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
                line-height: 1.45;
                font-size: 11.5px;
                padding: 16px;
                margin: 0;
              }
              .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 14px; }
              .brand { font-size: 14px; font-weight: 800; color: #0d9488; letter-spacing: 0.5px; }
              .badge { display: inline-block; background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px; text-transform: uppercase; }
              .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; }
              .meta-label { font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; }
              .meta-val { font-size: 10.5px; font-weight: 600; color: #0f172a; margin-top: 2px; }
              .doc-box { background: #f5f3ff; border: 1.5px solid #6366f1; border-left: 5px solid #4f46e5; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; }
              .doc-pill { display: inline-block; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; font-size: 9.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-right: 4px; margin-top: 4px; }
              .normal-pill { display: inline-block; background: #dcfce7; border: 1px solid #86efac; color: #166534; font-size: 9.5px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-right: 4px; margin-top: 4px; }
              table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 14px; border: 1px solid #e2e8f0; }
              th { background: #f1f5f9; padding: 6px 8px; text-align: left; font-weight: 700; color: #475569; border-bottom: 1px solid #cbd5e1; }
              td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
              .footer { border-top: 1px solid #e2e8f0; padding-top: 8px; text-align: center; font-size: 9px; color: #94a3b8; margin-top: 16px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="brand">MEDIASSIST CLINICAL INTELLIGENCE REPORT</div>
                <h1 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 4px 0 2px 0;">${record.title}</h1>
                <div style="font-size: 10px; color: #64748b;">Session: <strong>${record.session_name}</strong> • File: ${record.file_name}</div>
              </div>
              <div style="text-align: right;">
                <div class="badge">Verified Clinical Report</div>
                <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">Summary v${summaryVersion}</div>
              </div>
            </div>

            <div class="meta-grid">
              <div><div class="meta-label">Category</div><div class="meta-val">${record.category || 'Lab Report'}</div></div>
              <div><div class="meta-label">Facility</div><div class="meta-val">${record.hospital || 'Diagnostic Lab'}</div></div>
              <div><div class="meta-label">Attending Doctor</div><div class="meta-val">${record.doctor_name || 'Consulting Physician'}</div></div>
              <div><div class="meta-label">Report Date</div><div class="meta-val">${record.record_date || 'Recent'}</div></div>
            </div>

            <div class="doc-box">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="color: #4338ca; font-size: 11px;">🩺 DOCTOR'S EXECUTIVE BRIEFING (30-Second Clinical Digest)</strong>
                <span style="font-size: 9.5px; font-weight: 700; color: #4338ca;">${rawParams.length} Tested (${flaggedParams.length} Flagged)</span>
              </div>
              <div style="font-size: 11px; color: #1e1b4b; margin-bottom: 6px;">${summaryQuick || 'Diagnostic test parameters recorded and extracted.'}</div>
              <div>
                ${flaggedParams.map(p => `<span class="doc-pill">⚠️ ${p.display_name}: ${p.value} ${p.unit || ''} (${p.status})</span>`).join('')}
                ${normalParams.slice(0, 4).map(p => `<span class="normal-pill">✓ ${p.display_name}: ${p.value} ${p.unit || ''}</span>`).join('')}
              </div>
            </div>

            ${rawParams.length > 0 ? `
              <div style="font-weight: 800; font-size: 11.5px; margin-bottom: 4px;">📊 Structured Parameters Table</div>
              <table>
                <thead>
                  <tr><th>Test Parameter</th><th>Observed Result</th><th>Reference Range</th><th style="text-align:center;">Status</th></tr>
                </thead>
                <tbody>
                  ${rawParams.map(p => `
                    <tr>
                      <td style="font-weight: 600;">${p.display_name}</td>
                      <td><strong>${p.value}</strong> <span style="color:#64748b; font-size:9px;">${p.unit || ''}</span></td>
                      <td style="color:#64748b;">${p.reference_range || '-'}</td>
                      <td style="text-align:center; font-weight:700; color:${p.status === 'HIGH' ? '#991b1b' : p.status === 'LOW' ? '#92400e' : '#166534'};">${p.status}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}

            <div class="footer">
              <strong>MediAssist Clinical Intelligence Engine</strong> • Generated strictly from verified patient document sources.<br/>
              This document is for clinical reference and patient education.
            </div>

            <script>
              window.onload = () => { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }
};
