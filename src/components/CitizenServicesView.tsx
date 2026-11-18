import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileBadge2,
  QrCode,
  Search,
  Upload,
} from 'lucide-react';
import type { CertificateApplication, CertificateType, Language, PropertyTaxRecord } from '../types';
import { apiFetch, formatINR, generateCertificatePDF, generateTaxReceiptPDF } from '../utils/api';

interface CitizenServicesViewProps {
  lang: Language;
  initialTab?: string;
  onRefreshData: () => void;
}

const CERT_TYPES: CertificateType[] = [
  'Birth Certificate',
  'Death Certificate',
  'Caste Certificate',
  'Income Certificate',
  'Residence (Domicile) Certificate',
  'Character Certificate',
  'Family Membership (Parivar)',
  'No Objection Certificate (NOC)',
];

export function CitizenServicesView({ lang, initialTab = 'apply', onRefreshData }: CitizenServicesViewProps) {
  const [activeTab, setActiveTab] = useState<'apply' | 'track' | 'tax'>(
    initialTab === 'track' ? 'track' : initialTab === 'tax' ? 'tax' : 'apply'
  );

  useEffect(() => {
    if (initialTab === 'track' || initialTab === 'tax' || initialTab === 'apply') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Apply form state
  const [certType, setCertType] = useState<CertificateType>('Residence (Domicile) Certificate');
  const [applicantName, setApplicantName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [wardNo, setWardNo] = useState(4);
  const [mobile, setMobile] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [purpose, setPurpose] = useState('');
  const [docName, setDocName] = useState('');
  const [docPreview, setDocPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedCert, setSubmittedCert] = useState<CertificateApplication | null>(null);

  // Track & QR Verify state
  const [recentCerts, setRecentCerts] = useState<CertificateApplication[]>([]);
  const [trackQuery, setTrackQuery] = useState('BR-WCH-RMN-2026-0041');
  const [trackedCert, setTrackedCert] = useState<CertificateApplication | null>(null);
  const [trackError, setTrackError] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState<string>('');

  // Property Tax state
  const [taxRecords, setTaxRecords] = useState<PropertyTaxRecord[]>([]);
  const [taxSearch, setTaxSearch] = useState('');
  const [taxMessage, setTaxMessage] = useState('');

  useEffect(() => {
    loadCertsAndTax();
  }, []);

  async function loadCertsAndTax() {
    try {
      const [certs, taxes] = await Promise.all([
        apiFetch<CertificateApplication[]>('/api/certificates'),
        apiFetch<PropertyTaxRecord[]>('/api/registers/property-tax'),
      ]);
      setRecentCerts(certs);
      setTaxRecords(taxes);
      if (certs.length > 0 && !trackedCert) {
        const approved = certs.find((c) => c.status === 'Approved & Signed') || certs[0];
        setTrackedCert(approved);
        setTrackQuery(approved.ref_id);
      }
    } catch {
      // handled gracefully in UI
    }
  }

  useEffect(() => {
    if (!trackedCert) {
      setQrImageUrl('');
      return;
    }
    const payload = JSON.stringify({
      ref: trackedCert.ref_id,
      hash: trackedCert.qr_hash,
      name: trackedCert.applicant_name,
      type: trackedCert.cert_type,
      ward: trackedCert.ward_no,
    });
    QRCode.toDataURL(payload, { width: 140, margin: 1 })
      .then(setQrImageUrl)
      .catch(() => setQrImageUrl(''));
  }, [trackedCert]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDocPreview(reader.result.slice(0, 120000));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const created = await apiFetch<CertificateApplication>('/api/certificates', {
        method: 'POST',
        body: JSON.stringify({
          cert_type: certType,
          applicant_name: applicantName,
          guardian_name: guardianName,
          ward_no: wardNo,
          mobile,
          aadhaar_last4: aadhaarLast4,
          purpose,
          doc_name: docName || 'Aadhaar_Ward_Proof.pdf',
          doc_preview: docPreview,
        }),
      });
      setSubmittedCert(created);
      setTrackedCert(created);
      setTrackQuery(created.ref_id);
      setApplicantName('');
      setGuardianName('');
      setMobile('');
      setAadhaarLast4('');
      setPurpose('');
      setDocName('');
      setDocPreview('');
      await loadCertsAndTax();
      onRefreshData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTrackLookup(e: React.FormEvent) {
    e.preventDefault();
    setTrackError('');
    try {
      const found = await apiFetch<CertificateApplication>(
        `/api/certificates?ref=${encodeURIComponent(trackQuery.trim())}`
      );
      setTrackedCert(found);
    } catch (err) {
      setTrackedCert(null);
      setTrackError(err instanceof Error ? err.message : 'Record not found');
    }
  }

  async function handlePayTax(record: PropertyTaxRecord) {
    setTaxMessage('');
    try {
      const updated = await apiFetch<PropertyTaxRecord>(`/api/registers/property-tax/${record.id}/pay`, {
        method: 'POST',
      });
      setTaxRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setTaxMessage(
        `Payment successful for Holding ${updated.holding_no}. Receipt No: ${updated.last_receipt_no} (${formatINR(updated.annual_tax)}).`
      );
      onRefreshData();
    } catch (err) {
      setTaxMessage(err instanceof Error ? err.message : 'Payment error');
    }
  }

  const filteredTax = taxRecords.filter(
    (t) =>
      t.holding_no.toLowerCase().includes(taxSearch.toLowerCase()) ||
      t.owner_name.toLowerCase().includes(taxSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hc-surface">
        <div>
          <p className="text-xs font-semibold text-[#FF671F] uppercase tracking-wide">
            {lang === 'hi' ? 'बिहार लोक सेवाओं का अधिकार (RTPS)' : 'Bihar Right to Public Services (RTPS) Desk'}
          </p>
          <h2 className="text-xl font-bold text-[#0B2C59] mt-0.5 hc-text">
            {lang === 'hi' ? 'नागरिक प्रमाण पत्र, QR सत्यापन एवं कर भुगतान' : 'Citizen Certificates, QR Verification & Tax Portal'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={`px-3.5 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'apply' ? 'bg-[#0B2C59] text-white' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'ऑनलाइन आवेदन करें' : 'Apply for Certificate'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={`px-3.5 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'track' ? 'bg-[#0B2C59] text-white' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'आवेदन ट्रैक / QR डाउनलोड' : 'Track & Download QR PDF'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tax')}
            className={`px-3.5 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'tax' ? 'bg-[#0B2C59] text-white' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'संपत्ति कर भुगतान' : 'Property Tax Payment'}
          </button>
        </div>
      </div>

      {/* TAB 1: APPLY FOR CERTIFICATE */}
      {activeTab === 'apply' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleApplySubmit} className="lg:col-span-8 bg-white border border-slate-200 rounded p-6 space-y-4 hc-surface">
            <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2.5 hc-text">
              {lang === 'hi' ? 'प्रमाण पत्र आवेदन प्रपत्र (RTPS)' : 'RTPS Certificate Application Form'}
            </h3>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded">
                {submitError}
              </div>
            )}

            {submittedCert && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#046A38]" />
                  <span>Application Submitted Successfully</span>
                </div>
                <p className="text-xs">
                  Reference ID: <strong className="font-mono-tabular">{submittedCert.ref_id}</strong> · QR Hash:{' '}
                  <strong className="font-mono-tabular">{submittedCert.qr_hash}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('track')}
                  className="text-xs font-semibold text-[#0B2C59] underline"
                >
                  Track Application Status →
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Type *</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value as CertificateType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0B2C59]"
                >
                  {CERT_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Number (Ramnagar) *</label>
                <select
                  value={wardNo}
                  onChange={(e) => setWardNo(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0B2C59]"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Ward No. {String(num).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Applicant Full Name *</label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g., Ankit Kumar Verma"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B2C59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Father / Husband / Guardian Name *</label>
                <input
                  type="text"
                  required
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g., Shri Rameshwar Verma"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B2C59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (SMS Alert) *</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono-tabular focus:outline-none focus:border-[#0B2C59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhaar Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  value={aadhaarLast4}
                  onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g., 4821"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono-tabular focus:outline-none focus:border-[#0B2C59]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Reason for Certificate *</label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Bihar Post-Matric Scholarship / School Admission / Bank Account"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B2C59]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Supporting Document (Aadhaar / Voter Slip / Ration Card / Hospital Slip)
              </label>
              <label className="flex items-center justify-between gap-3 px-4 py-3 border border-dashed border-slate-300 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <span className="text-xs text-slate-600 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#0B2C59]" />
                  <span>{docName ? `Attached: ${docName}` : 'Choose PDF or Image file (optional for demo)'}</span>
                </span>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} className="hidden" />
                <span className="text-xs font-semibold text-[#0B2C59]">Browse</span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-[#0B2C59] hover:bg-[#071E3D] text-white text-sm font-semibold rounded transition-colors disabled:opacity-60"
              >
                {submitting ? 'Submitting Application...' : 'Submit RTPS Application'}
              </button>
            </div>
          </form>

          {/* Right Guidelines Panel */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
            <h3 className="text-sm font-bold text-[#0B2C59] border-b border-slate-200 pb-2 hc-text">
              {lang === 'hi' ? 'सेवा समय-सीमा एवं दस्तावेज़ निर्देश' : 'RTPS Service Charter & SLA'}
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-700 hc-muted">
              <li className="flex justify-between border-b border-slate-100 pb-2">
                <span>Residence / Caste / Income</span>
                <span className="font-mono-tabular font-semibold text-[#0B2C59]">10 Working Days</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-2">
                <span>Birth & Death Registration</span>
                <span className="font-mono-tabular font-semibold text-[#0B2C59]">7 Working Days</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-2">
                <span>Parivar Membership / NOC</span>
                <span className="font-mono-tabular font-semibold text-[#0B2C59]">5 Working Days</span>
              </li>
              <li className="flex justify-between pb-1">
                <span>Online Application Fee</span>
                <span className="font-semibold text-[#046A38]">Free (Zero Fee)</span>
              </li>
            </ul>
            <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded text-xs text-slate-600 leading-relaxed">
              Every issued certificate contains an embedded cryptographic QR hash verifiable anytime on this portal by banks, schools, and government offices.
            </div>
          </aside>
        </div>
      )}

      {/* TAB 2: TRACK APPLICATION & QR-VERIFIED PDF DOWNLOAD */}
      {activeTab === 'track' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
            <h3 className="text-base font-bold text-[#0B2C59] hc-text">
              {lang === 'hi' ? 'आवेदन संख्या या QR कोड से खोजें' : 'Track by Reference ID or QR Code'}
            </h3>
            <form onSubmit={handleTrackLookup} className="flex gap-2">
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="e.g., BR-WCH-RMN-2026-0041"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded font-mono-tabular focus:outline-none focus:border-[#0B2C59]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#0B2C59] hover:bg-[#071E3D] text-white text-xs font-semibold rounded flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track</span>
              </button>
            </form>

            {trackError && <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded">{trackError}</p>}

            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 mb-2">Recent RTPS Applications (Click to Inspect):</p>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {recentCerts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setTrackQuery(c.ref_id);
                      setTrackedCert(c);
                      setTrackError('');
                    }}
                    className={`w-full text-left py-2.5 px-2 rounded hover:bg-slate-50 flex items-center justify-between gap-2 ${
                      trackedCert?.id === c.id ? 'bg-slate-100' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-mono-tabular font-bold text-[#0B2C59] truncate">{c.ref_id}</div>
                      <div className="text-xs text-slate-600 truncate">
                        {c.applicant_name} · {c.cert_type}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                        c.status === 'Approved & Signed'
                          ? 'text-[#046A38]'
                          : c.status === 'Rejected'
                          ? 'text-red-700'
                          : 'text-[#D97706]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-6 hc-surface">
            {trackedCert ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs font-mono-tabular text-slate-500">
                      Ref ID: {trackedCert.ref_id} · Applied: {trackedCert.applied_date}
                    </p>
                    <h3 className="text-lg font-bold text-[#0B2C59] mt-0.5 hc-text">{trackedCert.cert_type}</h3>
                    <p className="text-sm text-slate-700 mt-0.5">
                      Applicant: <strong>{trackedCert.applicant_name}</strong> ({trackedCert.guardian_name}) · Ward {String(trackedCert.ward_no).padStart(2, '0')}
                    </p>
                  </div>

                  {trackedCert.status === 'Approved & Signed' && (
                    <button
                      type="button"
                      onClick={() => generateCertificatePDF(trackedCert)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#046A38] hover:bg-emerald-800 text-white text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download QR-Verified PDF</span>
                    </button>
                  )}
                </div>

                {/* Progress Steps */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['Submitted', 'Verified by Sachiv', 'Approved & Signed'] as const).map((step, idx) => {
                    const stepRank =
                      trackedCert.status === 'Approved & Signed'
                        ? 2
                        : trackedCert.status === 'Verified by Sachiv'
                        ? 1
                        : trackedCert.status === 'Rejected'
                        ? -1
                        : 0;
                    const done = stepRank >= idx;
                    return (
                      <div
                        key={step}
                        className={`p-3 rounded border ${
                          done ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          {done ? <CheckCircle2 className="w-4 h-4 text-[#046A38]" /> : <Clock className="w-4 h-4" />}
                          <span>Step {idx + 1}</span>
                        </div>
                        <div className="mt-1 font-medium">{step}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Official Certificate Card Preview + Live QR Code */}
                <div className="border border-slate-300 bg-[#FBF9F5] p-5 rounded flex flex-col sm:flex-row items-start justify-between gap-5">
                  <div className="space-y-2 text-xs text-slate-700 flex-1">
                    <div className="font-serif-official font-bold text-sm text-[#0B2C59]">
                      GOVERNMENT OF BIHAR · RAMNAGAR GRAM PARISHAD
                    </div>
                    <p>
                      <strong>Purpose:</strong> {trackedCert.purpose}
                    </p>
                    <p>
                      <strong>Verification Remarks:</strong> {trackedCert.remarks}
                    </p>
                    {trackedCert.issued_by && (
                      <p className="text-[#046A38] font-semibold">
                        Signed by: {trackedCert.issued_by} on {trackedCert.issued_date}
                      </p>
                    )}
                    <p className="font-mono-tabular text-[11px] text-slate-500">
                      QR Verification Hash: {trackedCert.qr_hash}
                    </p>
                  </div>

                  {qrImageUrl && (
                    <div className="bg-white p-2 border border-slate-300 rounded text-center shrink-0">
                      <img src={qrImageUrl} alt="QR Verification Code" className="w-24 h-24 mx-auto" />
                      <div className="text-[10px] font-mono-tabular text-slate-600 mt-1 flex items-center justify-center gap-1">
                        <QrCode className="w-3 h-3 text-[#0B2C59]" />
                        <span>RTPS Verified</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-slate-500">
                <FileBadge2 className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                Enter a valid RTPS Reference ID to inspect application status and download certificate.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PROPERTY & HOUSE TAX PAYMENT */}
      {activeTab === 'tax' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-[#0B2C59] hc-text">
                {lang === 'hi' ? 'संपत्ति एवं गृह कर ऑनलाइन भुगतान' : 'Property & House Tax Assessment & Payment'}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Search by Holding Number (e.g., HOLD-RMN-04-019) or Owner Name to pay annual Gram Parishad tax.
              </p>
            </div>
            <input
              type="text"
              value={taxSearch}
              onChange={(e) => setTaxSearch(e.target.value)}
              placeholder="Search Holding No or Owner..."
              className="px-3 py-2 text-sm border border-slate-300 rounded w-full sm:w-64 focus:outline-none focus:border-[#0B2C59]"
            />
          </div>

          {taxMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded">
              {taxMessage}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Holding No</th>
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">Owner Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Area (sq.ft)</th>
                  <th className="py-2.5 px-3 text-right">Annual Tax</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {filteredTax.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#0B2C59]">{row.holding_no}</td>
                    <td className="py-2.5 px-3 font-mono-tabular">W-{String(row.ward_no).padStart(2, '0')}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{row.owner_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.property_type}</td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular">{row.area_sqft}</td>
                    <td className="py-2.5 px-3 text-right font-mono-tabular font-semibold">{formatINR(row.annual_tax)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-semibold ${row.paid_status === 'Paid' ? 'text-[#046A38]' : 'text-[#D97706]'}`}>
                        {row.paid_status}
                      </span>
                      {row.last_receipt_no && (
                        <div className="text-[11px] font-mono-tabular text-slate-500">{row.last_receipt_no}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {row.paid_status === 'Due' ? (
                        <button
                          type="button"
                          onClick={() => handlePayTax(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF671F] hover:bg-[#e55814] text-white text-xs font-semibold rounded whitespace-nowrap"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Now</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => generateTaxReceiptPDF(row)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-300 hover:border-[#0B2C59] text-[#0B2C59] text-xs font-semibold rounded whitespace-nowrap"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Receipt ({row.last_paid_date})</span>
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
    </div>
  );
}
