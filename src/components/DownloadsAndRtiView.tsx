import { Download, FileText, PhoneCall, Scale, ShieldCheck } from 'lucide-react';
import type { ActiveView, Language } from '../types';
import { generateBlankFormPDF } from '../utils/api';

interface DownloadsAndRtiViewProps {
  lang: Language;
  onNavigate: (view: ActiveView, subTab?: string) => void;
}

const STATUTORY_FORMS = [
  {
    code: 'RGP-FRM-01',
    title: 'Birth / Death Registration Application Form',
    titleHi: 'जन्म / मृत्यु पंजीकरण आवेदन प्रपत्र',
    desc: 'For hospital/home birth or death entry in Parishad Vital Register within 21 days.',
    fields: [
      'Event Type (Birth / Death)',
      'Full Name of Child / Deceased',
      'Date & Place of Event',
      'Father / Mother / Spouse Name',
      'Ward Number & House No (Ramnagar)',
      'Informant Name & Mobile Number',
      'Aadhaar / Hospital Slip Reference',
    ],
  },
  {
    code: 'RGP-FRM-02',
    title: 'Parivar Register Inclusion / Mutation Form',
    titleHi: 'परिवार पंजी नाम जोड़ने / संशोधन प्रपत्र',
    desc: 'Add newborn member, daughter-in-law, or update household head in Parivar Register.',
    fields: [
      'Existing Family ID (e.g. RMN-F0412)',
      'Head of Family Full Name',
      'Ward No & Holding No',
      'Member Name to Add / Modify',
      'Relationship with Head of Family',
      'Date of Birth & Aadhaar Last 4 Digits',
      'Reason for Mutation (Birth / Marriage / Split)',
    ],
  },
  {
    code: 'RGP-FRM-03',
    title: 'Right to Information (RTI) Application Form — Section 6(1)',
    titleHi: 'सूचना का अधिकार (RTI) आवेदन प्रपत्र — धारा 6(1)',
    desc: 'Request certified copies of GPDP works, muster rolls, cashbook vouchers, or Gram Sabha MoM.',
    fields: [
      'Applicant Full Name',
      'Father / Husband Name',
      'Full Postal Address & Mobile No',
      'BPL Card No (If Fee Exempted)',
      'Subject / Department (Works / Funds / RTPS)',
      'Particulars of Information Required',
      'Period to which Information Relates',
    ],
  },
  {
    code: 'RGP-FRM-04',
    title: 'Janta Darbar Offline Grievance Submission Form',
    titleHi: 'जनता दरबार ऑफलाइन शिकायत प्रपत्र',
    desc: 'Physical complaint submission form for weekly Tuesday/Friday Parishad Janta Darbar.',
    fields: [
      'Complainant Full Name',
      'Ward No & Tola Name (Ramnagar)',
      'Mobile Number',
      'Grievance Category (Nal-Jal / Road / Light / Pension)',
      'Location Landmark & Issue Description',
      'Supporting Document / Photo Attached (Yes/No)',
    ],
  },
  {
    code: 'RGP-FRM-05',
    title: 'Caste / Income / Residence Self-Declaration (Shapath Patra)',
    titleHi: 'जाति / आय / निवास स्व-घोषणा पत्र (RTPS)',
    desc: 'Mandatory self-attestation annexure for Bihar RTPS certificate verification.',
    fields: [
      'Applicant Full Name',
      'Guardian Name & Mother Name',
      'Ward No, Village Ramnagar, Post Ramnagar',
      'Caste / Annual Family Income (INR)',
      'Purpose of Certificate',
      'Aadhaar Number (Last 4 Digits) & Mobile',
    ],
  },
];

const RTI_OFFICERS = [
  {
    role: 'Public Information Officer (PIO)',
    name: 'Smt. Sangeeta Kumari (Parishad Secretary / Sachiv)',
    jurisdiction: 'All Ramnagar Gram Parishad records, Cashbook, Works & Registers',
    contact: '+91 94310-88203 · sachiv.ramnagar.wch@bihar.gov.in',
  },
  {
    role: 'Assistant PIO (RTPS & Works Cell)',
    name: 'Ku. Priya Ranjan (Lekhapal-cum-IT Assistant)',
    jurisdiction: 'e-GramSwaraj Vouchers, Measurement Books & RTPS Logs',
    contact: '+91 94310-88209',
  },
  {
    role: 'First Appellate Authority (FAA)',
    name: 'Block Panchayati Raj Officer (BPRO), Ramnagar',
    jurisdiction: 'Block Office Campus, Ramnagar, West Champaran - 845106',
    contact: '06256-242110 · bpro.ramnagar.wch@bihar.gov.in',
  },
];

export function DownloadsAndRtiView({ lang, onNavigate }: DownloadsAndRtiViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hc-surface">
        <div>
          <p className="text-xs font-semibold text-[#FF671F] uppercase tracking-wide">
            {lang === 'hi' ? 'डाउनलोड प्रपत्र एवं सूचना का अधिकार प्रकोष्ठ' : 'Statutory Forms, Downloads & RTI Cell'}
          </p>
          <h2 className="text-xl font-bold text-[#0B2C59] mt-0.5 hc-text">
            {lang === 'hi'
              ? 'रामनगर ग्राम परिषद — मुद्रण योग्य आवेदन प्रपत्र एवं RTI अधिकारी'
              : 'Printable Application Forms & Section 4(1)(b) RTI Cell'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('funds', 'rti')}
          className="px-4 py-2 bg-[#0B2C59] hover:bg-[#071E3D] text-white text-xs font-semibold rounded whitespace-nowrap shrink-0"
        >
          {lang === 'hi' ? 'वार्ड-वार निधि RTI चार्ट देखें →' : 'View Ward-Wise RTI Fund Chart →'}
        </button>
      </div>

      {/* Printable Statutory Forms */}
      <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <h3 className="text-base font-bold text-[#0B2C59] flex items-center gap-2 hc-text">
            <FileText className="w-4 h-4 text-[#FF671F]" />
            <span>{lang === 'hi' ? 'आधिकारिक आवेदन प्रपत्र (PDF डाउनलोड)' : 'Downloadable Official Forms (PDF)'}</span>
          </h3>
          <span className="text-xs text-slate-500">Zero Fee · Official Format</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STATUTORY_FORMS.map((form) => (
            <div key={form.code} className="border border-slate-200 rounded p-4 bg-[#F8FAFC] flex flex-col justify-between gap-3">
              <div>
                <div className="text-xs font-mono-tabular font-bold text-[#0B2C59]">{form.code}</div>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  {lang === 'hi' ? form.titleHi : form.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{form.desc}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-[11px] text-slate-500 font-mono-tabular">{form.fields.length} Fields · A4 Print</span>
                <button
                  type="button"
                  onClick={() => generateBlankFormPDF(form.title, form.code, form.desc, form.fields)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2C59] hover:bg-[#071E3D] text-white text-xs font-semibold rounded whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Blank PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RTI Appellate & PIO Directory */}
      <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
        <h3 className="text-base font-bold text-[#0B2C59] flex items-center gap-2 border-b border-slate-200 pb-2.5 hc-text">
          <Scale className="w-4 h-4 text-[#046A38]" />
          <span>{lang === 'hi' ? 'सूचना का अधिकार (RTI) पदाधिकारी विवरण' : 'RTI Act 2005 — Designated Officers'}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RTI_OFFICERS.map((off) => (
            <div key={off.role} className="border border-slate-200 rounded p-4 bg-[#F8FAFC] space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wide text-[#FF671F]">{off.role}</div>
              <div className="text-sm font-bold text-slate-900">{off.name}</div>
              <div className="text-xs text-slate-600 leading-relaxed">{off.jurisdiction}</div>
              <div className="text-xs font-mono-tabular text-[#0B2C59] pt-1 flex items-center gap-1">
                <PhoneCall className="w-3 h-3 shrink-0" />
                <span>{off.contact}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-[#046A38] shrink-0 mt-0.5" />
            <span>
              <strong>Proactive Disclosure:</strong> All 15th Finance Commission grants, digital cashbook vouchers, Ward 1–15 expenditures, and Gram Sabha resolutions are published openly on this portal.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('funds', 'cashbook')}
            className="px-3.5 py-2 border border-[#0B2C59] text-[#0B2C59] hover:bg-[#0B2C59] hover:text-white text-xs font-semibold rounded whitespace-nowrap shrink-0 transition-colors"
          >
            Inspect Cashbook Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
