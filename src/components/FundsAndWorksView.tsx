import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, MapPin } from 'lucide-react';
import type { CashbookEntry, GrantSummary, Language, PublicWork, Ward } from '../types';
import { apiFetch, downloadCSV, exportTablePDF, formatINR } from '../utils/api';

interface FundsAndWorksViewProps {
  lang: Language;
  wards: Ward[];
  initialTab?: string;
}

export function FundsAndWorksView({ lang, wards, initialTab = 'overview' }: FundsAndWorksViewProps) {
  const [tab, setTab] = useState<'overview' | 'cashbook' | 'works' | 'rti'>(
    initialTab === 'cashbook' || initialTab === 'works' || initialTab === 'rti' ? initialTab : 'overview'
  );
  const [grants, setGrants] = useState<GrantSummary[]>([]);
  const [cashbook, setCashbook] = useState<CashbookEntry[]>([]);
  const [works, setWorks] = useState<PublicWork[]>([]);
  const [cashFilter, setCashFilter] = useState<'All' | 'Income' | 'Expenditure'>('All');

  useEffect(() => {
    if (initialTab === 'overview' || initialTab === 'cashbook' || initialTab === 'works' || initialTab === 'rti') {
      setTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    Promise.all([
      apiFetch<GrantSummary[]>('/api/funds/grants'),
      apiFetch<CashbookEntry[]>('/api/funds/cashbook'),
      apiFetch<PublicWork[]>('/api/works'),
    ]).then(([g, c, w]) => {
      setGrants(g);
      setCashbook(c);
      setWorks(w);
    });
  }, []);

  const totalSanctioned = grants.reduce((s, g) => s + g.sanctioned_amount, 0);
  const totalReleased = grants.reduce((s, g) => s + g.released_amount, 0);
  const totalUtilized = grants.reduce((s, g) => s + g.utilized_amount, 0);

  const filteredCash = cashbook.filter((c) => (cashFilter === 'All' ? true : c.entry_type === cashFilter));
  const maxWardFund = Math.max(...wards.map((w) => w.allocated_fund), 1);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hc-surface">
        <div>
          <p className="text-xs font-semibold text-[#FF671F] uppercase tracking-wide">
            {lang === 'hi' ? 'वित्तीय लेखांकन, लोक कार्य एवं आरटीआई प्रकटीकरण' : 'Financial Accounting, Public Works & RTI Disclosure'}
          </p>
          <h2 className="text-xl font-bold text-[#0B2C59] mt-0.5 hc-text">
            {lang === 'hi' ? '15वां वित्त, राज्य वित्त, डिजिटल कैशबुक एवं विकास कार्य' : 'Grants, Digital Cashbook, Works Register & Ward RTI'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
          {(
            [
              { id: 'overview', label: lang === 'hi' ? 'अनुदान सारांश' : 'Grant Tracker' },
              { id: 'rti', label: lang === 'hi' ? 'वार्ड RTI चार्ट' : 'Ward RTI Chart' },
              { id: 'cashbook', label: lang === 'hi' ? 'डिजिटल कैशबुक' : 'Digital Cashbook' },
              { id: 'works', label: lang === 'hi' ? 'विकास कार्य पंजी' : 'Works Register' },
            ] as const
          ).map((tItem) => (
            <button
              key={tItem.id}
              type="button"
              onClick={() => setTab(tItem.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                tab === tItem.id ? 'bg-[#0B2C59] text-white' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Grant Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded p-4 hc-surface">
          <div className="text-xs text-slate-500 font-medium">Total Sanctioned Grants (FY 2026–27)</div>
          <div className="text-2xl font-bold text-[#0B2C59] font-mono-tabular mt-1">{formatINR(totalSanctioned)}</div>
          <div className="text-xs text-slate-500 mt-1">15th FC · 6th SFC · MGNREGA · Saat Nischay</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-4 hc-surface">
          <div className="text-xs text-slate-500 font-medium">Funds Released to Panchayat Account</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-tabular mt-1">{formatINR(totalReleased)}</div>
          <div className="text-xs text-[#0B2C59] font-mono-tabular mt-1">
            {totalSanctioned > 0 ? Math.round((totalReleased / totalSanctioned) * 100) : 0}% of Sanctioned Allocation
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-4 hc-surface">
          <div className="text-xs text-slate-500 font-medium">Verified Utilization (Vouchers & MB)</div>
          <div className="text-2xl font-bold text-[#046A38] font-mono-tabular mt-1">{formatINR(totalUtilized)}</div>
          <div className="text-xs text-[#046A38] font-mono-tabular mt-1">
            {totalReleased > 0 ? Math.round((totalUtilized / totalReleased) * 100) : 0}% Utilized of Released Funds
          </div>
        </div>
      </div>

      {/* TAB: GRANT TRACKER OVERVIEW */}
      {tab === 'overview' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
          <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2.5 hc-text">
            Scheme-Wise Grant Release & Utilization (FY 2026–27)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grants.map((g) => {
              const pct = Math.min(100, Math.round((g.utilized_amount / Math.max(1, g.released_amount)) * 100));
              return (
                <div key={g.id} className="border border-slate-200 rounded p-4 bg-[#F8FAFC] space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-500">{g.nodal_agency}</div>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {lang === 'hi' ? g.scheme_name_hi : g.scheme_name}
                      </h4>
                    </div>
                    <span className="text-xs font-mono-tabular font-semibold text-[#0B2C59]">{g.financial_year}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block">Sanctioned</span>
                      <span className="font-mono-tabular font-bold text-slate-900">{formatINR(g.sanctioned_amount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Released</span>
                      <span className="font-mono-tabular font-bold text-[#0B2C59]">{formatINR(g.released_amount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Utilized</span>
                      <span className="font-mono-tabular font-bold text-[#046A38]">{formatINR(g.utilized_amount)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Utilization Progress</span>
                      <span className="font-mono-tabular font-semibold">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0B2C59]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: PUBLIC RTI WARD-WISE ALLOCATION VS EXPENDITURE CHART */}
      {tab === 'rti' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-5 hc-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-[#0B2C59] hc-text">
                {lang === 'hi'
                  ? 'सार्वजनिक RTI प्रकटीकरण: वार्ड-वार निधि आवंटन बनाम व्यय (वार्ड 1–15)'
                  : 'Public RTI Transparency: Ward-Wise Fund Allocation vs. Expenditure (Wards 1–15)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proactive disclosure under Section 4(1)(b) of the Right to Information Act, 2005
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#0B2C59] inline-block rounded-xs" />
                <span>Allocated</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#046A38] inline-block rounded-xs" />
                <span>Utilized</span>
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {wards.map((w) => {
              const allocWidth = Math.round((w.allocated_fund / maxWardFund) * 100);
              const spentWidth = Math.round((w.spent_fund / maxWardFund) * 100);
              const pct = Math.round((w.spent_fund / Math.max(1, w.allocated_fund)) * 100);
              return (
                <div key={w.ward_no} className="grid grid-cols-12 items-center gap-3 text-xs">
                  <div className="col-span-4 sm:col-span-3 font-medium text-slate-800 truncate">
                    <span className="font-mono-tabular font-bold text-[#0B2C59]">W-{String(w.ward_no).padStart(2, '0')}</span>{' '}
                    {lang === 'hi' ? w.ward_name_hi : w.ward_name}
                  </div>
                  <div className="col-span-5 sm:col-span-6 space-y-1">
                    <div className="w-full h-2.5 bg-slate-100 rounded-xs overflow-hidden">
                      <div className="h-full bg-[#0B2C59]" style={{ width: `${allocWidth}%` }} />
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-xs overflow-hidden">
                      <div className="h-full bg-[#046A38]" style={{ width: `${spentWidth}%` }} />
                    </div>
                  </div>
                  <div className="col-span-3 text-right font-mono-tabular text-slate-700">
                    <div className="font-semibold text-[#046A38]">{formatINR(w.spent_fund)}</div>
                    <div className="text-[11px] text-slate-500">
                      of {formatINR(w.allocated_fund)} ({pct}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: DIGITAL CASHBOOK */}
      {tab === 'cashbook' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
              {(['All', 'Income', 'Expenditure'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCashFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                    cashFilter === f ? 'bg-[#0B2C59] text-white' : 'text-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadCSV(
                    'Ramnagar_Digital_Cashbook.csv',
                    ['Voucher No', 'Date', 'Type', 'Grant Source', 'Ward', 'Party', 'Description', 'Amount (INR)', 'Bill Ref'],
                    filteredCash.map((c) => [
                      c.voucher_no,
                      c.entry_date,
                      c.entry_type,
                      c.grant_source,
                      c.ward_no || 'General',
                      c.party_name,
                      c.description,
                      c.amount,
                      c.bill_ref,
                    ])
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#046A38]" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  exportTablePDF(
                    'Ramnagar Gram Parishad Digital Cashbook',
                    `Filter: ${cashFilter}`,
                    ['Voucher', 'Date', 'Type', 'Grant Source', 'Party', 'Description', 'Amount', 'Bill Ref'],
                    filteredCash.map((c) => [
                      c.voucher_no,
                      c.entry_date,
                      c.entry_type,
                      c.grant_source,
                      c.party_name,
                      c.description,
                      formatINR(c.amount),
                      c.bill_ref,
                    ]),
                    'Ramnagar_Digital_Cashbook.pdf'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2C59] text-white rounded text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Voucher No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Grant / Head</th>
                  <th className="py-2.5 px-3">Party & Description</th>
                  <th className="py-2.5 px-3">Bill Ref</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {filteredCash.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#0B2C59]">{c.voucher_no}</td>
                    <td className="py-2.5 px-3 font-mono-tabular text-slate-600">{c.entry_date}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-semibold ${c.entry_type === 'Income' ? 'text-[#046A38]' : 'text-[#D97706]'}`}>
                        {c.entry_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {c.grant_source}
                      {c.ward_no ? ` · Ward ${c.ward_no}` : ''}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{c.party_name}</div>
                      <div className="text-xs text-slate-500">{c.description}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono-tabular text-xs text-slate-600">{c.bill_ref}</td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular font-bold text-slate-900">
                      {c.entry_type === 'Income' ? '+' : '-'} {formatINR(c.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: INFRASTRUCTURE & ASSET WORKS REGISTER */}
      {tab === 'works' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
          <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2.5 hc-text">
            {lang === 'hi' ? 'सार्वजनिक अवसंरचना एवं निर्माण कार्य रजिस्टर' : 'Public Infrastructure & Geo-Tagged Works Register'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {works.map((wk) => (
              <div key={wk.id} className="border border-slate-200 rounded p-4 bg-[#F8FAFC] space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500 font-mono-tabular">
                      {wk.work_code} · Ward {String(wk.ward_no).padStart(2, '0')} · {wk.scheme_source}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      {lang === 'hi' ? wk.title_hi : wk.title}
                    </h4>
                  </div>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
                      wk.status === 'Completed'
                        ? 'text-[#046A38]'
                        : wk.status === 'In Progress'
                        ? 'text-[#0B2C59]'
                        : 'text-[#D97706]'
                    }`}
                  >
                    {wk.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Executing Agency: <strong className="text-slate-800">{wk.contractor_name}</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 font-mono-tabular">
                  <span>Budget: {formatINR(wk.sanctioned_budget)}</span>
                  <span>Spent: {formatINR(wk.expenditure)}</span>
                  <span className="flex items-center gap-1 text-[#0B2C59]">
                    <MapPin className="w-3 h-3" />
                    {wk.geo_lat.toFixed(4)}, {wk.geo_lng.toFixed(4)}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Physical Progress</span>
                    <span className="font-mono-tabular font-semibold">{wk.progress_pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${wk.status === 'Completed' ? 'bg-[#046A38]' : 'bg-[#FF671F]'}`}
                      style={{ width: `${wk.progress_pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
