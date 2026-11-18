import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Search } from 'lucide-react';
import type { Beneficiary, Language } from '../types';
import { apiFetch, downloadCSV, exportTablePDF, formatINR } from '../utils/api';

interface WelfareSchemesViewProps {
  lang: Language;
  initialCategory?: string;
}

const CATEGORIES = ['All', 'Saat Nischay', 'PMAY-G', 'MGNREGA', 'Pensions', 'PDS Ration'] as const;

export function WelfareSchemesView({ lang, initialCategory = 'All' }: WelfareSchemesViewProps) {
  const [category, setCategory] = useState<string>(initialCategory);
  const [wardFilter, setWardFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (CATEGORIES.includes(initialCategory as (typeof CATEGORIES)[number])) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'All') params.set('category', category);
    if (wardFilter !== 'All') params.set('ward', wardFilter);
    if (query.trim()) params.set('q', query.trim());

    apiFetch<Beneficiary[]>(`/api/beneficiaries?${params.toString()}`)
      .then((data) => {
        if (active) setRows(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, wardFilter, query]);

  const handleExportCSV = () => {
    downloadCSV(
      `Ramnagar_Beneficiaries_${category}.csv`,
      ['Family ID', 'Beneficiary Name', 'Guardian', 'Ward', 'Category', 'Scheme', 'Card/Job No', 'Masked Aadhaar', 'Amount (INR)', 'Status'],
      rows.map((r) => [
        r.family_id,
        r.beneficiary_name,
        r.guardian_name,
        r.ward_no,
        r.scheme_category,
        r.scheme_name,
        r.id_card_no,
        r.masked_aadhaar,
        r.sanctioned_amount,
        r.benefit_status,
      ])
    );
  };

  const handleExportPDF = () => {
    exportTablePDF(
      `Welfare Scheme Beneficiary List (${category})`,
      `Ward: ${wardFilter} | Total Records: ${rows.length}`,
      ['Family ID', 'Beneficiary Name', 'Ward', 'Scheme', 'Card / Job ID', 'Masked Aadhaar', 'Amount', 'Status'],
      rows.map((r) => [
        r.family_id,
        r.beneficiary_name,
        `Ward ${r.ward_no}`,
        r.scheme_name,
        r.id_card_no,
        r.masked_aadhaar,
        r.sanctioned_amount > 0 ? formatINR(r.sanctioned_amount) : 'In-Kind / Active',
        r.benefit_status,
      ]),
      `Ramnagar_Welfare_Beneficiaries_${category}.pdf`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#FF671F] uppercase tracking-wide">
              {lang === 'hi' ? 'बिहार एवं केंद्रीय कल्याणकारी योजनाएं' : 'Bihar & Central Welfare Schemes Tracker'}
            </p>
            <h2 className="text-xl font-bold text-[#0B2C59] mt-0.5 hc-text">
              {lang === 'hi'
                ? 'सात निश्चय, पीएम आवास (PMAY-G), मनरेगा, पेंशन एवं राशन लाभार्थी सूची'
                : 'Saat Nischay, PMAY-G, MGNREGA, Social Pensions & Ration Beneficiaries'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:border-[#0B2C59] rounded text-xs font-semibold text-slate-700 bg-white whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#046A38]" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0B2C59] hover:bg-[#071E3D] text-white rounded text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded border border-slate-200">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                category === cat ? 'bg-[#0B2C59] text-white' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {cat === 'All' ? (lang === 'hi' ? 'सभी योजनाएं' : 'All Schemes') : cat}
            </button>
          ))}
        </div>

        {/* Search & Ward Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === 'hi'
                  ? 'नाम, फैमिली आईडी (RMN-F...), जॉब कार्ड या राशन कार्ड नंबर से खोजें...'
                  : 'Search by Beneficiary Name, Family ID (RMN-F...), Job Card or Ration Card No...'
              }
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B2C59]"
            />
          </div>
          <div className="sm:col-span-4">
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0B2C59]"
            >
              <option value="All">All Wards (Ward 01 – 15)</option>
              {Array.from({ length: 15 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={String(w)}>
                  Ward No. {String(w).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600 uppercase">
                <th className="py-2.5 px-3">Family ID</th>
                <th className="py-2.5 px-3">Beneficiary & Guardian</th>
                <th className="py-2.5 px-3">Ward</th>
                <th className="py-2.5 px-3">Scheme & Category</th>
                <th className="py-2.5 px-3">Card / Job ID</th>
                <th className="py-2.5 px-3">Masked Aadhaar</th>
                <th className="py-2.5 px-3 text-right">Sanctioned</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading beneficiary records...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No beneficiary records match the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#0B2C59]">{b.family_id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{b.beneficiary_name}</div>
                      <div className="text-xs text-slate-500">{b.guardian_name}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono-tabular">W-{String(b.ward_no).padStart(2, '0')}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900">{b.scheme_name}</div>
                      <div className="text-xs text-slate-500">{b.scheme_category}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono-tabular text-xs text-slate-700">{b.id_card_no}</td>
                    <td className="py-2.5 px-3 font-mono-tabular text-xs text-slate-600">{b.masked_aadhaar}</td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold">
                      {b.sanctioned_amount > 0 ? formatINR(b.sanctioned_amount) : 'Service / Kind'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-xs font-semibold ${
                          b.benefit_status === 'Pending Verification'
                            ? 'text-[#D97706]'
                            : 'text-[#046A38]'
                        }`}
                      >
                        {b.benefit_status}
                      </span>
                      <div className="text-[11px] font-mono-tabular text-slate-500">{b.last_disbursed_date}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
