import { useEffect, useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, Search, Upload } from 'lucide-react';
import type {
  AssetItem,
  Grievance,
  Language,
  ParivarRecord,
  PropertyTaxRecord,
  VitalRecord,
} from '../types';
import { apiFetch, downloadCSV, exportTablePDF, formatINR, generateGrievanceReceiptPDF } from '../utils/api';

interface MandatoryRegistersViewProps {
  lang: Language;
  initialTab?: string;
}

export function MandatoryRegistersView({ lang, initialTab = 'parivar' }: MandatoryRegistersViewProps) {
  const [tab, setTab] = useState<'parivar' | 'tax' | 'assets' | 'vitals'>(
    initialTab === 'tax' || initialTab === 'assets' || initialTab === 'vitals' ? initialTab : 'parivar'
  );
  const [search, setSearch] = useState('');
  const [parivar, setParivar] = useState<ParivarRecord[]>([]);
  const [taxes, setTaxes] = useState<PropertyTaxRecord[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<ParivarRecord[]>('/api/registers/parivar'),
      apiFetch<PropertyTaxRecord[]>('/api/registers/property-tax'),
      apiFetch<AssetItem[]>('/api/registers/assets'),
      apiFetch<VitalRecord[]>('/api/registers/vitals'),
    ]).then(([p, tx, a, v]) => {
      setParivar(p);
      setTaxes(tx);
      setAssets(a);
      setVitals(v);
    });
  }, []);

  const q = search.trim().toLowerCase();
  const filteredParivar = parivar.filter(
    (p) =>
      p.family_id.toLowerCase().includes(q) ||
      p.head_name.toLowerCase().includes(q) ||
      p.ration_card_no.toLowerCase().includes(q)
  );
  const filteredTaxes = taxes.filter(
    (t) => t.holding_no.toLowerCase().includes(q) || t.owner_name.toLowerCase().includes(q)
  );
  const filteredAssets = assets.filter(
    (a) => a.asset_code.toLowerCase().includes(q) || a.item_name.toLowerCase().includes(q)
  );
  const filteredVitals = vitals.filter(
    (v) => v.reg_no.toLowerCase().includes(q) || v.person_name.toLowerCase().includes(q)
  );

  const handleExport = (mode: 'csv' | 'pdf') => {
    if (tab === 'parivar') {
      const headers = ['Family ID', 'House No', 'Ward', 'Head of Family', 'Members', 'Category', 'Status', 'Occupation', 'Ration Card'];
      const rows = filteredParivar.map((r) => [
        r.family_id,
        r.house_no,
        r.ward_no,
        r.head_name,
        r.members_count,
        r.category,
        r.economic_status,
        r.occupation,
        r.ration_card_no,
      ]);
      if (mode === 'csv') downloadCSV('Ramnagar_Parivar_Register.csv', headers, rows);
      else exportTablePDF('Parivar Register (Household Census)', `Records: ${rows.length}`, headers, rows, 'Ramnagar_Parivar_Register.pdf');
    } else if (tab === 'tax') {
      const headers = ['Holding No', 'Ward', 'Owner', 'Property Type', 'Area sq.ft', 'Annual Tax', 'Status', 'Receipt No'];
      const rows = filteredTaxes.map((r) => [
        r.holding_no,
        r.ward_no,
        r.owner_name,
        r.property_type,
        r.area_sqft,
        formatINR(r.annual_tax),
        r.paid_status,
        r.last_receipt_no || '-',
      ]);
      if (mode === 'csv') downloadCSV('Ramnagar_Property_Tax_Register.csv', headers, rows);
      else exportTablePDF('Property & House Tax Register', `Records: ${rows.length}`, headers, rows, 'Ramnagar_Property_Tax_Register.pdf');
    } else if (tab === 'assets') {
      const headers = ['Asset Code', 'Item Name', 'Category', 'Ward', 'Qty', 'Condition', 'Value (INR)', 'Folio'];
      const rows = filteredAssets.map((r) => [
        r.asset_code,
        r.item_name,
        r.category,
        r.ward_no,
        r.quantity,
        r.condition,
        formatINR(r.purchase_value),
        r.folio_no,
      ]);
      if (mode === 'csv') downloadCSV('Ramnagar_Asset_Inventory.csv', headers, rows);
      else exportTablePDF('Parishad Asset & Stock Inventory', `Records: ${rows.length}`, headers, rows, 'Ramnagar_Asset_Inventory.pdf');
    } else {
      const headers = ['Reg No', 'Type', 'Person Name', 'Parents / Spouse', 'Event Date', 'Ward', 'Cert Ref'];
      const rows = filteredVitals.map((r) => [
        r.reg_no,
        r.record_type,
        r.person_name,
        r.related_name,
        r.event_date,
        r.ward_no,
        r.cert_ref,
      ]);
      if (mode === 'csv') downloadCSV('Ramnagar_Vital_Records_Register.csv', headers, rows);
      else exportTablePDF('Birth, Death & Marriage Register', `Records: ${rows.length}`, headers, rows, 'Ramnagar_Vital_Register.pdf');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#FF671F] uppercase tracking-wide">
              {lang === 'hi' ? 'बिहार पंचायती राज अनिवार्य पंजियाँ' : 'Mandatory Statutory Digital Registers'}
            </p>
            <h2 className="text-xl font-bold text-[#0B2C59] mt-0.5 hc-text">
              {lang === 'hi'
                ? 'परिवार पंजी, संपत्ति कर, परिसंपत्ति स्टॉक एवं जन्म-मृत्यु-विवाह पंजी'
                : 'Parivar Register, Property Tax, Asset Stock & Vital Records'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#046A38]" />
              <span>Export Excel/CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0B2C59] text-white rounded text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
            {(
              [
                { id: 'parivar', label: lang === 'hi' ? 'परिवार पंजी' : 'Parivar Register' },
                { id: 'tax', label: lang === 'hi' ? 'संपत्ति कर पंजी' : 'Property Tax Register' },
                { id: 'assets', label: lang === 'hi' ? 'परिसंपत्ति / स्टॉक' : 'Asset / Stock Inventory' },
                { id: 'vitals', label: lang === 'hi' ? 'जन्म / मृत्यु / विवाह' : 'Birth / Death / Marriage' },
              ] as const
            ).map((tItem) => (
              <button
                key={tItem.id}
                type="button"
                onClick={() => setTab(tItem.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                  tab === tItem.id ? 'bg-[#0B2C59] text-white' : 'text-slate-700'
                }`}
              >
                {tItem.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search register entries..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B2C59]"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded">
          {tab === 'parivar' && (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Family ID</th>
                  <th className="py-2.5 px-3">House / Ward</th>
                  <th className="py-2.5 px-3">Head of Household</th>
                  <th className="py-2.5 px-3 text-right">Members</th>
                  <th className="py-2.5 px-3">Category / Econ.</th>
                  <th className="py-2.5 px-3">Occupation</th>
                  <th className="py-2.5 px-3">Ration Card No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredParivar.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#0B2C59]">{p.family_id}</td>
                    <td className="py-2.5 px-3 font-mono-tabular">
                      {p.house_no} · W-{String(p.ward_no).padStart(2, '0')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{p.head_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular">{p.members_count}</td>
                    <td className="py-2.5 px-3">
                      {p.category} · <strong className="text-[#046A38]">{p.economic_status}</strong>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{p.occupation}</td>
                    <td className="py-2.5 px-3 font-mono-tabular text-xs">{p.ration_card_no}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'tax' && (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Holding No</th>
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">Owner Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Area (sq.ft)</th>
                  <th className="py-2.5 px-3 text-right">Annual Tax</th>
                  <th className="py-2.5 px-3">Status & Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTaxes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#0B2C59]">{t.holding_no}</td>
                    <td className="py-2.5 px-3 font-mono-tabular">W-{String(t.ward_no).padStart(2, '0')}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{t.owner_name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{t.property_type}</td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular">{t.area_sqft}</td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold">{formatINR(t.annual_tax)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-semibold ${t.paid_status === 'Paid' ? 'text-[#046A38]' : 'text-[#D97706]'}`}>
                        {t.paid_status}
                      </span>
                      {t.last_receipt_no && <span className="ml-2 font-mono-tabular text-xs text-slate-500">({t.last_receipt_no})</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'assets' && (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Asset Code</th>
                  <th className="py-2.5 px-3">Asset / Stock Item</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Location Ward</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3">Condition</th>
                  <th className="py-2.5 px-3 text-right">Book Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#0B2C59]">{a.asset_code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{a.item_name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{a.category}</td>
                    <td className="py-2.5 px-3 font-mono-tabular">W-{String(a.ward_no).padStart(2, '0')} · {a.folio_no}</td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular">{a.quantity}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-semibold ${a.condition === 'Good' ? 'text-[#046A38]' : 'text-[#D97706]'}`}>
                        {a.condition}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold">{formatINR(a.purchase_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'vitals' && (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Registration No</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Person Name</th>
                  <th className="py-2.5 px-3">Parents / Spouse</th>
                  <th className="py-2.5 px-3">Event Date</th>
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">RTPS Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredVitals.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#0B2C59]">{v.reg_no}</td>
                    <td className="py-2.5 px-3 font-semibold">{v.record_type}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{v.person_name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{v.related_name}</td>
                    <td className="py-2.5 px-3 font-mono-tabular">{v.event_date}</td>
                    <td className="py-2.5 px-3 font-mono-tabular">W-{String(v.ward_no).padStart(2, '0')}</td>
                    <td className="py-2.5 px-3 font-mono-tabular text-xs text-[#046A38]">{v.cert_ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

interface JantaDarbarViewProps {
  lang: Language;
}

export function JantaDarbarView({ lang }: JantaDarbarViewProps) {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [citizenName, setCitizenName] = useState('');
  const [mobile, setMobile] = useState('');
  const [wardNo, setWardNo] = useState(4);
  const [category, setCategory] = useState('Drinking Water (Nal-Jal)');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<Grievance | null>(null);
  const [trackTicket, setTrackTicket] = useState('');
  const [tracked, setTracked] = useState<Grievance | null>(null);
  const [trackError, setTrackError] = useState('');

  useEffect(() => {
    apiFetch<Grievance[]>('/api/grievances').then((data) => {
      setGrievances(data);
      if (data.length > 0) {
        setTracked(data[0]);
        setTrackTicket(data[0].ticket_id);
      }
    });
  }, []);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result.slice(0, 120000));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmitGrievance(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await apiFetch<Grievance>('/api/grievances', {
        method: 'POST',
        body: JSON.stringify({
          citizen_name: citizenName,
          mobile,
          ward_no: wardNo,
          category,
          subject,
          description,
          photo_name: photoName,
          photo_preview: photoPreview,
        }),
      });
      setSubmittedTicket(created);
      setTracked(created);
      setTrackTicket(created.ticket_id);
      setGrievances((prev) => [created, ...prev]);
      setCitizenName('');
      setMobile('');
      setSubject('');
      setDescription('');
      setPhotoName('');
      setPhotoPreview('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setTrackError('');
    try {
      const found = await apiFetch<Grievance>(`/api/grievances?ticket=${encodeURIComponent(trackTicket.trim())}`);
      setTracked(found);
    } catch (err) {
      setTracked(null);
      setTrackError(err instanceof Error ? err.message : 'Ticket not found');
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded p-5 hc-surface">
        <p className="text-xs font-semibold text-[#FF671F] uppercase tracking-wide">
          {lang === 'hi' ? 'लोक शिकायत निवारण (जनता दरबार)' : 'Janta Darbar · Public Grievance Redressal'}
        </p>
        <h2 className="text-xl font-bold text-[#0B2C59] mt-0.5 hc-text">
          {lang === 'hi'
            ? 'वार्ड स्तरीय शिकायत दर्ज करें एवं टिकट आईडी से स्थिति जांचें'
            : 'Submit Ward Grievance & Track Ticket Resolution'}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Complaint Submission Form */}
        <form onSubmit={handleSubmitGrievance} className="lg:col-span-6 bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
          <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2 hc-text">
            {lang === 'hi' ? 'नई शिकायत दर्ज करें' : 'Lodge New Janta Darbar Complaint'}
          </h3>

          {submittedTicket && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#046A38]" />
                <span>Grievance Registered & Auto-Routed</span>
              </div>
              <p>
                Ticket ID: <strong className="font-mono-tabular">{submittedTicket.ticket_id}</strong> · Assigned to:{' '}
                <strong>{submittedTicket.assigned_to}</strong>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Citizen Full Name *</label>
              <input
                type="text"
                required
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B2C59]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono-tabular focus:outline-none focus:border-[#0B2C59]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ward No (Auto-Routing) *</label>
              <select
                value={wardNo}
                onChange={(e) => setWardNo(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0B2C59]"
              >
                {Array.from({ length: 15 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Ward No. {String(w).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grievance Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0B2C59]"
              >
                <option>Drinking Water (Nal-Jal)</option>
                <option>Drainage & Sanitation</option>
                <option>Street Light</option>
                <option>PCC Road / Culvert Repair</option>
                <option>Pension / Ration / PMAY-G</option>
                <option>General Civic Issue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Location Landmark *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Broken water supply pipe near Ward 04 Anganwadi"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B2C59]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the civic issue clearly..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B2C59]"
            />
          </div>

          <div>
            <label className="flex items-center justify-between gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#0B2C59]" />
                <span>{photoName ? `Photo attached: ${photoName}` : 'Upload Site Photo (optional)'}</span>
              </span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <span className="font-semibold text-[#0B2C59]">Select Photo</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#FF671F] hover:bg-[#e55814] text-white text-sm font-semibold rounded transition-colors disabled:opacity-60"
          >
            {submitting ? 'Routing Grievance...' : 'Submit Grievance to Janta Darbar'}
          </button>
        </form>

        {/* Grievance Tracker */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
          <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2 hc-text">
            {lang === 'hi' ? 'टिकट आईडी से शिकायत स्थिति देखें' : 'Track Grievance Ticket Status'}
          </h3>

          <form onSubmit={handleTrack} className="flex gap-2">
            <input
              type="text"
              value={trackTicket}
              onChange={(e) => setTrackTicket(e.target.value)}
              placeholder="e.g., JD-2026-108"
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded font-mono-tabular focus:outline-none focus:border-[#0B2C59]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#0B2C59] text-white text-xs font-semibold rounded flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track</span>
            </button>
          </form>

          {trackError && <p className="text-xs text-red-700 bg-red-50 p-2 rounded">{trackError}</p>}

          {tracked && (
            <div className="border border-slate-200 bg-[#F8FAFC] rounded p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono-tabular font-bold text-sm text-[#0B2C59]">{tracked.ticket_id}</span>
                <span
                  className={`font-bold ${
                    tracked.status === 'Resolved'
                      ? 'text-[#046A38]'
                      : tracked.status === 'In Progress'
                      ? 'text-[#0B2C59]'
                      : 'text-[#D97706]'
                  }`}
                >
                  {tracked.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{tracked.subject}</h4>
              <p className="text-slate-600">{tracked.description}</p>
              <div className="pt-2 border-t border-slate-200 space-y-1 text-slate-600">
                <div>
                  <strong>Routed To:</strong> {tracked.assigned_to}
                </div>
                <div>
                  <strong>Official Remarks:</strong> {tracked.resolution_remarks}
                </div>
                <div className="font-mono-tabular text-[11px] text-slate-500">
                  Filed: {tracked.created_at} · Last Updated: {tracked.updated_at}
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => generateGrievanceReceiptPDF(tracked)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2C59] hover:bg-[#071E3D] text-white text-xs font-semibold rounded"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Acknowledgment PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-2">Recent Public Janta Darbar Tickets:</p>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {grievances.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setTrackTicket(g.ticket_id);
                    setTracked(g);
                    setTrackError('');
                  }}
                  className="w-full text-left py-2 px-2 hover:bg-slate-50 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-mono-tabular font-bold text-[#0B2C59] mr-2">{g.ticket_id}</span>
                    <span className="text-slate-800 truncate">{g.subject}</span>
                  </div>
                  <span
                    className={`font-semibold shrink-0 ${
                      g.status === 'Resolved'
                        ? 'text-[#046A38]'
                        : g.status === 'In Progress'
                        ? 'text-[#0B2C59]'
                        : 'text-[#D97706]'
                    }`}
                  >
                    {g.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
