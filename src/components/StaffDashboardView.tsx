import { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Gavel,
  Landmark,
  Megaphone,
  MessageSquareWarning,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import type {
  AuditLog,
  AuthUser,
  Beneficiary,
  CashbookEntry,
  CertificateApplication,
  GramKatchahryCase,
  GramSabhaMeeting,
  Grievance,
  Language,
  ParivarRecord,
  PublicWork,
} from '../types';
import { apiFetch, formatINR, generateCertificatePDF } from '../utils/api';

interface StaffDashboardViewProps {
  lang: Language;
  staffUser: AuthUser;
  onRefreshGlobal: () => void;
}

export function StaffDashboardView({ lang, staffUser, onRefreshGlobal }: StaffDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'certs' | 'grievances' | 'notices' | 'finance' | 'sabha' | 'registers' | 'audit'>(
    staffUser.role === 'sarpanch' ? 'sabha' : staffUser.role === 'ward_member' ? 'grievances' : 'certs'
  );

  const [certs, setCerts] = useState<CertificateApplication[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [cashbook, setCashbook] = useState<CashbookEntry[]>([]);
  const [works, setWorks] = useState<PublicWork[]>([]);
  const [sabhas, setSabhas] = useState<GramSabhaMeeting[]>([]);
  const [cases, setCases] = useState<GramKatchahryCase[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [parivar, setParivar] = useState<ParivarRecord[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [feedback, setFeedback] = useState('');

  // Form states for creating Notice/Tender
  const [noticeType, setNoticeType] = useState<'notice' | 'tender' | 'resolution'>('notice');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeSummary, setNoticeSummary] = useState('');
  const [noticeClosing, setNoticeClosing] = useState('');
  const [noticeTicker, setNoticeTicker] = useState(true);

  // Cashbook form
  const [cbType, setCbType] = useState<'Income' | 'Expenditure'>('Expenditure');
  const [cbGrant, setCbGrant] = useState('15th Central Finance Commission');
  const [cbWard, setCbWard] = useState('4');
  const [cbParty, setCbParty] = useState('');
  const [cbAmount, setCbAmount] = useState('');
  const [cbDesc, setCbDesc] = useState('');

  // New Public Work form
  const [wkTitle, setWkTitle] = useState('');
  const [wkWard, setWkWard] = useState('4');
  const [wkScheme, setWkScheme] = useState('15th Central Finance Commission');
  const [wkContractor, setWkContractor] = useState('');
  const [wkBudget, setWkBudget] = useState('');

  // Gram Sabha Scheduler form
  const [gsTitle, setGsTitle] = useState('');
  const [gsDate, setGsDate] = useState('2026-12-05');
  const [gsAgenda, setGsAgenda] = useState('');

  // Gram Katchahry form
  const [gkPetitioner, setGkPetitioner] = useState('');
  const [gkRespondent, setGkRespondent] = useState('');
  const [gkWard, setGkWard] = useState('4');
  const [gkDispute, setGkDispute] = useState('');

  // Parivar Register Add form
  const [prHead, setPrHead] = useState('');
  const [prWard, setPrWard] = useState('4');
  const [prMembers, setPrMembers] = useState('4');
  const [prCategory, setPrCategory] = useState('OBC');
  const [prEcon, setPrEcon] = useState<'BPL' | 'APL' | 'AAY'>('BPL');
  const [prOccupation, setPrOccupation] = useState('');

  useEffect(() => {
    loadAllStaffData();
  }, []);

  async function loadAllStaffData() {
    const results = await Promise.allSettled([
      apiFetch<CertificateApplication[]>('/api/certificates'),
      apiFetch<Grievance[]>('/api/grievances'),
      apiFetch<CashbookEntry[]>('/api/funds/cashbook'),
      apiFetch<PublicWork[]>('/api/works'),
      apiFetch<GramSabhaMeeting[]>('/api/gram-sabha'),
      apiFetch<GramKatchahryCase[]>('/api/gram-katchahry'),
      apiFetch<Beneficiary[]>('/api/beneficiaries'),
      apiFetch<ParivarRecord[]>('/api/registers/parivar'),
      apiFetch<AuditLog[]>('/api/audit-logs'),
    ]);

    const setters = [
      setCerts,
      setGrievances,
      setCashbook,
      setWorks,
      setSabhas,
      setCases,
      setBeneficiaries,
      setParivar,
      setAudits,
    ] as const;
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        setters[index](result.value as never);
      } else {
        failed.push(result.reason instanceof Error ? result.reason.message : 'Unknown data loading error');
      }
    });

    setFeedback(
      failed.length
        ? `Some dashboard data could not be loaded: ${Array.from(new Set(failed)).join('; ')}`
        : ''
    );
  }

  async function updateCertStatus(id: number, status: string) {
    setFeedback('');
    try {
      const updated = await apiFetch<CertificateApplication>(`/api/certificates/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          remarks: `${status} by ${staffUser.fullName} (${staffUser.designation})`,
        }),
      });
      setCerts((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setFeedback(`Updated certificate ${updated.ref_id} to "${status}".`);
      onRefreshGlobal();
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Action failed');
    }
  }

  async function updateGrievanceStatus(id: number, status: 'Pending' | 'In Progress' | 'Resolved') {
    setFeedback('');
    const remarks =
      status === 'Resolved'
        ? `Resolved by ${staffUser.fullName} (${staffUser.designation}) after field inspection.`
        : `Work in progress under supervision of ${staffUser.fullName}.`;
    try {
      const updated = await apiFetch<Grievance>(`/api/grievances/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolution_remarks: remarks }),
      });
      setGrievances((prev) => prev.map((g) => (g.id === id ? updated : g)));
      setFeedback(`Updated Ticket ${updated.ticket_id} to "${status}".`);
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to update grievance');
    }
  }

  async function handlePublishNotice(e: React.FormEvent) {
    e.preventDefault();
    setFeedback('');
    try {
      await apiFetch('/api/notices', {
        method: 'POST',
        body: JSON.stringify({
          type: noticeType,
          title: noticeTitle,
          summary: noticeSummary,
          closing_date: noticeClosing || null,
          is_ticker: noticeTicker,
        }),
      });
      setNoticeTitle('');
      setNoticeSummary('');
      setNoticeClosing('');
      setFeedback(`Published new ${noticeType} to Ramnagar public portal & ticker.`);
      onRefreshGlobal();
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to publish notice');
    }
  }

  async function handleAddCashbook(e: React.FormEvent) {
    e.preventDefault();
    setFeedback('');
    try {
      await apiFetch('/api/funds/cashbook', {
        method: 'POST',
        body: JSON.stringify({
          entry_type: cbType,
          grant_source: cbGrant,
          ward_no: cbWard ? Number(cbWard) : null,
          party_name: cbParty,
          amount: Number(cbAmount),
          description: cbDesc,
        }),
      });
      setCbParty('');
      setCbAmount('');
      setCbDesc('');
      setFeedback('Recorded cashbook voucher and updated ward expenditure.');
      onRefreshGlobal();
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Cashbook entry failed');
    }
  }

  async function handleAddWork(e: React.FormEvent) {
    e.preventDefault();
    setFeedback('');
    try {
      const created = await apiFetch<PublicWork>('/api/works', {
        method: 'POST',
        body: JSON.stringify({
          title: wkTitle,
          ward_no: Number(wkWard),
          scheme_source: wkScheme,
          contractor_name: wkContractor,
          sanctioned_budget: Number(wkBudget),
        }),
      });
      setWkTitle('');
      setWkContractor('');
      setWkBudget('');
      setFeedback(`Sanctioned new public work ${created.work_code} in Ward ${created.ward_no}.`);
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to sanction work');
    }
  }

  async function handleUpdateWorkProgress(work: PublicWork, nextPct: number) {
    const nextStatus = nextPct >= 100 ? 'Completed' : 'In Progress';
    try {
      await apiFetch(`/api/works/${work.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ progress_pct: nextPct, status: nextStatus }),
      });
      setFeedback(`Updated work ${work.work_code} to ${nextPct}% (${nextStatus}).`);
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to update work');
    }
  }

  async function handleScheduleSabha(e: React.FormEvent) {
    e.preventDefault();
    setFeedback('');
    try {
      const created = await apiFetch<GramSabhaMeeting>('/api/gram-sabha', {
        method: 'POST',
        body: JSON.stringify({
          title: gsTitle,
          meeting_date: gsDate,
          meeting_time: '11:00 AM',
          venue: 'Ramnagar Gram Parishad Bhawan Courtyard',
          agenda: gsAgenda,
        }),
      });
      setGsTitle('');
      setGsAgenda('');
      setFeedback(`Scheduled Gram Sabha ${created.meeting_no} for ${created.meeting_date}.`);
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to schedule Gram Sabha');
    }
  }

  async function handleCompleteSabha(sabha: GramSabhaMeeting) {
    try {
      await apiFetch(`/api/gram-sabha/${sabha.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          attendance_count: 215,
          status: 'Completed',
          minutes_summary: `Quorum verified (215 citizens present). Agenda approved unanimously by Ramnagar Gram Sabha on ${sabha.meeting_date}.`,
        }),
      });
      setFeedback(`Marked ${sabha.meeting_no} completed with 215 attendees.`);
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function handleFileKatchahry(e: React.FormEvent) {
    e.preventDefault();
    setFeedback('');
    try {
      await apiFetch('/api/gram-katchahry', {
        method: 'POST',
        body: JSON.stringify({
          petitioner: gkPetitioner,
          respondent: gkRespondent,
          ward_no: Number(gkWard),
          dispute_type: gkDispute,
          next_hearing_date: '2026-11-26',
        }),
      });
      setGkPetitioner('');
      setGkRespondent('');
      setGkDispute('');
      setFeedback('Registered new Gram Katchahry dispute case.');
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to file case');
    }
  }

  async function handleResolveCase(caseItem: GramKatchahryCase) {
    try {
      await apiFetch(`/api/gram-katchahry/${caseItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Judgment Delivered',
          next_hearing_date: null,
          judgment_summary: `Settled amicably before Sarpanch Bench on ${new Date().toISOString().slice(0, 10)}.`,
        }),
      });
      setFeedback(`Recorded judgment for Case ${caseItem.case_no}.`);
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function handleAddParivar(e: React.FormEvent) {
    e.preventDefault();
    setFeedback('');
    try {
      const created = await apiFetch<ParivarRecord>('/api/registers/parivar', {
        method: 'POST',
        body: JSON.stringify({
          ward_no: Number(prWard),
          head_name: prHead,
          members_count: Number(prMembers),
          category: prCategory,
          economic_status: prEcon,
          occupation: prOccupation || 'Agriculture',
        }),
      });
      setPrHead('');
      setPrOccupation('');
      setFeedback(`Added Household ${created.family_id} (${created.head_name}) to Parivar Register.`);
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to add household');
    }
  }

  async function handleVerifyBeneficiary(ben: Beneficiary, status: string) {
    try {
      await apiFetch(`/api/beneficiaries/${ben.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ benefit_status: status }),
      });
      setFeedback(`Updated beneficiary ${ben.beneficiary_name} (${ben.family_id}) to "${status}".`);
      loadAllStaffData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Verification failed');
    }
  }

  const visibleGrievances =
    staffUser.role === 'ward_member' && staffUser.wardNo
      ? grievances.filter((g) => g.ward_no === staffUser.wardNo)
      : grievances;

  return (
    <div className="space-y-6">
      {/* Staff Role Banner */}
      <div className="bg-[#0B2C59] text-white rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-7 h-7 text-[#FF671F] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-amber-300 font-semibold uppercase tracking-wide">
              Ramnagar Gram Parishad · Staff Governance Workspace
            </p>
            <h2 className="text-lg sm:text-xl font-bold mt-0.5">
              {lang === 'hi' ? staffUser.fullNameHi : staffUser.fullName}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {lang === 'hi' ? staffUser.designationHi : staffUser.designation}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-[#071E3D] px-3 py-2 rounded border border-slate-700">
            <div className="text-lg font-bold font-mono-tabular">
              {certs.filter((c) => c.status !== 'Approved & Signed').length}
            </div>
            <div className="text-[11px] text-slate-300">Pending RTPS</div>
          </div>
          <div className="bg-[#071E3D] px-3 py-2 rounded border border-slate-700">
            <div className="text-lg font-bold font-mono-tabular">
              {visibleGrievances.filter((g) => g.status !== 'Resolved').length}
            </div>
            <div className="text-[11px] text-slate-300">Open Tickets</div>
          </div>
          <div className="bg-[#071E3D] px-3 py-2 rounded border border-slate-700">
            <div className="text-lg font-bold font-mono-tabular">{works.length}</div>
            <div className="text-[11px] text-slate-300">Active Works</div>
          </div>
        </div>
      </div>

      {/* Staff Workspace Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded border border-slate-200 hc-surface">
        {(
          [
            { id: 'certs', label: 'RTPS Certificate Queue', icon: FileCheck2 },
            { id: 'grievances', label: 'Janta Darbar Desk', icon: MessageSquareWarning },
            { id: 'notices', label: 'Publish Notices / Tenders', icon: Megaphone, roles: ['mukhiya', 'sachiv'] },
            { id: 'finance', label: 'Cashbook & Works', icon: Landmark, roles: ['mukhiya', 'sachiv', 'ward_member'] },
            { id: 'sabha', label: 'Gram Sabha & Katchahry', icon: Gavel },
            { id: 'registers', label: 'Parivar & Beneficiaries', icon: BookOpen, roles: ['mukhiya', 'sachiv', 'ward_member'] },
            { id: 'audit', label: 'Audit Trail', icon: ClipboardList },
          ] as const
        )
          .filter((tab) => !('roles' in tab) || (tab.roles as readonly string[]).includes(staffUser.role))
          .map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id ? 'bg-[#0B2C59] text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#046A38]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* TAB 1: RTPS CERTIFICATE APPROVAL QUEUE */}
      {activeTab === 'certs' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
          <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
            RTPS Certificate Verification & Digital Signature Queue
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Ref ID</th>
                  <th className="py-2.5 px-3">Applicant & Ward</th>
                  <th className="py-2.5 px-3">Certificate Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {certs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono-tabular font-bold text-[#0B2C59]">{c.ref_id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{c.applicant_name}</div>
                      <div className="text-xs text-slate-500">
                        {c.guardian_name} · Ward {String(c.ward_no).padStart(2, '0')}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{c.cert_type}</div>
                      <div className="text-xs text-slate-500">{c.purpose}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-semibold ${
                          c.status === 'Approved & Signed'
                            ? 'text-[#046A38]'
                            : c.status === 'Rejected'
                            ? 'text-red-700'
                            : 'text-[#D97706]'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2 whitespace-nowrap">
                      {c.status === 'Submitted' && (
                        <button
                          type="button"
                          onClick={() => updateCertStatus(c.id, 'Verified by Sachiv')}
                          className="px-2.5 py-1.5 bg-[#0B2C59] text-white text-xs font-semibold rounded"
                        >
                          Verify Record
                        </button>
                      )}
                      {c.status !== 'Approved & Signed' && (staffUser.role === 'mukhiya' || staffUser.role === 'sachiv') && (
                        <button
                          type="button"
                          onClick={() => updateCertStatus(c.id, 'Approved & Signed')}
                          className="px-2.5 py-1.5 bg-[#046A38] text-white text-xs font-semibold rounded"
                        >
                          Approve & Sign
                        </button>
                      )}
                      {c.status === 'Approved & Signed' && (
                        <button
                          type="button"
                          onClick={() => generateCertificatePDF(c)}
                          className="px-2.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded"
                        >
                          Download PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: JANTA DARBAR GRIEVANCE DESK */}
      {activeTab === 'grievances' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
          <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
            Janta Darbar Grievance Action Desk
          </h3>
          <div className="divide-y divide-slate-200">
            {visibleGrievances.map((g) => (
              <div key={g.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono-tabular font-bold text-[#0B2C59]">{g.ticket_id}</span>
                    <span>·</span>
                    <span>Ward {String(g.ward_no).padStart(2, '0')}</span>
                    <span>·</span>
                    <span>{g.category}</span>
                    <span>·</span>
                    <span
                      className={`font-bold ${
                        g.status === 'Resolved'
                          ? 'text-[#046A38]'
                          : g.status === 'In Progress'
                          ? 'text-[#0B2C59]'
                          : 'text-[#D97706]'
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{g.subject}</h4>
                  <p className="text-xs text-slate-600">{g.description}</p>
                  <p className="text-xs text-slate-500">
                    Citizen: {g.citizen_name} ({g.mobile}) · Remarks: {g.resolution_remarks}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {g.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => updateGrievanceStatus(g.id, 'In Progress')}
                      className="px-3 py-1.5 bg-[#0B2C59] text-white text-xs font-semibold rounded whitespace-nowrap"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {g.status !== 'Resolved' && (
                    <button
                      type="button"
                      onClick={() => updateGrievanceStatus(g.id, 'Resolved')}
                      className="px-3 py-1.5 bg-[#046A38] text-white text-xs font-semibold rounded whitespace-nowrap"
                    >
                      Resolve Ticket
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PUBLISH NOTICES / TENDERS / RESOLUTIONS */}
      {activeTab === 'notices' && (
        <form onSubmit={handlePublishNotice} className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
          <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
            Publish Official Public Notice, Tender (NIT) or Gram Sabha Resolution
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={noticeType}
                onChange={(e) => setNoticeType(e.target.value as 'notice' | 'tender' | 'resolution')}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
              >
                <option value="notice">Public Notice (आदेश/सूचना)</option>
                <option value="tender">Tender / Quotation (निविदा)</option>
                <option value="resolution">Gram Sabha Resolution (कार्यवाही)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Closing / Event Date (Optional)</label>
              <input
                type="date"
                value={noticeClosing}
                onChange={(e) => setNoticeClosing(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noticeTicker}
                  onChange={(e) => setNoticeTicker(e.target.checked)}
                />
                <span>Pin to Top Running News Ticker</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Headline / Subject *</label>
            <input
              type="text"
              required
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="e.g., Special Social Security Pension e-KYC Camp at Ramnagar Parishad Bhawan"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Details / Official Order Text *</label>
            <textarea
              rows={3}
              required
              value={noticeSummary}
              onChange={(e) => setNoticeSummary(e.target.value)}
              placeholder="Enter complete order details for citizens and contractors..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B2C59] text-white text-xs font-semibold rounded"
          >
            <Plus className="w-4 h-4" />
            <span>Publish to Public Notice Board</span>
          </button>
        </form>
      )}

      {/* TAB 4: DIGITAL CASHBOOK & PUBLIC WORKS */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {(staffUser.role === 'mukhiya' || staffUser.role === 'sachiv') && (
              <form onSubmit={handleAddCashbook} className="lg:col-span-6 bg-white border border-slate-200 rounded p-5 space-y-3.5 hc-surface">
                <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
                  Record Digital Cashbook Voucher ({cashbook.length} Entries)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Entry Type</label>
                    <select
                      value={cbType}
                      onChange={(e) => setCbType(e.target.value as 'Income' | 'Expenditure')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                    >
                      <option value="Expenditure">Expenditure</option>
                      <option value="Income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ward No (Optional)</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={cbWard}
                      onChange={(e) => setCbWard(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono-tabular"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grant / Fund Head</label>
                  <select
                    value={cbGrant}
                    onChange={(e) => setCbGrant(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                  >
                    <option>15th Central Finance Commission</option>
                    <option>State Finance Commission</option>
                    <option>MGNREGA</option>
                    <option>Saat Nischay Part-2</option>
                    <option>Own Source Revenue (OSR)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Party / Vendor Name *</label>
                    <input
                      type="text"
                      required
                      value={cbParty}
                      onChange={(e) => setCbParty(e.target.value)}
                      placeholder="e.g., Champaran Traders"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (INR) *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={cbAmount}
                      onChange={(e) => setCbAmount(e.target.value)}
                      placeholder="50000"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono-tabular"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher Description *</label>
                  <input
                    type="text"
                    required
                    value={cbDesc}
                    onChange={(e) => setCbDesc(e.target.value)}
                    placeholder="Purpose & MB / Bill Reference"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-[#0B2C59] text-white text-xs font-semibold rounded">
                  Post Voucher to Digital Cashbook
                </button>
              </form>
            )}

            {(staffUser.role === 'mukhiya' || staffUser.role === 'sachiv') && (
              <form onSubmit={handleAddWork} className="lg:col-span-6 bg-white border border-slate-200 rounded p-5 space-y-3.5 hc-surface">
                <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
                  Sanction New Public Work (GPDP)
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Title *</label>
                  <input
                    type="text"
                    required
                    value={wkTitle}
                    onChange={(e) => setWkTitle(e.target.value)}
                    placeholder="e.g., Covered RCC Drain from Ward 08 Chowk to Canal"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ward No</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={wkWard}
                      onChange={(e) => setWkWard(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sanctioned Budget (INR) *</label>
                    <input
                      type="number"
                      required
                      min={10000}
                      value={wkBudget}
                      onChange={(e) => setWkBudget(e.target.value)}
                      placeholder="450000"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono-tabular"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Scheme Source</label>
                    <select
                      value={wkScheme}
                      onChange={(e) => setWkScheme(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                    >
                      <option>15th Central Finance Commission</option>
                      <option>State Finance Commission</option>
                      <option>MGNREGA</option>
                      <option>Saat Nischay Part-2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contractor / Agency *</label>
                    <input
                      type="text"
                      required
                      value={wkContractor}
                      onChange={(e) => setWkContractor(e.target.value)}
                      placeholder="e.g., Departmental / Contractor"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-[#046A38] text-white text-xs font-semibold rounded">
                  Sanction Work in Asset Register
                </button>
              </form>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded p-5 space-y-3 hc-surface">
            <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
              Update Public Works Physical Progress ({works.length} Sanctioned Works)
            </h3>
            <div className="divide-y divide-slate-200">
              {works.map((wk) => (
                <div key={wk.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono-tabular text-slate-500">
                      {wk.work_code} · Ward {wk.ward_no} · Budget {formatINR(wk.sanctioned_budget)}
                    </div>
                    <div className="text-sm font-bold text-slate-900">{wk.title}</div>
                    <div className="text-xs text-[#0B2C59] font-semibold">
                      Progress: {wk.progress_pct}% · Status: {wk.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {wk.progress_pct < 75 && (
                      <button
                        type="button"
                        onClick={() => handleUpdateWorkProgress(wk, 75)}
                        className="px-2.5 py-1.5 bg-[#0B2C59] text-white text-xs font-semibold rounded"
                      >
                        Set 75%
                      </button>
                    )}
                    {wk.progress_pct < 100 && (
                      <button
                        type="button"
                        onClick={() => handleUpdateWorkProgress(wk, 100)}
                        className="px-2.5 py-1.5 bg-[#046A38] text-white text-xs font-semibold rounded"
                      >
                        Mark 100% Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GRAM SABHA & GRAM KATCHAHRY */}
      {activeTab === 'sabha' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {(staffUser.role === 'mukhiya' || staffUser.role === 'sachiv') && (
              <form onSubmit={handleScheduleSabha} className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 space-y-3 hc-surface">
                <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
                  Schedule Gram Sabha Meeting
                </h3>
                <input
                  type="text"
                  required
                  value={gsTitle}
                  onChange={(e) => setGsTitle(e.target.value)}
                  placeholder="Meeting Title (e.g., Winter Social Audit Sabha)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
                <input
                  type="date"
                  required
                  value={gsDate}
                  onChange={(e) => setGsDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
                <textarea
                  rows={3}
                  required
                  value={gsAgenda}
                  onChange={(e) => setGsAgenda(e.target.value)}
                  placeholder="Meeting Agenda Items..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
                <button type="submit" className="w-full py-2 bg-[#0B2C59] text-white text-xs font-semibold rounded">
                  Publish Gram Sabha Notice
                </button>
              </form>
            )}

            {(staffUser.role === 'sarpanch' || staffUser.role === 'sachiv') && (
              <form onSubmit={handleFileKatchahry} className="lg:col-span-7 bg-white border border-slate-200 rounded p-5 space-y-3 hc-surface">
                <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
                  Register Gram Katchahry Case (Sarpanch Bench)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={gkPetitioner}
                    onChange={(e) => setGkPetitioner(e.target.value)}
                    placeholder="Petitioner Name"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                  <input
                    type="text"
                    required
                    value={gkRespondent}
                    onChange={(e) => setGkRespondent(e.target.value)}
                    placeholder="Respondent Name"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={gkWard}
                    onChange={(e) => setGkWard(e.target.value)}
                    placeholder="Ward No"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                  <input
                    type="text"
                    required
                    value={gkDispute}
                    onChange={(e) => setGkDispute(e.target.value)}
                    placeholder="Dispute Type (e.g., Medh)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-[#0B2C59] text-white text-xs font-semibold rounded">
                  File Gram Katchahry Dispute
                </button>
              </form>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded p-5 space-y-3 hc-surface">
              <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
                Gram Sabha Meetings ({sabhas.length})
              </h3>
              <div className="divide-y divide-slate-200">
                {sabhas.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono-tabular font-bold text-[#0B2C59]">
                        {s.meeting_no} · {s.meeting_date} · {s.status}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                      <div className="text-xs text-slate-500">Attendance: {s.attendance_count} / {s.quorum_required}</div>
                    </div>
                    {s.status === 'Scheduled' && (staffUser.role === 'mukhiya' || staffUser.role === 'sachiv') && (
                      <button
                        type="button"
                        onClick={() => handleCompleteSabha(s)}
                        className="px-3 py-1.5 bg-[#046A38] text-white text-xs font-semibold rounded shrink-0"
                      >
                        Record Quorum & MoM
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-5 space-y-3 hc-surface">
              <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
                Gram Katchahry Cases ({cases.length})
              </h3>
              <div className="divide-y divide-slate-200">
                {cases.map((c) => (
                  <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono-tabular text-[#0B2C59] font-bold">
                        {c.case_no} · Ward {c.ward_no} · {c.status}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {c.petitioner} vs. {c.respondent} ({c.dispute_type})
                      </div>
                      <div className="text-xs text-slate-600">{c.judgment_summary}</div>
                    </div>
                    {(staffUser.role === 'sarpanch' || staffUser.role === 'sachiv') &&
                      c.status !== 'Judgment Delivered' &&
                      c.status !== 'Compromise Reached' && (
                        <button
                          type="button"
                          onClick={() => handleResolveCase(c)}
                          className="px-3 py-1.5 bg-[#046A38] text-white text-xs font-semibold rounded whitespace-nowrap shrink-0"
                        >
                          Record Judgment
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PARIVAR REGISTER & BENEFICIARY VERIFICATION */}
      {activeTab === 'registers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {(staffUser.role === 'mukhiya' || staffUser.role === 'sachiv') && (
            <form onSubmit={handleAddParivar} className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 space-y-3 hc-surface">
              <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
                Enroll Household in Parivar Register ({parivar.length} Listed)
              </h3>
              <input
                type="text"
                required
                value={prHead}
                onChange={(e) => setPrHead(e.target.value)}
                placeholder="Head of Family Name *"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={prWard}
                  onChange={(e) => setPrWard(e.target.value)}
                  placeholder="Ward No"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={prMembers}
                  onChange={(e) => setPrMembers(e.target.value)}
                  placeholder="Family Members"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={prCategory}
                  onChange={(e) => setPrCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                >
                  <option>General</option>
                  <option>OBC</option>
                  <option>EBC</option>
                  <option>SC</option>
                  <option>ST</option>
                </select>
                <select
                  value={prEcon}
                  onChange={(e) => setPrEcon(e.target.value as 'BPL' | 'APL' | 'AAY')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                >
                  <option value="BPL">BPL</option>
                  <option value="APL">APL</option>
                  <option value="AAY">AAY (Antyodaya)</option>
                </select>
              </div>
              <input
                type="text"
                value={prOccupation}
                onChange={(e) => setPrOccupation(e.target.value)}
                placeholder="Primary Occupation (e.g. Farming / Trade)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
              <button type="submit" className="w-full py-2 bg-[#0B2C59] text-white text-xs font-semibold rounded">
                Add to Parivar Register
              </button>
            </form>
          )}

          <div
            className={`${
              staffUser.role === 'mukhiya' || staffUser.role === 'sachiv' ? 'lg:col-span-7' : 'lg:col-span-12'
            } bg-white border border-slate-200 rounded p-5 space-y-3 hc-surface`}
          >
            <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
              Welfare Beneficiary Field Verification Queue
            </h3>
            <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
              {beneficiaries.map((b) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">
                      {b.beneficiary_name} · <span className="font-mono-tabular text-[#0B2C59]">{b.family_id}</span>
                    </div>
                    <div className="text-slate-600">
                      Ward {String(b.ward_no).padStart(2, '0')} · {b.scheme_name} · Status:{' '}
                      <strong className={b.benefit_status === 'Pending Verification' ? 'text-[#D97706]' : 'text-[#046A38]'}>
                        {b.benefit_status}
                      </strong>
                    </div>
                  </div>
                  {b.benefit_status === 'Pending Verification' && (
                    <button
                      type="button"
                      onClick={() => handleVerifyBeneficiary(b, 'Active')}
                      className="px-2.5 py-1.5 bg-[#046A38] text-white font-semibold rounded shrink-0"
                    >
                      Verify & Activate
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-3 hc-surface">
          <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2">
            Immutable Governance Audit Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 uppercase">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Actor & Role</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Entity</th>
                  <th className="py-2 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono-tabular text-slate-500 whitespace-nowrap">{a.timestamp}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {a.actor_name} ({a.actor_role})
                    </td>
                    <td className="py-2 px-3 font-mono-tabular font-semibold text-[#0B2C59]">{a.action}</td>
                    <td className="py-2 px-3 font-mono-tabular">{a.entity}</td>
                    <td className="py-2 px-3 text-slate-700">{a.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
